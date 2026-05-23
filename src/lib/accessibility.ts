/**
 * Accessibility utility: generates stable, unique IDs for form label-input association.
 * Usage: const ids = useFormFieldIds('prefix', count) -> ['prefix-0', 'prefix-1', ...]
 */
import { useMemo } from 'react'

export function useFormFieldIds(prefix: string, count: number): string[] {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => `${prefix}-${i}`)
  }, [prefix, count])
}
