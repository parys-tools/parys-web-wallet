import { clear as clearIdb, del as delIdb, get as getIdb, set as setIdb } from 'idb-keyval'
import { SignerType } from 'src/blockchain/types'
import { config } from 'src/config'
import { storageProvider } from 'src/features/storage/storageProvider'
import { TransactionMap } from 'src/features/types'
import { isValidDerivationPath, isValidMnemonicLocale } from 'src/features/wallet/utils'
import { areAddressesEqual, isValidAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

export interface StoredAccountData {
  address: Address
  name: string
  type: SignerType
  derivationPath: string
  encryptedMnemonic?: string // Only SignerType.local accounts will have this
  locale?: string // Not yet used, needed when non-english mnemonics are supported
}
const AccountDataWhitelist = [
  'address',
  'name',
  'type',
  'derivationPath',
  'encryptedMnemonic',
  'locale',
]
export type StoredAccountsData = Array<StoredAccountData>

// This lock may not be necessary because storage writes/reads are synchronous
// but adding a simple module-level lock just to be cautious
let accountLock = false

function acquireLock() {
  // Should never happen
  if (accountLock) throw new Error('Account lock already acquired')
  accountLock = true
}

function releaseLock() {
  if (!accountLock) logger.warn('Releasing account lock but it is already released')
  accountLock = false
}

enum AccountFile {
  accounts,
  feedData,
}

const STORAGE_PATHS = Object.freeze({
  browser: {
    [AccountFile.accounts]: 'wallet/accounts',
    [AccountFile.feedData]: 'wallet/feedData/ADDRESS',
  },
  electron: {
    [AccountFile.accounts]: 'accounts.json',
    [AccountFile.feedData]: 'feedData-ADDRESS.json',
  },
})

function getFilePath(file: AccountFile): string {
  if (config.isElectron) return STORAGE_PATHS.electron[file]
  else return STORAGE_PATHS.browser[file]
}

export function getAccounts() {
  return getAccountsData()
}

export function addAccount(newAccount: StoredAccountData) {
  try {
    acquireLock()

    validateAccount(newAccount)

    const accountsMetadata = getAccountsData()
    if (accountsMetadata.find((a) => areAddressesEqual(a.address, newAccount.address))) {
      throw new Error('New account already exists in account list')
    }

    accountsMetadata.push(newAccount)
    setAccountsData(accountsMetadata)

    tryPersistBrowserStorage()
  } finally {
    releaseLock()
  }
}

export function modifyAccounts(updatedAccountsData: StoredAccountsData) {
  if (!updatedAccountsData.length) return
  try {
    acquireLock()
    const accountsMetadata = getAccountsData()
    for (const account of updatedAccountsData) {
      const index = accountsMetadata.findIndex((a) => areAddressesEqual(a.address, account.address))
      if (index < 0) throw new Error('Address not found in account list')
      accountsMetadata[index] = account
    }
    setAccountsData(accountsMetadata)
  } finally {
    releaseLock()
  }
}

export function removeAccount(address: Address) {
  try {
    acquireLock()
    const accountsMetadata = getAccountsData()
    const index = accountsMetadata.findIndex((a) => areAddressesEqual(a.address, address))
    if (index < 0) throw new Error('Address not found in account list')
    accountsMetadata.splice(index, 1)
    setAccountsData(accountsMetadata)
  } finally {
    releaseLock()
  }
}

export function removeAllAccounts() {
  try {
    acquireLock()
    setAccountsData([])
  } finally {
    releaseLock()
  }
}

function getAccountsData() {
  const data = storageProvider.getItem(getFilePath(AccountFile.accounts))
  const parsed = parseAccountsData(data)
  return parsed || []
}

function setAccountsData(accounts: StoredAccountsData) {
  const serialized = JSON.stringify(accounts, AccountDataWhitelist)
  storageProvider.setItem(getFilePath(AccountFile.accounts), serialized, true)
}

function parseAccountsData(data: string | null): StoredAccountsData | null {
  try {
    if (!data) return null
    const parsed = JSON.parse(data) as StoredAccountsData
    if (!parsed || !Array.isArray(parsed)) throw new Error('Invalid format for account data')
    parsed.forEach(validateAccount)
    return parsed
  } catch (error) {
    logger.error('Error parsing account data', error)
    throw new Error('Failed to parse account file')
  }
}

function validateAccount(account: StoredAccountData) {
  const error = (reason: string) => {
    throw new Error(`Invalid format for account: ${reason}`)
  }
  if (!account) error('missing account')
  const { address, type, derivationPath, encryptedMnemonic, locale } = account
  if (!address || !isValidAddress(address)) error('invalid address')
  if (!type || !Object.values(SignerType).includes(type)) error('invalid signer type')
  if (!derivationPath || !isValidDerivationPath(derivationPath)) error('invalid derivation path')
  if (type === SignerType.Local && !encryptedMnemonic) error('local account is missing mnemonic')
  if (locale && isValidMnemonicLocale(locale)) error('invalid mnemonic locale')
}

export async function getFeedDataForAccount(address: Address) {
  try {
    const feedData = await getIdb<TransactionMap | undefined>(getFeedKey(address))
    return feedData || null
  } catch (error) {
    // Since feed data is not critical, swallow errors
    logger.error('Error getting feed data from storage', error)
    return null
  }
}

export async function setFeedDataForAccount(address: Address, feedData: TransactionMap) {
  try {
    await setIdb(getFeedKey(address), feedData)
  } catch (error) {
    // Since feed data is not critical, swallow errors
    logger.error('Error setting feed data in storage', error)
  }
}

export async function removeFeedDataForAccount(address: Address) {
  try {
    await delIdb(getFeedKey(address))
  } catch (error) {
    // Since feed data is not critical, swallow errors
    logger.error('Error deleting feed data item in storage', error)
  }
}

export async function removeAllFeedData() {
  try {
    // Note if IndexDb later gets used for other things, this clear could cause issues
    await clearIdb()
  } catch (error) {
    // Since feed data is not critical, swallow errors
    logger.error('Error clearing all feed data in storage', error)
  }
}

function getFeedKey(address: Address) {
  return `feedData_${address}`
}

function tryPersistBrowserStorage() {
  // Request persistent storage for site
  // This prevents browser from clearing local storage when space runs low. Rare but possible.
  // Not a critical perm (and not supported in safari) so not blocking on this
  if (navigator?.storage?.persist) {
    navigator.storage
      .persist()
      .then((isPersisted) => {
        logger.debug(`Is persisted storage granted: ${isPersisted}`)
      })
      .catch((reason) => {
        logger.error('Error enabling storage persist setting', reason)
      })
  }
}
