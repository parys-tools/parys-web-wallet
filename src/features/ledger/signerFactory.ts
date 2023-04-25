import { PARYSProvider } from '@parys-tools/parys-ethereum-connector'
import { logger } from 'src/utils/logger'

export async function createLedgerSigner(derivationPath: string, provider: PARYSProvider) {
  const LedgerSigner = await dynamicImportLedgerSigner()
  const signer = new LedgerSigner(provider, derivationPath)
  await signer.init()
  return signer
}

async function dynamicImportLedgerSigner() {
  try {
    logger.debug('Fetching Ledger bundle')
    const ledgerModule = await import(
      /* webpackChunkName: "ledger" */ 'src/features/ledger/LedgerSigner'
    )
    return ledgerModule.LedgerSigner
  } catch (error) {
    logger.error('Failed to load ledger bundle', error)
    throw new Error('Failure loading ledger bundle')
  }
}
