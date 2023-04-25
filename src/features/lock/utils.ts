import { BigNumber } from 'ethers'
import { Balances } from 'src/features/balances/types'
import { getTokenBalance } from 'src/features/balances/utils'
import { PARYS } from 'src/tokens'

export function getTotalPARYS(balances: Balances) {
  const { locked, pendingBlocked, pendingFree } = balances.lockedPARYS
  const parysBalance = getTokenBalance(balances, PARYS)
  return BigNumber.from(parysBalance).add(locked).add(pendingBlocked).add(pendingFree)
}

export function getTotalUnlockedPARYS(balances: Balances) {
  const { pendingBlocked, pendingFree } = balances.lockedPARYS
  const parysBalance = getTokenBalance(balances, PARYS)
  return BigNumber.from(parysBalance).add(pendingBlocked).add(pendingFree)
}

export function getTotalLockedCelo(balances: Balances) {
  const { locked, pendingBlocked, pendingFree } = balances.lockedPARYS
  return BigNumber.from(locked).add(pendingBlocked).add(pendingFree)
}

export function getTotalPendingPARYS(balances: Balances) {
  const { pendingBlocked, pendingFree } = balances.lockedPARYS
  return BigNumber.from(pendingBlocked).add(pendingFree)
}

export function hasPendingPARYS(balances: Balances) {
  const { pendingBlocked, pendingFree } = balances.lockedPARYS
  return BigNumber.from(pendingBlocked).gt(0) || BigNumber.from(pendingFree).gt(0)
}
