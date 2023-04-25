import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { Nft, NftContract } from 'src/features/nft/types'

interface NftState {
  owned: Record<Address, Nft[]>
  lastUpdated: number | null // for owned
  customContracts: NftContract[]
}

export const nftInitialState: NftState = {
  owned: {},
  lastUpdated: null,
  customContracts: [],
}

const nftSlice = createSlice({
  name: 'nft',
  initialState: nftInitialState,
  reducers: {
    updateOwnedNfts: (state, action: PayloadAction<Record<Address, Nft[]>>) => {
      state.owned = action.payload
      state.lastUpdated = Date.now()
    },
    setImageUri: (
      state,
      action: PayloadAction<{ contract: Address; tokenId: number; imageUri: string }>
    ) => {
      const { contract, tokenId, imageUri } = action.payload
      const nft = state.owned[contract]?.find((n) => n.tokenId === tokenId)
      if (nft) nft.imageUri = imageUri
    },
    addCustomContract: (state, action: PayloadAction<NftContract>) => {
      state.customContracts.push(action.payload)
    },
    resetNfts: () => nftInitialState,
  },
})

export const { updateOwnedNfts, setImageUri, addCustomContract, resetNfts } = nftSlice.actions
const nftReducer = nftSlice.reducer

const persistConfig = {
  key: 'nft',
  storage: storage,
  whitelist: ['owned', 'customContracts'],
}

export const persistedNftReducer = persistReducer<ReturnType<typeof nftReducer>>(
  persistConfig,
  nftReducer
)
