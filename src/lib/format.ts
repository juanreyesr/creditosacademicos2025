export function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function fmtDateTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-GT')
}

export function calcCreditos(horas: number) {
  if (!Number.isFinite(horas) || horas <= 0) return 0
  return Math.round((horas / 16) * 100) / 100
}

export function safeText(v: unknown) {
  const s = (v ?? '').toString().trim()
  return s.length ? s : '—'
}
