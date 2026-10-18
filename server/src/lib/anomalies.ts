// Flags points that deviate sharply from the mean of the preceding `window` points.
export function detectAnomalies(
  values: number[],
  window = 14,
  threshold = 3.3,
) {
  const found: { index: number; z: number }[] = []
  for (let i = 7; i < values.length; i++) {
    const prior = values.slice(Math.max(0, i - window), i)
    const mean = prior.reduce((s, v) => s + v, 0) / prior.length
    const std = Math.sqrt(
      prior.reduce((s, v) => s + (v - mean) ** 2, 0) / prior.length,
    )
    if (std === 0) continue
    const z = (values[i] - mean) / std
    if (Math.abs(z) >= threshold)
      found.push({ index: i, z: Math.round(z * 10) / 10 })
  }
  return found
}
