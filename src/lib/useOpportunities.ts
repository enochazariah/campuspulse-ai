import { useCallback, useEffect, useState } from 'react'
import { loadOpportunities } from './opportunities'
import type { LoadedData } from './opportunities'

export type OpportunitiesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: LoadedData }

export function useOpportunities(load: typeof loadOpportunities = loadOpportunities) {
  const [state, setState] = useState<OpportunitiesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    load(fetch, controller.signal).then(
      (data) => setState({ status: 'ready', data }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Something went wrong while loading.' })
      },
    )
    return () => controller.abort()
  }, [load, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
