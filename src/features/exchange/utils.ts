import { BigNumber, BigNumberish, FixedNumber } from 'ethers'
import { WEI_PER_UNIT } from 'src/consts'
import { ToPARYSRates } from 'src/features/exchange/types'
import { TokenMap } from 'src/features/tokens/types'
import { getNativeTokenById } from 'src/features/tokens/utils'
import { TokenExchangeTx } from 'src/features/types'
import { PARYS, Token, pUSD } from 'src/tokens'
import { fromWei, toWei } from 'src/utils/amount'
import { logger } from 'src/utils/logger'

export function useExchangeValues(
  fromAmount: number | string | null | undefined,
  fromTokenAddress: Address | null | undefined,
  toTokenAddress: Address | null | undefined,
  tokens: TokenMap,
  toPARYSRates: ToPARYSRates,
  isFromAmountWei: boolean
) {
  // Return some defaults when values are missing
  if (!fromTokenAddress || !toTokenAddress || !toPARYSRates)
    return getDefaultExchangeValues(pUSD, PARYS)

  const fromToken = tokens[fromTokenAddress] ?? pUSD
  const toToken = tokens[toTokenAddress] ?? PARYS
  const sellPARYS = fromToken.address === PARYS.address
  const stableTokenAddress = sellPARYS ? toTokenAddress : fromTokenAddress
  const toPARYSRate = toPARYSRates[stableTokenAddress]
  if (!toPARYSRate) return getDefaultExchangeValues(fromToken, toToken)

  const { stableBucket, parysBucket, spread } = toPARYSRate
  const [buyBucket, sellBucket] = sellPARYS
    ? [stableBucket, parysBucket]
    : [parysBucket, stableBucket]

  const fromAmountWei = parseInputAmount(fromAmount, isFromAmountWei)
  const { exchangeRateNum, exchangeRateWei, fromPARYSRateWei, toAmountWei } =
    calcSimpleExchangeRate(fromAmountWei, buyBucket, sellBucket, spread, sellPARYS)

  return {
    from: {
      weiAmount: fromAmountWei.toString(),
      token: fromToken,
    },
    to: {
      weiAmount: toAmountWei.toString(),
      token: toToken,
    },
    rate: {
      value: exchangeRateNum,
      weiValue: exchangeRateWei.toString(),
      fromPARYSWeiValue: fromPARYSRateWei.toString(),
      weiBasis: WEI_PER_UNIT,
      lastUpdated: toPARYSRate.lastUpdated,
      isReady: true,
    },
  }
}

function parseInputAmount(amount: BigNumberish | null | undefined, isWei: boolean) {
  const zero = BigNumber.from(0)
  try {
    if (!amount) return zero
    const parsed = isWei ? BigNumber.from(amount) : toWei(amount)
    if (parsed.isNegative()) return zero
    return parsed
  } catch (error) {
    logger.warn('Error parsing input amount')
    return zero
  }
}

export function calcSimpleExchangeRate(
  amountInWei: BigNumberish,
  buyBucket: string,
  sellBucket: string,
  spread: string,
  sellPARYS: boolean
) {
  try {
    const fromAmountFN = FixedNumber.from(amountInWei)
    const simulate = fromAmountFN.isZero() || fromAmountFN.isNegative()
    // If no valid from amount provided, simulate rate with 1 unit
    const fromAmountAdjusted = simulate ? FixedNumber.from(WEI_PER_UNIT) : fromAmountFN

    const reducedSellAmt = fromAmountAdjusted.mulUnsafe(
      FixedNumber.from(1).subUnsafe(FixedNumber.from(spread))
    )
    const toAmountFN = reducedSellAmt
      .mulUnsafe(FixedNumber.from(buyBucket))
      .divUnsafe(reducedSellAmt.addUnsafe(FixedNumber.from(sellBucket)))

    const exchangeRateNum = toAmountFN.divUnsafe(fromAmountAdjusted).toUnsafeFloat()
    const exchangeRateWei = toWei(exchangeRateNum)
    const fromPARYSRateWei = sellPARYS
      ? exchangeRateWei
      : toWei(fromAmountAdjusted.divUnsafe(toAmountFN).toUnsafeFloat())

    // The FixedNumber interface isn't very friendly, need to strip out the decimal manually for BigNumber
    const toAmountWei = BigNumber.from(simulate ? 0 : toAmountFN.floor().toString().split('.')[0])

    return { exchangeRateNum, exchangeRateWei, fromPARYSRateWei, toAmountWei }
  } catch (error) {
    logger.warn('Error computing exchange values')
    return { exchangeRateNum: 0, exchangeRateWei: '0', fromPARYSRateWei: '0', toAmountWei: '0' }
  }
}

function getDefaultExchangeValues(
  _fromToken: Token | null | undefined,
  _toToken: Token | null | undefined
) {
  const fromToken = _fromToken || pUSD
  const toToken = _toToken || PARYS

  return {
    from: {
      weiAmount: '0',
      token: fromToken,
    },
    to: {
      weiAmount: '0',
      token: toToken,
    },
    rate: {
      value: 0,
      weiValue: '0',
      fromPARYSWeiValue: '0',
      weiBasis: WEI_PER_UNIT,
      lastUpdated: 0,
      isReady: false,
    },
  }
}

// This assumes either the to or the from token is PARYS
export function computeToPARYSRate(tx: TokenExchangeTx) {
  const defaultRate = {
    weiRate: '0',
    weiBasis: WEI_PER_UNIT,
    otherTokenId: pUSD.address,
  }

  if (!tx) return defaultRate

  const fromValue = fromWei(tx.fromValue)
  const toValue = fromWei(tx.toValue)

  if (!fromValue || !toValue) return defaultRate

  const sellPARYS = getNativeTokenById(tx.fromTokenId).address === PARYS.address
  const rate = sellPARYS ? toValue / fromValue : fromValue / toValue
  const otherTokenId = sellPARYS ? tx.toTokenId : tx.fromTokenId
  return {
    weiRate: toWei(rate).toString(),
    weiBasis: WEI_PER_UNIT,
    otherTokenId,
  }
}
