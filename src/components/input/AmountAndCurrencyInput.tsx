import { ChangeEvent, useCallback, useMemo } from 'react'
import { TokenIcon } from 'src/components/icons/tokens/TokenIcon'
import { NumberInput } from 'src/components/input/NumberInput'
import { SelectInput, SelectOption } from 'src/components/input/SelectInput'
import { Box } from 'src/components/layout/Box'
import { useTokens } from 'src/features/tokens/hooks'
import { isNativeToken } from 'src/features/tokens/utils'
import { Font } from 'src/styles/fonts'
import { Stylesheet } from 'src/styles/types'
import { ErrorState } from 'src/utils/validation'

interface Props {
  tokenValue: string
  onTokenSelect: (event: ChangeEvent<HTMLInputElement>) => void
  onTokenBlur: (event: ChangeEvent<HTMLInputElement>) => void
  amountValue: string
  amountName?: string
  onAmountChange: (event: ChangeEvent<HTMLInputElement>) => void
  onAmountBlur: (event: ChangeEvent<HTMLInputElement>) => void
  errors: ErrorState
  tokenInputName?: string
  inputDisabled?: boolean
  nativeTokensOnly?: boolean
}

export const AmountAndCurrencyInput = (props: Props) => {
  const {
    tokenValue,
    onTokenSelect,
    onTokenBlur,
    amountValue,
    amountName,
    onAmountChange,
    onAmountBlur,
    errors,
    tokenInputName,
    inputDisabled,
    nativeTokensOnly,
  } = props

  const tokens = useTokens()

  const selectOptions = useMemo(
    () =>
      Object.values(tokens)
        .sort((a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1))
        .filter((t) => (nativeTokensOnly ? isNativeToken(t) : true))
        .map((t) => ({
          display: t.symbol,
          value: t.address,
        })),
    [tokens]
  )

  const renderDropdownOption = useCallback(
    (option: SelectOption) => (
      <Box align="center">
        <TokenIcon token={tokens[option.value]} size="s" />
        <div css={style.tokenDropdownLabel}>{option.display}</div>
      </Box>
    ),
    [tokens]
  )

  const renderSelectValue = useCallback(
    (value: string) => {
      const option = selectOptions.find((o) => o.display === value)
      if (!option) return null
      return (
        <Box align="center">
          <TokenIcon token={tokens[option.value]} size="s" />
          <div css={{ ...Font.bold, ...style.tokenDropdownLabel }}>{value}</div>
        </Box>
      )
    },
    [selectOptions, tokens]
  )

  const selectName = tokenInputName ?? 'tokenAddress'
  const numberInputName = amountName ?? 'amount'

  return (
    <Box justify="start" align="center">
      <SelectInput
        name={selectName}
        autoComplete={false}
        width="7em"
        onChange={onTokenSelect}
        onBlur={onTokenBlur}
        value={tokenValue}
        options={selectOptions}
        placeholder="Currency"
        inputStyles={style.token}
        renderSelectValue={renderSelectValue}
        renderDropdownOption={renderDropdownOption}
        {...errors[selectName]}
      />
      <NumberInput
        fillWidth={true}
        name={numberInputName}
        onChange={onAmountChange}
        onBlur={onAmountBlur}
        value={amountValue}
        placeholder="1.00"
        inputStyles={style.amount}
        disabled={inputDisabled}
        {...errors[numberInputName]}
      />
    </Box>
  )
}

const style: Stylesheet = {
  token: {
    borderRadius: '4px 0 0 4px',
  },
  tokenDropdownLabel: {
    paddingLeft: '0.5em',
  },
  amount: {
    borderRadius: '0 4px 4px 0',
    paddingLeft: 15,
  },
}
