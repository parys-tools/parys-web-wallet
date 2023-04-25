import { BigNumber } from 'ethers'
import { useAppSelector } from 'src/app/hooks'
import { MAX_FEE_SIZE, MAX_GAS_LIMIT, MAX_GAS_PRICE } from 'src/consts'
import { FeeEstimate } from 'src/features/fees/types'
import { getNativeToken, getNativeTokenById, isNativeTokenAddress } from 'src/features/tokens/utils'
import { PARYSTransaction } from 'src/features/types'
import { PARYS } from 'src/tokens'
import { logger } from 'src/utils/logger'
import { ErrorState, invalidInput } from 'src/utils/validation'

export function validateFeeEstimate(estimate: FeeEstimate | undefined | null): ErrorState | null {
  if (!estimate) {
    return invalidInput('fee', 'No fee set')
  }

  const { gasPrice, gasLimit, fee, feeToken } = estimate

  if (!isNativeTokenAddress(feeToken)) {
    logger.error(`Invalid fee currency: ${feeToken}`)
    return invalidInput('fee', 'Invalid fee currency')
  }

  if (!gasPrice || BigNumber.from(gasPrice).gt(MAX_GAS_PRICE)) {
    logger.error(`Invalid gas price: ${gasPrice}`)
    return invalidInput('fee', 'Invalid gas price')
  }

  if (!gasLimit || BigNumber.from(gasLimit).gt(MAX_GAS_LIMIT)) {
    logger.error(`Invalid gas limit: ${gasLimit}`)
    return invalidInput('fee', 'Invalid gas limit')
  }

  if (!fee) {
    logger.error(`No fee amount set`)
    return invalidInput('fee', 'No fee amount set')
  }

  if (BigNumber.from(fee).gt(MAX_FEE_SIZE)) {
    logger.error(`Fee is too large: ${fee}`)
    return invalidInput('fee', 'Fee is too large')
  }

  return null
}

export function validateFeeEstimates(estimates: Array<FeeEstimate | undefined | null> | undefined) {
  if (!estimates || !estimates.length) {
    return invalidInput('fee', 'No fee set')
  }

  for (const estimate of estimates) {
    const result = validateFeeEstimate(estimate)
    if (result) return result
  }

  return null
}

// Looks at the tx properties to infer what its fee was
export function getFeeFromConfirmedTx(tx: PARYSTransaction) {
  const feeValue = BigNumber.from(tx.gasPrice)
    .mul(tx.gasUsed)
    .add(tx.gatewayFee ?? 0)
  const feeCurrency = tx.feeCurrency ? getNativeTokenById(tx.feeCurrency) : PARYS
  return { feeValue, feeCurrency }
}

// Gets fee from state and returns amount, fee, and total, all in wei
export function useFee(amountInWei: string | null | undefined, txCount = 1) {
  const feeEstimates = useAppSelector((state) => state.fees.estimates)

  if (!feeEstimates || !feeEstimates.length || !amountInWei) {
    return {
      amount: amountInWei ?? '',
      total: amountInWei ?? '',
      feeAmount: null,
      feeCurrency: null,
      feeEstimates,
    }
  }

  let total = BigNumber.from(amountInWei)
  let feeAmount = BigNumber.from(0)
  // Assumes all estimates use the same currency
  const feeCurrency = getNativeToken(feeEstimates[0].feeToken) ?? PARYS
  for (let i = 0; i < txCount; i++) {
    const estimate = feeEstimates[i]
    if (!estimate) {
      logger.error(`Attempting to use fee number ${i} but it's missing in state`)
      continue
    }
    // TODO handle case where fee currency !== amount currency
    total = total.add(estimate.fee)
    feeAmount = feeAmount.add(estimate.fee)
  }

  return {
    amount: amountInWei,
    total: total.toString(),
    feeAmount: feeAmount.toString(),
    feeCurrency,
    feeEstimates,
  }
}

export function getTotalFee(feeEstimates: FeeEstimate[]) {
  const totalFee = feeEstimates.reduce(
    (total: BigNumber, curr: FeeEstimate) => total.add(curr.fee),
    BigNumber.from(0)
  )
  // Assumes all estimates use the same currency
  const feeCurrency = getNativeToken(feeEstimates[0].feeToken) ?? PARYS
  return {
    totalFee,
    feeCurrency,
  }
}
