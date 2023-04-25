import { memo } from 'react'
import PARYSIcon from 'src/components/icons/tokens/PARYS.svg'
import pEUAIcon from 'src/components/icons/tokens/pEUA.svg'
import pEURIcon from 'src/components/icons/tokens/pEUR.svg'
import pUSDIcon from 'src/components/icons/tokens/pUSD.svg'
import { Box } from 'src/components/layout/Box'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { PARYS, Token, pEUA, pEUR, pUSD } from 'src/tokens'

interface Props {
  token: Token
  size: 's' | 'm' | 'l'
}

function _TokenIcon({ token, size }: Props) {
  let icon
  if (token.address === PARYS.address) icon = PARYSIcon
  else if (token.address === pUSD.address) icon = pUSDIcon
  else if (token.address === pEUR.address) icon = pEURIcon
  else if (token.address === pEUA.address) icon = pEUAIcon

  const { fallbackImgSize, actualSize, fontSize } = sizeValues[size]

  return icon ? (
    <img
      width={fallbackImgSize}
      height={fallbackImgSize}
      src={icon}
      css={{ height: actualSize, width: actualSize }}
      alt={token.symbol}
      title={token.symbol}
    />
  ) : (
    <Box
      align="center"
      justify="center"
      styles={{
        height: actualSize,
        width: actualSize,
        borderRadius: '50%',
        backgroundColor: token.color || Color.accentBlue,
      }}
    >
      <div
        css={{
          ...Font.bold,
          fontSize,
          color: '#FFFFFF',
          paddingLeft: size === 'l' ? 1 : 0,
        }}
      >
        {token.symbol[0].toUpperCase()}
      </div>
    </Box>
  )
}

const sizeValues = {
  s: {
    fallbackImgSize: '22px',
    actualSize: '1.4em',
    fontSize: '0.9em',
  },
  m: {
    fallbackImgSize: '24px',
    actualSize: '1.5em',
    fontSize: '0.95em',
  },
  l: {
    fallbackImgSize: '26px',
    actualSize: '1.7em',
    fontSize: '1em',
  },
}

export const TokenIcon = memo(_TokenIcon)
