import { PARYSTransactionRequest, serializePARYSTransaction } from '@parys-tools/parys-ethereum-connector'
import { TransportError, TransportStatusError } from '@ledgerhq/errors'
import { BigNumber, Signer, providers, utils } from 'ethers'
import { config } from 'src/config'
import { PARYS_LEDGER_APP_MIN_VERSION } from 'src/consts'
import { PARYSLedgerApp } from 'src/features/ledger/PARYSLedgerApp'
import { getLedgerTransport } from 'src/features/ledger/ledgerTransport'
import { getTokenData } from 'src/features/ledger/tokenData'
import 'src/polyfills/buffer' // Must be the first import
import { areAddressesEqual, ensureLeading0x, trimLeading0x } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { sleep } from 'src/utils/promises'

// Based partly on https://github.com/ethers-io/ethers.js/blob/master/packages/hardware-wallets/src.ts/ledger.ts
// But with customizations for the PARYS network and for electron
export class LedgerSigner extends Signer {
  address: Address | undefined

  constructor(readonly provider: providers.Provider, readonly path: string) {
    super()
  }

  async init() {
    if (this.address) throw new Error('Ledger Signer already initialized')

    await this.validatePARYSAppVersion()

    const account = await this.perform((parysApp) => parysApp.getAddress(this.path))
    this.address = utils.getAddress(account.address)
  }

  private async validatePARYSAppVersion() {
    let appConfiguration
    try {
      appConfiguration = await this.perform((parysApp) => parysApp.getAppConfiguration())
      if (!appConfiguration) throw new Error('Unable to retrieve Ledger app configuration')
      if (!appConfiguration.version) throw new Error('Ledger app config missing version info')
    } catch (error) {
      // The getAppConfiguration has been flaky since the latest Ledger firmware update
      // To prevent valid app configs from being blocked, this will fail open for now
      logger.error('Unable to get ledger app config. Sometimes flaky, swallowing error.', error)
      return
    }

    const version: string = appConfiguration.version
    const versionSegments = version.split('.').map((s) => parseInt(s))
    const minVersionSegments = PARYS_LEDGER_APP_MIN_VERSION.split('.').map((s) => parseInt(s))

    if (versionSegments.length !== 3) throw new Error('Invalid Ledger app version segments')
    if (versionSegments[0] !== minVersionSegments[0])
      throw new Error(`Unsupported Ledger app major version, must be ${minVersionSegments[0]}`)
    if (versionSegments[1] < minVersionSegments[1] || versionSegments[2] < minVersionSegments[2])
      throw new Error(
        `Unsupported Ledger app version, must be at least ${PARYS_LEDGER_APP_MIN_VERSION}`
      )

    if (!appConfiguration?.arbitraryDataEnabled)
      throw new Error(
        'Ledger does not allow contract data. Required for safe token transfers. Enable it from the ledger app settings.'
      )
  }

  async populateTransaction(transaction: utils.Deferrable<PARYSTransactionRequest>): Promise<any> {
    const tx: any = await utils.resolveProperties(transaction)

    if (!tx.to || !tx.gasPrice || !tx.gasLimit) {
      logger.error('To, gasPrice, and gasLimit fields all mandatory', tx)
      throw new Error('Tx is missing mandatory fields')
    }

    if (tx.nonce == null) {
      const nonce = await this.getTransactionCount('pending')
      tx.nonce = BigNumber.from(nonce).toNumber()
    }

    if (tx.chainId == null) {
      tx.chainId = config.chainId
    } else if (tx.chainId !== config.chainId) {
      throw new Error('Chain Id mismatch')
    }

    return tx
  }

  private async perform<T = any>(callback: (parysApp: PARYSLedgerApp) => Promise<T>): Promise<T> {
    const transport = await getLedgerTransport()
    try {
      const parysApp = new PARYSLedgerApp(transport)

      // Try up to 3 times over 3 seconds
      for (let i = 0; i < 3; i++) {
        try {
          const result = await callback(parysApp)
          return result
        } catch (error: any) {
          if (error instanceof TransportError) {
            logger.error('Ledger TransportError', error.name, error.id, error.message)
            if (error.id === 'TransportLocked') {
              // Device is locked up, possibly from another use. Wait then try again
              await sleep(1000)
              continue
            } else {
              throw new Error(`Ledger transport issue: ${error.message || 'unknown error'}`)
            }
          }

          if (error instanceof TransportStatusError) {
            logger.error(
              'Ledger TransportStatusError',
              error.statusCode,
              error.statusText,
              error.message
            )
            throw new Error(error.message || 'Ledger responded with failure')
          }

          logger.error('Unknown ledger error', error)
          break
        }
      }

      throw new Error('Ledger action failed, please check connection')
    } finally {
      await transport
        .close()
        .catch((error: any) => logger.error('Suppressing error during transport close', error))
    }
  }

  async getAddress(): Promise<string> {
    if (!this.address) throw new Error('LedgerSigner must be initiated before getting address')
    return this.address
  }

  async signMessage(message: utils.Bytes | string): Promise<string> {
    if (typeof message === 'string') {
      message = utils.toUtf8Bytes(message)
    }

    // Ledger expects hex without leading 0x
    const messageHex = trimLeading0x(utils.hexlify(message))

    const sig = await this.perform((parysApp) =>
      parysApp.signPersonalMessage(this.path, messageHex)
    )
    sig.r = ensureLeading0x(sig.r)
    sig.s = ensureLeading0x(sig.s)
    return utils.joinSignature(sig)
  }

  async signTransaction(transaction: PARYSTransactionRequest): Promise<string> {
    const tx = await this.populateTransaction(transaction)

    if (tx.from != null) {
      if (utils.getAddress(tx.from) !== this.address) {
        throw new Error('Transaction from address mismatch')
      }
      delete tx.from
    }

    // Provide ERC20 info for known tokens
    const toTokenInfo = getTokenData(transaction.to)
    const feeTokenInfo = getTokenData(transaction.feeCurrency)
    if (toTokenInfo) {
      await this.perform((parysApp) => parysApp.provideERC20TokenInformation(toTokenInfo))
    }
    if (
      feeTokenInfo &&
      (!toTokenInfo ||
        !areAddressesEqual(toTokenInfo.contractAddress, feeTokenInfo.contractAddress))
    ) {
      await this.perform((parysApp) => parysApp.provideERC20TokenInformation(feeTokenInfo))
    }

    // Ledger expects hex without leading 0x
    const unsignedTx = trimLeading0x(serializePARYSTransaction(tx))
    const sig = await this.perform((parysApp) => parysApp.signTransaction(this.path, unsignedTx))

    return serializePARYSTransaction(tx, {
      v: BigNumber.from(ensureLeading0x(sig.v)).toNumber(),
      r: ensureLeading0x(sig.r),
      s: ensureLeading0x(sig.s),
    })
  }

  // Override just for type fix
  sendTransaction(
    transaction: utils.Deferrable<PARYSTransactionRequest>
  ): Promise<providers.TransactionResponse> {
    return super.sendTransaction(transaction)
  }

  connect(): Signer {
    throw new Error('Connect method unimplemented on LedgerSigner')
  }
}
