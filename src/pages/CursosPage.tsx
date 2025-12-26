import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import type { Curso, Inscripcion } from '../types'

export default function CursosPage() {
  const { user } = useSession()
  const { push } = useToast()
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [inscritos, setInscritos] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        const [{ data: cursosData, error: cErr }, { data: insData, error: iErr }] = await Promise.all([
          supabase.from('cursos').select('*').eq('activo', true).order('created_at', { ascending: false }),
          supabase.from('inscripciones').select('curso_id').eq('user_id', user.id),
        ])
        if (cErr) throw cErr
        if (iErr) throw iErr
        if (!mounted) return
        setCursos((cursosData ?? []) as Curso[])
        setInscritos(new Set((insData ?? []).map((x: any) => x.curso_id)))
      } catch (e: any) {
        push({ kind: 'error', title: 'No se pudieron cargar los cursos', description: e?.message ?? 'Error.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user, push])

  async function toggleEnroll(cursoId: string) {
    if (!user) return
    const already = inscritos.has(cursoId)
    try {
      if (already) {
        const { error } = await supabase
          .from('inscripciones')
          .delete()
          .eq('user_id', user.id)
          .eq('curso_id', cursoId)
        if (error) throw error
        setInscritos((s) => {
          const n = new Set([...s])
          n.delete(cursoId)
          return n
        })
        push({ kind: 'ok', title: 'Inscripción eliminada' })
      } else {
        const { error } = await supabase.from('inscripciones').insert({ user_id: user.id, curso_id: cursoId })
        if (error) throw error
        setInscritos((s) => new Set([...s, cursoId]))
        push({ kind: 'ok', title: 'Inscripción realizada' })
      }
    } catch (e: any) {
      push({ kind: 'error', title: 'Error actualizando inscripción', description: e?.message ?? 'Error.' })
    }
  }

  const empty = !loading && cursos.length === 0

  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">Cursos</h1>
          <p className="p">Explora cursos disponibles y gestiona tu inscripción.</p>
        </div>
        {loading ? <div className="badge">Cargando…</div> : null}
      </div>
      <div className="bd">
        {empty ? (
          <div className="small">No hay cursos publicados todavía.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Descripción</th>
                <th>Horas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((c) => {
                const isIn = inscritos.has(c.id)
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 800 }}>
                      <Link href={`/curso/${c.id}`}>{c.titulo}</Link>
                    </td>
                    <td className="small">{c.descripcion ?? '—'}</td>
                    <td>{c.horas ?? '—'}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn primary" onClick={() => toggleEnroll(c.id)}>
                          {isIn ? 'Quitar' : 'Inscribirme'}
                        </button>
                        <Link className="btn" href={`/curso/${c.id}`}>
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
