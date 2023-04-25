import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { useFundWalletModal } from 'src/components/FundWalletModal'
import Mail from 'src/components/icons/mail.svg'
import { Box } from 'src/components/layout/Box'
import { useAddressQrCodeModal } from 'src/features/qr/QrCodeModal'
import { useWalletAddress } from 'src/features/wallet/hooks'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { Stylesheet } from 'src/styles/types'

export function HeaderSectionEmpty() {
  const address = useWalletAddress()
  const showQrModal = useAddressQrCodeModal()
  const showFundModal = useFundWalletModal()

  const onQrButtonClick = () => {
    showQrModal(address)
  }

  const onClickBuyPARYS = () => {
    showFundModal(address)
  }

  return (
    <Box direction="column">
      <h1 css={style.header}>
        Welcome to your PARYS wallet. Manage your Carbon and Digital Currency investments from a
        single source.
      </h1>

      <Box direction="column">
        <Box direction="row" align="end">
          <img src={Mail} css={style.icon} alt="Get Started" />
          <label css={[Font.body, Font.bold]}>Get started</label>
        </Box>
        <p css={style.tip}>All new wallets start empty. Add funds to start using PARYS.</p>
        <p css={style.tip}>
          You can <TextButton onClick={onClickBuyPARYS}>buy PARYS</TextButton> from an exchange or
          ask a friend on PARYS to send a payment to{' '}
          <TextButton onClick={onQrButtonClick}>your address.</TextButton>{' '}
        </p>
        <div css={style.callToActionContainer}>
          <Button size="s" margin="0.5em 1em 0 0" width="9em" onClick={onClickBuyPARYS}>
            Buy PARYS
          </Button>
          <Button size="s" margin="0.5em 0 0 0" width="9em" onClick={onQrButtonClick}>
            Receive PARYS
          </Button>
        </div>
      </Box>
    </Box>
  )
}

const style: Stylesheet = {
  header: {
    ...Font.h1,
    margin: '0 0 1em 0',
    color: Color.primaryGreen,
  },
  icon: {
    marginRight: '0.5em',
    height: '2em',
    width: '2em',
  },
  tip: {
    ...Font.body,
    margin: '1em 0 0 0',
  },
  callToActionContainer: {
    marginTop: '1.5em',
  },
}
