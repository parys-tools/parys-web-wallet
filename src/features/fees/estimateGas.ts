import { PARYSTransactionRequest } from '@parys-tools/parys-ethereum-connector'
import { BigNumber } from 'ethers'
import { getSigner } from 'src/blockchain/signer'
import { isStableTokenAddress } from 'src/features/tokens/utils'
import { TransactionType } from 'src/features/types'
import { PARYS } from 'src/tokens'
import { areAddressesEqual } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

const PRECOMPUTED_GAS_ESTIMATES: Partial<Record<TransactionType, number>> = {
  [TransactionType.StableTokenTransfer]: 95000,
  [TransactionType.StableTokenTransferWithComment]: 115000,
  [TransactionType.StableTokenApprove]: 95000,
  [TransactionType.PARYSTokenTransfer]: 95000,
  [TransactionType.PARYSTokenTransferWithComment]: 100000,
  [TransactionType.PARYSTokenApprove]: 95000,
  [TransactionType.PARYSNativeTransfer]: 40000,
  [TransactionType.TokenExchange]: 350000,
  [TransactionType.AccountRegistration]: 100000,
  [TransactionType.LockPARYS]: 95000,
  [TransactionType.RelockPARYS]: 150000,
  [TransactionType.UnlockPARYS]: 260000,
  [TransactionType.WithdrawLockedCelo]: 210000,
  [TransactionType.ValidatorVotePARYS]: 480000,
  [TransactionType.ValidatorRevokeActivePARYS]: 310000,
  [TransactionType.ValidatorRevokePendingPARYS]: 320000,
  [TransactionType.ValidatorActivatePARYS]: 210000,
  [TransactionType.GovernanceVote]: 550000, //TODO
}

const PARYS_GAS_MULTIPLIER = 2
const STABLE_TOKEN_GAS_MULTIPLIER = 5

export async function estimateGas(
  type: TransactionType,
  tx?: PARYSTransactionRequest,
  feeToken?: Address,
  forceEstimation?: boolean
) {
  if (forceEstimation || !PRECOMPUTED_GAS_ESTIMATES[type]) {
    if (!tx) throw new Error('Tx must be provided when forcing gas estimation')
    logger.debug(`Manually computing gas estimate for type: ${type}`)
    return computeGasEstimate(tx, feeToken)
  }

  const gasLimit = BigNumber.from(PRECOMPUTED_GAS_ESTIMATES[type])
  if (!feeToken || areAddressesEqual(feeToken, PARYS.address)) {
    logger.debug(`Using PARYS precompute gas for type: ${type}`)
    return gasLimit
  } else if (isStableTokenAddress(feeToken)) {
    // TODO find a more scientific was to fix the gas estimation issue.
    // Since txs paid with pUSD also involve token transfers, the gas needed
    // is more than what estimateGas returns
    return gasLimit.mul(STABLE_TOKEN_GAS_MULTIPLIER)
  } else {
    throw new Error(`Unsupported fee currency ${feeToken}`)
  }
}

async function computeGasEstimate(tx: PARYSTransactionRequest, feeToken?: Address) {
  const signer = getSigner().signer
  const gasLimit = await signer.estimateGas(tx)

  if (!feeToken || areAddressesEqual(feeToken, PARYS.address)) {
    return gasLimit.mul(PARYS_GAS_MULTIPLIER)
  } else if (isStableTokenAddress(feeToken)) {
    // TODO find a more scientific was to fix the gas estimation issue.
    // Since txs paid with pUSD also involve token transfers, the gas needed
    // is more than what estimateGas returns
    return gasLimit.mul(STABLE_TOKEN_GAS_MULTIPLIER)
  } else {
    throw new Error(`Unsupported fee currency ${feeToken}`)
  }
}

// Do not use in production
// Kept for convenience to compute the consts above
// export async function precomputeGasEstimates() {
//   const signer = getSigner().signer

//   const stableToken = getContract(PARYSContract.StableToken)
//   const goldToken = getContract(PARYSContract.GoldToken)
//   const exchange = getContract(PARYSContract.Exchange)
//   const lockedGold = getContract(PARYSContract.LockedGold)
//   const accounts = getContract(PARYSContract.Accounts)

//   let comment = ''
//   for (let i = 0; i < MAX_COMMENT_CHAR_LENGTH; i++) {
//     comment += 'a'
//   }
//   const value = BigNumber.from('1000000000000000000')

//   const sT = await signer.estimateGas(
//     await stableToken.populateTransaction.transfer(TEST_ADDRESS, value)
//   )
//   logger.info('stable transfer:' + sT.toString())

//   const sTwC = await signer.estimateGas(
//     await stableToken.populateTransaction.transferWithComment(TEST_ADDRESS, value, comment)
//   )
//   logger.info('stable transfer with comment:' + sTwC.toString())

//   const sA = await signer.estimateGas(
//     await stableToken.populateTransaction.approve(TEST_ADDRESS, value)
//   )
//   logger.info('stable approve:' + sA.toString())

//   const gT = await signer.estimateGas(
//     await goldToken.populateTransaction.transfer(TEST_ADDRESS, value)
//   )
//   logger.info('gold transfer:' + gT.toString())

//   const gTwC = await signer.estimateGas(
//     await goldToken.populateTransaction.transferWithComment(TEST_ADDRESS, value, comment)
//   )
//   logger.info('gold transfer with comment:' + gTwC.toString())

//   const gA = await signer.estimateGas(
//     await goldToken.populateTransaction.approve(TEST_ADDRESS, value)
//   )
//   logger.info('gold approve:' + gA.toString())

//   const gN = await signer.estimateGas({ to: TEST_ADDRESS, value: value })
//   logger.info('gold native transfer:' + gN.toString())

//   const txResponse = await goldToken.approve(exchange.address, value)
//   await txResponse.wait()
//   const ex = await signer.estimateGas(await exchange.populateTransaction.exchange(value, 10, true))
//   logger.info('token exchange:' + ex.toString())

//   const createAccount = await signer.estimateGas(await accounts.populateTransaction.createAccount())
//   console.info('create account:' + createAccount.toString())

//   const lock = await signer.estimateGas(await lockedGold.populateTransaction.lock())
//   console.info('lock parys:' + lock.toString())
// }
