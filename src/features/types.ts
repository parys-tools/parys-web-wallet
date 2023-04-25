import { VoteValue } from 'src/features/governance/types'

interface Transaction {
  type: TransactionType
  hash: string
  from: Address
  to: Address
  value: string
  blockNumber: number
  nonce: number
  timestamp: number
  gasPrice: string
  gasUsed: string
  feeCurrency?: Address // native token address, formerly token symbol
  gatewayFee?: string
  gatewayFeeRecipient?: Address
  inputData?: string
}

// Note, new tx types must be added at the bottom
// or old txs will be mislabeled in the feed.
export enum TransactionType {
  StableTokenTransfer,
  StableTokenTransferWithComment,
  StableTokenApprove,
  PARYSTokenTransfer,
  PARYSTokenTransferWithComment,
  PARYSTokenApprove,
  PARYSNativeTransfer,
  OtherTokenTransfer,
  OtherTokenApprove,
  EscrowTransfer,
  EscrowWithdraw,
  TokenExchange,
  AccountRegistration,
  LockPARYS,
  RelockPARYS,
  UnlockPARYS,
  WithdrawLockedCelo,
  ValidatorVotePARYS,
  ValidatorRevokeActivePARYS,
  ValidatorRevokePendingPARYS,
  ValidatorActivatePARYS,
  GovernanceVote,
  Other,
  NftTransfer,
}

interface TokenTransferTx extends Transaction {
  comment?: string
  isOutgoing: boolean
  tokenId: Address // formerly symbol, now address
}

interface TokenApproveTx extends Transaction {
  approvedValue: string
  spender: Address
  tokenId: Address // formerly symbol, now address
}

export interface StableTokenTransferTx extends TokenTransferTx {
  type: TransactionType.StableTokenTransfer
}

export interface StableTokenApproveTx extends TokenApproveTx {
  type: TransactionType.StableTokenApprove
}

export interface PARYSTokenTransferTx extends TokenTransferTx {
  type: TransactionType.PARYSTokenTransfer
}

export interface PARYSTokenApproveTx extends TokenApproveTx {
  type: TransactionType.PARYSTokenApprove
}

export interface PARYSNativeTransferTx extends TokenTransferTx {
  type: TransactionType.PARYSNativeTransfer
}

export interface OtherTokenTransferTx extends TokenTransferTx {
  type: TransactionType.OtherTokenTransfer
}

export interface OtherTokenApproveTx extends TokenApproveTx {
  type: TransactionType.OtherTokenApprove
}

export interface EscrowTransferTx extends Transaction {
  type: TransactionType.EscrowTransfer
  isOutgoing: true
  tokenId: Address // formerly symbol, now address
  comment?: string
}

export interface EscrowWithdrawTx extends Transaction {
  type: TransactionType.EscrowWithdraw
  tokenId: Address // formerly symbol, now address
  isOutgoing: false
  comment?: string
}

export interface TokenExchangeTx extends Transaction {
  type: TransactionType.TokenExchange
  fromTokenId: Address // formerly symbol, now address
  toTokenId: Address // formerly symbol, now address
  fromValue: string
  toValue: string
}

export type LockTokenType =
  | TransactionType.LockPARYS
  | TransactionType.RelockPARYS
  | TransactionType.UnlockPARYS
  | TransactionType.WithdrawLockedCelo
  | TransactionType.AccountRegistration

export interface LockTokenTx extends Transaction {
  type: LockTokenType
}

export type StakeTokenType =
  | TransactionType.ValidatorVotePARYS
  | TransactionType.ValidatorRevokeActivePARYS
  | TransactionType.ValidatorRevokePendingPARYS
  | TransactionType.ValidatorActivatePARYS

export interface StakeTokenTx extends Transaction {
  type: StakeTokenType
  groupAddress: Address
}

export interface GovernanceVoteTx extends Transaction {
  type: TransactionType.GovernanceVote
  proposalId: string
  vote: VoteValue
}

export interface NftTransferTx extends Transaction {
  type: TransactionType.NftTransfer
  contract: Address
  tokenId: string
}

export interface OtherTx extends Transaction {
  type: TransactionType.Other
}

export type TokenTransaction =
  | StableTokenTransferTx
  | PARYSTokenTransferTx
  | StableTokenApproveTx
  | PARYSTokenApproveTx
  | OtherTokenTransferTx
  | OtherTokenApproveTx

export type TokenTransfer =
  | StableTokenTransferTx
  | PARYSTokenTransferTx
  | PARYSNativeTransferTx
  | OtherTokenTransferTx

export type EscrowTransaction = EscrowTransferTx | EscrowWithdrawTx

export type PARYSTransaction =
  | TokenTransaction
  | PARYSNativeTransferTx
  | TokenExchangeTx
  | EscrowTransaction
  | LockTokenTx
  | StakeTokenTx
  | GovernanceVoteTx
  | NftTransferTx
  | OtherTx

export type TransactionMap = Record<string, PARYSTransaction> // hash to item
