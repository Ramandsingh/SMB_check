'use client'

import { useState, useCallback } from 'react'
import { Domain, SavedAudit } from '@/types'
import { DOMAIN_META } from '@/lib/questions'
import { calcScores, RECOMMENDATION_LABELS, scoreColor } from '@/lib/scoring'
import { useAuditStore } from '@/lib/useAuditStore'
import { ScoreGauge } from '@/components/ScoreGauge'
import { DomainForm } from '@/components/DomainForm'

type Tab = 'overview' | Domain

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'finance', label: 'Finance' },
  { id: 'operations', label: 'Operations' },
  { id: 'sales', label: 'Sales' },
  { id: 'marketing', label: 'Marketing' },
]

const DOMAINS: Domain[] = ['finance', 'operations', 'sales', 'marketing']

export default function DashboardPage() {
  const { data, loaded, savedId, setField, setAnswer, setDomainNotes, loadFromDb, clearAll, markSaved } = useAuditStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [dbError, setDbError] = useState('')
  const [showAudits, setShowAudits] = useState(false)
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([])
  const [loadingAudits, setLoadingAudits] = useState(false)
  const [aiLoading, setAiLoading] = useState<Domain | null>(null)
  const [aiInsights, setAiInsights] = useState<Partial<Record<Domain, string>>>({})
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const scores = calcScores(data)
  const rec = RECOMMENDATION_LABELS[scores.recommendation]

  async function saveToDb() {
    setDbStatus('saving')
    setDbError('')

    try {
      const payload = { ...data, aiInsights }
      const isUpdate = savedId !== null
      const url = isUpdate ? `/api/audits/${savedId}` : '/api/audits'
      const method = isUpdate ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
      }

      const saved = await res.json()
      markSaved(saved.id)
      setDbStatus('saved')
      setTimeout(() => setDbStatus('idle'), 3000)
    } catch (err: unknown) {
      setDbError(err instanceof Error ? err.message : 'Save failed')
      setDbStatus('error')
    }
  }

  async function loadAudits() {
    setLoadingAudits(true)
    try {
      const res = await fetch('/api/audits')
      const audits = await res.json()
      setSavedAudits(audits)
      setShowAudits(true)
    } catch {
      setSavedAudits([])
    } finally {
      setLoadingAudits(false)
    }
  }

  async function loadAudit(id: number) {
    try {
      const res = await fetch(`/api/audits/${id}`)
      const audit = await res.json()
      loadFromDb({
        ...audit,
        id: audit.id,
        answers: audit.answers ?? {},
        domainNotes: audit.domainNotes ?? {},
        generalNotes: audit.generalNotes ?? '',
      })
      if (audit.aiInsights) setAiInsights(audit.aiInsights)
      setShowAudits(false)
    } catch {}
  }

  async function handleAiAnalyze(domain: Domain) {
    setAiLoading(domain)
    const domainAnswers = Object.fromEntries(
      Object.entries(data.answers).filter(([k]) => k.startsWith(domain.slice(0, 3)))
    )
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'domain', domain, auditData: data, scores, domainAnswers }),
      })
      const { text, error } = await res.json()
      if (error) throw new Error(error)
      setAiInsights(prev => ({ ...prev, [domain]: text }))
    } catch (err: unknown) {
      setAiInsights(prev => ({ ...prev, [domain]: `Error: ${err instanceof Error ? err.message : 'AI request failed'}` }))
    } finally {
      setAiLoading(null)
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'summary', auditData: data, scores }),
      })
      const { text, error } = await res.json()
      if (error) throw new Error(error)
      setSummary(text)
    } catch (err: unknown) {
      setSummary(`Error: ${err instanceof Error ? err.message : 'AI request failed'}`)
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth', { method: 'DELETE' })
    window.location.href = '/login'
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">SMB Audit</span>
            </div>

            <input
              type="text"
              value={data.businessName}
              onChange={e => setField('businessName', e.target.value)}
              placeholder="Business name..."
              className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadAudits}
                disabled={loadingAudits}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {loadingAudits ? 'Loading...' : 'Load Saved'}
              </button>
              <button
                onClick={saveToDb}
                disabled={dbStatus === 'saving'}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  dbStatus === 'saved' ? 'bg-emerald-600 text-white'
                    : dbStatus === 'error' ? 'bg-red-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {dbStatus === 'saving' ? 'Saving...' : dbStatus === 'saved' ? 'Saved!' : dbStatus === 'error' ? 'Error' : savedId ? 'Update DB' : 'Save to DB'}
              </button>
              <a
                href="/report"
                target="_blank"
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Download Report
              </a>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {dbError && (
            <div className="pb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mb-2">
              DB error: {dbError}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 pb-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? `border-blue-600 text-blue-600`
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
                {tab.id !== 'overview' && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${DOMAIN_META[tab.id as Domain].badgeClass}`}>
                    {scores.domains[tab.id as Domain]?.completionPct ?? 0}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Load Audits Modal */}
      {showAudits && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAudits(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Saved Audits</h2>
              <button onClick={() => setShowAudits(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {savedAudits.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No saved audits found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {savedAudits.map(audit => (
                  <button
                    key={audit.id}
                    onClick={() => loadAudit(audit.id)}
                    className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium text-gray-900 text-sm">{audit.businessName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {audit.abn && `ABN: ${audit.abn} · `}
                      {audit.auditDate && `Date: ${audit.auditDate} · `}
                      {audit.loanAmount && `Loan: AUD ${audit.loanAmount}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Auditor: {audit.auditorName ?? 'N/A'} · Saved {new Date(audit.updatedAt).toLocaleDateString('en-AU')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Business info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Business Details & Loan Information</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { key: 'abn', label: 'ABN', placeholder: '12 345 678 901' },
                  { key: 'contactName', label: 'Contact Name', placeholder: 'Full name' },
                  { key: 'contactPhone', label: 'Contact Phone', placeholder: '04XX XXX XXX' },
                  { key: 'auditorName', label: 'Auditor Name', placeholder: 'Your name' },
                  { key: 'auditDate', label: 'Audit Date', placeholder: '', type: 'date' },
                  { key: 'loanAmount', label: 'Loan Amount (AUD)', placeholder: '150,000' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <input
                      type={f.type ?? 'text'}
                      value={data[f.key as keyof typeof data] as string}
                      onChange={e => setField(f.key as keyof typeof data, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={data.loanPurpose}
                  onChange={e => setField('loanPurpose', e.target.value)}
                  placeholder="e.g. Workshop expansion, equipment purchase, working capital"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Overall score */}
            <div className={`bg-white rounded-xl border-2 p-6 ${
              rec.color === 'green' ? 'border-emerald-400' :
              rec.color === 'yellow' ? 'border-yellow-400' :
              rec.color === 'orange' ? 'border-orange-400' :
              rec.color === 'red' ? 'border-red-400' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-6">
                <ScoreGauge score={scores.overall} size="lg" label="Overall" />
                <div className="flex-1">
                  <div className={`text-xl font-bold ${
                    rec.color === 'green' ? 'text-emerald-700' :
                    rec.color === 'yellow' ? 'text-yellow-700' :
                    rec.color === 'orange' ? 'text-orange-700' :
                    rec.color === 'red' ? 'text-red-700' : 'text-gray-700'
                  }`}>{rec.label}</div>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex gap-3 mt-3">
                    {DOMAINS.map(d => (
                      <div key={d} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{DOMAIN_META[d].label}</div>
                        <div className="text-base font-bold" style={{ color: scoreColor(scores.domains[d]?.score ?? 0) }}>
                          {scores.domains[d]?.answeredCount > 0 ? scores.domains[d].score : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Domain cards */}
            <div className="grid grid-cols-2 gap-4">
              {DOMAINS.map(domain => {
                const meta = DOMAIN_META[domain]
                const ds = scores.domains[domain]
                return (
                  <div
                    key={domain}
                    className={`bg-white rounded-xl border ${meta.borderClass} p-5 cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setActiveTab(domain)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className={`font-semibold ${meta.colorClass}`}>{meta.label}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
                        <p className="text-xs text-gray-400">{Math.round(meta.weight * 100)}% of overall score</p>
                      </div>
                      <ScoreGauge score={ds.answeredCount > 0 ? ds.score : 0} size="sm" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{ds.answeredCount}/{ds.totalScorable}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            domain === 'finance' ? 'bg-blue-500' :
                            domain === 'operations' ? 'bg-amber-500' :
                            domain === 'sales' ? 'bg-emerald-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${ds.completionPct}%` }}
                        />
                      </div>
                    </div>
                    <div className={`mt-3 text-xs font-medium ${meta.colorClass}`}>
                      Click to fill in assessment →
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">AI Executive Summary</h3>
                  <p className="text-xs text-gray-400">Credit committee-ready summary generated by AI</p>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {summaryLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : 'Generate Summary'}
                </button>
              </div>
              {summary ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-indigo-50 rounded-lg p-4 border border-indigo-100 leading-relaxed">
                  {summary}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Generate an AI-written executive summary for use in credit committee review.
                </p>
              )}
            </div>

            {/* General notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">General Meeting Notes</label>
              <textarea
                rows={5}
                value={data.generalNotes}
                onChange={e => setField('generalNotes', e.target.value)}
                placeholder="Overall observations, key discussion points, any concerns or positives not captured in the assessment..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-700"
              />
            </div>

            {/* Clear data */}
            <div className="flex justify-end">
              {showClearConfirm ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Clear all data?</span>
                  <button onClick={() => { clearAll(); setShowClearConfirm(false); setAiInsights({}); setSummary('') }} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Yes, clear</button>
                  <button onClick={() => setShowClearConfirm(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowClearConfirm(true)} className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Clear Assessment
                </button>
              )}
            </div>
          </div>
        )}

        {DOMAINS.map(domain => activeTab === domain && (
          <DomainForm
            key={domain}
            domain={domain}
            data={data}
            onAnswer={setAnswer}
            onDomainNotes={setDomainNotes}
            onAiAnalyze={handleAiAnalyze}
            aiLoading={aiLoading === domain}
            aiInsight={aiInsights[domain] ?? ''}
          />
        ))}
      </main>
    </div>
  )
}
