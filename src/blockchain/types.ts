import type { PARYSWallet } from '@parys-tools/parys-ethereum-connector'
import type { LedgerSigner } from 'src/features/ledger/LedgerSigner'

export enum SignerType {
  Local = 'local',
  Ledger = 'ledger',
}

interface PARYSWalletSigner {
  type: SignerType.Local
  signer: PARYSWallet
}

interface PARYSLedgerSigner {
  type: SignerType.Ledger
  signer: LedgerSigner
}

export type PARYSSigner = PARYSWalletSigner | PARYSLedgerSigner
