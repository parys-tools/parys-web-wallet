import { createAction, createSlice } from '@reduxjs/toolkit'
import type { SessionTypes } from '@walletconnectv2/types'
import {
  SessionStatus,
  WalletConnectSession,
  WalletConnectStatus,
} from 'src/features/walletManager/types'

export const initializeWcClient = createAction<string>('walletConnect/init')
export const proposeWcSession = createAction<SessionTypes.Proposal>('walletconnect/proposeSession')
export const approveWcSession = createAction('walletconnect/approveSession')
export const rejectWcSession = createAction('walletconnect/rejectSession')
export const createWcSession = createAction<SessionTypes.Settled>('walletconnect/createSession')
export const updateWcSession = createAction<SessionTypes.UpdateParams>(
  'walletconnect/updateSession'
)
export const deleteWcSession = createAction<SessionTypes.DeleteParams>(
  'walletconnect/deleteSession'
)
export const failWcSession = createAction<string>('walletconnect/fail')
export const requestFromWc = createAction<SessionTypes.RequestEvent>('walletconnect/requestEvent')
export const approveWcRequest = createAction('walletconnect/approveRequest')
export const rejectWcRequest = createAction('walletconnect/rejectRequest')
export const completeWcRequest = createAction('walletconnect/completeRequest')
export const failWcRequest = createAction<string>('walletconnect/failRequest')
export const dismissWcRequest = createAction('walletconnect/dismissRequest')
export const disconnectWcClient = createAction('walletconnect/disconnect')
export const resetWcClient = createAction('walletconnect/reset')

interface walletConnectState {
  status: WalletConnectStatus
  uri: string | null
  session: WalletConnectSession | null
  request: SessionTypes.RequestEvent | null
  error: string | null
}

const walletConnectsInitialState: walletConnectState = {
  status: WalletConnectStatus.Disconnected,
  uri: null,
  session: null,
  request: null,
  error: null,
}

const walletConnectSlice = createSlice({
  name: 'walletConnect',
  initialState: walletConnectsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeWcClient, (state, action) => {
        state.status = WalletConnectStatus.Initializing
        state.uri = action.payload
      })
      .addCase(proposeWcSession, (state, action) => {
        state.status = WalletConnectStatus.SessionPending
        state.session = {
          status: SessionStatus.Pending,
          data: action.payload,
        }
      })
      .addCase(createWcSession, (state, action) => {
        state.status = WalletConnectStatus.SessionActive
        state.session = {
          status: SessionStatus.Settled,
          data: action.payload,
          startTime: Date.now(),
        }
      })
      .addCase(failWcSession, (state, action) => {
        state.status = WalletConnectStatus.Error
        state.error = action.payload
      })
      .addCase(requestFromWc, (state, action) => {
        state.status = WalletConnectStatus.RequestPending
        state.request = action.payload
      })
      .addCase(approveWcRequest, (state) => {
        state.status = WalletConnectStatus.RequestActive
      })
      .addCase(completeWcRequest, (state) => {
        state.status = WalletConnectStatus.RequestComplete
      })
      .addCase(failWcRequest, (state, action) => {
        state.status = WalletConnectStatus.RequestFailed
        state.error = action.payload
      })
      .addCase(dismissWcRequest, (state) => {
        state.status = WalletConnectStatus.SessionActive
        state.request = null
        state.error = null
      })
      .addCase(disconnectWcClient, (state) => {
        if (state.status !== WalletConnectStatus.Error) {
          return walletConnectsInitialState
        } else {
          // Preserve error for displaying to user
          return {
            ...walletConnectsInitialState,
            status: state.status,
            error: state.error,
          }
        }
      })
      .addCase(resetWcClient, () => walletConnectsInitialState)
  },
})

export const walletConnectReducer = walletConnectSlice.reducer
