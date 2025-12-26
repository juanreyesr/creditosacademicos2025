import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import type { Curso } from '../types'
import { fmtDate } from '../lib/format'

type Row = { curso: Curso; created_at: string }

export default function MisCursosPage() {
  const { user } = useSession()
  const { push } = useToast()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('inscripciones')
          .select('created_at, curso:cursos(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        const mapped = (data ?? [])
          .filter((x: any) => x.curso)
          .map((x: any) => ({ created_at: x.created_at, curso: x.curso as Curso }))
        if (!mounted) return
        setRows(mapped)
      } catch (e: any) {
        push({ kind: 'error', title: 'No se pudieron cargar tus cursos', description: e?.message ?? 'Error.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user, push])

  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">Mis cursos</h1>
          <p className="p">Cursos en los que estás inscrito.</p>
        </div>
        {loading ? <div className="badge">Cargando…</div> : null}
      </div>
      <div className="bd">
        {!loading && rows.length === 0 ? (
          <div className="small">
            Aún no estás inscrito en ningún curso. Ve a <Link href="/cursos" className="pill">Cursos</Link>.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Horas</th>
                <th>Inscrito en</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.curso.id}>
                  <td style={{ fontWeight: 800 }}>{r.curso.titulo}</td>
                  <td>{r.curso.horas ?? '—'}</td>
                  <td className="mono">{fmtDate(r.created_at)}</td>
                  <td>
                    <Link href={`/curso/${r.curso.id}`} className="btn">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
