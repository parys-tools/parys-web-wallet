import { Address } from 'src/components/Address'
import { Box } from 'src/components/layout/Box'
import { useModal } from 'src/components/modal/useModal'
import { QrCode } from 'src/features/qr/QrCode'
import { encodeAddressForQr } from 'src/features/qr/utils'

export function useAddressQrCodeModal() {
  const { showModalWithContent } = useModal()
  return (address: Address) => {
    const data = encodeAddressForQr(address)
    showModalWithContent({
      head: 'Your PARYS Account Address',
      content: <AddressQrCodeModal address={address} data={data} />,
    })
  }
}

function AddressQrCodeModal({ address, data }: { address: Address; data: string }) {
  return (
    <Box direction="column" align="center">
      <div css={{ marginBottom: '1em', paddingLeft: '1em' }}>
        <Address address={address} hideIdenticon={true} buttonType="copy" />
      </div>
      <QrCode data={data} size="12em" />
    </Box>
  )
}
