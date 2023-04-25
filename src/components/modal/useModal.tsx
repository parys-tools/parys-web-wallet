import { ReactElement, useCallback, useContext } from 'react'
import {
  ModalAction,
  ModalActionCallback,
  ModalOkAction,
  ModalProps,
  ModalSize,
  SuccessModalContent,
} from 'src/components/modal/modal'
import { ModalContext } from 'src/components/modal/modalContext'
import { errorToString } from 'src/utils/validation'

interface ModalBase {
  head: string
  headIcon?: ReactElement | null
  headColor?: string | null
  subHead?: string | null
  actions?: ModalAction | ModalAction[] | null
  onActionClick?: ModalActionCallback | null
  size?: ModalSize | null
  dismissable?: boolean | null
}

interface ModalWithContentProps extends ModalBase {
  content: any
}

interface StandardModalProps extends ModalBase {
  body: string
}

export type showModalFunction = (props: StandardModalProps) => void
export type showModalFunctionAsync = (props: StandardModalProps) => Promise<ModalAction | null>

export function useModal() {
  const context = useContext(ModalContext)

  const showLoadingModal = useCallback((head: string, subHead?: string | null) => {
    const modalProps: ModalProps = {
      type: 'loading',
      head: head,
      subHead: subHead ?? undefined,
    }
    context.showModal(modalProps)
  }, [])

  const showSuccessModal = useCallback((head: string, subHead?: string | null) => {
    const modalProps: ModalProps = {
      head,
      subHead: subHead ?? undefined,
      onClose: context.closeModal,
      actions: ModalOkAction,
      onActionClick: context.closeModal,
    }
    context.showModal(modalProps, <SuccessModalContent />)
  }, [])

  const showErrorModal = useCallback(
    (head: string, subHead?: string | undefined, error?: unknown) => {
      const errorMsg = errorToString(error, 80)
      const modalProps: ModalProps = {
        head,
        subHead: subHead,
        body: errorMsg,
        severity: 'error',
        actions: ModalOkAction,
        onClose: context.closeModal,
        onActionClick: context.closeModal,
      }
      context.showModal(modalProps)
    },
    []
  )

  const showModalWithContent = useCallback((props: ModalWithContentProps) => {
    const modalProps: ModalProps = {
      head: props.head,
      headIcon: props.headIcon ?? undefined,
      headColor: props.headColor ?? undefined,
      subHead: props.subHead ?? undefined,
      onClose: props.dismissable === false ? undefined : context.closeModal,
      actions: props.actions ?? undefined,
      onActionClick: props.onActionClick,
    }
    context.showModal(modalProps, props.content)
  }, [])

  const showModalAsync = useCallback((props: StandardModalProps) => {
    const modalProps: ModalProps = {
      head: props.head,
      headIcon: props.headIcon ?? undefined,
      headColor: props.headColor ?? undefined,
      subHead: props.subHead ?? undefined,
      body: props.body,
      onClose: props.dismissable === false ? undefined : context.closeModal,
      actions: props.actions ?? ModalOkAction, //default to an ok button,
      onActionClick: props.actions ? props.onActionClick : context.closeModal, //default to close for the Ok button,
      size: props.size ?? undefined,
    }
    return context.showModalAsync(modalProps)
  }, [])

  const showModal = useCallback((props: StandardModalProps) => {
    const modalProps: ModalProps = {
      head: props.head,
      headIcon: props.headIcon ?? undefined,
      headColor: props.headColor ?? undefined,
      subHead: props.subHead ?? undefined,
      body: props.body,
      onClose: props.dismissable === false ? undefined : context.closeModal,
      actions: props.actions ?? ModalOkAction, //default to an ok button,
      onActionClick: props.actions ? props.onActionClick : context.closeModal, //default to close for the Ok button,
      size: props.size ?? undefined,
    }
    context.showModal(modalProps)
  }, [])

  return {
    showModal,
    showModalAsync,
    showLoadingModal,
    showSuccessModal,
    showErrorModal,
    showModalWithContent,
    closeModal: context.closeModal,
  }
}
