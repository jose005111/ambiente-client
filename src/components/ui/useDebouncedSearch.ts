import { useEffect, useState } from 'react'

export function useDebouncedSearch(value: string) {
  const [term, setTerm] = useState(value)
  useEffect(() => {
    if (!value.trim()) {
      const immediate = window.setTimeout(() => setTerm(''), 0)
      return () => window.clearTimeout(immediate)
    }
    const timer = window.setTimeout(() => setTerm(value.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [value])
  return term
}
