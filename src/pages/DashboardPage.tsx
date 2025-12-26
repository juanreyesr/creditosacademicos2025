import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import { calcCreditos, fmtDateTime } from '../lib/format'

export default function DashboardPage() {
  const { user } = useSession()
  const { push } = useToast()

  const [loading, setLoading] = useState(true)
  const [enrolled, setEnrolled] = useState(0)
  const [diplomas, setDiplomas] = useState(0)
  const [creditos, setCreditos] = useState(0)
  const [lastCreditAt, setLastCreditAt] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!user) return
      setLoading(true)

      try {
        const [ins, dip, regs] = await Promise.all([
          supabase.from('inscripciones').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('diplomas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('registros').select('creditos, created_at').eq('usuario_id', user.id).is('deleted_at', null),
        ])

        if (ins.error) throw ins.error
        if (dip.error) throw dip.error
        if (regs.error) throw regs.error

        if (!mounted) return
        setEnrolled(ins.count ?? 0)
        setDiplomas(dip.count ?? 0)

        const rows = regs.data ?? []
        const total = rows.reduce((acc, r) => acc + (Number(r.creditos) || 0), 0)
        setCreditos(Math.round(total * 100) / 100)

        const last = rows
          .map((r) => r.created_at)
          .filter(Boolean)
          .sort((a, b) => (a > b ? -1 : 1))[0]
        setLastCreditAt(last ?? null)
      } catch (e: any) {
        push({ kind: 'error', title: 'Error cargando dashboard', description: e?.message ?? 'Revisa conexión a Supabase.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [user, push])

  const info = useMemo(() => {
    return [
      { n: enrolled, l: 'Cursos inscritos' },
      { n: diplomas, l: 'Diplomas emitidos' },
      { n: creditos, l: 'Créditos acumulados' },
    ]
  }, [enrolled, diplomas, creditos])

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <div className="hd">
            <div>
              <h1 className="h1">Dashboard</h1>
              <p className="p">Resumen rápido de tu actividad.</p>
            </div>
            {loading ? <div className="badge">Cargando…</div> : null}
          </div>
          <div className="bd">
            <div className="grid">
              {info.map((k) => (
                <div key={k.l} className="col-4">
                  <div className="card">
                    <div className="bd">
                      <div className="kpi">
                        <div className="n">{k.n}</div>
                        <div className="l">{k.l}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hr" />

            <div className="small">
              Último registro de créditos: <span className="mono">{lastCreditAt ? fmtDateTime(lastCreditAt) : '—'}</span>
            </div>
            <div className="small">
              Nota: 1 crédito = 16 horas. Si registras horas, el sistema calcula créditos automáticamente.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
