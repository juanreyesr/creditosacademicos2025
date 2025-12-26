import React, { useEffect, useMemo, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/auth'
import { useToast } from '../components/Toast'
import type { Curso, Leccion } from '../types'
import { fmtDateTime } from '../lib/format'

type Progreso = { leccion_id: string; completado: boolean; updated_at: string }

export default function CursoDetallePage() {
  const [, params] = useRoute('/curso/:id')
  const cursoId = params?.id ?? ''
  const { user } = useSession()
  const { push } = useToast()

  const [loading, setLoading] = useState(true)
  const [curso, setCurso] = useState<Curso | null>(null)
  const [lecciones, setLecciones] = useState<Leccion[]>([])
  const [prog, setProg] = useState<Map<string, Progreso>>(new Map())
  const [inscrito, setInscrito] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!user || !cursoId) return
      setLoading(true)
      try {
        const [c, l, p, ins] = await Promise.all([
          supabase.from('cursos').select('*').eq('id', cursoId).maybeSingle(),
          supabase.from('lecciones').select('*').eq('curso_id', cursoId).order('orden', { ascending: true }),
          supabase.from('progreso_lecciones').select('leccion_id, completado, updated_at').eq('user_id', user.id),
          supabase.from('inscripciones').select('id').eq('user_id', user.id).eq('curso_id', cursoId).maybeSingle(),
        ])
        if (c.error) throw c.error
        if (l.error) throw l.error
        if (p.error) throw p.error
        if (ins.error) throw ins.error

        if (!mounted) return
        setCurso(c.data as any)
        setLecciones((l.data ?? []) as any)
        setInscrito(!!ins.data?.id)

        const map = new Map<string, Progreso>()
        for (const row of p.data ?? []) map.set((row as any).leccion_id, row as any)
        setProg(map)
      } catch (e: any) {
        push({ kind: 'error', title: 'No se pudo cargar el curso', description: e?.message ?? 'Error.' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [user, cursoId, push])

  const completion = useMemo(() => {
    const total = lecciones.length
    if (!total) return 0
    let done = 0
    for (const lec of lecciones) {
      if (prog.get(lec.id)?.completado) done++
    }
    return Math.round((done / total) * 100)
  }, [lecciones, prog])

  async function toggleLesson(lec: Leccion) {
    if (!user) return
    const current = prog.get(lec.id)?.completado ?? false
    try {
      const payload = { user_id: user.id, leccion_id: lec.id, completado: !current }
      const { error } = await supabase.from('progreso_lecciones').upsert(payload, { onConflict: 'user_id,leccion_id' })
      if (error) throw error
      setProg((m) => {
        const n = new Map(m)
        n.set(lec.id, { leccion_id: lec.id, completado: !current, updated_at: new Date().toISOString() })
        return n
      })
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo actualizar progreso', description: e?.message ?? 'Error.' })
    }
  }

  async function toggleEnroll() {
    if (!user || !cursoId) return
    try {
      if (inscrito) {
        const { error } = await supabase.from('inscripciones').delete().eq('user_id', user.id).eq('curso_id', cursoId)
        if (error) throw error
        setInscrito(false)
      } else {
        const { error } = await supabase.from('inscripciones').insert({ user_id: user.id, curso_id: cursoId })
        if (error) throw error
        setInscrito(true)
      }
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo actualizar inscripción', description: e?.message ?? 'Error.' })
    }
  }

  async function emitirDiploma() {
    if (!user || !cursoId) return
    try {
      if (completion < 100) {
        push({ kind: 'error', title: 'Curso no completado', description: 'Completa todas las lecciones para emitir el diploma.' })
        return
      }
      // Insert diploma if not exists
      const { data: existing, error: exErr } = await supabase
        .from('diplomas')
        .select('id')
        .eq('user_id', user.id)
        .eq('curso_id', cursoId)
        .maybeSingle()
      if (exErr) throw exErr
      if (existing?.id) {
        push({ kind: 'ok', title: 'Ya existe un diploma', description: 'Revisa la sección Diplomas.' })
        return
      }

      const codigo = crypto.randomUUID().split('-')[0].toUpperCase() + '-' + Date.now().toString().slice(-6)
      const { error } = await supabase.from('diplomas').insert({ user_id: user.id, curso_id: cursoId, codigo })
      if (error) throw error
      push({ kind: 'ok', title: 'Diploma creado', description: 'Ve a la sección Diplomas para descargarlo.' })
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo emitir el diploma', description: e?.message ?? 'Error.' })
    }
  }

  return (
    <div className="card">
      <div className="hd">
        <div>
          <h1 className="h1">{curso?.titulo ?? (loading ? 'Cargando…' : 'Curso')}</h1>
          <p className="p">{curso?.descripcion ?? '—'}</p>
          <div className="small">Progreso: <span className="mono">{completion}%</span></div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary" onClick={toggleEnroll}>{inscrito ? 'Quitar inscripción' : 'Inscribirme'}</button>
          <button className="btn" onClick={emitirDiploma} disabled={completion < 100}>Emitir diploma</button>
        </div>
      </div>
      <div className="bd">
        {lecciones.length === 0 ? (
          <div className="small">Este curso aún no tiene lecciones publicadas.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lección</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {lecciones.map((lec, idx) => {
                const done = prog.get(lec.id)?.completado ?? false
                const updated = prog.get(lec.id)?.updated_at ?? null
                return (
                  <tr key={lec.id}>
                    <td className="mono">{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{lec.titulo}</div>
                      <div className="small">{lec.contenido ? lec.contenido.slice(0, 130) + (lec.contenido.length > 130 ? '…' : '') : '—'}</div>
                    </td>
                    <td>
                      {done ? <span className="badge" style={{ color: 'var(--ok)' }}>Completada</span> : <span className="badge">Pendiente</span>}
                      <div className="small">{updated ? fmtDateTime(updated) : ''}</div>
                    </td>
                    <td>
                      <button className="btn" onClick={() => toggleLesson(lec)}>
                        {done ? 'Marcar pendiente' : 'Marcar completada'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="hr" />
        <div className="small">
          Si tu institución requiere evaluación formal, este módulo está preparado para activar el flujo de evaluaciones en una iteración posterior.
        </div>
        <div style={{ marginTop: 10 }}>
          <Link href="/cursos" className="btn">Volver a cursos</Link>
        </div>
      </div>
    </div>
  )
}
