import { utils } from 'ethers'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from 'src/app/hooks'
import { defaultButtonStyles } from 'src/components/buttons/Button'
import PasteIcon from 'src/components/icons/paste.svg'
import QrCodeIcon from 'src/components/icons/qr_code.svg'
import SendPaymentIcon from 'src/components/icons/send_payment.svg'
import { Identicon } from 'src/components/Identicon'
import { Box } from 'src/components/layout/Box'
import { useAddressQrCodeModal } from 'src/features/qr/QrCodeModal'
import { txFlowReset } from 'src/features/txFlow/txFlowSlice'
import { Color } from 'src/styles/Color'
import { Stylesheet } from 'src/styles/types'
import { validateAddress } from 'src/utils/addresses'
import { useClipboardSet } from 'src/utils/clipboard'
import { chunk, trimToLength } from 'src/utils/string'

type ButtonType = 'send' | 'copy' | 'qrAndCopy'

interface Props {
  address: Address
  name?: string
  hideIdenticon?: boolean
  buttonType?: ButtonType
  isTransparent?: boolean
}

export function Address(props: Props) {
  const { address, name, hideIdenticon, buttonType, isTransparent } = props
  validateAddress(address, 'Address component')

  const onSendButtonClick = useSendToAddress(address)
  const onCopyButtonClick = useClipboardSet(address)
  const showQrModal = useAddressQrCodeModal()
  const onQrButtonClick = () => {
    showQrModal(address)
  }

  const addressSections = chunk<string>(utils.getAddress(address).substring(2).toUpperCase(), 4)

  const iconContainerStyle = getIconContainerStyle(isTransparent)
  const addressContainerStyle = getAddressContainerStyle(
    hideIdenticon,
    buttonType,
    isTransparent,
    name
  )

  return (
    <Box direction="row" align="center">
      {!hideIdenticon && (
        <div css={iconContainerStyle}>
          <Identicon address={address} size={46} />
        </div>
      )}
      <div css={addressContainerStyle}>
        {name ? (
          <>
            <Box direction="row" align="center">
              <span css={style.addressChunk}>{trimToLength(name, 22)}</span>
            </Box>
            <Box direction="row" align="center">
              {addressSections.slice(0, 3).map((chunk, index) => (
                <span key={`address-chunk-${index + 5}`} css={style.addressChunk}>
                  {chunk}
                </span>
              ))}
              <span css={[style.addressChunk, { padding: 0 }]}>...</span>
            </Box>
          </>
        ) : (
          <>
            <Box direction="row" align="center" justify="between">
              {addressSections.slice(0, 5).map((chunk, index) => (
                <span key={`address-chunk-${index}`} css={style.addressChunk}>
                  {chunk}
                </span>
              ))}
            </Box>
            <Box direction="row" align="center" justify="between">
              {addressSections.slice(5).map((chunk, index) => (
                <span key={`address-chunk-${index + 5}`} css={style.addressChunk}>
                  {chunk}
                </span>
              ))}
            </Box>
          </>
        )}
      </div>
      {buttonType === 'send' && (
        <button css={style.button} onClick={onSendButtonClick} title="Send to Address">
          <img width="15px" height="15px" src={SendPaymentIcon} alt="Send" />
        </button>
      )}
      {(buttonType === 'copy' || buttonType === 'qrAndCopy') && (
        <Box direction="column" align="center" justify="between">
          {buttonType === 'qrAndCopy' && (
            <button
              css={[style.button, { marginBottom: 6 }]}
              onClick={onQrButtonClick}
              title="Qr Code"
            >
              <img width="16px" height="16px" src={QrCodeIcon} alt="Qr Code" />
            </button>
          )}
          <button css={style.button} onClick={onCopyButtonClick} title="Copy Address">
            <img width="17px" height="17px" src={PasteIcon} alt="Copy" />
          </button>
        </Box>
      )}
    </Box>
  )
}

export function useSendToAddress(address: Address) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  return () => {
    dispatch(txFlowReset())
    navigate('/send', { state: { recipient: address } })
  }
}

function getAddressContainerStyle(
  hideIdenticon?: boolean,
  buttonType?: ButtonType,
  isTransparent?: boolean,
  name?: string
) {
  const addressContainerStyle = { ...style.addressContainer }
  if (name) {
    addressContainerStyle.paddingLeft = 34
  }
  if (hideIdenticon) {
    addressContainerStyle.paddingLeft = 8
    addressContainerStyle.paddingRight = 8
    addressContainerStyle.marginLeft = 0
  }
  if (buttonType) {
    addressContainerStyle.paddingRight = 16
  }
  if (buttonType === 'qrAndCopy') {
    if (!hideIdenticon) throw new Error('No current design for two-button address with identicon')
    addressContainerStyle.paddingLeft = 12
    addressContainerStyle.paddingRight = 19
    addressContainerStyle.paddingTop = 12
    addressContainerStyle.paddingBottom = 12
  }
  if (isTransparent) {
    addressContainerStyle.backgroundColor = 'none'
  }
  return addressContainerStyle
}

function getIconContainerStyle(isTransparent?: boolean) {
  return isTransparent ? style.iconContainer : { ...style.iconContainer, ...style.iconShadow }
}

const style: Stylesheet = {
  iconContainer: {
    zIndex: 10,
    borderRadius: 23,
  },
  iconShadow: {
    backgroundColor: '#FFFFFF',
    boxShadow: '2px 0px 0px 2px #FFFFFF',
  },
  addressContainer: {
    zIndex: 5,
    backgroundColor: Color.fillLight,
    marginLeft: '-23px',
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingLeft: '30px',
    paddingRight: '6px',
    borderRadius: 4,
  },
  addressChunk: {
    padding: '0px 3px',
    lineHeight: '22px',
  },
  button: {
    ...defaultButtonStyles,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    height: 27,
    width: 27,
    marginLeft: -10,
  },
  buttonTop: {
    marginLeft: -10,
  },
}
