import { Box } from 'src/components/layout/Box'
import { MoneyValue } from 'src/components/MoneyValue'
import { computeToPARYSRate } from 'src/features/exchange/utils'
import {
  TransactionFeeProperty,
  TransactionStatusProperty,
} from 'src/features/feed/components/CommonTransactionProperties'
import {
  TransactionProperty,
  TransactionPropertyGroup,
} from 'src/features/feed/components/TransactionPropertyGroup'
import { txReviewStyles } from 'src/features/feed/components/txReviewStyles'
import { useTokens } from 'src/features/tokens/hooks'
import { getTokenById } from 'src/features/tokens/utils'
import { TokenExchangeTx } from 'src/features/types'
import { Stylesheet } from 'src/styles/types'
import { PARYS } from 'src/tokens'

interface Props {
  tx: TokenExchangeTx
}

export function TokenExchangeReview({ tx }: Props) {
  const tokens = useTokens()
  const rate = computeToPARYSRate(tx)

  return (
    <TransactionPropertyGroup>
      <TransactionStatusProperty tx={tx} />
      <TransactionProperty label="Amount">
        <Box styles={txReviewStyles.value}>
          <span css={style.amountLabel}>In: </span>
          <MoneyValue amountInWei={tx.fromValue} token={getTokenById(tx.fromTokenId, tokens)} />
        </Box>
        <Box styles={txReviewStyles.value}>
          <span css={style.amountLabel}>Out: </span>
          <MoneyValue amountInWei={tx.toValue} token={getTokenById(tx.toTokenId, tokens)} />
        </Box>
      </TransactionProperty>
      <TransactionFeeProperty tx={tx} />
      <TransactionProperty label="Rate">
        <Box styles={txReviewStyles.value}>
          <MoneyValue amountInWei={rate.weiBasis} token={PARYS} />
          <span css={style.rateDivider}> : </span>
          <MoneyValue amountInWei={rate.weiRate} token={getTokenById(rate.otherTokenId, tokens)} />
        </Box>
      </TransactionProperty>
    </TransactionPropertyGroup>
  )
}

const style: Stylesheet = {
  amountLabel: {
    display: 'inline-block',
    minWidth: '3em',
  },
  rateDivider: {
    padding: '0 0.5em',
  },
}
