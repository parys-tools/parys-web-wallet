import { BigNumber, Contract } from 'ethers'
import { appSelect } from 'src/app/appSelect'
import { getLatestBlockDetails, getNumBlocksPerInterval } from 'src/blockchain/blocks'
import { getContract } from 'src/blockchain/contracts'
import { PARYSContract, config } from 'src/config'
import { MAX_TOKEN_PRICE_NUM_DAYS } from 'src/consts'
import { updatePairPrices } from 'src/features/tokenPrice/tokenPriceSlice'
import {
  PairPriceUpdate,
  QuoteCurrencyPriceHistory,
  TokenPricePoint,
} from 'src/features/tokenPrice/types'
import { findMissingPriceDays, mergePriceHistories } from 'src/features/tokenPrice/utils'
import { PARYS, StableTokens } from 'src/tokens'
import { areAddressesEqual, ensureLeading0x } from 'src/utils/addresses'
import { fromFixidity } from 'src/utils/amount'
import {
  BlockscoutTransactionLog,
  queryBlockscout,
  validateBlockscoutLog,
} from 'src/utils/blockscout'
import { logger } from 'src/utils/logger'
import { sleep } from 'src/utils/promises'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

const DEFAULT_HISTORY_NUM_DAYS = 7
const SECONDS_PER_DAY = 86400
const BLOCK_FETCHING_INTERVAL_SIZE = 60 // 1 minutes
const PAUSE_BETWEEN_FETCH_REQUESTS = 250 // 1/4 second
const MAX_TIME_FROM_NOW_FOR_LOG = 600_000 // 10 minutes
const MEDIAN_UPDATED_TOPIC_0 = '0xa9981ebfc3b766a742486e898f54959b050a66006dbce1a4155c1f84a08bcf41'
const EXPECTED_MIN_PARYS_TO_STABLE = 0.1
const EXPECTED_MAX_PARYS_TO_STABLE = 100

interface FetchTokenPriceParams {
  baseCurrency: Address
  numDays?: number // 7 by default
}

// Currently this only fetches PARYS to stable token prices
// May eventually expand to fetch other pairs
function* fetchTokenPrice(params: FetchTokenPriceParams) {
  const { baseCurrency, numDays: _numDays } = params
  const numDays = _numDays || DEFAULT_HISTORY_NUM_DAYS
  if (numDays > MAX_TOKEN_PRICE_NUM_DAYS) {
    throw new Error(`Cannot retrieve prices for such a wide window: ${numDays}`)
  }
  if (baseCurrency !== PARYS.address) {
    throw new Error('Only PARYS <-> Native currency is currently supported')
  }

  const prices = yield* appSelect((state) => state.tokenPrice.byBaseAddress)
  const pairPriceUpdates = yield* call(fetchStableTokenPrices, numDays, prices[baseCurrency])
  if (pairPriceUpdates && pairPriceUpdates.length) {
    yield* put(updatePairPrices(pairPriceUpdates))
  }
}

export const {
  name: fetchTokenPriceSagaName,
  wrappedSaga: fetchTokenPriceSaga,
  reducer: fetchTokenPriceReducer,
  actions: fetchTokenPriceActions,
} = createMonitoredSaga<FetchTokenPriceParams>(fetchTokenPrice, 'fetchTokenPrice')

// Fetches token prices by retrieving and parsing the oracle reporting tx logs
async function fetchStableTokenPrices(numDays: number, oldPrices?: QuoteCurrencyPriceHistory) {
  const latestBlock = await getLatestBlockDetails()
  if (!latestBlock) throw new Error('Latest block number needed for fetching prices')

  const missingDays = findMissingPriceDays(numDays, oldPrices)
  // Skip task if all needed days are already in store
  if (!missingDays.length) return null

  const oracleContract = getContract(PARYSContract.SortedOracles)
  const numBlocksPerDay = getNumBlocksPerInterval(SECONDS_PER_DAY)
  const numBlocksPerInterval = getNumBlocksPerInterval(BLOCK_FETCHING_INTERVAL_SIZE)
  const priceUpdates: QuoteCurrencyPriceHistory = {}

  for (const day of missingDays) {
    const toBlock = latestBlock.number - numBlocksPerDay * day
    const fromBlock = toBlock - numBlocksPerInterval
    const tokenToPrice = await tryFetchOracleLogs(fromBlock, toBlock, oracleContract)
    if (!tokenToPrice) continue
    // Prepends the new price point to each tokens history
    for (const [address, price] of tokenToPrice) {
      if (!priceUpdates[address]) priceUpdates[address] = []
      priceUpdates[address]!.push(price)
    }
    await sleep(PAUSE_BETWEEN_FETCH_REQUESTS) // Brief pause to help avoid overloading blockscout and/or getting rate limited
  }

  const mergedPrices = mergePriceHistories(priceUpdates, oldPrices)

  const pairPriceUpdates: PairPriceUpdate[] = []
  for (const quoteCurrency of Object.keys(mergedPrices)) {
    const prices = mergedPrices[quoteCurrency]!
    pairPriceUpdates.push({ baseCurrency: PARYS.address, quoteCurrency, prices })
  }
  return pairPriceUpdates
}

async function tryFetchOracleLogs(fromBlock: number, toBlock: number, oracleContract: Contract) {
  try {
    const url = `${config.blockscoutUrl}/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${oracleContract.address}&topic0=${MEDIAN_UPDATED_TOPIC_0}`
    const txLogs = await queryBlockscout<Array<BlockscoutTransactionLog>>(url)
    return parseBlockscoutOracleLogs(txLogs, oracleContract, fromBlock)
  } catch (error) {
    logger.error(`Failed to fetch and parse oracle logs for blocks ${fromBlock}-${toBlock}`, error)
    return null
  }
}

function parseBlockscoutOracleLogs(
  logs: Array<BlockscoutTransactionLog>,
  oracleContract: Contract,
  minBlock: number
) {
  const tokenAddrToPrice = new Map<Address, TokenPricePoint>()
  for (const token of StableTokens) {
    const tokenAddress = token.address
    const price = parseBlockscoutOracleLogsForToken(logs, oracleContract, tokenAddress, minBlock)
    if (price) tokenAddrToPrice.set(tokenAddress, price)
  }
  return tokenAddrToPrice
}

function parseBlockscoutOracleLogsForToken(
  logs: Array<BlockscoutTransactionLog>,
  oracleContract: Contract,
  searchToken: Address,
  minBlock: number
): TokenPricePoint | null {
  if (!logs || !logs.length) throw new Error('No oracle logs found in time range')

  for (const log of logs) {
    try {
      validateBlockscoutLog(log, MEDIAN_UPDATED_TOPIC_0, minBlock)

      const filteredTopics = log.topics.filter((t) => !!t)
      const logDescription = oracleContract.interface.parseLog({
        topics: filteredTopics,
        data: log.data,
      })

      if (logDescription.name !== 'MedianUpdated') {
        throw new Error(`Unexpected log name: ${logDescription.name}`)
      }

      const { token, value } = logDescription.args
      if (!token || !areAddressesEqual(token, searchToken)) {
        // Log is likely for a different token
        continue
      }

      const valueAdjusted = fromFixidity(value)
      if (
        valueAdjusted <= EXPECTED_MIN_PARYS_TO_STABLE ||
        valueAdjusted >= EXPECTED_MAX_PARYS_TO_STABLE
      ) {
        throw new Error(`Invalid median value: ${value}`)
      }

      const timestamp = BigNumber.from(ensureLeading0x(log.timeStamp)).mul(1000)
      if (timestamp.lte(0) || timestamp.gt(Date.now() + MAX_TIME_FROM_NOW_FOR_LOG)) {
        throw new Error(`Invalid timestamp: ${log.timeStamp}`)
      }

      return { timestamp: timestamp.toNumber(), price: valueAdjusted }
    } catch (error) {
      logger.warn('Unable to parse token price log, will attempt next', error)
    }
  }

  logger.error(`All log parse attempts failed or no log found for token ${searchToken}`)
  return null
}
