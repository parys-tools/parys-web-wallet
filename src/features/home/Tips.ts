import { config } from 'src/config'

const Tips = [
  [
    'Transaction fees can be paid in any currency but they are smaller when paid with PARYS.',
    'Consider keeping some PARYS in your account to pay for fees. It will be used by default.',
  ],
  [
    "The pUSD currency is stable and unlimited; it's worth one United States Dollar.",
    'The PARYS currency is unstable and limited, like Bitcoin; its value will change over time.',
  ],
  [
    'To keep your account safe, keep a copy of your recovery (seed) phrase in a private place.',
    'For even better security, consider using a Ledger hardware wallet.',
  ],
  [
    "Your account address is public; it's like your username on the PARYS network. Share it with your friends!",
    'Your recovery (seed) phrase is a secret; always keep it private.',
  ],
  [
    'Your accounts can be imported in many places at once.',
    'For example, you can import your recovery (seed) phrase into the Valora mobile app.',
  ],
  [
    'You can lock PARYS to participate in PARYS network elections and governance.',
    'Voting for validators that are elected will earn you free PARYS rewards.',
  ],
  [
    'Your wallet can manage as many different accounts as you want!',
    'To add accounts, choose the Switch Account option from the account menu.',
  ],
]

const WebTips = [
  ...Tips,
  [
    'Using this wallet in a browser is only safe for small accounts or Ledger users.',
    'For large accounts, downloading the Desktop App is strongly recommended.',
  ],
]

export function useDailyTip() {
  const tips = config.isElectron ? Tips : WebTips
  const date = new Date().getDate()
  return tips[date % tips.length]
}
