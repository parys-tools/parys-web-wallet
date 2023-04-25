import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { TokenMap } from 'src/features/tokens/types'
import { NativeTokensByAddress, Token } from 'src/tokens'
import { normalizeAddress } from 'src/utils/addresses'
import { assert } from 'src/utils/validation'

interface TokensState {
  isMigrated: boolean // Have the tokens been migrated from previous home in walletSlice
  byAddress: TokenMap // Note, only custom added tokens get stored here
}

const initialState: TokensState = {
  isMigrated: false,
  byAddress: {},
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    markMigrated: (state) => {
      state.isMigrated = true
    },
    addToken: (state, action: PayloadAction<Token>) => {
      const newToken = action.payload
      assert(newToken, 'No new token provided')
      const addr = newToken.address
      assert(addr && addr === normalizeAddress(addr), 'No new token address invalid')
      assert(!state.byAddress[addr], 'Token already exists')
      assert(!NativeTokensByAddress[addr], 'Cannot add native tokens')
      state.byAddress[addr] = newToken
    },
    removeToken: (state, action: PayloadAction<string>) => {
      const tokenAddr = action.payload
      assert(state.byAddress[tokenAddr], 'Token does not exist')
      assert(!NativeTokensByAddress[tokenAddr], 'Token is native')
      delete state.byAddress[tokenAddr]
    },
    resetTokens: () => initialState,
  },
})

export const { markMigrated, addToken, removeToken, resetTokens } = tokensSlice.actions
const tokenReducer = tokensSlice.reducer

const persistConfig = {
  key: 'tokens',
  storage: storage,
  whitelist: ['isMigrated', 'byAddress'],
}

export const persistedTokensReducer = persistReducer<ReturnType<typeof tokenReducer>>(
  persistConfig,
  tokenReducer
)
