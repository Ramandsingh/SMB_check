'use client'

import { useState, useCallback, useEffect } from 'react'
import { Domain, SavedAudit } from '@/types'
import { DOMAIN_META } from '@/lib/questions'
import { calcScores, RECOMMENDATION_LABELS, scoreColor } from '@/lib/scoring'
import { useAuditStore, defaultAuditData } from '@/lib/useAuditStore'
import { ScoreGauge } from '@/components/ScoreGauge'
import { DomainForm } from '@/components/DomainForm'

type Tab = 'overview' | Domain
type View = 'list' | 'audit'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'finance', label: 'Finance' },
  { id: 'operations', label: 'Operations' },
  { id: 'sales', label: 'Sales' },
  { id: 'marketing', label: 'Marketing' },
]

const DOMAINS: Domain[] = ['finance', 'operations', 'sales', 'marketing']

const REC_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-500',
}

export default function DashboardPage() {
  const { data, loaded, savedId, setField, setAnswer, setDomainNotes, loadFromDb, clearAll, markSaved } = useAuditStore()
  const [view, setView] = useState<View>('list')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [businesses, setBusinesses] = useState<SavedAudit[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [dbStatus, setDbStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [dbError, setDbError] = useState('')
  const [aiLoading, setAiLoading] = useState<Domain | null>(null)
  const [aiInsights, setAiInsights] = useState<Partial<Record<Domain, string>>>({})
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const scores = calcScores(data)
  const rec = RECOMMENDATION_LABELS[scores.recommendation]

  async function fetchBusinesses() {
    setLoadingList(true)
    try {
      const res = await fetch('/api/audits')
      if (res.ok) setBusinesses(await res.json())
    } catch {}
    finally { setLoadingList(false) }
  }

  useEffect(() => { fetchBusinesses() }, [])

  function startNew() {
    clearAll()
    setAiInsights({})
    setSummary('')
    setActiveTab('overview')
    setView('audit')
  }

  async function openBusiness(id: number) {
    try {
      const res = await fetch(`/api/audits/${id}`)
      const audit = await res.json()
      loadFromDb({
        ...audit,
        answers: audit.answers ?? {},
        domainNotes: audit.domainNotes ?? {},
        generalNotes: audit.generalNotes ?? '',
      })
      if (audit.aiInsights) setAiInsights(audit.aiInsights)
      setSummary('')
      setActiveTab('overview')
      setView('audit')
    } catch {}
  }

  function backToList() {
    setView('list')
    fetchBusinesses()
  }

  async function saveToDb() {
    setDbStatus('saving')
    setDbError('')
    try {
      const payload = { ...data, aiInsights }
      const isUpdate = savedId !== null
      const res = await fetch(isUpdate ? `/api/audits/${savedId}` : '/api/audits', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const { error } = await res.json(); throw new Error(error) }
      const saved = await res.json()
      markSaved(saved.id)
      setDbStatus('saved')
      setTimeout(() => setDbStatus('idle'), 3000)
    } catch (err: unknown) {
      setDbError(err instanceof Error ? err.message : 'Save failed')
      setDbStatus('error')
    }
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
    } finally { setAiLoading(null) }
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
    } finally { setSummaryLoading(false) }
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

  // ── BUSINESSES LIST VIEW ───────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">SMB Audit Tool</div>
                <div className="text-xs text-gray-400">Business Lending Assessments</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Business Assessments</h1>
              <p className="text-sm text-gray-500 mt-0.5">{businesses.length} saved assessment{businesses.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Assessment
            </button>
          </div>

          {loadingList ? (
            <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No assessments yet</p>
              <p className="text-gray-400 text-sm mt-1">Click &quot;+ New Assessment&quot; to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map(biz => {
                const recLabel = biz.loanAmount ? `AUD ${biz.loanAmount}` : null
                return (
                  <div
                    key={biz.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    onClick={() => openBusiness(biz.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-600 transition-colors">
                        {biz.businessName}
                      </h3>
                      <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                        <svg className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {biz.abn && <div>ABN: {biz.abn}</div>}
                      {biz.auditDate && <div>Date: {biz.auditDate}</div>}
                      {biz.auditorName && <div>Auditor: {biz.auditorName}</div>}
                      {recLabel && <div className="font-medium text-gray-700">Loan: {recLabel}</div>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {new Date(biz.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-blue-600 font-medium group-hover:underline">Open →</span>
                    </div>
                  </div>
                )
              })}

              {/* + New card */}
              <div
                onClick={startNew}
                className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-36"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-medium">New Assessment</span>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── AUDIT FORM VIEW ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={backToList}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Businesses
            </button>

            <input
              type="text"
              value={data.businessName}
              onChange={e => setField('businessName', e.target.value)}
              placeholder="Business name..."
              className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={saveToDb}
                disabled={dbStatus === 'saving'}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  dbStatus === 'saved' ? 'bg-emerald-600 text-white'
                    : dbStatus === 'error' ? 'bg-red-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {dbStatus === 'saving' ? 'Saving...' : dbStatus === 'saved' ? 'Saved!' : dbStatus === 'error' ? 'Error' : savedId ? 'Update' : 'Save'}
              </button>
              <a
                href="/report"
                target="_blank"
                className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Report
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
                    ? 'border-blue-600 text-blue-600'
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
                  <span className="text-sm text-gray-600">Clear this assessment?</span>
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
