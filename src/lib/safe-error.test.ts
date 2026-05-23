import { describe, it, expect } from 'vitest'
import { safeErrorMessage, safeErrorFromResponse } from './safe-error'

describe('safeErrorMessage', () => {
  it('returns error string when data has string error', () => {
    expect(safeErrorMessage({ error: 'test error' })).toBe('test error')
  })

  it('returns fallback when data is null', () => {
    expect(safeErrorMessage(null, 'fallback')).toBe('fallback')
  })

  it('returns fallback when data is undefined', () => {
    expect(safeErrorMessage(undefined, 'fallback')).toBe('fallback')
  })

  it('returns fallback when data.error is a number', () => {
    expect(safeErrorMessage({ error: 500 }, 'fallback')).toBe('fallback')
  })

  it('returns fallback when data.error is null', () => {
    expect(safeErrorMessage({ error: null }, 'fallback')).toBe('fallback')
  })

  it('returns fallback when data has no error property', () => {
    expect(safeErrorMessage({ message: 'ok' }, 'fallback')).toBe('fallback')
  })

  it('returns fallback when data is a string', () => {
    expect(safeErrorMessage('unexpected', 'fallback')).toBe('fallback')
  })

  it('returns default fallback when not provided', () => {
    const result = safeErrorMessage(null)
    expect(result).toBe('An unexpected error occurred')
  })
})

describe('safeErrorFromResponse', () => {
  it('returns error from JSON response', async () => {
    const res = new Response(JSON.stringify({ error: 'bad request' }), { status: 400 })
    expect(await safeErrorFromResponse(res)).toBe('bad request')
  })

  it('returns fallback for non-JSON response', async () => {
    const res = new Response('not json', { status: 500 })
    expect(await safeErrorFromResponse(res, 'fallback')).toBe('fallback')
  })
})
