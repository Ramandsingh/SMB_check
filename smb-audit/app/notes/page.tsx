'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Category = 'release' | 'prd' | 'general'

interface Note {
  id: number
  category: Category
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'release', label: 'Release Notes', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'prd',     label: 'PRD',           color: 'bg-blue-100 text-blue-700' },
  { id: 'general', label: 'General',       color: 'bg-gray-100 text-gray-600' },
]

function categoryMeta(id: Category) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[2]
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [selected, setSelected] = useState<Note | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState<Category>('general')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [isNew, setIsNew] = useState(false)

  async function fetchNotes() {
    const res = await fetch('/api/notes')
    if (res.ok) setNotes(await res.json())
  }

  useEffect(() => { fetchNotes() }, [])

  function openNote(note: Note) {
    setSelected(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditCategory(note.category)
    setDirty(false)
    setIsNew(false)
  }

  function newNote(category: Category = 'general') {
    const draft: Note = { id: 0, category, title: '', content: '', createdAt: '', updatedAt: '' }
    setSelected(draft)
    setEditTitle('')
    setEditContent('')
    setEditCategory(category)
    setDirty(true)
    setIsNew(true)
  }

  async function save() {
    setSaving(true)
    try {
      if (isNew) {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: editCategory, title: editTitle || 'Untitled', content: editContent }),
        })
        const { id } = await res.json()
        await fetchNotes()
        const fresh = await fetch(`/api/notes/${id}`)
        const note = await fresh.json()
        openNote(note)
      } else if (selected) {
        await fetch(`/api/notes/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: editCategory, title: editTitle, content: editContent }),
        })
        await fetchNotes()
        setDirty(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteNote() {
    if (!selected || selected.id === 0) { setSelected(null); return }
    if (!confirm('Delete this note?')) return
    await fetch(`/api/notes/${selected.id}`, { method: 'DELETE' })
    setSelected(null)
    fetchNotes()
  }

  const filtered = activeCategory === 'all' ? notes : notes.filter(n => n.category === activeCategory)

  const counts = useCallback(() => {
    const c: Record<string, number> = { all: notes.length }
    CATEGORIES.forEach(cat => { c[cat.id] = notes.filter(n => n.category === cat.id).length })
    return c
  }, [notes])()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Assessments
            </Link>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Project Notes</span>
            </div>
          </div>
          <button
            onClick={() => newNote(activeCategory === 'all' ? 'general' : activeCategory)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          {/* Category filters */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {[{ id: 'all' as const, label: 'All Notes' }, ...CATEGORIES].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as Category | 'all')}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {'label' in cat ? cat.label : cat.id}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
                  {counts[cat.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No notes yet</p>
            )}
            {filtered.map(note => {
              const meta = categoryMeta(note.category)
              return (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`w-full text-left bg-white rounded-xl border px-4 py-3 transition-all ${
                    selected?.id === note.id
                      ? 'border-violet-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm truncate">{note.title}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.color}`}>{meta.label}</span>
                    <span className="text-xs text-gray-400">{new Date(note.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {note.content && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{note.content}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selected === null ? (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Select a note or create a new one</p>
              <div className="flex gap-2 mt-4">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => newNote(cat.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${cat.color} hover:opacity-80`}
                  >
                    + {cat.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
              {/* Editor toolbar */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <select
                  value={editCategory}
                  onChange={e => { setEditCategory(e.target.value as Category); setDirty(true) }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input
                  value={editTitle}
                  onChange={e => { setEditTitle(e.target.value); setDirty(true) }}
                  placeholder="Note title..."
                  className="flex-1 text-sm font-semibold text-gray-900 border-0 focus:outline-none placeholder-gray-300"
                />
                <div className="flex items-center gap-2">
                  {dirty && <span className="text-xs text-amber-500">Unsaved</span>}
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {!isNew && (
                    <button
                      onClick={deleteNote}
                      className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={editContent}
                onChange={e => { setEditContent(e.target.value); setDirty(true) }}
                placeholder="Write your notes here... supports plain text and markdown-style formatting."
                className="flex-1 px-5 py-4 text-sm text-gray-700 resize-none focus:outline-none leading-relaxed font-mono"
              />

              {/* Footer */}
              {selected.updatedAt && (
                <div className="px-5 py-2 border-t border-gray-100 text-xs text-gray-400">
                  Last updated {new Date(selected.updatedAt).toLocaleString('en-AU')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
