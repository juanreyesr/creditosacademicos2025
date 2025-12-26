export type Perfil = {
  user_id: string
  is_admin: boolean
}

export type Curso = {
  id: string
  titulo: string
  descripcion: string | null
  horas: number | null
  creditos: number | null
  activo: boolean
  created_at: string
}

export type Leccion = {
  id: string
  curso_id: string
  titulo: string
  contenido: string | null
  orden: number
  created_at: string
}

export type Inscripcion = {
  id: string
  user_id: string
  curso_id: string
  created_at: string
}

export type DiplomaPublico = {
  codigo: string
  emitido_en: string
  curso_titulo: string
  nombre: string | null
  colegiado_numero: string | null
  firma: string | null
}

export type RegistroCredito = {
  id: string
  usuario_id: string
  correlativo: number
  nombre: string
  telefono: string | null
  colegiado_numero: string
  colegiado_activo: boolean
  actividad: string
  institucion: string | null
  tipo: string
  fecha: string
  horas: number
  creditos: number
  observaciones: string | null
  archivo_url: string | null
  archivo_mime: string | null
  hash: string | null
  deleted_at: string | null
  created_at: string
}
