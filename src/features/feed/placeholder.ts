import { providers } from 'ethers'
import { FeeEstimate } from 'src/features/fees/types'
import { PARYSTransaction, TransactionType } from 'src/features/types'

export function createPlaceholderForTx(
  txReceipt: providers.TransactionReceipt,
  value: string,
  feeEstimate: FeeEstimate
): PARYSTransaction {
  return {
    type: TransactionType.Other,
    hash: txReceipt.transactionHash,
    from: txReceipt.from,
    to: txReceipt.to,
    value: value,
    blockNumber: txReceipt.blockNumber,
    nonce: 0, // TODO
    timestamp: Math.floor(Date.now() / 1000),
    gasPrice: feeEstimate.gasPrice,
    gasUsed: txReceipt.gasUsed.toString(),
    feeCurrency: feeEstimate.feeToken,
    gatewayFee: undefined, // TODO
    gatewayFeeRecipient: undefined, // TODO
  }
}
