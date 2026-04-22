'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuditData, Domain } from '@/types'

const STORAGE_KEY = 'smb_audit_v1'

const defaultDomainNotes: Record<Domain, string> = {
  finance: '',
  operations: '',
  sales: '',
  marketing: '',
}

export const defaultAuditData: AuditData = {
  businessName: '',
  abn: '',
  contactName: '',
  contactPhone: '',
  auditorName: '',
  auditDate: new Date().toISOString().split('T')[0],
  loanAmount: '',
  loanPurpose: '',
  answers: {},
  domainNotes: defaultDomainNotes,
  generalNotes: '',
}

export function useAuditStore() {
  const [data, setData] = useState<AuditData>(defaultAuditData)
  const [loaded, setLoaded] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData({ ...defaultAuditData, ...parsed, domainNotes: { ...defaultDomainNotes, ...parsed.domainNotes } })
      }
      const id = localStorage.getItem(`${STORAGE_KEY}_id`)
      if (id) setSavedId(Number(id))
    } catch {}
    setLoaded(true)
  }, [])

  const persist = useCallback((next: AuditData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const setField = useCallback(<K extends keyof AuditData>(key: K, value: AuditData[K]) => {
    setData(prev => {
      const next = { ...prev, [key]: value }
      persist(next)
      return next
    })
  }, [persist])

  const setAnswer = useCallback((questionId: string, rating: number | null, value: string, notes: string) => {
    setData(prev => {
      const next = {
        ...prev,
        answers: { ...prev.answers, [questionId]: { rating, value, notes } },
      }
      persist(next)
      return next
    })
  }, [persist])

  const setDomainNotes = useCallback((domain: Domain, notes: string) => {
    setData(prev => {
      const next = { ...prev, domainNotes: { ...prev.domainNotes, [domain]: notes } }
      persist(next)
      return next
    })
  }, [persist])

  const loadFromDb = useCallback((dbData: AuditData & { id: number }) => {
    const { id, ...rest } = dbData
    const merged = { ...defaultAuditData, ...rest, domainNotes: { ...defaultDomainNotes, ...(rest.domainNotes ?? {}) } }
    setData(merged)
    setSavedId(id)
    persist(merged)
    try { localStorage.setItem(`${STORAGE_KEY}_id`, String(id)) } catch {}
  }, [persist])

  const clearAll = useCallback(() => {
    setData(defaultAuditData)
    setSavedId(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(`${STORAGE_KEY}_id`)
    } catch {}
  }, [])

  const markSaved = useCallback((id: number) => {
    setSavedId(id)
    try { localStorage.setItem(`${STORAGE_KEY}_id`, String(id)) } catch {}
  }, [])

  return { data, loaded, savedId, setField, setAnswer, setDomainNotes, loadFromDb, clearAll, markSaved }
}
