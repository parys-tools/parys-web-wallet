import { CallEffect } from '@redux-saga/core/effects'
import { useCallback, useEffect, useRef } from 'react'
import { delay, race } from 'typed-redux-saga'

// Using requires 'raw' call effects because of issue:
// https://github.com/agiledigital/typed-redux-saga/issues/43
export function* withTimeout<T>(effect: CallEffect<T>, ms: number, errorMsg: string) {
  const { result, timeout } = yield* race({
    result: effect,
    timeout: delay(ms),
  })
  if (!result || timeout) {
    throw new Error(errorMsg)
  }
  return result
}

// https://usehooks-typescript.com/react-hook/use-interval
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void | null>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  })

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback?.current()
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }

    return undefined
  }, [delay])
}

// https://medium.com/javascript-in-plain-english/usetimeout-react-hook-3cc58b94af1f
export const useTimeout = (
  callback: () => void,
  delay = 0 // in ms (default: immediately put into JS Event Queue)
): (() => void) => {
  const timeoutIdRef = useRef<NodeJS.Timeout>()

  const cancel = useCallback(() => {
    const timeoutId = timeoutIdRef.current
    if (timeoutId) {
      timeoutIdRef.current = undefined
      clearTimeout(timeoutId)
    }
  }, [timeoutIdRef])

  useEffect(() => {
    if (delay >= 0) {
      timeoutIdRef.current = setTimeout(callback, delay)
    }
    return cancel
  }, [callback, delay, cancel])

  return cancel
}

export async function fetchWithTimeout(
  resource: RequestInfo,
  options?: RequestInit,
  timeout = 10000
) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  })
  clearTimeout(id)
  return response
}
