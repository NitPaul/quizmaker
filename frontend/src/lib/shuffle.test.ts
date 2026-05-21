import { describe, expect, it } from 'vitest'
import { applyRandomness, shuffle } from './shuffle'

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    expect(shuffle([1, 2, 3, 4, 5]).length).toBe(5)
  })

  it('preserves all elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input)
    expect([...result].sort((a, b) => a - b)).toEqual(input)
  })

  it('does not mutate the input array', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    shuffle(input)
    expect(input).toEqual(copy)
  })

  it('handles empty input', () => {
    expect(shuffle([])).toEqual([])
  })

  it('handles single element', () => {
    expect(shuffle([42])).toEqual([42])
  })
})

describe('applyRandomness', () => {
  it('returns the requested number of items', () => {
    expect(applyRandomness([1, 2, 3, 4, 5], 3, 100).length).toBe(3)
  })

  it('caps at array length when num exceeds it', () => {
    expect(applyRandomness([1, 2, 3], 10, 100).length).toBe(3)
  })

  it('preserves elements (no duplicates introduced)', () => {
    const input = Array.from({ length: 20 }, (_, i) => i)
    const result = applyRandomness(input, 10, 100)
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
    result.forEach((v) => expect(input).toContain(v))
  })

  it('with 0% randomness keeps the first N items in some order', () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const result = applyRandomness(input, 5, 0)
    // All result items should come from the first 5 of input
    result.forEach((v) => expect(v).toBeLessThan(5))
  })

  it('returns full input when num equals length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = applyRandomness(input, 5, 100)
    expect([...result].sort((a, b) => a - b)).toEqual(input)
  })
})
