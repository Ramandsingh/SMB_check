'use client'

import { useState } from 'react'
import { Domain, Answer, AuditData } from '@/types'
import { QUESTIONS, DOMAIN_META, getCategories } from '@/lib/questions'
import { calcDomainScore } from '@/lib/scoring'
import { ScoreGauge } from './ScoreGauge'
import { StarRating } from './StarRating'

interface Props {
  domain: Domain
  data: AuditData
  onAnswer: (qId: string, rating: number | null, value: string, notes: string) => void
  onDomainNotes: (domain: Domain, notes: string) => void
  onAiAnalyze: (domain: Domain) => void
  aiLoading: boolean
  aiInsight: string
}

export function DomainForm({ domain, data, onAnswer, onDomainNotes, onAiAnalyze, aiLoading, aiInsight }: Props) {
  const meta = DOMAIN_META[domain]
  const categories = getCategories(domain)
  const domainScore = calcDomainScore(domain, data.answers)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  function toggleNotes(qId: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  function getAnswer(qId: string): Answer {
    return data.answers[qId] ?? { rating: null, value: '', notes: '' }
  }

  function update(qId: string, partial: Partial<Answer>) {
    const cur = getAnswer(qId)
    onAnswer(qId, partial.rating !== undefined ? partial.rating : cur.rating, partial.value ?? cur.value, partial.notes ?? cur.notes)
  }

  return (
    <div className="space-y-6">
      {/* Domain header */}
      <div className={`flex items-center justify-between p-5 rounded-xl border ${meta.bgClass} ${meta.borderClass}`}>
        <div>
          <h2 className={`text-lg font-semibold ${meta.colorClass}`}>{meta.label}</h2>
          <p className="text-sm text-gray-600">{meta.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            {domainScore.answeredCount}/{domainScore.totalScorable} scored questions answered
            {domainScore.completionPct > 0 && ` · ${domainScore.completionPct}% complete`}
          </p>
        </div>
        <ScoreGauge score={domainScore.score} size="md" label="Score" />
      </div>

      {/* Questions by category */}
      {categories.map(cat => {
        const qs = QUESTIONS.filter(q => q.domain === domain && q.category === cat)
        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {qs.map(q => {
                const ans = getAnswer(q.id)
                const hasNote = expandedNotes.has(q.id) || !!ans.notes
                return (
                  <div key={q.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-800 leading-snug">
                            {q.label}
                          </label>
                          {q.weight > 0 && (
                            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.badgeClass}`}>
                              scored
                            </span>
                          )}
                        </div>
                        {q.helpText && (
                          <p className="text-xs text-gray-400 mt-0.5">{q.helpText}</p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {q.type === 'rating' && (
                          <StarRating
                            value={ans.rating}
                            onChange={v => update(q.id, { rating: v })}
                          />
                        )}
                        {q.type === 'yesno' && (
                          <div className="flex gap-2">
                            {(['yes', 'no'] as const).map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => update(q.id, { value: ans.value === opt ? '' : opt })}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  ans.value === opt
                                    ? opt === 'yes'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {opt === 'yes' ? 'Yes' : 'No'}
                              </button>
                            ))}
                          </div>
                        )}
                        {(q.type === 'number' || q.type === 'text') && (
                          <input
                            type={q.type === 'number' ? 'text' : 'text'}
                            inputMode={q.type === 'number' ? 'decimal' : 'text'}
                            value={ans.value}
                            onChange={e => update(q.id, { value: e.target.value })}
                            placeholder={q.type === 'number' ? '0' : 'Enter value'}
                            className="w-44 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        )}
                      </div>
                    </div>

                    {/* Notes toggle */}
                    <div className="mt-2">
                      {!hasNote ? (
                        <button
                          type="button"
                          onClick={() => toggleNotes(q.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          + Add note
                        </button>
                      ) : (
                        <textarea
                          rows={2}
                          value={ans.notes}
                          onChange={e => update(q.id, { notes: e.target.value })}
                          placeholder="Notes for this question..."
                          className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Domain-level notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {DOMAIN_META[domain].label} — Overall Notes
        </label>
        <textarea
          rows={4}
          value={data.domainNotes[domain]}
          onChange={e => onDomainNotes(domain, e.target.value)}
          placeholder={`Key observations, context, and findings for ${DOMAIN_META[domain].label.toLowerCase()}...`}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">AI Analysis</h3>
            <p className="text-xs text-gray-400">Powered by OpenRouter — requires API key</p>
          </div>
          <button
            type="button"
            onClick={() => onAiAnalyze(domain)}
            disabled={aiLoading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {aiLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analysing...
              </>
            ) : 'Analyse with AI'}
          </button>
        </div>
        {aiInsight ? (
          <div className="prose prose-sm max-w-none text-gray-700 text-sm whitespace-pre-wrap bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            {aiInsight}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Click "Analyse with AI" to generate insights for this domain based on your answers.
          </p>
        )}
      </div>
    </div>
  )
}
