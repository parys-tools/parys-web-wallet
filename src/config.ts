export enum PARYSContract {
  Accounts = 'Accounts',
  Attestations = 'Attestations',
  Election = 'Election',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  ExchangeEUR = 'ExchangeEUR',
  ExchangeBRL = 'ExchangeBRL',
  GasPriceMinimum = 'GasPriceMinimum',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  LockedGold = 'LockedGold',
  Reserve = 'Reserve',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  StableTokenEUR = 'StableTokenEUR',
  StableTokenBRL = 'StableTokenBRL',
  Validators = 'Validators',
}

export enum PARYSChain {
  Mainnet = 42220,
  Alfajores = 44787,
}

// @ts-ignore Defined by webpack define plugin
const debugMode = __DEBUG__ ?? false
// @ts-ignore Defined by webpack define plugin
const isElectron = __IS_ELECTRON__ ?? false
// const isElectron = true
// @ts-ignore Defined by webpack define plugin
const version = __VERSION__ || null
// @ts-ignore Defined by webpack define plugin
const alchemyApiKey = __ALCHEMY_KEY__ || null
// @ts-ignore Defined by webpack define plugin
const walletConnectV2ProjectId = __WALLET_CONNECT_KEY__ || null

interface Config {
  debug: boolean
  isElectron: boolean
  version: string | null
  alchemyApiKey: string | null
  walletConnectV2ProjectId: string | null
  jsonRpcUrlPrimary: string
  jsonRpcUrlSecondary?: string
  gatewayFeeRecipient?: string
  blockscoutUrl: string
  discordUrl: string
  desktopUrls: {
    windows: string
    mac: string
    linux: string
  }
  chainId: number
  contractAddresses: Record<PARYSContract, string>
  nomspaceRegistry: string
  ensCoinTypeValue?: number
}

const desktopUrls = {
  windows:
    'https://github.com/parys-tools/parys-web-wallet/releases/download/v1.7.1/PARYS-Wallet-1.7.1-win-x64.exe',
  mac: 'https://github.com/parys-tools/parys-web-wallet/releases/download/v1.7.1/PARYS-Wallet-1.7.1-mac.dmg',
  linux:
    'https://github.com/parys-tools/parys-web-wallet/releases/download/v1.7.1/PARYS-Wallet-1.7.1-linux-x86_64.AppImage',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configMainnet: Config = {
  debug: debugMode,
  isElectron,
  version,
  alchemyApiKey,
  walletConnectV2ProjectId,
  jsonRpcUrlPrimary: 'https://node.celowallet.app',
  jsonRpcUrlSecondary: 'https://forno.celo.org',
  gatewayFeeRecipient: '0x97a5fF70483F9320aFA72e04AbA148Aa1c26946C',
  blockscoutUrl: 'https://explorer.celo.org',
  discordUrl: 'https://discord.gg/ht885KmG5A',
  desktopUrls,
  chainId: 42220,
  contractAddresses: {
    [PARYSContract.Accounts]: '0x7d21685C17607338b313a7174bAb6620baD0aaB7',
    [PARYSContract.Attestations]: '0xdC553892cdeeeD9f575aa0FBA099e5847fd88D20',
    [PARYSContract.Election]: '0x8D6677192144292870907E3Fa8A5527fE55A7ff6',
    [PARYSContract.Escrow]: '0xf4Fa51472Ca8d72AF678975D9F8795A504E7ada5',
    [PARYSContract.Exchange]: '0x67316300f17f063085Ca8bCa4bd3f7a5a3C66275',
    [PARYSContract.ExchangeEUR]: '0xE383394B913d7302c49F794C7d3243c429d53D1d',
    [PARYSContract.ExchangeBRL]: '0x8f2cf9855C919AFAC8Bd2E7acEc0205ed568a4EA',
    [PARYSContract.GasPriceMinimum]: '0xDfca3a8d7699D8bAfe656823AD60C17cb8270ECC',
    [PARYSContract.GoldToken]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    [PARYSContract.Governance]: '0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972',
    [PARYSContract.LockedGold]: '0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E',
    [PARYSContract.Reserve]: '0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9',
    [PARYSContract.SortedOracles]: '0xefB84935239dAcdecF7c5bA76d8dE40b077B7b33',
    [PARYSContract.StableToken]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    [PARYSContract.StableTokenEUR]: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    [PARYSContract.StableTokenBRL]: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
    [PARYSContract.Validators]: '0xaEb865bCa93DdC8F47b8e29F40C5399cE34d0C58',
  },
  nomspaceRegistry: '0x3DE51c3960400A0F752d3492652Ae4A0b2A36FB3',
  ensCoinTypeValue: 2147525868, // https://github.com/ensdomains/address-encoder/issues/329
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const configAlfajores: Config = {
  debug: true,
  isElectron,
  version,
  alchemyApiKey,
  walletConnectV2ProjectId,
  jsonRpcUrlPrimary: 'https://alfajores-forno.celo-testnet.org',
  blockscoutUrl: 'https://alfajores-blockscout.celo-testnet.org',
  discordUrl: 'https://discord.gg/ht885KmG5A',
  desktopUrls,
  chainId: 44787,
  contractAddresses: {
    [PARYSContract.Accounts]: '0xed7f51A34B4e71fbE69B3091FcF879cD14bD73A9',
    [PARYSContract.Attestations]: '0xAD5E5722427d79DFf28a4Ab30249729d1F8B4cc0',
    [PARYSContract.Election]: '0x1c3eDf937CFc2F6F51784D20DEB1af1F9a8655fA',
    [PARYSContract.Escrow]: '0xb07E10c5837c282209c6B9B3DE0eDBeF16319a37',
    [PARYSContract.Exchange]: '0x17bc3304F94c85618c46d0888aA937148007bD3C',
    [PARYSContract.ExchangeEUR]: '0x997B494F17D3c49E66Fafb50F37A972d8Db9325B',
    [PARYSContract.ExchangeBRL]: '0xf391DcaF77360d39e566b93c8c0ceb7128fa1A08',
    [PARYSContract.GasPriceMinimum]: '0xd0Bf87a5936ee17014a057143a494Dc5C5d51E5e',
    [PARYSContract.GoldToken]: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    [PARYSContract.Governance]: '0xAA963FC97281d9632d96700aB62A4D1340F9a28a',
    [PARYSContract.LockedGold]: '0x6a4CC5693DC5BFA3799C699F3B941bA2Cb00c341',
    [PARYSContract.Reserve]: '0xa7ed835288Aa4524bB6C73DD23c0bF4315D9Fe3e',
    [PARYSContract.SortedOracles]: '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075',
    [PARYSContract.StableToken]: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    [PARYSContract.StableTokenEUR]: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    [PARYSContract.StableTokenBRL]: '0xE4D517785D091D3c54818832dB6094bcc2744545',
    [PARYSContract.Validators]: '0x9acF2A99914E083aD0d610672E93d14b0736BBCc',
  },
  nomspaceRegistry: '0x40cd4db228e9c172dA64513D0e874d009486A9a9',
}

export const config = Object.freeze(configMainnet)
