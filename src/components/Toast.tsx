import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastKind = 'ok' | 'error' | 'info'
type ToastItem = { id: string; kind: ToastKind; title: string; description?: string }

const ToastCtx = createContext<{
  push: (t: Omit<ToastItem, 'id'>) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2)
    const item: ToastItem = { id, ...t }
    setItems((s) => [...s, item])
    window.setTimeout(() => {
      setItems((s) => s.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast" aria-live="polite" aria-relevant="additions">
        {items.map((t) => (
          <div key={t.id} className={`item ${t.kind === 'info' ? '' : t.kind}`}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>{t.title}</div>
            {t.description ? <div className="small">{t.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
