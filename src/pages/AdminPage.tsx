import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import type { Curso } from '../types'
import { calcCreditos, fmtDate } from '../lib/format'

export default function AdminPage() {
  const { push } = useToast()
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [horas, setHoras] = useState<number>(16)

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('cursos').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setCursos((data ?? []) as any)
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudieron cargar cursos', description: e?.message ?? 'Error.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createCurso() {
    try {
      if (!titulo.trim()) {
        push({ kind: 'error', title: 'Título requerido' })
        return
      }
      const h = Number(horas)
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        horas: Number.isFinite(h) ? h : null,
        creditos: Number.isFinite(h) ? calcCreditos(h) : null,
        activo: true,
      }
      const { error } = await supabase.from('cursos').insert(payload)
      if (error) throw error
      setTitulo('')
      setDescripcion('')
      setHoras(16)
      push({ kind: 'ok', title: 'Curso creado' })
      await load()
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo crear curso', description: e?.message ?? 'Error.' })
    }
  }

  async function toggleActivo(c: Curso) {
    try {
      const { error } = await supabase.from('cursos').update({ activo: !c.activo }).eq('id', c.id)
      if (error) throw error
      await load()
    } catch (e: any) {
      push({ kind: 'error', title: 'No se pudo actualizar', description: e?.message ?? 'Error.' })
    }
  }

  return (
    <div className="grid">
      <div className="col-6">
        <div className="card">
          <div className="hd">
            <div>
              <h1 className="h1">Admin</h1>
              <p className="p">Gestión mínima para cursos (MVP).</p>
            </div>
            {loading ? <div className="badge">Cargando…</div> : null}
          </div>
          <div className="bd">
            <div className="row">
              <div>
                <label>Título</label>
                <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label>Horas</label>
                <input className="input" type="number" min={1} value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Descripción</label>
              <textarea className="textarea" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={createCurso}>Crear curso</button>
            </div>

            <div className="hr" />

            <div className="small">
              La gestión avanzada (lecciones, evaluaciones, videos) se implementa en iteraciones siguientes, pero la estructura de tablas ya está prevista en <span className="mono">supabase/schema.sql</span>.
            </div>
          </div>
        </div>
      </div>

      <div className="col-6">
        <div className="card">
          <div className="hd">
            <div>
              <div style={{ fontWeight: 800 }}>Cursos existentes</div>
              <div className="small">Activa/desactiva publicación.</div>
            </div>
            <Link href="/creditos" className="btn">Ir a Créditos</Link>
          </div>
          <div className="bd">
            {cursos.length === 0 ? (
              <div className="small">No hay cursos todavía.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Creado</th>
                    <th>Activo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 800 }}>{c.titulo}</td>
                      <td className="mono">{fmtDate(c.created_at)}</td>
                      <td>{c.activo ? <span className="badge" style={{ color: 'var(--ok)' }}>Sí</span> : <span className="badge">No</span>}</td>
                      <td><button className="btn" onClick={() => toggleActivo(c)}>{c.activo ? 'Desactivar' : 'Activar'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
