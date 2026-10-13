import { useCallback, useEffect, useState } from 'react'

export type Route = 'home' | 'profile' | 'results'

export function parseRoute(hash: string): Route {
  if (hash === '#/profile') return 'profile'
  if (hash === '#/results') return 'results'
  return 'home'
}

/** Minimal hash router: works on any static host with no server rewrites. */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const navigate = useCallback((next: Route) => {
    window.location.hash = next === 'home' ? '#/' : `#/${next}`
  }, [])
  return [route, navigate]
}
