import { BigNumber, BigNumberish, Contract } from 'ethers'
import { appSelect } from 'src/app/appSelect'
import { getContractByAddress, getErc20Contract } from 'src/blockchain/contracts'
import { getProvider } from 'src/blockchain/provider'
import { config } from 'src/config'
import { BALANCE_STALE_TIME } from 'src/consts'
import {
  balancesInitialState,
  setVoterBalances,
  updateBalances,
} from 'src/features/balances/balancesSlice'
import { Balances } from 'src/features/balances/types'
import { areBalancesEmpty } from 'src/features/balances/utils'
import { fetchLockedCeloStatus, fetchTotalLocked } from 'src/features/lock/fetchLockedStatus'
import { LockedCeloBalances } from 'src/features/lock/types'
import { getMigratedTokens } from 'src/features/tokens/migration'
import { TokenMap } from 'src/features/tokens/types'
import { isNativeTokenAddress } from 'src/features/tokens/utils'
import { fetchStakingBalances } from 'src/features/validators/fetchGroupVotes'
import { fetchAccountStatus } from 'src/features/wallet/accounts/accountsContract'
import { PARYS } from 'src/tokens'
import { createMonitoredSaga } from 'src/utils/saga'
import { isStale } from 'src/utils/time'
import { call, put } from 'typed-redux-saga'

// Fetch wallet balances and other frequently used data like votes
// Essentially, fetch all the data that forms need to validate inputs
function* fetchBalances() {
  const address = yield* appSelect((state) => state.wallet.address)
  if (!address) throw new Error('Cannot fetch balances before address is set')

  const tokenAddrToToken = yield* call(getMigratedTokens)
  const tokenAddrToValue = yield* call(fetchTokenBalances, address, tokenAddrToToken)

  let lockedPARYS: LockedCeloBalances
  if (config.isElectron) {
    yield* call(fetchAccountStatus)
    lockedPARYS = yield* call(fetchLockedCeloStatus)
  } else {
    lockedPARYS = { ...balancesInitialState.accountBalances.lockedPARYS }
  }

  const newBalances: Balances = { tokenAddrToValue, lockedPARYS, lastUpdated: Date.now() }
  yield* put(updateBalances(newBalances))

  if (config.isElectron) {
    yield* call(fetchStakingBalances)
    yield* call(fetchVoterBalances)
  }

  return newBalances
}

export function* fetchBalancesIfStale() {
  const balances = yield* appSelect((state) => state.balances.accountBalances)
  if (isStale(balances.lastUpdated, BALANCE_STALE_TIME) || areBalancesEmpty(balances)) {
    return yield* call(fetchBalances)
  } else {
    return balances
  }
}

async function fetchTokenBalances(
  address: Address,
  tokenMap: TokenMap
): Promise<Record<Address, string>> {
  const tokenAddrs = Object.keys(tokenMap)
  // TODO may be good to batch here if token list is really long
  const fetchPromises: Promise<{ tokenAddress: Address; value: string }>[] = []
  for (const tokenAddr of tokenAddrs) {
    // logger.debug(`Fetching ${t.id} balance`)
    if (tokenAddr === PARYS.address) {
      fetchPromises.push(fetchPARYSBalance(address))
    } else {
      fetchPromises.push(fetchTokenBalance(address, tokenAddr))
    }
  }

  const newTokenAddrToValue: Record<Address, string> = {}
  const tokenBalancesArr = await Promise.all(fetchPromises)
  tokenBalancesArr.forEach((bal) => (newTokenAddrToValue[bal.tokenAddress] = bal.value))
  return newTokenAddrToValue
}

// TODO Figure out why the balanceOf result is incorrect for GoldToken
// Contractkit works around this in the same way, must be a low-level issue
async function fetchPARYSBalance(address: Address) {
  const provider = getProvider()
  const balance = await provider.getBalance(address)
  return { tokenAddress: PARYS.address, value: balance.toString() }
}

async function fetchTokenBalance(address: Address, tokenAddress: Address) {
  let contract: Contract | null
  if (isNativeTokenAddress(tokenAddress)) {
    contract = getContractByAddress(tokenAddress)
  } else {
    contract = getErc20Contract(tokenAddress)
  }
  if (!contract) throw new Error(`No contract found for token: ${tokenAddress}`)
  const balance: BigNumberish = await contract.balanceOf(address)
  return { tokenAddress, value: BigNumber.from(balance).toString() }
}

function* fetchVoterBalances() {
  const voteSignerFor = yield* appSelect((state) => state.wallet.account.voteSignerFor)
  if (!voteSignerFor) return

  // Only the total locked is used for now so just fetching that bit
  const locked = yield* call(fetchTotalLocked, voteSignerFor)
  const voterBalances = {
    tokenAddrToValue: {},
    lockedPARYS: {
      locked,
      pendingBlocked: '0',
      pendingFree: '0',
    },
    lastUpdated: Date.now(),
  }
  yield* put(setVoterBalances(voterBalances))
}

export const {
  name: fetchBalancesSagaName,
  wrappedSaga: fetchBalancesSaga,
  reducer: fetchBalancesReducer,
  actions: fetchBalancesActions,
} = createMonitoredSaga(fetchBalances, 'fetchBalances')
