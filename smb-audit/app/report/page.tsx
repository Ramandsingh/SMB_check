'use client'

import { useState, useEffect } from 'react'
import { AuditData, Domain } from '@/types'
import { defaultAuditData } from '@/lib/useAuditStore'
import { QUESTIONS, DOMAIN_META } from '@/lib/questions'
import { calcScores, RECOMMENDATION_LABELS, scoreColor } from '@/lib/scoring'

const STORAGE_KEY = 'smb_audit_v1'

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold" style={{ color: scoreColor(score) }}>{score}</span>
    </div>
  )
}

export default function ReportPage() {
  const [data, setData] = useState<AuditData>(defaultAuditData)
  const [aiInsights, setAiInsights] = useState<Partial<Record<Domain, string>>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setData(JSON.parse(raw))
    } catch {}
    setLoaded(true)
  }, [])

  const scores = calcScores(data)
  const rec = RECOMMENDATION_LABELS[scores.recommendation]

  if (!loaded) return <div className="p-8 text-gray-400">Loading report...</div>

  const DOMAINS: Domain[] = ['finance', 'operations', 'sales', 'marketing']

  return (
    <div className="bg-white min-h-screen">
      {/* Print button — hidden in print */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 shadow bg-white"
        >
          Close
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Report header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Business Lending Assessment</p>
              <h1 className="text-3xl font-bold text-gray-900">{data.businessName || 'Unnamed Business'}</h1>
              {data.abn && <p className="text-sm text-gray-500 mt-1">ABN: {data.abn}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Audit Date</p>
              <p className="font-semibold text-gray-800">{data.auditDate || 'Not set'}</p>
              <p className="text-xs text-gray-400 mt-2">Auditor</p>
              <p className="font-semibold text-gray-800">{data.auditorName || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Loan request */}
        <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Loan Request</p>
            <p className="text-2xl font-bold text-gray-900">{data.loanAmount ? `AUD ${data.loanAmount}` : 'Not specified'}</p>
            <p className="text-sm text-gray-600 mt-1">{data.loanPurpose || 'Purpose not specified'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Contact</p>
            <p className="text-sm font-medium text-gray-800">{data.contactName || 'Not provided'}</p>
            {data.contactPhone && <p className="text-sm text-gray-600">{data.contactPhone}</p>}
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-xl p-6 mb-8 border-2 ${
          rec.color === 'green' ? 'bg-emerald-50 border-emerald-400' :
          rec.color === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
          rec.color === 'orange' ? 'bg-orange-50 border-orange-400' :
          rec.color === 'red' ? 'bg-red-50 border-red-400' : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">Lending Recommendation</p>
              <h2 className={`text-2xl font-bold ${
                rec.color === 'green' ? 'text-emerald-700' :
                rec.color === 'yellow' ? 'text-yellow-700' :
                rec.color === 'orange' ? 'text-orange-700' :
                rec.color === 'red' ? 'text-red-700' : 'text-gray-700'
              }`}>{rec.label}</h2>
              <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black" style={{ color: scoreColor(scores.overall) }}>{scores.overall}</div>
              <div className="text-xs text-gray-400 mt-1">/ 100</div>
              <div className="text-xs text-gray-500">Overall Score</div>
            </div>
          </div>
        </div>

        {/* Domain scores summary */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs">Assessment Summary</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Domain</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Weight</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider">Progress</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wider w-48">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DOMAINS.map(domain => {
                  const meta = DOMAIN_META[domain]
                  const ds = scores.domains[domain]
                  return (
                    <tr key={domain}>
                      <td className="px-5 py-3">
                        <div className={`font-semibold text-sm ${meta.colorClass}`}>{meta.label}</div>
                        <div className="text-xs text-gray-400">{meta.description}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{Math.round(meta.weight * 100)}%</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{ds.answeredCount}/{ds.totalScorable} questions</td>
                      <td className="px-5 py-3 w-48">
                        {ds.answeredCount > 0 ? <ScoreBar score={ds.score} /> : <span className="text-xs text-gray-400 italic">Not assessed</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Domain details */}
        {DOMAINS.map(domain => {
          const meta = DOMAIN_META[domain]
          const questions = QUESTIONS.filter(q => q.domain === domain)
          const hasAnswers = questions.some(q => data.answers[q.id])
          if (!hasAnswers) return null

          return (
            <div key={domain} className="mb-8 page-break-before">
              <div className={`flex items-center gap-3 px-5 py-3 rounded-t-xl ${meta.bgClass} border ${meta.borderClass}`}>
                <h2 className={`font-bold text-base ${meta.colorClass}`}>{meta.label}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badgeClass}`}>
                  Score: {scores.domains[domain].score}/100
                </span>
              </div>

              <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
                {/* Answers table */}
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2 uppercase tracking-wider">Question</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2 uppercase tracking-wider w-24">Answer</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map(q => {
                      const ans = data.answers[q.id]
                      if (!ans) return null
                      const hasValue = ans.rating !== null || ans.value || ans.notes

                      if (!hasValue) return null

                      return (
                        <tr key={q.id} className="align-top">
                          <td className="px-5 py-2.5">
                            <div className="text-sm text-gray-800">{q.label}</div>
                            <div className="text-xs text-gray-400">{q.category}</div>
                          </td>
                          <td className="px-5 py-2.5">
                            {q.type === 'rating' && ans.rating !== null && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold" style={{ color: scoreColor(ans.rating * 20) }}>{ans.rating}/5</span>
                                <span className="text-xs text-gray-400">({ans.rating * 20}pts)</span>
                              </div>
                            )}
                            {q.type === 'yesno' && ans.value && (
                              <span className={`text-sm font-semibold ${ans.value === 'yes' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {ans.value === 'yes' ? 'Yes' : 'No'}
                              </span>
                            )}
                            {(q.type === 'number' || q.type === 'text') && ans.value && (
                              <span className="text-sm text-gray-700">{ans.value}</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5">
                            {ans.notes && <p className="text-xs text-gray-600 italic">{ans.notes}</p>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Domain notes */}
                {data.domainNotes[domain] && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Domain Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.domainNotes[domain]}</p>
                  </div>
                )}

                {/* AI insights */}
                {aiInsights[domain] && (
                  <div className="px-5 py-4 bg-indigo-50 border-t border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">AI Analysis</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiInsights[domain]}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* General notes */}
        {data.generalNotes && (
          <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">General Meeting Notes</h2>
            <div className="border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.generalNotes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 flex justify-between text-xs text-gray-400">
          <span>SMB Audit Tool — Joinery Business Assessment</span>
          <span>Generated {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { font-size: 12px; }
          @page { margin: 20mm; }
        }
        .page-break-before { page-break-before: auto; }
      `}</style>
    </div>
  )
}
