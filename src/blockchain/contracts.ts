import { Contract, utils } from 'ethers'
import { ABI as AccountsAbi } from 'src/blockchain/ABIs/accounts'
import { ABI as ElectionAbi } from 'src/blockchain/ABIs/election'
import { ABI as Erc20Abi } from 'src/blockchain/ABIs/erc20'
import { ABI as Erc721Abi } from 'src/blockchain/ABIs/erc721'
import { ABI as EscrowAbi } from 'src/blockchain/ABIs/escrow'
import { ABI as ExchangeAbi } from 'src/blockchain/ABIs/exchange'
import { ABI as GoldTokenAbi } from 'src/blockchain/ABIs/goldToken'
import { ABI as GovernanceAbi } from 'src/blockchain/ABIs/governance'
import { ABI as LockedGoldAbi } from 'src/blockchain/ABIs/lockedGold'
import { ABI as SortedOraclesAbi } from 'src/blockchain/ABIs/sortedOracles'
import { ABI as StableTokenAbi } from 'src/blockchain/ABIs/stableToken'
import { ABI as ValidatorsAbi } from 'src/blockchain/ABIs/validators'
import { getSigner } from 'src/blockchain/signer'
import { PARYSContract, config } from 'src/config'
import { areAddressesEqual, normalizeAddress } from 'src/utils/addresses'

let contractCache: Partial<Record<PARYSContract, Contract>> = {}
let tokenContractCache: Partial<Record<string, Contract>> = {} // token address to contract

export function getContract(c: PARYSContract) {
  const cachedContract = contractCache[c]
  if (cachedContract) return cachedContract
  const signer = getSigner().signer
  const address = config.contractAddresses[c]
  const abi = getContractAbi(c)
  const contract = new Contract(address, abi, signer)
  contractCache[c] = contract
  return contract
}

export function getErc20Contract(tokenAddress: Address) {
  return getTokenContract(tokenAddress, Erc20Abi)
}

export function getErc721Contract(tokenAddress: Address) {
  return getTokenContract(tokenAddress, Erc721Abi)
}

// Search for token contract by address
function getTokenContract(tokenAddress: Address, abi: string) {
  const normalizedAddr = normalizeAddress(tokenAddress)
  const cachedContract = tokenContractCache[normalizedAddr]
  if (cachedContract) return cachedContract
  const signer = getSigner().signer
  const contract = new Contract(normalizedAddr, abi, signer)
  tokenContractCache[normalizedAddr] = contract
  return contract
}

function getContractAbi(c: PARYSContract) {
  switch (c) {
    case PARYSContract.Accounts:
      return AccountsAbi
    case PARYSContract.Election:
      return ElectionAbi
    case PARYSContract.Escrow:
      return EscrowAbi
    case PARYSContract.Exchange:
    case PARYSContract.ExchangeEUR:
    case PARYSContract.ExchangeBRL:
      return ExchangeAbi
    case PARYSContract.GoldToken:
      return GoldTokenAbi
    case PARYSContract.Governance:
      return GovernanceAbi
    case PARYSContract.LockedGold:
      return LockedGoldAbi
    case PARYSContract.SortedOracles:
      return SortedOraclesAbi
    case PARYSContract.StableToken:
    case PARYSContract.StableTokenEUR:
    case PARYSContract.StableTokenBRL:
      return StableTokenAbi
    case PARYSContract.Validators:
      return ValidatorsAbi
    default:
      throw new Error(`No ABI for contract ${c}`)
  }
}

// Search for core contract by address
export function getContractByAddress(address: Address): Contract | null {
  const name = getContractName(address)
  if (name) return getContract(name)
  else return null
}

// Search for core contract name by address
export function getContractName(address: Address): PARYSContract | null {
  if (!address) return null
  const contractNames = Object.keys(config.contractAddresses) as Array<PARYSContract> // Object.keys loses types
  for (const name of contractNames) {
    const cAddress = config.contractAddresses[name]
    if (areAddressesEqual(address, cAddress)) {
      return name
    }
  }
  return null
}

let erc721Interface: utils.Interface

// Normally, interfaces are retrieved through the getContract() function
// but ERC721 is an exception because no core parys contracts use it
export function getErc721AbiInterface() {
  if (!erc721Interface) {
    erc721Interface = new utils.Interface(Erc721Abi)
  }
  return erc721Interface
}

// Necessary if the signer changes, as in after a logout
export function clearContractCache() {
  contractCache = {}
  tokenContractCache = {}
}
