import { useCallback, useEffect, useRef, useState } from 'react'

// The loading / error / data / reload pattern from useMyProfile, written once.
// Every data hook in this folder is a thin wrapper around it:
//
//   const { data, isLoading, error, reload } = useQuery(() => fetchThing(id), [id])
//
// `deps` works like useEffect's dependency list: when a value in it changes,
// the query runs again. Pass `enabled: false` to wait (e.g. until a user id exists).
export function useQuery(queryFn, deps, { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState(null)

  // Each run gets a number. If an older, slower request finishes after a newer
  // one (e.g. the user changed a filter twice quickly), its result is ignored
  // instead of overwriting fresher data. This bug is called a "race condition".
  const latestRun = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(queryFn, deps)

  const reload = useCallback(async ({ silent = false } = {}) => {
    const runId = ++latestRun.current
    if (!silent) setIsLoading(true)
    setError(null)
    try {
      const result = await run()
      if (runId === latestRun.current) setData(result)
    } catch (caught) {
      if (runId === latestRun.current) setError(caught)
    } finally {
      if (runId === latestRun.current) setIsLoading(false)
    }
  }, [run])

  useEffect(() => {
    if (enabled) reload()
  }, [enabled, reload])

  // setData is exposed so realtime handlers can patch the list in place.
  return { data, setData, isLoading, error, reload }
}
