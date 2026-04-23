export interface AccumulatorLeg {
  match: string
  pick: string
  odds: number
  confidence: string
  edge: number
}

export interface AccumulatorResult {
  legs: AccumulatorLeg[]
  combinedOdds: string
  stake: string
  potentialReturn: string
  warning: string
}

export function buildAccumulator(
  picks: AccumulatorLeg[],
  bankroll: number,
): AccumulatorResult | null {
  if (picks.length < 2) return null
  const legs = picks.slice(0, 3)

  const combinedOdds = legs.reduce((acc, p) => acc * p.odds, 1)
  const avgEdge = legs.reduce((s, p) => s + p.edge, 0) / legs.length

  // Compound Kelly — very conservative for accas
  const kellySingle = avgEdge / (combinedOdds - 1)
  const kellyAcca = Math.max(0, kellySingle * 0.3)

  return {
    legs,
    combinedOdds: combinedOdds.toFixed(2),
    stake: (bankroll * kellyAcca).toFixed(2),
    potentialReturn: (bankroll * kellyAcca * combinedOdds).toFixed(2),
    warning: 'Accumulators have compounded risk. Use small stakes only.',
  }
}
