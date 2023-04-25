import { PropsWithChildren } from 'react'
import Logo from 'src/components/icons/parys-full-logo-tm-white.svg'
import { Box } from 'src/components/layout/Box'
import { PageDots } from 'src/features/onboarding/PageDots'
import { mq } from 'src/styles/mediaQueries'
import { Stylesheet } from 'src/styles/types'

interface Props {
  // For page dots
  current?: number
  total?: number
}

export function OnboardingScreenFrame({ current, total, children }: PropsWithChildren<Props>) {
  return (
    <Box direction="column" align="center" justify="between" styles={style.container}>
      <div css={style.logoContainer}>
        <img width="200" height="200" src={Logo} alt="PARYS Logo" css={style.logo} />
      </div>
      <main>
        <Box align="center" justify="center" direction="column" styles={style.childrenContainer}>
          {children}
        </Box>
      </main>
      <nav css={style.dotsContainer}>
        {current && total && <PageDots current={current} total={total} />}
      </nav>
    </Box>
  )
}

const style: Stylesheet = {
  container: {
    minHeight: '100vh',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    width: '100%',
  },
  logoContainer: {
    alignSelf: 'flex-start',
  },
  logo: {
    padding: '1em 1.25em',
    [mq[768]]: {
      padding: '1.5em 1.5em',
    },
  },
  childrenContainer: {
    maxWidth: '46em',
  },
  dotsContainer: {
    margin: '1.5em',
    borderRadius: 8,
    padding: '0.6em',
    background: 'rgba(255,255,255,0.5)',
  },
}
