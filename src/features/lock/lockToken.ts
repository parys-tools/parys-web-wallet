import { BigNumber, providers } from 'ethers'
import { appSelect } from 'src/app/appSelect'
import { getContract } from 'src/blockchain/contracts'
import { getSigner } from 'src/blockchain/signer'
import { signTransaction } from 'src/blockchain/transaction'
import { TxPlanExecutor, executeTxPlan } from 'src/blockchain/txPlan'
import { PARYSContract } from 'src/config'
import { MIN_LOCK_AMOUNT } from 'src/consts'
import { fetchBalancesActions, fetchBalancesIfStale } from 'src/features/balances/fetchBalances'
import { Balances } from 'src/features/balances/types'
import { getTokenBalance } from 'src/features/balances/utils'
import { createPlaceholderForTx } from 'src/features/feed/placeholder'
import { FeeEstimate } from 'src/features/fees/types'
import { validateFeeEstimates } from 'src/features/fees/utils'
import { LockActionType, LockTokenParams, PendingWithdrawal } from 'src/features/lock/types'
import { getTotalPendingPARYS, getTotalUnlockedPARYS } from 'src/features/lock/utils'
import { LockTokenTx, LockTokenType, TransactionType } from 'src/features/types'
import { GroupVotes } from 'src/features/validators/types'
import { getTotalNonvotingLocked } from 'src/features/validators/utils'
import {
  createAccountRegisterTx,
  fetchAccountStatus,
} from 'src/features/wallet/accounts/accountsContract'
import { setAccountIsRegistered } from 'src/features/wallet/walletSlice'
import { PARYS } from 'src/tokens'
import {
  BigNumberMin,
  areAmountsNearlyEqual,
  getAdjustedAmount,
  validateAmount,
  validateAmountWithFees,
} from 'src/utils/amount'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { ErrorState, invalidInput, validateOrThrow } from 'src/utils/validation'
import { call, put } from 'typed-redux-saga'

export function validate(
  params: LockTokenParams,
  balances: Balances,
  groupVotes: GroupVotes,
  validateFee = false
): ErrorState {
  const { amountInWei, action, feeEstimates } = params
  let errors: ErrorState = { isValid: true }

  if (!Object.values(LockActionType).includes(action)) {
    return invalidInput('action', 'Invalid Action Type')
  }

  if (!amountInWei) {
    return invalidInput('amount', 'Amount Missing')
  }

  const { locked, pendingFree, pendingBlocked } = balances.lockedPARYS
  let maxAmount = null
  if (action === LockActionType.Lock) {
    maxAmount = getTotalUnlockedPARYS(balances).toString()
  } else if (action === LockActionType.Unlock) {
    maxAmount = locked
  } else if (action === LockActionType.Withdraw) {
    maxAmount = pendingFree
  }
  errors = {
    ...errors,
    ...validateAmount(amountInWei, PARYS, null, maxAmount, MIN_LOCK_AMOUNT),
  }

  // Special case handling for withdraw which is confusing
  if (action === LockActionType.Withdraw && BigNumber.from(pendingFree).lte(0)) {
    errors = {
      ...errors,
      ...invalidInput('amount', 'No pending available to withdraw'),
    }
  }

  // Special case handling for locking whole balance
  if (action === LockActionType.Lock && !errors.amount) {
    const remainingAfterPending = BigNumber.from(amountInWei).sub(pendingFree).sub(pendingBlocked)
    const parysBalance = getTokenBalance(balances, PARYS)
    if (
      remainingAfterPending.gt(0) &&
      (remainingAfterPending.gte(parysBalance) ||
        areAmountsNearlyEqual(remainingAfterPending, parysBalance, PARYS))
    ) {
      errors = {
        ...errors,
        ...invalidInput('amount', 'Locking whole balance is not allowed'),
      }
    }

    if (validateFee) {
      let amountAffectingBalance = '0'
      if (action === LockActionType.Lock) {
        const netDiff = BigNumber.from(amountInWei).sub(getTotalPendingPARYS(balances))
        amountAffectingBalance = netDiff.gt(0) ? netDiff.toString() : '0'
      }
      errors = {
        ...errors,
        ...validateFeeEstimates(feeEstimates),
        ...validateAmountWithFees(amountAffectingBalance, PARYS, balances, feeEstimates),
      }
    }
  }

  // Ensure user isn't trying to unlock PARYS used for staking
  if (action === LockActionType.Unlock) {
    const nonVotingLocked = getTotalNonvotingLocked(balances, groupVotes)
    if (
      nonVotingLocked.lt(amountInWei) &&
      !areAmountsNearlyEqual(nonVotingLocked, amountInWei, PARYS)
    ) {
      errors = {
        ...errors,
        ...invalidInput('stakedPARYS', 'Locked funds in use for staking'),
      }
    }
  }

  return errors
}

function* lockToken(params: LockTokenParams) {
  const { amountInWei, action, feeEstimates } = params

  const balances = yield* call(fetchBalancesIfStale)
  const pendingWithdrawals = yield* appSelect((state) => state.lock.pendingWithdrawals)
  const isAccountRegistered = yield* appSelect((state) => state.wallet.account.isRegistered)
  const groupVotes = yield* appSelect((state) => state.validators.groupVotes)

  validateOrThrow(() => validate(params, balances, groupVotes, true), 'Invalid transaction')

  if (action === LockActionType.Unlock) {
    yield* call(ensureAccountNotGovernanceVoting)
  }

  const txPlan = getLockActionTxPlan(params, pendingWithdrawals, balances, isAccountRegistered)
  if (!feeEstimates || feeEstimates.length !== txPlan.length) {
    throw new Error('Fee estimates missing or do not match txPlan')
  }

  const { txPlan: txPlanAdjusted, feeEstimates: feeEstimatesAdjusted } = yield* call(
    ensureAccountNotAlreadyRegistered,
    txPlan,
    feeEstimates
  )

  logger.info(`Executing ${action} for ${amountInWei} PARYS`)
  yield* call<TxPlanExecutor<LockTokenTxPlanItem>>(
    executeTxPlan,
    txPlanAdjusted,
    feeEstimatesAdjusted,
    createActionTx,
    createPlaceholderTx,
    'lockToken'
  )

  // If a lock succeeds, account is definitely registered.
  // Set it in case the registration was done during this txPlan
  yield* put(setAccountIsRegistered(true))

  yield* put(fetchBalancesActions.trigger())
}

function createActionTx(txPlanItem: LockTokenTxPlanItem, feeEstimate: FeeEstimate, nonce: number) {
  if (txPlanItem.type === TransactionType.AccountRegistration) {
    return createAccountRegisterTx(feeEstimate, nonce)
  } else if (txPlanItem.type === TransactionType.LockPARYS) {
    return createLockPARYSTx(txPlanItem, feeEstimate, nonce)
  } else if (txPlanItem.type === TransactionType.RelockPARYS) {
    return createRelockPARYSTx(txPlanItem, feeEstimate, nonce)
  } else if (txPlanItem.type === TransactionType.UnlockPARYS) {
    return createUnlockPARYSTx(txPlanItem, feeEstimate, nonce)
  } else if (txPlanItem.type === TransactionType.WithdrawLockedCelo) {
    return createWithdrawPARYSTx(txPlanItem, feeEstimate, nonce)
  } else {
    throw new Error(`Invalid tx type for lock request: ${txPlanItem.type}`)
  }
}

function createPlaceholderTx(
  txPlanItem: LockTokenTxPlanItem,
  feeEstimate: FeeEstimate,
  txReceipt: providers.TransactionReceipt
): LockTokenTx {
  return {
    ...createPlaceholderForTx(txReceipt, txPlanItem.amountInWei, feeEstimate),
    type: txPlanItem.type,
  }
}

interface LockTokenTxPlanItem {
  type: LockTokenType
  amountInWei: string
  pendingWithdrawal?: PendingWithdrawal
}

type LockTokenTxPlan = Array<LockTokenTxPlanItem>

// Lock token operations can require varying numbers of txs in specific order
// This determines the ideal tx types and order
export function getLockActionTxPlan(
  params: LockTokenParams,
  pendingWithdrawals: PendingWithdrawal[],
  balances: Balances,
  isAccountRegistered: boolean
): LockTokenTxPlan {
  const { action, amountInWei } = params

  if (action === LockActionType.Unlock) {
    // If only all three cases where this simple :)
    const adjustedAmount = getAdjustedAmount(amountInWei, balances.lockedPARYS.locked, PARYS)
    return [{ type: TransactionType.UnlockPARYS, amountInWei: adjustedAmount.toString() }]
  } else if (action === LockActionType.Lock) {
    const txs: LockTokenTxPlan = []

    if (!isAccountRegistered) {
      txs.push({ type: TransactionType.AccountRegistration, amountInWei: '0' })
    }

    // Need relock from the pendings in reverse order
    // due to the way the storage is managed in the contract
    let amountRemaining = BigNumber.from(amountInWei)
    const pwSorted = [...pendingWithdrawals].sort((a, b) => b.index - a.index)
    for (const p of pwSorted) {
      if (amountRemaining.lt(MIN_LOCK_AMOUNT)) break
      const txAmount = BigNumberMin(amountRemaining, BigNumber.from(p.value))
      const adjustedAmount = getAdjustedAmount(txAmount, p.value, PARYS)
      txs.push({
        type: TransactionType.RelockPARYS,
        pendingWithdrawal: p,
        amountInWei: adjustedAmount.toString(),
      })
      amountRemaining = amountRemaining.sub(adjustedAmount)
    }
    // If pending relocks didn't cover it
    if (amountRemaining.gte(MIN_LOCK_AMOUNT)) {
      txs.push({ type: TransactionType.LockPARYS, amountInWei: amountRemaining.toString() })
    }
    return txs
  } else if (action === LockActionType.Withdraw) {
    const txs: LockTokenTxPlan = []
    const now = Date.now()
    // Withdraw all available pendings
    for (const p of pendingWithdrawals) {
      if (p.timestamp <= now)
        txs.push({
          type: TransactionType.WithdrawLockedCelo,
          pendingWithdrawal: p,
          amountInWei: p.value,
        })
    }
    return txs
  } else {
    throw new Error(`Invalid lockToken tx type: ${action}`)
  }
}

async function createLockPARYSTx(
  txPlanItem: LockTokenTxPlanItem,
  feeEstimate: FeeEstimate,
  nonce: number
) {
  const lockedGold = getContract(PARYSContract.LockedGold)
  const tx = await lockedGold.populateTransaction.lock()
  tx.value = BigNumber.from(txPlanItem.amountInWei)
  tx.nonce = nonce
  logger.info('Signing lock parys tx')
  return signTransaction(tx, feeEstimate)
}

async function createRelockPARYSTx(
  txPlanItem: LockTokenTxPlanItem,
  feeEstimate: FeeEstimate,
  nonce: number
) {
  const { amountInWei, pendingWithdrawal } = txPlanItem
  if (!pendingWithdrawal) throw new Error('Pending withdrawal missing from relock tx')
  const lockedGold = getContract(PARYSContract.LockedGold)
  const tx = await lockedGold.populateTransaction.relock(pendingWithdrawal.index, amountInWei)
  tx.nonce = nonce
  logger.info('Signing relock parys tx')
  return signTransaction(tx, feeEstimate)
}

async function createUnlockPARYSTx(
  txPlanItem: LockTokenTxPlanItem,
  feeEstimate: FeeEstimate,
  nonce: number
) {
  const { amountInWei } = txPlanItem
  const lockedGold = getContract(PARYSContract.LockedGold)
  const tx = await lockedGold.populateTransaction.unlock(amountInWei)
  tx.nonce = nonce
  logger.info('Signing unlock parys tx')
  return signTransaction(tx, feeEstimate)
}

async function createWithdrawPARYSTx(
  txPlanItem: LockTokenTxPlanItem,
  feeEstimate: FeeEstimate,
  nonce: number
) {
  const { pendingWithdrawal } = txPlanItem
  if (!pendingWithdrawal) throw new Error('Pending withdrawal missing from withdraw tx')
  const lockedGold = getContract(PARYSContract.LockedGold)
  const tx = await lockedGold.populateTransaction.withdraw(pendingWithdrawal.index)
  tx.nonce = nonce
  logger.info('Signing withdraw parys tx')
  return signTransaction(tx, feeEstimate)
}

async function ensureAccountNotGovernanceVoting() {
  const address = getSigner().signer.address
  const governance = getContract(PARYSContract.Governance)
  const isVoting: boolean = await governance.isVoting(address)
  if (isVoting)
    throw new Error(
      'Account has voted for an active governance proposal. You must wait until the proposal is done.'
    )
}

// This is necessary in case the isAccountRegistered in state is
// stale or incorrect, which is rare but does happen
function* ensureAccountNotAlreadyRegistered(txPlan: LockTokenTxPlan, feeEstimates: FeeEstimate[]) {
  if (txPlan[0].type !== TransactionType.AccountRegistration) {
    // Not trying to register, no adjustments needed
    return { txPlan, feeEstimates }
  }

  // Force fetch latest account status
  const { isRegistered } = yield* call(fetchAccountStatus, true)
  if (isRegistered) {
    // Remove the account registration tx from plan and estimates
    return { txPlan: txPlan.slice(1), feeEstimates: feeEstimates.slice(1) }
  } else {
    return { txPlan, feeEstimates }
  }
}

export const {
  name: lockTokenSagaName,
  wrappedSaga: lockTokenSaga,
  reducer: lockTokenReducer,
  actions: lockTokenActions,
} = createMonitoredSaga<LockTokenParams>(lockToken, 'lockToken')
