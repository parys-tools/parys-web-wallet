import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ToPARYSRates } from 'src/features/exchange/types'

export interface ExchangeState {
  toPARYSRates: ToPARYSRates
}

export const exchangeInitialState: ExchangeState = {
  toPARYSRates: {},
}

const exchangeSlice = createSlice({
  name: 'exchange',
  initialState: exchangeInitialState,
  reducers: {
    setExchangeRates: (state, action: PayloadAction<ToPARYSRates>) => {
      state.toPARYSRates = action.payload
    },
    resetExchangeRates: () => exchangeInitialState,
  },
})

export const { setExchangeRates, resetExchangeRates } = exchangeSlice.actions

export const exchangeReducer = exchangeSlice.reducer
