import { Link } from 'react-router-dom'
import {
  default as LogoCompact,
  default as LogoNormal,
} from 'src/components/icons/parys-full-logo-tm-white.svg'
import { useIsMobile } from 'src/styles/mediaQueries'
import { Stylesheet } from 'src/styles/types'

export function HeaderLogo() {
  const isMobile = useIsMobile()
  return (
    <Link to="/">
      {isMobile ? (
        <img width="28" height="28" src={LogoCompact} alt="PARYS Logo" css={style.logoCompact} />
      ) : (
        <img width="120" height="120" src={LogoNormal} alt="PARYS Logo" css={style.logoNormal} />
      )}
    </Link>
  )
}

const style: Stylesheet = {
  logoCompact: {},
  logoNormal: {
    padding: '20px 0px 0px 100px',
  },
}
