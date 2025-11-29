import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended for Colegio de Psicólogos with custom fields
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Agremiados - Miembros del Colegio de Psicólogos
 * Tabla personalizada para autenticación con número de colegiado
 */
export const agremiados = mysqlTable("agremiados", {
  id: int("id").autoincrement().primaryKey(),
  numeroColegiado: varchar("numeroColegiado", { length: 50 }).notNull().unique(),
  nombreCompleto: varchar("nombreCompleto", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  primerIngreso: boolean("primerIngreso").default(true).notNull(),
  activo: boolean("activo").default(true).notNull(),
  role: mysqlEnum("role", ["agremiado", "administrador", "superadministrador"]).default("agremiado").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  numeroColgiadoIdx: index("numero_colegiado_idx").on(table.numeroColegiado),
}));

/**
 * Categorías de cursos (áreas temáticas)
 */
export const categorias = mysqlTable("categorias", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  orden: int("orden").default(0).notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Cursos disponibles en la plataforma
 */
export const cursos = mysqlTable("cursos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  categoriaId: int("categoriaId").notNull(),
  imagenUrl: varchar("imagenUrl", { length: 500 }),
  duracionMinutos: int("duracionMinutos"),
  nivel: mysqlEnum("nivel", ["basico", "intermedio", "avanzado"]).default("basico"),
  activo: boolean("activo").default(true).notNull(),
  orden: int("orden").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoriaIdx: index("categoria_idx").on(table.categoriaId),
}));

/**
 * Videos de cursos (integración con YouTube)
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  cursoId: int("cursoId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  youtubeVideoId: varchar("youtubeVideoId", { length: 100 }).notNull(),
  duracionSegundos: int("duracionSegundos"),
  orden: int("orden").default(0).notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cursoIdx: index("curso_idx").on(table.cursoId),
}));

/**
 * Webinars en vivo y grabados
 */
export const webinars = mysqlTable("webinars", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  categoriaId: int("categoriaId"),
  fechaInicio: timestamp("fechaInicio").notNull(),
  fechaFin: timestamp("fechaFin"),
  youtubeVideoId: varchar("youtubeVideoId", { length: 100 }),
  youtubeLiveId: varchar("youtubeLiveId", { length: 100 }),
  estado: mysqlEnum("estado", ["programado", "en_vivo", "finalizado", "cancelado"]).default("programado").notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoriaIdx: index("categoria_idx").on(table.categoriaId),
  estadoIdx: index("estado_idx").on(table.estado),
}));

/**
 * Evaluaciones de cursos
 */
export const evaluaciones = mysqlTable("evaluaciones", {
  id: int("id").autoincrement().primaryKey(),
  cursoId: int("cursoId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  puntajeMinimo: int("puntajeMinimo").default(70).notNull(),
  intentosMaximos: int("intentosMaximos").default(3).notNull(),
  tiempoEsperaHoras: int("tiempoEsperaHoras").default(24).notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cursoIdx: index("curso_idx").on(table.cursoId),
}));

/**
 * Preguntas de evaluaciones
 */
export const preguntas = mysqlTable("preguntas", {
  id: int("id").autoincrement().primaryKey(),
  evaluacionId: int("evaluacionId").notNull(),
  textoPregunta: text("textoPregunta").notNull(),
  opcionA: text("opcionA").notNull(),
  opcionB: text("opcionB").notNull(),
  opcionC: text("opcionC").notNull(),
  opcionD: text("opcionD").notNull(),
  respuestaCorrecta: mysqlEnum("respuestaCorrecta", ["A", "B", "C", "D"]).notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  evaluacionIdx: index("evaluacion_idx").on(table.evaluacionId),
}));

/**
 * Intentos de evaluación de agremiados
 */
export const intentosEvaluacion = mysqlTable("intentosEvaluacion", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  evaluacionId: int("evaluacionId").notNull(),
  numeroIntento: int("numeroIntento").notNull(),
  puntajeObtenido: int("puntajeObtenido").notNull(),
  aprobado: boolean("aprobado").notNull(),
  respuestas: text("respuestas").notNull(), // JSON con respuestas
  fechaIntento: timestamp("fechaIntento").defaultNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  evaluacionIdx: index("evaluacion_idx").on(table.evaluacionId),
}));

/**
 * Progreso de cursos de agremiados
 */
export const progresoCursos = mysqlTable("progresoCursos", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  cursoId: int("cursoId").notNull(),
  videoId: int("videoId"),
  porcentajeCompletado: int("porcentajeCompletado").default(0).notNull(),
  completado: boolean("completado").default(false).notNull(),
  ultimaVisualizacion: timestamp("ultimaVisualizacion").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  cursoIdx: index("curso_idx").on(table.cursoId),
  uniqueAgremiadoCurso: unique("unique_agremiado_curso").on(table.agremiadoId, table.cursoId),
}));

/**
 * Diplomas y certificados generados
 */
export const diplomas = mysqlTable("diplomas", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  cursoId: int("cursoId").notNull(),
  tipo: mysqlEnum("tipo", ["participacion", "aprobacion"]).notNull(),
  codigoVerificacion: varchar("codigoVerificacion", { length: 100 }).notNull().unique(),
  codigoQR: text("codigoQR"), // Base64 del QR
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  fechaEmision: timestamp("fechaEmision").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  cursoIdx: index("curso_idx").on(table.cursoId),
  codigoIdx: index("codigo_idx").on(table.codigoVerificacion),
}));

/**
 * Notificaciones para agremiados
 */
export const notificaciones = mysqlTable("notificaciones", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  tipo: mysqlEnum("tipo", ["curso_nuevo", "webinar", "diploma", "evaluacion", "general"]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensaje: text("mensaje").notNull(),
  leida: boolean("leida").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  leidaIdx: index("leida_idx").on(table.leida),
}));

/**
 * Comentarios en cursos
 */
export const comentarios = mysqlTable("comentarios", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  cursoId: int("cursoId").notNull(),
  comentario: text("comentario").notNull(),
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  cursoIdx: index("curso_idx").on(table.cursoId),
}));

/**
 * Encuestas de satisfacción
 */
export const encuestas = mysqlTable("encuestas", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  cursoId: int("cursoId").notNull(),
  calidadContenido: int("calidadContenido").notNull(), // 1-5
  claridadInstructor: int("claridadInstructor").notNull(), // 1-5
  relevancia: int("relevancia").notNull(), // 1-5
  comentarios: text("comentarios"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  cursoIdx: index("curso_idx").on(table.cursoId),
}));

/**
 * Insignias y logros (gamificación)
 */
export const insignias = mysqlTable("insignias", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  iconoUrl: varchar("iconoUrl", { length: 500 }),
  criterio: text("criterio").notNull(), // JSON con criterios
  activo: boolean("activo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Insignias obtenidas por agremiados
 */
export const agremiadosInsignias = mysqlTable("agremiadosInsignias", {
  id: int("id").autoincrement().primaryKey(),
  agremiadoId: int("agremiadoId").notNull(),
  insigniaId: int("insigniaId").notNull(),
  fechaObtencion: timestamp("fechaObtencion").defaultNow().notNull(),
}, (table) => ({
  agremiadoIdx: index("agremiado_idx").on(table.agremiadoId),
  insigniaIdx: index("insignia_idx").on(table.insigniaId),
}));

// Relations
export const agremiadosRelations = relations(agremiados, ({ many }) => ({
  progresoCursos: many(progresoCursos),
  intentosEvaluacion: many(intentosEvaluacion),
  diplomas: many(diplomas),
  notificaciones: many(notificaciones),
  comentarios: many(comentarios),
  encuestas: many(encuestas),
  insignias: many(agremiadosInsignias),
}));

export const cursosRelations = relations(cursos, ({ one, many }) => ({
  categoria: one(categorias, {
    fields: [cursos.categoriaId],
    references: [categorias.id],
  }),
  videos: many(videos),
  evaluaciones: many(evaluaciones),
  progresoCursos: many(progresoCursos),
  diplomas: many(diplomas),
  comentarios: many(comentarios),
  encuestas: many(encuestas),
}));

export const evaluacionesRelations = relations(evaluaciones, ({ one, many }) => ({
  curso: one(cursos, {
    fields: [evaluaciones.cursoId],
    references: [cursos.id],
  }),
  preguntas: many(preguntas),
  intentos: many(intentosEvaluacion),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Agremiado = typeof agremiados.$inferSelect;
export type InsertAgremiado = typeof agremiados.$inferInsert;

export type Categoria = typeof categorias.$inferSelect;
export type InsertCategoria = typeof categorias.$inferInsert;

export type Curso = typeof cursos.$inferSelect;
export type InsertCurso = typeof cursos.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

export type Webinar = typeof webinars.$inferSelect;
export type InsertWebinar = typeof webinars.$inferInsert;

export type Evaluacion = typeof evaluaciones.$inferSelect;
export type InsertEvaluacion = typeof evaluaciones.$inferInsert;

export type Pregunta = typeof preguntas.$inferSelect;
export type InsertPregunta = typeof preguntas.$inferInsert;

export type IntentoEvaluacion = typeof intentosEvaluacion.$inferSelect;
export type InsertIntentoEvaluacion = typeof intentosEvaluacion.$inferInsert;

export type ProgresoCurso = typeof progresoCursos.$inferSelect;
export type InsertProgresoCurso = typeof progresoCursos.$inferInsert;

export type Diploma = typeof diplomas.$inferSelect;
export type InsertDiploma = typeof diplomas.$inferInsert;

export type Notificacion = typeof notificaciones.$inferSelect;
export type InsertNotificacion = typeof notificaciones.$inferInsert;

export type Comentario = typeof comentarios.$inferSelect;
export type InsertComentario = typeof comentarios.$inferInsert;

export type Encuesta = typeof encuestas.$inferSelect;
export type InsertEncuesta = typeof encuestas.$inferInsert;

export type Insignia = typeof insignias.$inferSelect;
export type InsertInsignia = typeof insignias.$inferInsert;

export type AgremiadoInsignia = typeof agremiadosInsignias.$inferSelect;
export type InsertAgremiadoInsignia = typeof agremiadosInsignias.$inferInsert;
