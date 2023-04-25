import { Address, useSendToAddress } from 'src/components/Address'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { MoneyValue } from 'src/components/MoneyValue'
import { useAddContactModal } from 'src/features/contacts/AddContactModal'
import { TransactionStatusProperty } from 'src/features/feed/components/CommonTransactionProperties'
import {
  TransactionProperty,
  TransactionPropertyGroup,
} from 'src/features/feed/components/TransactionPropertyGroup'
import { txReviewStyles } from 'src/features/feed/components/txReviewStyles'
import { getFeeFromConfirmedTx } from 'src/features/fees/utils'
import { useTokens } from 'src/features/tokens/hooks'
import { getTokenById } from 'src/features/tokens/utils'
import { EscrowTransaction, TokenTransfer } from 'src/features/types'
import { Color } from 'src/styles/Color'
import { Stylesheet } from 'src/styles/types'

interface Props {
  tx: TokenTransfer | EscrowTransaction
}

export function TokenTransferReview({ tx }: Props) {
  const tokens = useTokens()
  const amountLabel = tx.isOutgoing ? 'Sent: ' : 'Received: '
  const addressLabel = tx.isOutgoing ? 'Sent To' : 'Received From'
  const address = tx.isOutgoing ? tx.to : tx.from

  const { feeValue, feeCurrency } = getFeeFromConfirmedTx(tx)

  const onClickSendButton = useSendToAddress(address)
  const onClickAddContact = useAddContactModal(address)

  return (
    <TransactionPropertyGroup>
      <TransactionStatusProperty tx={tx} />
      <TransactionProperty label={addressLabel}>
        <div css={txReviewStyles.value}>
          <Address address={address} buttonType="copy" />
          <Box align="center" margin="1.1em 0 0 0">
            <Button
              size="xs"
              margin="0 1.2em 0 1px"
              styles={txReviewStyles.actionButton}
              onClick={onClickSendButton}
            >
              Send Payment
            </Button>
            <Button size="xs" styles={txReviewStyles.actionButton} onClick={onClickAddContact}>
              Add Contact
            </Button>
          </Box>
        </div>
      </TransactionProperty>
      <TransactionProperty label="Amount">
        <Box styles={txReviewStyles.value}>
          <span css={style.amountLabel}>{amountLabel}</span>
          <MoneyValue amountInWei={tx.value} token={getTokenById(tx.tokenId, tokens)} />
        </Box>
        {tx.isOutgoing && (
          <Box styles={txReviewStyles.value}>
            <span css={style.amountLabel}>Fee: </span>
            <MoneyValue amountInWei={feeValue} token={feeCurrency} />
          </Box>
        )}
      </TransactionProperty>
      <TransactionProperty label="Comment">
        <div css={[txReviewStyles.value, !tx.comment && { color: Color.textGrey }]}>
          {tx.comment || 'No comment included'}
        </div>
      </TransactionProperty>
    </TransactionPropertyGroup>
  )
}

const style: Stylesheet = {
  amountLabel: {
    display: 'inline-block',
    minWidth: '5em',
  },
}
