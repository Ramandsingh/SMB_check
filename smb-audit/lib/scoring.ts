import { Domain, Answer, AuditData, AuditScores, DomainScore } from '@/types'
import { QUESTIONS, DOMAIN_META } from './questions'

function ratingToScore(rating: number): number {
  return rating * 20
}

function yesNoToScore(value: string): number {
  return value === 'yes' ? 100 : 20
}

export function calcDomainScore(domain: Domain, answers: Record<string, Answer>): DomainScore {
  const scorable = QUESTIONS.filter(q => q.domain === domain && q.weight > 0)

  let totalWeight = 0
  let weightedScore = 0
  let answeredCount = 0

  for (const q of scorable) {
    const ans = answers[q.id]
    if (!ans) continue

    let score: number | null = null

    if (q.type === 'rating' && ans.rating !== null) {
      score = ratingToScore(ans.rating)
    } else if (q.type === 'yesno' && ans.value) {
      score = yesNoToScore(ans.value)
    }

    if (score !== null) {
      weightedScore += score * q.weight
      totalWeight += q.weight
      answeredCount++
    }
  }

  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0
  const completionPct = scorable.length > 0
    ? Math.round((answeredCount / scorable.length) * 100)
    : 0

  return { score, completionPct, answeredCount, totalScorable: scorable.length }
}

export function calcScores(data: AuditData): AuditScores {
  const domains: Domain[] = ['finance', 'operations', 'sales', 'marketing']
  const domainScores = {} as Record<Domain, DomainScore>

  let weightedTotal = 0
  let activeWeight = 0

  for (const domain of domains) {
    const ds = calcDomainScore(domain, data.answers)
    domainScores[domain] = ds

    if (ds.answeredCount > 0) {
      const w = DOMAIN_META[domain].weight
      weightedTotal += ds.score * w
      activeWeight += w
    }
  }

  const overall = activeWeight > 0 ? Math.round(weightedTotal / activeWeight) : 0
  const totalAnswered = domains.reduce((s, d) => s + domainScores[d].answeredCount, 0)

  let recommendation: AuditScores['recommendation'] = 'incomplete'
  if (totalAnswered > 0) {
    if (overall >= 75) recommendation = 'approve'
    else if (overall >= 55) recommendation = 'conditional'
    else if (overall >= 35) recommendation = 'high-risk'
    else recommendation = 'decline'
  }

  return { overall, domains: domainScores, recommendation }
}

export const RECOMMENDATION_LABELS: Record<AuditScores['recommendation'], {
  label: string
  color: string
  description: string
}> = {
  approve: {
    label: 'Recommend Approval',
    color: 'green',
    description: 'Strong business fundamentals. Lending risk appears manageable.',
  },
  conditional: {
    label: 'Conditional Approval',
    color: 'yellow',
    description: 'Reasonable business with some gaps. Consider conditions, covenants, or reduced amount.',
  },
  'high-risk': {
    label: 'High Risk',
    color: 'orange',
    description: 'Significant weaknesses identified. Proceed only with strong security or reduced exposure.',
  },
  decline: {
    label: 'Do Not Recommend',
    color: 'red',
    description: 'Critical gaps across multiple areas. Lending not recommended at this time.',
  },
  incomplete: {
    label: 'Assessment Incomplete',
    color: 'gray',
    description: 'Complete the assessment questions to generate a lending recommendation.',
  },
}

export function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 55) return '#eab308'
  if (score >= 35) return '#f97316'
  return '#ef4444'
}
