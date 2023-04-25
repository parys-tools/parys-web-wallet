import { BigNumber } from 'ethers'
import { ChangeEvent, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { BasicHelpIconModal, HelpIcon } from 'src/components/icons/HelpIcon'
import { NumberInput } from 'src/components/input/NumberInput'
import { RadioBoxRow } from 'src/components/input/RadioBoxRow'
import { SelectInput } from 'src/components/input/SelectInput'
import { Box } from 'src/components/layout/Box'
import { ScreenContentFrame } from 'src/components/layout/ScreenContentFrame'
import { useNavHintModal } from 'src/components/modal/useNavHintModal'
import { StackedBarChart } from 'src/components/StackedBarChart'
import { useVoterBalances } from 'src/features/balances/hooks'
import { useFlowTransaction } from 'src/features/txFlow/hooks'
import { txFlowStarted } from 'src/features/txFlow/txFlowSlice'
import { TxFlowTransaction, TxFlowType } from 'src/features/txFlow/types'
import { getResultChartData, getSummaryChartData } from 'src/features/validators/barCharts'
import { validate } from 'src/features/validators/stakeToken'
import {
  GroupVotes,
  stakeActionLabel,
  StakeActionType,
  StakeTokenParams,
  ValidatorGroup,
} from 'src/features/validators/types'
import { getStakingMaxAmount, getValidatorGroupName } from 'src/features/validators/utils'
import { VotingForBanner } from 'src/features/wallet/accounts/VotingForBanner'
import { useIsVoteSignerAccount } from 'src/features/wallet/hooks'
import { Color } from 'src/styles/Color'
import { Font } from 'src/styles/fonts'
import { mq } from 'src/styles/mediaQueries'
import { Stylesheet } from 'src/styles/types'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { amountFieldFromWei, amountFieldToWei, fromWeiRounded } from 'src/utils/amount'
import { useCustomForm } from 'src/utils/useCustomForm'
import { useLocationState } from 'src/utils/useLocationState'

interface LocationState {
  groupAddress: Address
  action: StakeActionType
}

interface StakeTokenForm extends Omit<StakeTokenParams, 'amountInWei'> {
  amount: string
}

const initialValues: StakeTokenForm = {
  groupAddress: '',
  action: StakeActionType.Vote,
  amount: '',
}

const radioBoxLabels = [
  { value: StakeActionType.Vote, label: stakeActionLabel(StakeActionType.Vote) },
  { value: StakeActionType.Activate, label: stakeActionLabel(StakeActionType.Activate) },
  { value: StakeActionType.Revoke, label: stakeActionLabel(StakeActionType.Revoke) },
]

export function StakeFormScreen() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const locationState = useLocationState<LocationState>()

  const tx = useFlowTransaction()
  const { balances, voterBalances } = useVoterBalances()
  const isVoteSignerAccount = useIsVoteSignerAccount()
  const groups = useAppSelector((state) => state.validators.validatorGroups.groups)
  const groupVotes = useAppSelector((state) => state.validators.groupVotes)

  const onSubmit = (values: StakeTokenForm) => {
    dispatch(txFlowStarted({ type: TxFlowType.Stake, params: amountFieldToWei(values) }))
    navigate('/stake-review')
  }

  const validateForm = (values: StakeTokenForm) =>
    validate(amountFieldToWei(values), balances, voterBalances, groups, groupVotes)

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    resetValues,
    resetErrors,
  } = useCustomForm<StakeTokenForm>(
    getInitialValues(locationState, tx, groupVotes),
    onSubmit,
    validateForm
  )

  // Keep form in sync with tx state
  useEffect(() => {
    const initialValues = getInitialValues(locationState, tx, groupVotes)
    resetValues(initialValues)
    // Ensure we have the info needed otherwise send user back
    if (!groups || !groups.length) {
      // TODO find a way to avoid this, creates a bad UX
      navigate('/validators')
    }
  }, [tx])

  // Show modal to recommend nav to locked gold on low locked balance
  const hasLocked = BigNumber.from(voterBalances.lockedPARYS.locked).gt(0)
  const helpText = `You have ${
    hasLocked ? 'almost ' : ''
  } no locked PARYS. Only locked funds can be used to stake with Validators. Would you like to lock some now?`
  // TODO show a diff modal for signer accounts
  const shouldShow = isVoteSignerAccount ? false : errors.lockedPARYS
  useNavHintModal(shouldShow, 'Locked PARYS Needed to Vote', helpText, 'Lock PARYS', '/lock')

  const onSelectAction = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    let autoSetAmount: string
    if (value === StakeActionType.Activate) {
      const maxAmount = getStakingMaxAmount(
        StakeActionType.Activate,
        voterBalances,
        groupVotes,
        values.groupAddress
      )
      autoSetAmount = fromWeiRounded(maxAmount)
    } else {
      autoSetAmount = '0'
    }
    setValues({ ...values, [name]: value, amount: autoSetAmount })
    resetErrors()
  }

  const onUseMax = () => {
    const maxAmount = getStakingMaxAmount(
      values.action,
      voterBalances,
      groupVotes,
      values.groupAddress
    )
    setValues({ ...values, amount: fromWeiRounded(maxAmount) })
    resetErrors()
  }

  const onGoBack = () => {
    navigate(-1)
  }

  const selectOptions = useMemo(() => getSelectOptions(groups), [groups])

  const summaryData = useMemo(
    () => getSummaryChartData(voterBalances, groups, groupVotes),
    [voterBalances, groups, groupVotes]
  )
  const resultData = useMemo(
    () => getResultChartData(voterBalances, groups, groupVotes, amountFieldToWei(values)),
    [voterBalances, groups, groupVotes, values]
  )

  return (
    <ScreenContentFrame>
      <h1 css={style.h1}>
        Vote for Validators <HelpButton />
      </h1>
      <VotingForBanner />
      <div css={style.container}>
        <div css={style.content}>
          <form onSubmit={handleSubmit}>
            <Box direction="column">
              <label css={style.inputLabel}>Validator Group</label>
              <SelectInput
                name="groupAddress"
                autoComplete={true}
                allowRawOption={true}
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.groupAddress}
                options={selectOptions}
                fillWidth={true}
                hideChevron={true}
                {...errors['groupAddress']}
              />
            </Box>

            <Box direction="column" margin="1.5em 0 0 0">
              <label css={style.inputLabel}>Action</label>
              <RadioBoxRow
                value={values.action}
                startTabIndex={1}
                labels={radioBoxLabels}
                name="action"
                onChange={onSelectAction}
                margin="0.3em 0 0 -1.3em"
                containerStyles={style.radioBox}
              />
            </Box>

            <Box direction="column" justify="end" align="start" margin="1.5em 0 0 0">
              <label css={style.inputLabel}>Amount</label>
              <Box direction="row" align="center" justify="between" styles={style.amountContainer}>
                <NumberInput
                  width="14em"
                  margin="0 1em 0 0"
                  name="amount"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.amount.toString()}
                  placeholder="1.00"
                  disabled={values.action === StakeActionType.Activate}
                  {...errors['amount']}
                />
                <TextButton onClick={onUseMax} styles={style.maxAmountButton}>
                  Max Amount
                </TextButton>
              </Box>
            </Box>

            <Box direction="column" justify="end" align="start" margin="1.5em 0 0 0">
              <label css={style.inputLabel}>Result</label>
              <StackedBarChart
                data={resultData.data}
                total={resultData.total}
                showTotal={false}
                showLabels={true}
                width="23.5em"
              />
            </Box>

            <Box direction="row" margin="2em 0 0 0" justify="between">
              <Button
                type="button"
                size="m"
                color={Color.primaryWhite}
                onClick={onGoBack}
                width="5em"
              >
                Back
              </Button>
              <Button type="submit" size="m" width="10em">
                Continue
              </Button>
            </Box>
          </form>
        </div>
        <Box
          direction="column"
          justify="end"
          align="start"
          margin="0 0 1.5em 0"
          styles={style.currentSummaryContainer}
        >
          <label css={style.inputLabel}>Current Summary</label>
          <StackedBarChart
            data={summaryData.data}
            total={summaryData.total}
            showTotal={true}
            showLabels={true}
            width="18em"
          />
        </Box>
      </div>
    </ScreenContentFrame>
  )
}

function HelpButton() {
  return (
    <HelpIcon
      width="1em"
      modal={{ head: 'About Staking', content: <HelpModal /> }}
      margin="0 0 0 0.4em"
    />
  )
}

function HelpModal() {
  return (
    <BasicHelpIconModal>
      <p>
        You can use locked PARYS to vote in daily elections that decide the validators of the
        network.
      </p>
      <p>If your chosen validators are elected, you will earn PARYS rewards over time.</p>
    </BasicHelpIconModal>
  )
}

function getInitialValues(
  locationState: LocationState | null,
  tx: TxFlowTransaction | null,
  groupVotes: GroupVotes
): StakeTokenForm {
  if (tx && tx.params && tx.type === TxFlowType.Stake) {
    return amountFieldFromWei(tx.params)
  }

  const initialAction = locationState?.action ?? initialValues.action
  const groupAddress = locationState?.groupAddress
  const initialGroup =
    groupAddress && isValidAddress(groupAddress) ? groupAddress : initialValues.groupAddress

  // Auto use pending when defaulting to activate
  const initialAmount =
    groupAddress && groupVotes[groupAddress] && initialAction === StakeActionType.Activate
      ? fromWeiRounded(groupVotes[groupAddress].pending)
      : initialValues.amount

  return {
    groupAddress: initialGroup,
    action: initialAction,
    amount: initialAmount,
  }
}

function getSelectOptions(groups: ValidatorGroup[]) {
  return groups.map((g) => {
    const display = `${getValidatorGroupName(g, true)} - ${shortenAddress(g.address, true)}`
    return {
      display,
      value: g.address,
    }
  })
}

const style: Stylesheet = {
  h1: {
    ...Font.h2Green,
    margin: 0,
  },
  container: {
    display: 'flex',
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    marginTop: '1em',
    [mq[1024]]: {
      marginTop: '1.5em',
      flexDirection: 'row',
    },
  },
  content: {
    width: '100%',
    maxWidth: '23.5em',
    paddingRight: '3em',
    paddingBottom: '1em',
  },
  inputLabel: {
    ...Font.inputLabel,
    marginBottom: '0.6em',
  },
  radioBox: {
    justifyContent: 'flex-start',
  },
  amountContainer: {
    width: '100%',
  },
  maxAmountButton: {
    fontWeight: 300,
    fontSize: '0.9em',
    [mq[768]]: {
      fontSize: '1em',
    },
  },
  currentSummaryContainer: {
    background: Color.fillLighter,
    borderRadius: 6,
    padding: '1.2em',
  },
}
