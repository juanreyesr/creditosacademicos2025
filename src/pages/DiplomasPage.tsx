import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import { fmtDate, safeText } from '../lib/format'
import type { Curso } from '../types'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

type DiplomaRow = {
  id: string
  user_id: string
  curso_id: string
  codigo: string
  emitido_en: string
  firma: string | null
  curso?: Curso
}

export default function DiplomasPage() {
  const { user, session } = useSession()
  const { push } = useToast()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<DiplomaRow[]>([])
  const [perfil, setPerfil] = useState<{ nombre?: string; colegiado?: string } | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const [d, p] = await Promise.all([
          supabase
            .from('diplomas')
            .select('id,user_id,curso_id,codigo,emitido_en,firma, curso:cursos(*)')
            .eq('user_id', user.id)
            .order('emitido_en', { ascending: false }),
          supabase
            .from('registros')
            .select('nombre, colegiado_numero')
            .eq('usuario_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])
        if (d.error) throw d.error
        if (p.error) throw p.error

        if (!mounted) return
        setRows((d.data ?? []) as any)
        if (p.data) setPerfil({ nombre: p.data.nombre, colegiado: p.data.colegiado_numero })
      } catch (e: any) {
        push({ kind: 'error', title: 'No se pudieron cargar diplomas', description: e?.message ?? 'Error.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user, push])

  async function ensureFirma(diploma: DiplomaRow) {
    if (diploma.firma) return diploma.firma
    if (!session?.access_token) throw new Error('No hay sesión válida (token).')

    const res = await fetch('/api/diplomas-sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ diploma_id: diploma.id }),
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(txt || 'No se pudo firmar.')
    }
    const json = await res.json()
    const firma = json?.firma as string | undefined
    if (!firma) throw new Error('Firma no recibida.')
    // Refresh local row
    setRows((prev) => prev.map((r) => (r.id === diploma.id ? { ...r, firma } : r)))
    return firma
  }

  async function downloadPDF(diploma: DiplomaRow) {
    try {
      const firma = await ensureFirma(diploma)
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pad = 48
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Diploma', pad, 70)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Se certifica que:', pad, 105)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(safeText(perfil?.nombre ?? user?.email), pad, 132)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Colegiado No.: ${safeText(perfil?.colegiado)}`, pad, 155)

      doc.setFont('helvetica', 'normal')
      doc.text(`Ha completado el curso: ${safeText(diploma.curso?.titulo)}`, pad, 190, { maxWidth: 470 })

      doc.setFont('helvetica', 'normal')
      doc.text(`Fecha de emisión: ${fmtDate(diploma.emitido_en)}`, pad, 220)

      doc.setFont('helvetica', 'bold')
      doc.text(`Código: ${diploma.codigo}`, pad, 252)

      // QR a verificación
      const url = `${window.location.origin}/verificar-diploma/${encodeURIComponent(diploma.codigo)}`
      const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 })
      doc.addImage(qrDataUrl, 'PNG', 330, 280, 220, 220)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Verificación:', 330, 520)
      doc.setTextColor(77, 163, 255)
      doc.text(url, 330, 535, { maxWidth: 240 })
      doc.setTextColor(0, 0, 0)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Firma: ${firma}`, pad, 690, { maxWidth: 500 })

      doc.save(`Diploma_${diploma.codigo}.pdf`)
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo generar el PDF', description: e?.message ?? 'Error.' })
    }
  }

  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">Diplomas</h1>
          <p className="p">Descarga y verifica diplomas emitidos por cursos completados.</p>
        </div>
        {loading ? <div className="badge">Cargando…</div> : null}
      </div>
      <div className="bd">
        {!loading && rows.length === 0 ? (
          <div className="small">Aún no tienes diplomas emitidos.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Código</th>
                <th>Emisión</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 800 }}>{d.curso?.titulo ?? '—'}</td>
                  <td className="mono">{d.codigo}</td>
                  <td className="mono">{fmtDate(d.emitido_en)}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn primary" onClick={() => downloadPDF(d)}>
                        Descargar PDF
                      </button>
                      <Link className="btn" href={`/verificar-diploma/${encodeURIComponent(d.codigo)}`}>
                        Verificar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="hr" />
        <div className="small">
          La verificación pública funciona incluso sin sesión, siempre que esté configurada la función RPC <span className="mono">verificar_diploma</span>.
        </div>
      </div>
    </div>
  )
}
