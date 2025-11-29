import { getDb } from "./server/db";
import { agremiados, categorias, cursos, videos, evaluaciones, preguntas } from "./drizzle/schema";
import { hashPassword } from "./server/auth";

async function seed() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("🌱 Seeding database...");

  // Create test agremiado
  const passwordHash = await hashPassword("password123");
  await db.insert(agremiados).values([
    {
      numeroColegiado: "12345",
      nombreCompleto: "María Elena García López",
      email: "maria.garcia@example.com",
      passwordHash,
      primerIngreso: false,
      activo: true,
      role: "agremiado",
    },
    {
      numeroColegiado: "admin",
      nombreCompleto: "Administrador Sistema",
      email: "admin@colegiodepsicologos.org.gt",
      passwordHash,
      primerIngreso: false,
      activo: true,
      role: "superadministrador",
    },
  ]);

  // Create categories
  const categoriasData = await db.insert(categorias).values([
    { nombre: "Psicología Clínica", descripcion: "Cursos sobre evaluación, diagnóstico y tratamiento de trastornos mentales", orden: 1, activo: true },
    { nombre: "Psicología Educativa", descripcion: "Capacitaciones sobre procesos de aprendizaje y desarrollo educativo", orden: 2, activo: true },
    { nombre: "Psicología Organizacional", descripcion: "Formación en gestión del talento humano y clima laboral", orden: 3, activo: true },
    { nombre: "Neuropsicología", descripcion: "Estudios sobre la relación entre el cerebro y la conducta", orden: 4, activo: true },
    { nombre: "Psicología Social", descripcion: "Análisis de la interacción entre individuos y grupos sociales", orden: 5, activo: true },
  ]);

  // Create courses
  await db.insert(cursos).values([
    {
      titulo: "Introducción a la Terapia Cognitivo-Conductual",
      descripcion: "Fundamentos teóricos y prácticos de la TCC para el tratamiento de trastornos de ansiedad y depresión",
      categoriaId: 1,
      duracionMinutos: 240,
      nivel: "basico",
      activo: true,
      orden: 1,
    },
    {
      titulo: "Evaluación Neuropsicológica Infantil",
      descripcion: "Técnicas y herramientas para la evaluación neuropsicológica en población pediátrica",
      categoriaId: 4,
      duracionMinutos: 180,
      nivel: "intermedio",
      activo: true,
      orden: 1,
    },
    {
      titulo: "Gestión del Estrés Laboral",
      descripcion: "Estrategias para identificar y manejar el estrés en ambientes organizacionales",
      categoriaId: 3,
      duracionMinutos: 120,
      nivel: "basico",
      activo: true,
      orden: 1,
    },
    {
      titulo: "Dificultades de Aprendizaje",
      descripcion: "Identificación y abordaje de dificultades específicas del aprendizaje en el aula",
      categoriaId: 2,
      duracionMinutos: 200,
      nivel: "intermedio",
      activo: true,
      orden: 1,
    },
    {
      titulo: "Psicología Comunitaria",
      descripcion: "Intervenciones psicosociales en comunidades vulnerables",
      categoriaId: 5,
      duracionMinutos: 150,
      nivel: "avanzado",
      activo: true,
      orden: 1,
    },
  ]);

  // Add sample videos (using placeholder YouTube IDs)
  await db.insert(videos).values([
    {
      cursoId: 1,
      titulo: "Módulo 1: Fundamentos de la TCC",
      descripcion: "Introducción a los principios básicos de la terapia cognitivo-conductual",
      youtubeVideoId: "dQw4w9WgXcQ",
      duracionSegundos: 1800,
      orden: 1,
      activo: true,
    },
    {
      cursoId: 1,
      titulo: "Módulo 2: Técnicas de Reestructuración Cognitiva",
      descripcion: "Cómo identificar y modificar pensamientos automáticos negativos",
      youtubeVideoId: "dQw4w9WgXcQ",
      duracionSegundos: 2100,
      orden: 2,
      activo: true,
    },
  ]);

  // Add sample evaluation
  const evaluacionResult = await db.insert(evaluaciones).values({
    cursoId: 1,
    titulo: "Evaluación Final - TCC",
    descripcion: "Evaluación de conocimientos sobre terapia cognitivo-conductual",
    puntajeMinimo: 70,
    intentosMaximos: 3,
    tiempoEsperaHoras: 24,
    activo: true,
  });

  // Add sample questions
  await db.insert(preguntas).values([
    {
      evaluacionId: 1,
      textoPregunta: "¿Cuál es el objetivo principal de la terapia cognitivo-conductual?",
      opcionA: "Explorar el inconsciente del paciente",
      opcionB: "Modificar pensamientos y conductas disfuncionales",
      opcionC: "Analizar la historia familiar",
      opcionD: "Prescribir medicamentos",
      respuestaCorrecta: "B",
      activo: true,
    },
    {
      evaluacionId: 1,
      textoPregunta: "¿Qué son los pensamientos automáticos?",
      opcionA: "Pensamientos conscientes y deliberados",
      opcionB: "Pensamientos que surgen espontáneamente ante situaciones",
      opcionC: "Pensamientos sobre el futuro",
      opcionD: "Pensamientos sobre el pasado",
      respuestaCorrecta: "B",
      activo: true,
    },
    {
      evaluacionId: 1,
      textoPregunta: "¿Cuál es una técnica común en TCC?",
      opcionA: "Asociación libre",
      opcionB: "Interpretación de sueños",
      opcionC: "Registro de pensamientos",
      opcionD: "Hipnosis",
      respuestaCorrecta: "C",
      activo: true,
    },
  ]);

  console.log("✅ Database seeded successfully!");
  console.log("\n📝 Test credentials:");
  console.log("Agremiado: 12345 / password123");
  console.log("Admin: admin / password123");
}

seed().catch(console.error);
