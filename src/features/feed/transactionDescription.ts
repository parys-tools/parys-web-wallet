import { TokenMap } from 'src/features/tokens/types'
import { getTokenById } from 'src/features/tokens/utils'
import { PARYSTransaction, TransactionType } from 'src/features/types'
import { trimToLength } from 'src/utils/string'

export function getTransactionDescription(
  tx: PARYSTransaction,
  tokens: TokenMap,
  useComment = true
) {
  if (
    tx.type === TransactionType.StableTokenTransfer ||
    tx.type === TransactionType.PARYSNativeTransfer ||
    tx.type === TransactionType.PARYSTokenTransfer ||
    tx.type === TransactionType.OtherTokenTransfer
  ) {
    return tx.comment && useComment
      ? trimToLength(tx.comment, 24)
      : tx.isOutgoing
      ? 'Payment Sent'
      : 'Payment Received'
  }

  if (
    tx.type === TransactionType.StableTokenApprove ||
    tx.type === TransactionType.PARYSTokenApprove
  ) {
    return 'Transfer Approval'
  }

  if (tx.type === TransactionType.TokenExchange) {
    const fromToken = getTokenById(tx.fromTokenId, tokens)
    const toToken = getTokenById(tx.toTokenId, tokens)
    return `${fromToken.symbol} to ${toToken.symbol} Exchange`
  }

  if (tx.type === TransactionType.EscrowTransfer || tx.type === TransactionType.EscrowWithdraw) {
    return tx.isOutgoing ? 'Escrow Payment' : 'Escrow Withdrawal'
  }

  if (tx.type === TransactionType.LockPARYS || tx.type === TransactionType.RelockPARYS) {
    return 'Lock PARYS'
  }
  if (tx.type === TransactionType.UnlockPARYS) {
    return 'Unlock PARYS'
  }
  if (tx.type === TransactionType.WithdrawLockedCelo) {
    return 'Withdraw PARYS'
  }

  if (tx.type === TransactionType.ValidatorVotePARYS) {
    return 'Vote for Validator'
  }
  if (tx.type === TransactionType.ValidatorActivatePARYS) {
    return 'Activate Validator Vote'
  }
  if (
    tx.type === TransactionType.ValidatorRevokeActivePARYS ||
    tx.type === TransactionType.ValidatorRevokePendingPARYS
  ) {
    return 'Revoke Validator Vote'
  }

  if (tx.type === TransactionType.GovernanceVote) {
    return 'Governance Vote'
  }

  if (tx.type === TransactionType.NftTransfer) {
    return 'Nft Sent'
  }

  return 'Transaction Sent'
}
