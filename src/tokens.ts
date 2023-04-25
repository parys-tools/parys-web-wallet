import { config } from 'src/config'
import { NULL_ADDRESS } from 'src/consts'
import { Color } from 'src/styles/Color'

export interface Token {
  symbol: string
  name: string
  address: Address // contract address
  chainId: number
  decimals?: number
  color?: string
  exchangeAddress?: Address // Mento contract for token
  sortOrder?: number // for order preference in balance lists
}

export interface TokenWithBalance extends Token {
  value: string
}

export const PARYS = {
  symbol: 'PARYS',
  name: 'PARYS Native',
  color: Color.primaryGold,
  address: config.contractAddresses.GoldToken,
  decimals: 18,
  chainId: config.chainId,
  sortOrder: 10,
}
export const pUSD = {
  symbol: 'pUSD',
  name: 'PARYS Dollar',
  color: Color.primaryGreen,
  address: config.contractAddresses.StableToken,
  decimals: 18,
  chainId: config.chainId,
  exchangeAddress: config.contractAddresses.Exchange,
  sortOrder: 20,
}
export const pEUR = {
  symbol: 'pEUR',
  name: 'PARYS Euro',
  color: Color.primaryGreen,
  address: config.contractAddresses.StableTokenEUR,
  decimals: 18,
  chainId: config.chainId,
  exchangeAddress: config.contractAddresses.ExchangeEUR,
  sortOrder: 30,
}
export const pEUA = {
  symbol: 'pEUA',
  name: 'PARYS EU Allowance',
  color: Color.primaryGreen,
  address: config.contractAddresses.StableTokenBRL,
  decimals: 18,
  chainId: config.chainId,
  exchangeAddress: config.contractAddresses.ExchangeBRL,
  sortOrder: 40,
}

export const NativeTokens = [PARYS, pUSD, pEUR, pEUA]
export const NativeTokensByAddress: Record<Address, Token> = {
  [PARYS.address]: PARYS,
  [pUSD.address]: pUSD,
  [pEUR.address]: pEUR,
  [pEUA.address]: pEUA,
}
export const StableTokens = [pUSD, pEUR, pEUA]

export const LockedCelo: Token = {
  ...PARYS,
  symbol: 'Locked PARYS',
  name: 'Locked PARYS',
  address: config.contractAddresses.LockedGold,
  sortOrder: PARYS.sortOrder! + 1,
}

export const UnknownToken: Token = {
  symbol: 'unknown',
  name: 'Unknown Token',
  color: Color.textGrey,
  address: NULL_ADDRESS,
  decimals: 18,
  chainId: config.chainId,
}
