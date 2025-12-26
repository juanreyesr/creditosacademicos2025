import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import type { RegistroCredito } from '../types'
import { calcCreditos, fmtDate, fmtDateTime, safeText } from '../lib/format'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'

function withinFiveYears(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  if (Number.isNaN(d.getTime()) || d > now) return false
  const past = new Date()
  past.setFullYear(now.getFullYear() - 5)
  return d >= past
}

async function downloadComprobante(path: string) {
  const { data, error } = await supabase.storage.from('comprobantes').download(path)
  if (error) throw error
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = path.split('/').pop() || 'comprobante'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function generarConstanciaPDF(rec: RegistroCredito, localFile?: File | null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pad = 48

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Constancia de Registro de Créditos Académicos', pad, 64)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Colegio de Psicólogos de Guatemala — Artículo 16: 1 crédito = 16 horas', pad, 84)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`Correlativo: ${rec.correlativo}`, pad, 120)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)

  const lines = [
    `Nombre: ${safeText(rec.nombre)}`,
    `Teléfono: ${safeText(rec.telefono)}`,
    `Colegiado No.: ${safeText(rec.colegiado_numero)} (Activo: ${rec.colegiado_activo ? 'Sí' : 'No'})`,
    `Actividad: ${safeText(rec.actividad)}`,
    `Institución: ${safeText(rec.institucion)}`,
    `Tipo: ${safeText(rec.tipo)}`,
    `Fecha: ${fmtDate(rec.fecha)}`,
    `Horas: ${rec.horas}    Créditos: ${rec.creditos}`,
    `Observaciones: ${safeText(rec.observaciones)}`,
    `Registro: ${fmtDateTime(rec.created_at)}`,
  ]

  let y = 150
  for (const l of lines) {
    doc.text(l, pad, y, { maxWidth: 360 })
    y += 18
  }

  // QR a un enlace “interno” (útil para auditoría si el usuario está autenticado)
  const qrUrl = `${window.location.origin}/creditos?registro=${encodeURIComponent(rec.id)}`
  const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 220 })
  doc.addImage(qrDataUrl, 'PNG', 360, 140, 170, 170)

  doc.setFontSize(9)
  doc.text('QR de referencia', 360, 320)
  doc.text(qrUrl, 360, 334, { maxWidth: 190 })

  // Logo simple
  try {
    const img = await fetch('/logo-cpg.png')
    const blob = await img.blob()
    const buf = await blob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    const dataUrl = `data:${blob.type};base64,${base64}`
    doc.addImage(dataUrl, 'PNG', pad, 350, 64, 64)
  } catch {
    // ignore
  }

  // Adjuntar comprobante (solo si imagen)
  const file = localFile
  if (file && /^image\//.test(file.type)) {
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const usableW = pageW - pad * 2
    const usableH = pageH - pad * 2

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })

    if (dataUrl) {
      doc.addPage()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Comprobante adjunto', pad, pad)

      // Mantener proporción (estimación por canvas)
      const imgEl = new Image()
      await new Promise((res) => {
        imgEl.onload = res
        imgEl.onerror = res
        imgEl.src = dataUrl
      })

      const w = (imgEl as any).width || 800
      const h = (imgEl as any).height || 600
      const scale = Math.min(usableW / w, usableH / h)
      const drawW = w * scale
      const drawH = h * scale
      const x = pad + (usableW - drawW) / 2
      const y0 = pad + 24 + (usableH - drawH) / 2
      doc.addImage(dataUrl, 'PNG', x, y0, drawW, drawH)
    }
  }

  doc.save(`Constancia_${rec.correlativo}.pdf`)
}

export default function CreditosPage({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useSession()
  const { push } = useToast()

  const storageKey = useMemo(() => (user ? `av_creditos_profile_${user.id}` : 'av_creditos_profile'), [user])

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<RegistroCredito[]>([])

  // Admin view controls
  const [viewAll, setViewAll] = useState(false)
  const [q, setQ] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  // Form fields
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [colegiado, setColegiado] = useState('')
  const [colegiadoActivo, setColegiadoActivo] = useState(true)
  const [actividad, setActividad] = useState('')
  const [institucion, setInstitucion] = useState('')
  const [tipo, setTipo] = useState('Diplomado')
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [horas, setHoras] = useState<number>(16)
  const [observaciones, setObservaciones] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [autoPdf, setAutoPdf] = useState(true)

  const creditos = useMemo(() => calcCreditos(Number(horas)), [horas])

  // Prefill desde localStorage y último registro en DB
  useEffect(() => {
    if (!user) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const s = JSON.parse(raw)
        if (typeof s?.nombre === 'string') setNombre(s.nombre)
        if (typeof s?.telefono === 'string') setTelefono(s.telefono)
        if (typeof s?.colegiado === 'string') setColegiado(s.colegiado)
      }
    } catch {
      // ignore
    }

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('registros')
          .select('nombre, telefono, colegiado_numero')
          .eq('usuario_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (error) return
        if (data) {
          setNombre((prev) => prev || data.nombre)
          setTelefono((prev) => prev || (data.telefono ?? ''))
          setColegiado((prev) => prev || data.colegiado_numero)
        }
      } catch {
        // ignore
      }
    })()
  }, [user, storageKey])

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      let query = supabase.from('registros').select('*').order('created_at', { ascending: false }).limit(200)

      if (!isAdmin || !viewAll) query = query.eq('usuario_id', user.id)
      if (!showDeleted) query = query.is('deleted_at', null)

      // Filtro simple (solo si admin en viewAll)
      if (isAdmin && viewAll && q.trim()) {
        const term = `%${q.trim()}%`
        query = query.or(`nombre.ilike.${term},colegiado_numero.ilike.${term},actividad.ilike.${term}`)
      }

      const { data, error } = await query
      if (error) throw error
      setRows((data ?? []) as any)
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudieron cargar registros', description: e?.message ?? 'Error.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, isAdmin, viewAll, q, showDeleted])

  async function getCorrelativo() {
    try {
      const { data, error } = await supabase.rpc('next_correlativo')
      if (error) throw error
      return Number(data)
    } catch {
      // Fallback: max(correlativo)+1 del usuario
      if (!user) return 1
      const { data, error } = await supabase
        .from('registros')
        .select('correlativo')
        .eq('usuario_id', user.id)
        .order('correlativo', { ascending: false })
        .limit(1)
      if (error) throw error
      const max = Number((data?.[0] as any)?.correlativo ?? 0)
      return max + 1
    }
  }

  async function guardarDatosRapidos() {
    if (!user) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ nombre, telefono, colegiado }))
    } catch {
      // ignore
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    // Validaciones mínimas
    if (!nombre.trim()) return push({ kind: 'error', title: 'Nombre requerido' })
    if (!colegiado.trim()) return push({ kind: 'error', title: 'Número de colegiado requerido' })
    if (!actividad.trim()) return push({ kind: 'error', title: 'Actividad requerida' })
    if (!withinFiveYears(fecha)) return push({ kind: 'error', title: 'Fecha inválida', description: 'Debe estar dentro de los últimos 5 años y no ser futura.' })

    const h = Number(horas)
    if (!Number.isFinite(h) || h <= 0) return push({ kind: 'error', title: 'Horas inválidas' })

    try {
      const correlativo = await getCorrelativo()

      let archivo_url: string | null = null
      let archivo_mime: string | null = null
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          return push({ kind: 'error', title: 'Archivo demasiado grande', description: 'Máximo 10 MB.' })
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `${user.id}/${correlativo}-${safeName}`
        const { error: upErr } = await supabase.storage.from('comprobantes').upload(path, file, { contentType: file.type, upsert: false })
        if (upErr) throw upErr
        archivo_url = path
        archivo_mime = file.type
      }

      const payload = {
        usuario_id: user.id,
        correlativo,
        nombre: nombre.trim(),
        telefono: telefono.trim() || null,
        colegiado_numero: colegiado.trim(),
        colegiado_activo: colegiadoActivo,
        actividad: actividad.trim(),
        institucion: institucion.trim() || null,
        tipo,
        fecha,
        horas: h,
        creditos,
        observaciones: observaciones.trim() || null,
        archivo_url,
        archivo_mime,
        hash: null,
      }

      const { data: inserted, error } = await supabase.from('registros').insert(payload).select('*').single()
      if (error) throw error

      await guardarDatosRapidos()
      setActividad('')
      setInstitucion('')
      setObservaciones('')
      setFile(null)
      push({ kind: 'ok', title: 'Registro guardado', description: `Correlativo ${correlativo}` })

      await load()

      if (autoPdf) {
        await generarConstanciaPDF(inserted as any, file)
      }
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo guardar', description: e?.message ?? 'Error.' })
    }
  }

  async function onDelete(r: RegistroCredito) {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      // Soft delete preferido
      const { error } = await supabase.from('registros').update({ deleted_at: new Date().toISOString() }).eq('id', r.id)
      if (error) {
        // Fallback hard delete
        const del = await supabase.from('registros').delete().eq('id', r.id)
        if (del.error) throw del.error
      }
      push({ kind: 'ok', title: 'Registro eliminado' })
      await load()
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo eliminar', description: e?.message ?? 'Error.' })
    }
  }

  async function exportExcel() {
    try {
      const dataset = rows.map((r) => ({
        correlativo: r.correlativo,
        nombre: r.nombre,
        telefono: r.telefono ?? '',
        colegiado_numero: r.colegiado_numero,
        colegiado_activo: r.colegiado_activo ? 'Sí' : 'No',
        actividad: r.actividad,
        institucion: r.institucion ?? '',
        tipo: r.tipo,
        fecha: r.fecha,
        horas: r.horas,
        creditos: r.creditos,
        observaciones: r.observaciones ?? '',
        created_at: r.created_at,
        deleted_at: r.deleted_at ?? '',
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(dataset)
      XLSX.utils.book_append_sheet(wb, ws, 'Registros')
      XLSX.writeFile(wb, `creditos_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo exportar', description: e?.message ?? 'Error.' })
    }
  }

  const totalCreditos = useMemo(() => {
    const t = rows.reduce((acc, r) => acc + (Number(r.creditos) || 0), 0)
    return Math.round(t * 100) / 100
  }, [rows])

  return (
    <div className="grid">
      <div className="col-6">
        <div className="card">
          <div className="hd">
            <div>
              <h1 className="h1">Registro de créditos</h1>
              <p className="p">1 crédito = 16 horas. Se guarda por usuario y puede auditarse con perfil admin.</p>
            </div>
            <div className="badge">Total en vista: <span className="mono">{totalCreditos}</span></div>
          </div>
          <div className="bd">
            <form onSubmit={onSubmit}>
              <div className="row">
                <div>
                  <label>Nombre</label>
                  <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>No. de colegiado</label>
                  <input className="input" value={colegiado} onChange={(e) => setColegiado(e.target.value)} />
                </div>
                <div>
                  <label>Colegiado activo</label>
                  <select className="select" value={colegiadoActivo ? '1' : '0'} onChange={(e) => setColegiadoActivo(e.target.value === '1')}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Actividad</label>
                  <input className="input" value={actividad} onChange={(e) => setActividad(e.target.value)} placeholder="Ej. Diplomado de Neuropsicología" />
                </div>
                <div>
                  <label>Institución</label>
                  <input className="input" value={institucion} onChange={(e) => setInstitucion(e.target.value)} placeholder="Ej. CAEDUC / Universidad" />
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Tipo</label>
                  <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option>Diplomado</option>
                    <option>Webinar</option>
                    <option>Curso</option>
                    <option>Taller</option>
                    <option>Congreso</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label>Fecha</label>
                  <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Horas</label>
                  <input className="input" type="number" min={1} value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
                </div>
                <div>
                  <label>Créditos (auto)</label>
                  <input className="input" value={creditos} readOnly />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Observaciones</label>
                <textarea className="textarea" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>Comprobante (opcional, máx. 10MB)</label>
                  <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <div className="small">Bucket: <span className="mono">comprobantes</span></div>
                </div>
                <div>
                  <label>PDF automático</label>
                  <select className="select" value={autoPdf ? '1' : '0'} onChange={(e) => setAutoPdf(e.target.value === '1')}>
                    <option value="1">Sí, generar al guardar</option>
                    <option value="0">No</option>
                  </select>
                  <div className="small">El PDF incluye QR de referencia y datos del registro.</div>
                </div>
              </div>

              <div style={{ marginTop: 14 }} className="row">
                <button className="btn primary" type="submit">Guardar registro</button>
                <button className="btn" type="button" onClick={exportExcel}>Exportar Excel (vista actual)</button>
              </div>
            </form>
          </div>
        </div>

        {isAdmin ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="hd">
              <div style={{ fontWeight: 800 }}>Controles de admin</div>
              <div className="badge">RLS: admin puede ver todos</div>
            </div>
            <div className="bd">
              <div className="row">
                <div>
                  <label>Vista</label>
                  <select className="select" value={viewAll ? '1' : '0'} onChange={(e) => setViewAll(e.target.value === '1')}>
                    <option value="0">Solo mi usuario (auth.uid())</option>
                    <option value="1">Ver todos (modo admin)</option>
                  </select>
                </div>
                <div>
                  <label>Mostrar eliminados</label>
                  <select className="select" value={showDeleted ? '1' : '0'} onChange={(e) => setShowDeleted(e.target.value === '1')}>
                    <option value="0">No</option>
                    <option value="1">Sí</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Búsqueda (nombre, colegiado o actividad)</label>
                <input className="input" value={q} onChange={(e) => setQ(e.target.value)} disabled={!viewAll} />
                <div className="small">Disponible únicamente en modo “Ver todos”.</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="col-6">
        <div className="card">
          <div className="hd">
            <div>
              <div style={{ fontWeight: 800 }}>Registros</div>
              <div className="small">Mostrando hasta 200 registros.</div>
            </div>
            {loading ? <div className="badge">Cargando…</div> : <div className="badge">Filas: {rows.length}</div>}
          </div>
          <div className="bd">
            {rows.length === 0 ? (
              <div className="small">No hay registros en esta vista.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Corr.</th>
                      <th>Fecha</th>
                      <th>Actividad</th>
                      <th>Horas</th>
                      <th>Créd.</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className="mono">{r.correlativo}</td>
                        <td className="mono">{fmtDate(r.fecha)}</td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{r.actividad}</div>
                          <div className="small">{r.nombre} — {r.colegiado_numero}</div>
                          {r.deleted_at ? <div className="small" style={{ color: 'var(--danger)' }}>Eliminado: {fmtDateTime(r.deleted_at)}</div> : null}
                        </td>
                        <td className="mono">{r.horas}</td>
                        <td className="mono">{r.creditos}</td>
                        <td>
                          <div className="row" style={{ gap: 8 }}>
                            <button className="btn" onClick={() => generarConstanciaPDF(r, null)}>PDF</button>
                            {r.archivo_url ? (
                              <button className="btn" onClick={() => downloadComprobante(r.archivo_url!)}>Comprobante</button>
                            ) : null}
                            <button className="btn danger" onClick={() => onDelete(r)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="bd">
            <div className="small">
              Importante: para que el filtro automático funcione, la tabla <span className="mono">registros</span> debe tener RLS con política <span className="mono">usuario_id = auth.uid()</span>.
              El modo admin se habilita con <span className="mono">perfiles.is_admin = true</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
