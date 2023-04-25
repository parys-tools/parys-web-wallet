/**
 * Utilities to facilitate sending transactions with
 * different gas currencies. Prefer these to
 * sending with Ethers directly.
 */

import { PARYSTransactionRequest } from '@parys-tools/parys-ethereum-connector'
import { BigNumber } from 'ethers'
import { getProvider } from 'src/blockchain/provider'
import { getSigner } from 'src/blockchain/signer'
import { FeeEstimate } from 'src/features/fees/types'
import { PARYS } from 'src/tokens'
import { areAddressesEqual } from 'src/utils/addresses'

export async function sendTransaction(tx: PARYSTransactionRequest, feeEstimate?: FeeEstimate) {
  const signedTx = await signTransaction(tx, feeEstimate)
  return sendSignedTransaction(signedTx)
}

export async function signTransaction(tx: PARYSTransactionRequest, feeEstimate?: FeeEstimate) {
  const signer = getSigner().signer

  if (!feeEstimate) {
    // For now, require fee to be pre-computed when using this utility
    // May revisit later
    throw new Error('Fee estimate required to send tx')
  }

  const { gasPrice, gasLimit, feeToken } = feeEstimate
  const feeCurrencyAddress = areAddressesEqual(feeToken, PARYS.address) ? undefined : feeToken

  const signedTx = await signer.signTransaction({
    ...tx,
    // TODO set gatewayFeeRecipient
    gasPrice: BigNumber.from(gasPrice),
    gasLimit: BigNumber.from(gasLimit),
    feeCurrency: feeCurrencyAddress,
  })

  return signedTx
}

export async function sendSignedTransaction(signedTx: string) {
  const provider = getProvider()
  const txResponse = await provider.sendTransaction(signedTx)
  const txReceipt = await txResponse.wait()
  return txReceipt
}

export async function getCurrentNonce() {
  const signer = getSigner().signer
  const nonce = await signer.getTransactionCount('pending')
  return BigNumber.from(nonce).toNumber()
}
