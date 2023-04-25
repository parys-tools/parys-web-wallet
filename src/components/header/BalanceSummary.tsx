import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { transparentButtonStyles } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { MoneyValue } from 'src/components/MoneyValue'
import { useBalancesWithTokens } from 'src/features/balances/hooks'
import { getSortedTokenBalances } from 'src/features/balances/utils'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { mq, useWindowSize } from 'src/styles/mediaQueries'
import { Stylesheet } from 'src/styles/types'

export function BalanceSummary() {
  const { width: windowWidth } = useWindowSize()
  let numItems = 2
  if (windowWidth && windowWidth > 550) numItems = 3
  if (windowWidth && windowWidth > 1024) numItems = 4

  const balances = useBalancesWithTokens()
  const tokens = balances.tokenAddrToToken

  const { tokensToShow, hiddenTokens } = useMemo(() => {
    const sortedTokens = getSortedTokenBalances(tokens)
    const totalTokens = sortedTokens.length
    if (totalTokens <= numItems) {
      return { tokensToShow: sortedTokens, hiddenTokens: 0 }
    } else {
      return {
        tokensToShow: sortedTokens.slice(0, numItems - 1),
        hiddenTokens: totalTokens - (numItems - 1),
      }
    }
  }, [tokens, numItems])

  const navigate = useNavigate()
  const onBalanceClick = () => {
    navigate('/balances')
  }

  return (
    <div css={style.balances} onClick={onBalanceClick}>
      {tokensToShow.map((t) => (
        <MoneyValue
          key={`balance-summary-${t.address}`}
          amountInWei={t.value}
          token={t}
          roundDownIfSmall={true}
          baseFontSize={1.4}
          containerCss={style.balanceContainer}
          symbolType="icon"
          iconSize="l"
        />
      ))}
      {hiddenTokens > 0 && (
        <Box
          align="center"
          justify="center"
          styles={style.moreTokensContainer}
        >{`${hiddenTokens} more`}</Box>
      )}
    </div>
  )
}

const style: Stylesheet = {
  balances: {
    ...transparentButtonStyles,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: '0.05em',
  },
  balanceContainer: {
    margin: '0 0.5em',
    fontSize: '0.9em',
    [mq[480]]: {
      margin: '0 0.75em',
    },
    [mq[768]]: {
      fontSize: '1em',
      margin: '0 1em',
    },
    [mq[1024]]: {
      margin: '0 1.2em',
    },
    [mq[1200]]: {
      margin: '0 1.4em',
    },
    ':hover': {
      filter: 'brightness(1.1)',
    },
  },
  moreTokensContainer: {
    ...Font.bold,
    fontSize: '0.85em',
    padding: '0.4em 0.8em',
    borderRadius: '2em',
    background: Color.fillLighter,
    ':hover': {
      backgroundColor: Color.fillLight,
    },
    margin: '0.1em 0.5em 0 0.5em',
    [mq[480]]: {
      margin: '0.1em 0.75em 0 0.75em',
    },
    [mq[768]]: {
      fontSize: '0.95em',
      margin: '0.1em 1em 0 1em',
    },
    [mq[1200]]: {
      margin: '0.1em 1.2em 0 1.2em',
    },
  },
}
