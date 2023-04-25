import { FeeEstimate } from 'src/features/fees/types'

export type ToPARYSRates = Record<string, ExchangeRate> // token address to token<->PARYS rate

// Raw Mento chain data from an Exchange contract
export interface ExchangeRate {
  stableBucket: string
  parysBucket: string
  spread: string
  lastUpdated: number
}

// Result after ExchangeRate gets processed
export interface SimpleExchangeRate {
  rate: number
  lastUpdated: number
}

export interface ExchangeTokenParams {
  amountInWei: string
  fromTokenAddress: Address
  toTokenAddress: Address
  exchangeRate?: SimpleExchangeRate
  feeEstimates?: FeeEstimate[]
}
