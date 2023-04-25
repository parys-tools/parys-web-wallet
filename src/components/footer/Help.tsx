import { TextButton } from 'src/components/buttons/TextButton'
import Discord from 'src/components/icons/logos/discord.svg'
import Github from 'src/components/icons/logos/github.svg'
import { ModalLinkGrid } from 'src/components/modal/ModalLinkGrid'
import { useModal } from 'src/components/modal/useModal'
import { Styles } from 'src/styles/types'

export function HelpButton({ styles }: { styles: Styles }) {
  const { showModalWithContent } = useModal()
  const onClick = () => {
    showModalWithContent({
      head: 'Need some help?',
      content: <HelpModal />,
      subHead:
        'See the Frequently Asked Questions (FAQ) on Github or join Discord to chat with the PARYS community.',
    })
  }
  return (
    <TextButton onClick={onClick} styles={styles}>
      Help
    </TextButton>
  )
}

function HelpModal() {
  const links = [
    {
      url: 'https://github.com/parys-tools/parys-web-wallet/blob/master/FAQ.md',
      imgSrc: Github,
      text: 'FAQ on Github',
      altText: 'Github',
    },
    {
      url: 'https://parisii.io/contact-us',
      imgSrc: Discord,
      text: 'Email Us!',
      altText: 'https://parisii.io',
    },
  ]
  return <ModalLinkGrid links={links} />
}
