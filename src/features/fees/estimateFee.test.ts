import { TokenBalances } from 'src/features/balances/types'
import { resolveTokenPreferenceOrder } from 'src/features/fees/feeTokenOrder'
import { NativeTokens, PARYS, Token, pEUA, pEUR, pUSD } from 'src/tokens'

describe('resolveCurrencyPreferenceOrder', () => {
  function getBaseBalances() {
    return NativeTokens.reduce<TokenBalances>((result, token: Token) => {
      result[token.address] = { ...token, value: '0' }
      return result
    }, {})
  }

  it('Chooses correct order with no preferences', () => {
    const order = resolveTokenPreferenceOrder(getBaseBalances())
    expect(order).toEqual([PARYS.address, pUSD.address, pEUR.address, pEUA.address])
  })

  it('Chooses correct order with preferences', () => {
    const order1 = resolveTokenPreferenceOrder(getBaseBalances(), pEUR.address, pUSD.address)
    expect(order1).toEqual([pEUR.address, pUSD.address, PARYS.address, pEUA.address])
    const order2 = resolveTokenPreferenceOrder(getBaseBalances(), pUSD.address, pUSD.address)
    expect(order2).toEqual([pUSD.address, PARYS.address, pEUR.address, pEUA.address])
    const order3 = resolveTokenPreferenceOrder(getBaseBalances(), pUSD.address)
    expect(order3).toEqual([pUSD.address, PARYS.address, pEUR.address, pEUA.address])
    const order4 = resolveTokenPreferenceOrder(getBaseBalances(), pUSD.address, pEUA.address)
    expect(order4).toEqual([pUSD.address, pEUA.address, PARYS.address, pEUR.address])
  })

  it('Chooses correct order with balances', () => {
    const balances1 = getBaseBalances()
    balances1[PARYS.address].value = '100'
    const order1 = resolveTokenPreferenceOrder(balances1)
    expect(order1).toEqual([PARYS.address, pUSD.address, pEUR.address, pEUA.address])
    const balances2 = getBaseBalances()
    balances2[pEUR.address].value = '100'
    const order2 = resolveTokenPreferenceOrder(balances2, pUSD.address, pEUR.address)
    expect(order2).toEqual([pEUR.address, pUSD.address, PARYS.address, pEUA.address])
    const balances3 = getBaseBalances()
    balances3[pUSD.address].value = '200'
    balances3[PARYS.address].value = '100'
    const order3 = resolveTokenPreferenceOrder(balances3, pEUR.address)
    expect(order3).toEqual([pUSD.address, PARYS.address, pEUR.address, pEUA.address])
    const balances4 = getBaseBalances()
    balances4[pUSD.address].value = '100'
    balances4[pEUR.address].value = '100'
    balances4[PARYS.address].value = '100'
    const order4 = resolveTokenPreferenceOrder(balances4, PARYS.address, pUSD.address)
    expect(order4).toEqual([PARYS.address, pUSD.address, pEUR.address, pEUA.address])
  })
})
