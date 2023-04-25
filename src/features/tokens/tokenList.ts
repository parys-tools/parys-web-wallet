import alfajores from 'src/alfajores.tokens.json'
import { PARYSChain, config } from 'src/config'
import mainnet from 'src/mainnet.tokens.json'
import { Token } from 'src/tokens'
import { areAddressesEqual } from 'src/utils/addresses'

let erc20Tokens: Token[]

function loadErc20Tokens() {
  let data
  if (config.chainId === PARYSChain.Alfajores) {
    data = alfajores
  } else if (config.chainId === PARYSChain.Mainnet) {
    data = mainnet
  } else {
    throw new Error(`Unsupported chain for token data ${config.chainId}`)
  }
  if (!data || !Array.isArray(data)) {
    throw new Error(`Invalid token data for ${config.chainId}`)
  }
  erc20Tokens = data
}

export function getKnownErc20Tokens() {
  if (!erc20Tokens) loadErc20Tokens()
  return erc20Tokens
}

export function findTokenByAddress(address: Address) {
  return getKnownErc20Tokens().find((t) => areAddressesEqual(t.address, address))
}
