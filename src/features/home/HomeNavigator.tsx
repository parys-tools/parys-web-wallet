import { shallowEqual } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from 'src/app/hooks'
import { ScreenFrame } from 'src/components/layout/ScreenFrame'
import { LoginScreen } from 'src/features/password/LoginScreen'
import { useAccountLockStatus } from 'src/features/password/password'
import { hasAccounts } from 'src/features/wallet/manager'
import { hasAccount_v1 } from 'src/features/wallet/storage_v1'

export function HomeNavigator() {
  const isUnlocked = useAccountLockStatus()

  // Force navigation to fail screen if providers are unable to connect
  const isConnected = useAppSelector((s) => s.wallet.isConnected, shallowEqual)
  if (isConnected === false) throw new Error('Unable to connect to network.')

  // If password has been entered already
  if (isUnlocked) {
    return (
      <ScreenFrame>
        <Outlet />
      </ScreenFrame>
    )
  }

  // If wallet exists in storage but is not unlocked yet
  if (hasAccounts() || hasAccount_v1()) {
    return <LoginScreen />
  }

  // Otherwise, account must not be set up yet
  return <Navigate to="/setup" replace={true} />
}
