export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function applyRandomness<T>(items: T[], num: number, randomnessPercent: number): T[] {
  const requested = Math.min(num, items.length)
  const numOrdered = Math.round(requested * (1 - randomnessPercent / 100))
  const numRandom = requested - numOrdered
  const orderedPart = items.slice(0, numOrdered)
  const remaining = items.slice(numOrdered)
  const randomPart = shuffle(remaining).slice(0, numRandom)
  return shuffle([...orderedPart, ...randomPart])
}
