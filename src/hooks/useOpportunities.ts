import { useCallback, useEffect, useState } from 'react'
import { loadOpportunities } from '../lib/opportunities'
import type { LoadedData } from '../lib/opportunities'

export type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: LoadedData }

export function useOpportunities(): { state: DataState; retry: () => void } {
  const [state, setState] = useState<DataState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadOpportunities(fetch, controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'The opportunity list could not be loaded.',
        })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
