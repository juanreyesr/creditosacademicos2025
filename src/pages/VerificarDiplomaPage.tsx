import React, { useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import type { DiplomaPublico } from '../types'
import { fmtDate } from '../lib/format'

export default function VerificarDiplomaPage() {
  const [, params] = useRoute('/verificar-diploma/:codigo')
  const codigo = (params?.codigo ?? '').trim()
  const { push } = useToast()

  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState<DiplomaPublico | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setNotFound(false)
      try {
        const { data, error } = await supabase.rpc('verificar_diploma', { p_codigo: codigo })

        if (error) throw error
        if (!mounted) return
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setNotFound(true)
          setRow(null)
          return
        }
        setRow((Array.isArray(data) ? data[0] : data) as any)
      } catch (e: any) {
        push({ kind: 'error', title: 'Error verificando diploma', description: e?.message ?? 'Error.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (codigo) load()
    return () => {
      mounted = false
    }
  }, [codigo, push])

  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">Verificación de diploma</h1>
          <p className="p">Consulta pública por código.</p>
        </div>
        <div className="badge mono">{codigo || '—'}</div>
      </div>
      <div className="bd">
        {loading ? (
          <div className="small">Cargando…</div>
        ) : notFound ? (
          <div>
            <div className="badge" style={{ borderColor: 'rgba(255,92,92,.55)' }}>
              No encontrado
            </div>
            <div className="small" style={{ marginTop: 10 }}>
              El código no existe o el diploma aún no ha sido publicado para verificación.
            </div>
          </div>
        ) : row ? (
          <div className="grid">
            <div className="col-8">
              <div className="card">
                <div className="bd">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{row.curso_titulo}</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    Emitido el: <span className="mono">{fmtDate(row.emitido_en)}</span>
                  </div>
                  <div className="hr" />
                  <div className="small">
                    Nombre: <span className="mono">{row.nombre ?? '—'}</span>
                  </div>
                  <div className="small">
                    Colegiado: <span className="mono">{row.colegiado_numero ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="card">
                <div className="bd">
                  <div className="badge" style={{ borderColor: 'rgba(57,217,138,.5)', color: 'var(--ok)' }}>
                    Válido
                  </div>
                  <div className="small" style={{ marginTop: 10 }}>
                    Firma: <span className="mono">{row.firma ?? '—'}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <Link href="/" className="btn">
                      Ir al inicio
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
