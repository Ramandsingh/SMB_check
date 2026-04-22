export type Domain = 'finance' | 'operations' | 'sales' | 'marketing'

export interface Question {
  id: string
  domain: Domain
  category: string
  label: string
  type: 'rating' | 'yesno' | 'number' | 'text'
  helpText?: string
  weight: number
}

export interface Answer {
  rating: number | null
  value: string
  notes: string
}

export interface AuditData {
  businessName: string
  abn: string
  contactName: string
  contactPhone: string
  auditorName: string
  auditDate: string
  loanAmount: string
  loanPurpose: string
  answers: Record<string, Answer>
  domainNotes: Record<Domain, string>
  generalNotes: string
}

export interface DomainScore {
  score: number
  completionPct: number
  answeredCount: number
  totalScorable: number
}

export interface AuditScores {
  overall: number
  domains: Record<Domain, DomainScore>
  recommendation: 'approve' | 'conditional' | 'high-risk' | 'decline' | 'incomplete'
}

export interface SavedAudit {
  id: number
  businessName: string
  abn: string | null
  auditorName: string | null
  auditDate: string | null
  loanAmount: string | null
  createdAt: string
  updatedAt: string
}
