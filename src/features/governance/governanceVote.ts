import { BigNumber, BigNumberish, providers } from 'ethers'
import { appSelect } from 'src/app/appSelect'
import { getContract } from 'src/blockchain/contracts'
import { sendSignedTransaction, signTransaction } from 'src/blockchain/transaction'
import { PARYSContract } from 'src/config'
import { MIN_LOCKED_GOLD_TO_VOTE } from 'src/consts'
import { fetchBalancesActions, fetchBalancesIfStale } from 'src/features/balances/fetchBalances'
import { selectVoterBalances } from 'src/features/balances/hooks'
import { Balances } from 'src/features/balances/types'
import { addPlaceholderTransaction } from 'src/features/feed/feedSlice'
import { createPlaceholderForTx } from 'src/features/feed/placeholder'
import { validateFeeEstimate } from 'src/features/fees/utils'
import {
  GovernanceVoteParams,
  OrderedVoteValue,
  Proposal,
  ProposalStage,
  VoteValue,
} from 'src/features/governance/types'
import { setNumSignatures } from 'src/features/txFlow/txFlowSlice'
import { GovernanceVoteTx, TransactionType } from 'src/features/types'
import { PARYS } from 'src/tokens'
import { validateAmountWithFees } from 'src/utils/amount'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { ErrorState, invalidInput, validateOrThrow } from 'src/utils/validation'
import { call, put } from 'typed-redux-saga'

export function validate(
  params: GovernanceVoteParams,
  balances: Balances,
  voterBalances: Balances,
  proposals: Proposal[],
  validateFee = false
): ErrorState {
  const { proposalId, value, feeEstimate } = params
  let errors: ErrorState = { isValid: true }

  if (!proposalId) {
    errors = { ...errors, ...invalidInput('proposalId', 'No proposal selected') }
  } else {
    const selected = proposals.find((p) => p.id === proposalId)
    if (!selected || selected.stage !== ProposalStage.Referendum) {
      errors = { ...errors, ...invalidInput('proposalId', 'Invalid Proposal Selection') }
    }
  }

  if (!Object.values(VoteValue).includes(value)) {
    errors = { ...errors, ...invalidInput('value', 'Invalid vote value') }
  }

  // If locked amount is very small or 0
  if (BigNumber.from(voterBalances.lockedPARYS.locked).lte(MIN_LOCKED_GOLD_TO_VOTE)) {
    errors = { ...errors, ...invalidInput('lockedPARYS', 'Insufficient locked PARYS') }
  }

  if (validateFee) {
    errors = {
      ...errors,
      ...validateFeeEstimate(feeEstimate),
      ...validateAmountWithFees('0', PARYS, balances, feeEstimate ? [feeEstimate] : undefined),
    }
  }

  return errors
}

function* governanceVote(params: GovernanceVoteParams) {
  yield* call(fetchBalancesIfStale)
  const { balances, voterBalances } = yield* call(selectVoterBalances)
  const proposals = yield* appSelect((state) => state.governance.proposals)

  validateOrThrow(
    () => validate(params, balances, voterBalances, proposals, true),
    'Invalid transaction'
  )

  const signedTx = yield* call(createVoteTx, params)
  yield* put(setNumSignatures(1))

  const txReceipt = yield* call(sendSignedTransaction, signedTx)
  logger.info(`Governance vote hash received: ${txReceipt.transactionHash}`)

  const placeholderTx = getPlaceholderTx(params, txReceipt)
  yield* put(addPlaceholderTransaction(placeholderTx))

  yield* put(fetchBalancesActions.trigger())
}

async function createVoteTx(params: GovernanceVoteParams) {
  const { proposalId, value, feeEstimate } = params
  if (!feeEstimate) throw new Error('Fee estimate is missing')

  const governance = getContract(PARYSContract.Governance)

  const dequeuedBN: BigNumberish[] = await governance.getDequeue()
  const dequeued = dequeuedBN.map((d) => BigNumber.from(d).toString())
  const propsalIndex = dequeued.findIndex((d) => d === proposalId)
  if (propsalIndex < 0) throw new Error('Proposal not found in dequeued list')

  // Go from string enum to number
  const voteValue = OrderedVoteValue.indexOf(value)

  const tx = await governance.populateTransaction.vote(proposalId, propsalIndex, voteValue)
  logger.info('Signing governance vote tx')
  const signedTx = await signTransaction(tx, feeEstimate)
  return signedTx
}

function getPlaceholderTx(
  params: GovernanceVoteParams,
  txReceipt: providers.TransactionReceipt
): GovernanceVoteTx {
  if (!params.feeEstimate) {
    throw new Error('Params must have fee estimate to create placeholder tx')
  }
  return {
    ...createPlaceholderForTx(txReceipt, '0', params.feeEstimate),
    type: TransactionType.GovernanceVote,
    proposalId: params.proposalId,
    vote: params.value,
  }
}

export const {
  name: governanceVoteSagaName,
  wrappedSaga: governanceVoteSaga,
  reducer: governanceVoteReducer,
  actions: governanceVoteActions,
} = createMonitoredSaga<GovernanceVoteParams>(governanceVote, 'governanceVote')
