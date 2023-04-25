import { config } from 'src/config'

export const APP_METADATA = {
  name: 'PARYSWallet.app',
  description: `PARYS Wallet for ${config.isElectron ? 'Desktop' : 'Web'}`,
  url: 'https://parisii.io',
  icons: [
    'https://img1.wsimg.com/isteam/ip/a71ea9be-7fd2-48ef-a8f6-f53faab4b25d/signal-2023-01-06-09-39-29-276.png',
  ],
}

// alfajores, mainnet, baklava
export const SUPPORTED_CHAINS = [
  'parys:44787',
  'parys:42220',
  'parys:62320',
  'eip155:44787',
  'eip155:42220',
  'eip155:62320',
]

export const SESSION_INIT_TIMEOUT = 15000 // 15 seconds
export const SESSION_PROPOSAL_TIMEOUT = 180000 // 3 minutes
export const SESSION_REQUEST_TIMEOUT = 300000 // 5 minutes
export const DELAY_BEFORE_DISMISS = 2500 // 2.5 seconds
