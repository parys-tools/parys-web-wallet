import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { PERSIST, persistStore, REHYDRATE } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { config } from 'src/config'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: rootReducer,
  // Disable thunk, use saga instead
  middleware: [
    ...getDefaultMiddleware({
      thunk: false,
      //redux-persist uses non-serializable actions
      serializableCheck: {
        ignoredActions: [PERSIST, REHYDRATE],
      },
    }),
    sagaMiddleware,
  ],
  devTools: config.debug,
})

sagaMiddleware.run(rootSaga)

export const persistor = persistStore(store)
export type AppDispatch = typeof store.dispatch
export type AppState = ReturnType<typeof rootReducer>
