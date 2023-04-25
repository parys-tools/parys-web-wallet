import { useState } from 'react'
import { Fade } from 'src/components/animation/Fade'
import { KebabMenuIcon } from 'src/components/icons/KebabMenu'
import NftIcon from 'src/components/icons/nft.svg'
import { Box } from 'src/components/layout/Box'
import { Nft, NftContract } from 'src/features/nft/types'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { mq } from 'src/styles/mediaQueries'
import { Styles, Stylesheet } from 'src/styles/types'
import { logger } from 'src/utils/logger'

interface Props {
  nft: Nft | null
  contract: NftContract | null
  styles?: Styles
}

export function NftImage({ nft, contract, styles }: Props) {
  const [loaded, setLoaded] = useState(false)

  const containerStyle = styles
    ? { ...style.defaultImageContainer, ...styles }
    : style.defaultImageContainer

  return (
    <Box align="center" justify="center" styles={containerStyle}>
      <img src={NftIcon} css={style.defaultImage} />
      {nft?.imageUri && contract && (
        <div css={style.actualImageContainer}>
          <Fade show={loaded} transparent={true} duration="300ms">
            <img
              src={nft.imageUri}
              css={style.actualImage}
              alt={nft.tokenId.toString()}
              onLoad={() => setLoaded(true)}
              onError={() => {
                logger.error('Error loading nft image', nft.imageUri)
                setLoaded(false)
              }}
            />
          </Fade>
        </div>
      )}
    </Box>
  )
}

export function NftImageWithInfo({ nft, contract, styles }: Props) {
  const containerStyle = styles
    ? { ...style.imageAndInfoContainer, ...styles }
    : style.imageAndInfoContainer

  const isValid = !!(contract && nft)

  return (
    <div css={containerStyle}>
      <NftImage nft={nft} contract={contract} />
      <Box align="center" justify="between" styles={style.infoContainer}>
        <Box direction="column" align="start">
          <label css={style.infoHeader}>{isValid ? contract.name : ''}</label>
          <div css={style.infoText}>{isValid ? contract.symbol + ' #' + nft.tokenId : ''}</div>
        </Box>
        <KebabMenuIcon size={5} color={Color.altGrey} />
      </Box>
    </div>
  )
}

const style: Stylesheet = {
  defaultImageContainer: {
    position: 'relative',
    background: '#CFD4D9',
    width: '16em',
    height: '14em',
  },
  defaultImage: {
    width: '5em',
    height: '5em',
    [mq[1024]]: {
      width: '6em',
      height: '6em',
    },
  },
  imageAndInfoContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',
    ':hover': {
      top: -2,
      boxShadow: '0px 6px 4px rgba(0, 0, 0, 0.1)',
    },
  },
  infoContainer: {
    borderRadius: '0 0 8px 8px',
    padding: '1em',
    border: `1px solid ${Color.borderMedium}`,
    background: 'rgba(46, 51, 56, 0.02)',
  },
  infoHeader: {
    ...Font.body2,
    color: Color.textGrey,
  },
  infoText: {
    ...Font.body,
    ...Font.bold,
    fontSize: '1.2em',
    marginTop: '0.1em',
  },
  actualImageContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    div: {
      width: '100%',
      height: '100%',
    },
  },
  actualImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}
