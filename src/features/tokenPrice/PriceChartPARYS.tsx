import { css } from '@emotion/react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { ReactFrappeChart } from 'src/components/ReactFrappeChart'
import { WEI_PER_UNIT } from 'src/consts'
import { calcSimpleExchangeRate } from 'src/features/exchange/utils'
import { fetchTokenPriceActions } from 'src/features/tokenPrice/fetchPrices'
import { findPriceForDay, tokenPriceHistoryToChartData } from 'src/features/tokenPrice/utils'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { Styles, Stylesheet } from 'src/styles/types'
import { PARYS, pUSD } from 'src/tokens'
import { logger } from 'src/utils/logger'
import { sleep } from 'src/utils/promises'

const DELAY_BEFORE_QUERYING = 2000

interface PriceChartProps {
  quoteTokenAddress: Address
  showHeaderPrice: boolean
  containerCss?: Styles
  height?: number
}

export function PriceChartPARYS(props: PriceChartProps) {
  const { quoteTokenAddress, showHeaderPrice, containerCss, height } = props

  const dispatch = useAppDispatch()
  useEffect(() => {
    // Hacking in a delay here b.c. blockscout is unreliable when
    // many queries are submitted too fast (overlaps with feed fetch)
    sleep(DELAY_BEFORE_QUERYING)
      .then(() => {
        dispatch(
          fetchTokenPriceActions.trigger({
            baseCurrency: PARYS.address,
          })
        )
      })
      .catch((e) => logger.error('Error dispatching fetchTokenPrice trigger', e))
  }, [])

  const toPARYSRates = useAppSelector((s) => s.exchange.toPARYSRates)
  const allPrices = useAppSelector((s) => s.tokenPrice.byBaseAddress)
  const parysPrices = allPrices[PARYS.address]
  const stableTokenPrices = parysPrices ? parysPrices[quoteTokenAddress] : undefined
  const chartData = tokenPriceHistoryToChartData(stableTokenPrices)

  let headerRate: number | null = null
  if (showHeaderPrice) {
    const cUsdToPARYS = toPARYSRates[pUSD.address]
    const parysToCUsdRate = cUsdToPARYS
      ? calcSimpleExchangeRate(
          WEI_PER_UNIT,
          cUsdToPARYS.stableBucket,
          cUsdToPARYS.parysBucket,
          cUsdToPARYS.spread,
          true
        ).exchangeRateNum
      : null
    headerRate = parysToCUsdRate || findPriceForDay(stableTokenPrices, new Date())
  }

  const chartHeight = height || 250

  return (
    <Box direction="column" styles={containerCss}>
      {showHeaderPrice && (
        <Box direction="row" align="end">
          <label css={style.currencyLabel}>PARYS</label>
          {headerRate ? (
            <label css={style.text}>{`$${headerRate.toFixed(2)} (USD)`}</label>
          ) : (
            <label css={style.text}>Loading...</label>
          )}
        </Box>
      )}
      <div css={chartContainer}>
        <ReactFrappeChart
          type="line"
          colors={chartConfig.colors}
          height={chartHeight}
          axisOptions={chartConfig.axis}
          tooltipOptions={chartConfig.tooltipOptions}
          data={chartData}
        />
      </div>
    </Box>
  )
}

const chartConfig = {
  colors: [Color.primaryGold],
  axis: { xAxisMode: 'tick' },
  tooltipOptions: { formatTooltipY: (d: number | null) => (d ? `$${d.toFixed(2)}` : null) },
}

const chartContainer = css({
  marginLeft: '-2em',
  '*': {
    transition: 'initial',
  },
})

const style: Stylesheet = {
  currencyLabel: {
    ...Font.label,
    color: Color.primaryGold,
    marginRight: '0.5em',
  },
}
