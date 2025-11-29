import { eq, and, desc, asc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  agremiados, 
  InsertAgremiado,
  categorias,
  cursos,
  videos,
  webinars,
  evaluaciones,
  preguntas,
  intentosEvaluacion,
  progresoCursos,
  diplomas,
  notificaciones,
  comentarios,
  encuestas,
  insignias,
  agremiadosInsignias,
  Agremiado,
  Curso,
  Categoria,
  Video,
  Webinar,
  Evaluacion,
  Pregunta,
  Diploma,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER FUNCTIONS (Manus OAuth) =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== AGREMIADOS FUNCTIONS =====
export async function getAgremiadoByNumeroColegiado(numeroColegiado: string): Promise<Agremiado | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(agremiados)
    .where(eq(agremiados.numeroColegiado, numeroColegiado))
    .limit(1);

  return result[0];
}

export async function getAgremiadoById(id: number): Promise<Agremiado | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(agremiados)
    .where(eq(agremiados.id, id))
    .limit(1);

  return result[0];
}

export async function getAgremiadoByEmail(email: string): Promise<Agremiado | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(agremiados)
    .where(eq(agremiados.email, email))
    .limit(1);

  return result[0];
}

export async function createAgremiado(data: InsertAgremiado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agremiados).values(data);
  return result;
}

export async function updateAgremiado(id: number, data: Partial<InsertAgremiado>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(agremiados).set(data).where(eq(agremiados.id, id));
}

export async function getAllAgremiados() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(agremiados).orderBy(asc(agremiados.nombreCompleto));
}

export async function bulkInsertAgremiados(data: InsertAgremiado[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.length === 0) return;

  await db.insert(agremiados).values(data);
}

// ===== CATEGORIAS FUNCTIONS =====
export async function getAllCategorias() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(categorias)
    .where(eq(categorias.activo, true))
    .orderBy(asc(categorias.orden));
}

export async function getCategoriaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(categorias)
    .where(eq(categorias.id, id))
    .limit(1);

  return result[0];
}

// ===== CURSOS FUNCTIONS =====
export async function getAllCursos() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cursos)
    .where(eq(cursos.activo, true))
    .orderBy(asc(cursos.orden));
}

export async function getCursosByCategoria(categoriaId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cursos)
    .where(and(eq(cursos.categoriaId, categoriaId), eq(cursos.activo, true)))
    .orderBy(asc(cursos.orden));
}

export async function getCursoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(cursos)
    .where(eq(cursos.id, id))
    .limit(1);

  return result[0];
}

export async function searchCursos(query: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(cursos)
    .where(
      and(
        eq(cursos.activo, true),
        or(
          sql`${cursos.titulo} LIKE ${`%${query}%`}`,
          sql`${cursos.descripcion} LIKE ${`%${query}%`}`
        )
      )
    )
    .orderBy(asc(cursos.orden));
}

export async function createCurso(data: {
  titulo: string;
  descripcion: string;
  categoriaId: number;
  duracionMinutos?: number;
  nivel: "basico" | "intermedio" | "avanzado";
  orden?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cursos).values({
    ...data,
    activo: true,
  });

  // Get the last inserted ID
  const inserted = await db.select().from(cursos).orderBy(desc(cursos.id)).limit(1);
  return inserted[0];
}

export async function updateCurso(id: number, data: Partial<{
  titulo: string;
  descripcion: string;
  categoriaId: number;
  duracionMinutos: number;
  nivel: "basico" | "intermedio" | "avanzado";
  orden: number;
  activo: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cursos)
    .set(data)
    .where(eq(cursos.id, id));
}

export async function deleteCurso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related data first
  await db.delete(videos).where(eq(videos.cursoId, id));
  await db.delete(evaluaciones).where(eq(evaluaciones.cursoId, id));
  await db.delete(progresoCursos).where(eq(progresoCursos.cursoId, id));
  await db.delete(diplomas).where(eq(diplomas.cursoId, id));
  await db.delete(comentarios).where(eq(comentarios.cursoId, id));
  
  // Finally delete the curso
  await db.delete(cursos).where(eq(cursos.id, id));
}

// ===== VIDEOS FUNCTIONS =====
export async function getVideosByCurso(cursoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(videos)
    .where(and(eq(videos.cursoId, cursoId), eq(videos.activo, true)))
    .orderBy(asc(videos.orden));
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);

  return result[0];
}

function extractYouTubeVideoId(url: string): string {
  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // If no pattern matches, assume it's already a video ID
  return url;
}

export async function createVideo(data: {
  cursoId: number;
  titulo: string;
  descripcion?: string;
  youtubeUrl: string;
  duracionMinutos?: number;
  orden?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const youtubeVideoId = extractYouTubeVideoId(data.youtubeUrl);
  const duracionSegundos = data.duracionMinutos ? data.duracionMinutos * 60 : undefined;

  const result = await db.insert(videos).values({
    cursoId: data.cursoId,
    titulo: data.titulo,
    descripcion: data.descripcion,
    youtubeVideoId,
    duracionSegundos,
    orden: data.orden || 0,
    activo: true,
  });

  // Get the last inserted ID
  const inserted = await db.select().from(videos).orderBy(desc(videos.id)).limit(1);
  return inserted[0];
}

export async function updateVideo(id: number, data: Partial<{
  titulo: string;
  descripcion: string;
  youtubeUrl: string;
  duracionMinutos: number;
  orden: number;
  activo: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
  if (data.youtubeUrl !== undefined) updateData.youtubeVideoId = extractYouTubeVideoId(data.youtubeUrl);
  if (data.duracionMinutos !== undefined) updateData.duracionSegundos = data.duracionMinutos * 60;
  if (data.orden !== undefined) updateData.orden = data.orden;
  if (data.activo !== undefined) updateData.activo = data.activo;

  await db.update(videos)
    .set(updateData)
    .where(eq(videos.id, id));
}

export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related progress
  await db.delete(progresoCursos).where(eq(progresoCursos.videoId, id));
  
  // Delete the video
  await db.delete(videos).where(eq(videos.id, id));
}

// ===== WEBINARS FUNCTIONS =====
export async function getWebinarsProximos() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(webinars)
    .where(
      and(
        eq(webinars.activo, true),
        or(
          eq(webinars.estado, "programado"),
          eq(webinars.estado, "en_vivo")
        )
      )
    )
    .orderBy(asc(webinars.fechaInicio));
}

export async function getWebinarsFinalizados() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(webinars)
    .where(and(eq(webinars.activo, true), eq(webinars.estado, "finalizado")))
    .orderBy(desc(webinars.fechaInicio));
}

// ===== EVALUACIONES FUNCTIONS =====
export async function getEvaluacionByCurso(cursoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(evaluaciones)
    .where(and(eq(evaluaciones.cursoId, cursoId), eq(evaluaciones.activo, true)))
    .limit(1);

  return result[0];
}

export async function getPreguntasByEvaluacion(evaluacionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(preguntas)
    .where(and(eq(preguntas.evaluacionId, evaluacionId), eq(preguntas.activo, true)));
}

export async function getIntentosEvaluacion(agremiadoId: number, evaluacionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(intentosEvaluacion)
    .where(
      and(
        eq(intentosEvaluacion.agremiadoId, agremiadoId),
        eq(intentosEvaluacion.evaluacionId, evaluacionId)
      )
    )
    .orderBy(desc(intentosEvaluacion.fechaIntento));
}

export async function createIntentoEvaluacion(data: {
  agremiadoId: number;
  evaluacionId: number;
  numeroIntento: number;
  puntajeObtenido: number;
  aprobado: boolean;
  respuestas: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(intentosEvaluacion).values(data);
}

// ===== PROGRESO CURSOS FUNCTIONS =====
export async function getProgresoCurso(agremiadoId: number, cursoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(progresoCursos)
    .where(
      and(
        eq(progresoCursos.agremiadoId, agremiadoId),
        eq(progresoCursos.cursoId, cursoId)
      )
    )
    .limit(1);

  return result[0];
}

export async function getProgresosByAgremiado(agremiadoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(progresoCursos)
    .where(eq(progresoCursos.agremiadoId, agremiadoId))
    .orderBy(desc(progresoCursos.ultimaVisualizacion));
}

export async function upsertProgresoCurso(data: {
  agremiadoId: number;
  cursoId: number;
  videoId?: number;
  porcentajeCompletado: number;
  completado: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getProgresoCurso(data.agremiadoId, data.cursoId);

  if (existing) {
    await db
      .update(progresoCursos)
      .set({
        videoId: data.videoId,
        porcentajeCompletado: data.porcentajeCompletado,
        completado: data.completado,
        ultimaVisualizacion: new Date(),
      })
      .where(eq(progresoCursos.id, existing.id));
  } else {
    await db.insert(progresoCursos).values({
      agremiadoId: data.agremiadoId,
      cursoId: data.cursoId,
      videoId: data.videoId,
      porcentajeCompletado: data.porcentajeCompletado,
      completado: data.completado,
      ultimaVisualizacion: new Date(),
    });
  }
}

// ===== DIPLOMAS FUNCTIONS =====
export async function getDiplomasByAgremiado(agremiadoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(diplomas)
    .where(eq(diplomas.agremiadoId, agremiadoId))
    .orderBy(desc(diplomas.fechaEmision));
}

export async function getDiplomaByCodigoVerificacion(codigo: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(diplomas)
    .where(eq(diplomas.codigoVerificacion, codigo))
    .limit(1);

  return result[0];
}

export async function createDiploma(data: {
  agremiadoId: number;
  cursoId: number;
  tipo: "participacion" | "aprobacion";
  codigoVerificacion: string;
  codigoQR?: string;
  pdfUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(diplomas).values(data);
}

// ===== NOTIFICACIONES FUNCTIONS =====
export async function getNotificacionesByAgremiado(agremiadoId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificaciones)
    .where(eq(notificaciones.agremiadoId, agremiadoId))
    .orderBy(desc(notificaciones.createdAt))
    .limit(limit);
}

export async function createNotificacion(data: {
  agremiadoId: number;
  tipo: "curso_nuevo" | "webinar" | "diploma" | "evaluacion" | "general";
  titulo: string;
  mensaje: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notificaciones).values(data);
}

export async function marcarNotificacionLeida(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notificaciones).set({ leida: true }).where(eq(notificaciones.id, id));
}

// ===== COMENTARIOS FUNCTIONS =====
export async function getComentariosByCurso(cursoId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(comentarios)
    .where(and(eq(comentarios.cursoId, cursoId), eq(comentarios.activo, true)))
    .orderBy(desc(comentarios.createdAt));
}

export async function createComentario(data: {
  agremiadoId: number;
  cursoId: number;
  comentario: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(comentarios).values(data);
}

// ===== ESTADÍSTICAS =====
export async function getEstadisticasGenerales() {
  const db = await getDb();
  if (!db) return null;

  const [totalAgremiados] = await db.select({ count: sql<number>`count(*)` }).from(agremiados);
  const [totalCursos] = await db.select({ count: sql<number>`count(*)` }).from(cursos).where(eq(cursos.activo, true));
  const [totalDiplomas] = await db.select({ count: sql<number>`count(*)` }).from(diplomas);

  return {
    totalAgremiados: totalAgremiados.count,
    totalCursos: totalCursos.count,
    totalDiplomas: totalDiplomas.count,
  };
}

export async function getCursosPopulares(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      cursoId: progresoCursos.cursoId,
      titulo: cursos.titulo,
      totalEstudiantes: sql<number>`count(distinct ${progresoCursos.agremiadoId})`,
    })
    .from(progresoCursos)
    .innerJoin(cursos, eq(progresoCursos.cursoId, cursos.id))
    .groupBy(progresoCursos.cursoId, cursos.titulo)
    .orderBy(desc(sql`count(distinct ${progresoCursos.agremiadoId})`))
    .limit(limit);
}
