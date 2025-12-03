import { COOKIE_NAME } from "@shared/const";
import "./types";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { supabaseServer } from "./supabaseClient";
import { 
  hashPassword, 
  verifyPassword, 
  generateRandomPassword, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewCourseNotification,
  sendWebinarReminder,
  sendDiplomaNotification,
} from "./_core/mail";
import { generateDiplomaData, generateDiplomaHTML } from "./_core/diploma";
import { parseExcelFile } from "./_core/excel";
import { nanoid } from "nanoid";

// Custom procedure for agremiados authentication
const agremiadoProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const agremiadoId = ctx.req.session?.agremiadoId;
  
  if (!agremiadoId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Debe iniciar sesión" });
  }

  const agremiado = await db.getAgremiadoById(agremiadoId);
  
  if (!agremiado || !agremiado.activo) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Cuenta no válida" });
  }

  return next({
    ctx: {
      ...ctx,
      agremiado,
    },
  });
});

// Admin procedure (superadministrador o administrador)
const adminProcedure = agremiadoProcedure.use(async ({ ctx, next }) => {
  if (ctx.agremiado.role !== "superadministrador" && ctx.agremiado.role !== "administrador") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso denegado" });
  }

  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      // Also clear agremiado session
      if (ctx.req.session) {
        ctx.req.session.agremiadoId = undefined;
      }
      return { success: true } as const;
    }),
    
    // Agremiado authentication
    loginAgremiado: publicProcedure
      .input(z.object({
        numeroColegiado: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const agremiado = await db.getAgremiadoByNumeroColegiado(input.numeroColegiado);
        
        if (!agremiado) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Número de colegiado o contraseña incorrectos" 
          });
        }
        
        if (!agremiado.activo) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "No te encuentras activo. Por favor, contacta al administrador del sistema." 
          });
        }

        if (!agremiado.passwordHash) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Debe establecer una contraseña primero" 
          });
        }

        const isValid = await verifyPassword(input.password, agremiado.passwordHash);

        if (!isValid) {
          throw new TRPCError({ 
            code: "UNAUTHORIZED", 
            message: "Número de colegiado o contraseña incorrectos" 
          });
        }

        // Update last signed in
        await db.updateAgremiado(agremiado.id, {
          lastSignedIn: new Date(),
        });

        // Set session
        if (ctx.req.session) {
          ctx.req.session.agremiadoId = agremiado.id;
        }

        return {
          success: true,
          agremiado: {
            id: agremiado.id,
            numeroColegiado: agremiado.numeroColegiado,
            nombreCompleto: agremiado.nombreCompleto,
            email: agremiado.email,
            role: agremiado.role,
            primerIngreso: agremiado.primerIngreso,
          },
        };
      }),

    getCurrentAgremiado: agremiadoProcedure.query(({ ctx }) => {
      return ctx.agremiado;
    }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        numeroColegiado: z.string(),
      }))
      .mutation(async ({ input }) => {
        const agremiado = await db.getAgremiadoByNumeroColegiado(input.numeroColegiado);

        if (!agremiado || !agremiado.email) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No se encontró un agremiado con ese número de colegiado",
          });
        }

        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

        await db.createPasswordResetToken({
          agremiadoId: agremiado.id,
          token,
          expiresAt,
        });

        await sendPasswordResetEmail(agremiado.email, agremiado.nombreCompleto, token);

        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const resetToken = await db.getPasswordResetToken(input.token);

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Enlace inválido o expirado",
          });
        }

        const agremiado = await db.getAgremiadoById(resetToken.agremiadoId);

        if (!agremiado) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agremiado no encontrado",
          });
        }

        const passwordHash = await hashPassword(input.password);

        await db.updateAgremiado(agremiado.id, {
          passwordHash,
          primerIngreso: false,
        });

        await db.markPasswordResetTokenAsUsed(resetToken.id);

        return { success: true };
      }),
  }),

  agremiados: router({
    me: agremiadoProcedure.query(({ ctx }) => ctx.agremiado),
  }),

  cursos: router({
    listPublic: publicProcedure.query(async () => {
      return await db.getPublicCursos();
    }),

    listMyCursos: agremiadoProcedure.query(async ({ ctx }) => {
      return await db.getCursosByAgremiado(ctx.agremiado.id);
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const curso = await db.getCursoBySlug(input.slug);
        if (!curso) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Curso no encontrado" });
        }
        return curso;
      }),

    register: agremiadoProcedure
      .input(z.object({ cursoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const curso = await db.getCursoById(input.cursoId);
        if (!curso) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Curso no encontrado" });
        }

        const existing = await db.getCursoInscripcion(ctx.agremiado.id, curso.id);
        if (existing) {
          return { success: true, alreadyRegistered: true as const };
        }

        await db.createCursoInscripcion({
          agremiadoId: ctx.agremiado.id,
          cursoId: curso.id,
        });

        await sendNewCourseNotification(
          ctx.agremiado.email,
          ctx.agremiado.nombreCompleto,
          curso.titulo
        );

        return { success: true, alreadyRegistered: false as const };
      }),
  }),

  evaluaciones: router({
    getByCursoId: agremiadoProcedure
      .input(z.object({ cursoId: z.number() }))
      .query(async ({ input, ctx }) => {
        const evaluacion = await db.getEvaluacionByCursoId(input.cursoId);

        if (!evaluacion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evaluación no encontrada" });
        }

        const inscripcion = await db.getCursoInscripcion(ctx.agremiado.id, input.cursoId);
        
        if (!inscripcion) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Debe estar inscrito en el curso" });
        }

        return evaluacion;
      }),

    startAttempt: agremiadoProcedure
      .input(z.object({ evaluacionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const evaluacion = await db.getEvaluacionById(input.evaluacionId);

        if (!evaluacion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evaluación no encontrada" });
        }

        const intentos = await db.getIntentosByEvaluacionAndAgremiado(
          input.evaluacionId,
          ctx.agremiado.id
        );

        if (intentos.length >= evaluacion.maxIntentos) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Has alcanzado el número máximo de intentos permitidos" 
          });
        }

        if (intentos.length > 0) {
          const lastIntento = intentos[0];
          const horasDesdeUltimoIntento = 
            (Date.now() - lastIntento.fechaIntento.getTime()) / (1000 * 60 * 60);
          
          if (horasDesdeUltimoIntento < evaluacion.tiempoEsperaHoras) {
            const horasRestantes = Math.ceil(evaluacion.tiempoEsperaHoras - horasDesdeUltimoIntento);
            throw new TRPCError({ 
              code: "FORBIDDEN", 
              message: `Debe esperar ${horasRestantes} horas antes del siguiente intento` 
            });
          }
        }

        const intento = await db.createIntento({
          evaluacionId: input.evaluacionId,
          agremiadoId: ctx.agremiado.id,
          fechaIntento: new Date(),
        });

        return intento;
      }),

    evaluar: agremiadoProcedure
      .input(z.object({
        intentoId: z.number(),
        respuestas: z.array(z.object({
          preguntaId: z.number(),
          opcionSeleccionadaId: z.number().nullable(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const intento = await db.getIntentoById(input.intentoId);

        if (!intento || intento.agremiadoId !== ctx.agremiado.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Intento no válido" });
        }

        const evaluacion = await db.getEvaluacionById(intento.evaluacionId);

        if (!evaluacion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evaluación no encontrada" });
        }

        const preguntas = await db.getPreguntasByEvaluacionId(evaluacion.id);
        const opciones = await db.getOpcionesByEvaluacionId(evaluacion.id);

        if (preguntas.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La evaluación no tiene preguntas" });
        }

        let puntajeObtenido = 0;
        const respuestasDetalle = [];

        for (const respuesta of input.respuestas) {
          const pregunta = preguntas.find(p => p.id === respuesta.preguntaId);
          
          if (!pregunta) continue;

          const opcionesPregunta = opciones.filter(o => o.preguntaId === pregunta.id);
          const opcionCorrecta = opcionesPregunta.find(o => o.esCorrecta);

          const esCorrecta = 
            opcionCorrecta && respuesta.opcionSeleccionadaId === opcionCorrecta.id;

          if (esCorrecta) {
            puntajeObtenido += pregunta.puntaje;
          }

          respuestasDetalle.push({
            preguntaId: pregunta.id,
            opcionSeleccionadaId: respuesta.opcionSeleccionadaId,
            esCorrecta,
          });
        }

        const aprobado = puntajeObtenido >= evaluacion.puntajeMinimo;
        const correctas = respuestasDetalle.filter(r => r.esCorrecta).length;

        await db.updateIntento(intento.id, {
          puntajeObtenido,
          aprobado,
          respuestas: JSON.stringify(respuestasDetalle),
        });

        // If approved, generate diploma
        if (aprobado) {
          const curso = await db.getCursoById(evaluacion.cursoId);

          if (curso) {
            const diplomaData = await generateDiplomaData({
              nombreCompleto: ctx.agremiado.nombreCompleto,
              cursoTitulo: curso.titulo,
              tipo: "aprobacion",
              fechaEmision: new Date(),
            });

            await db.createDiploma({
              agremiadoId: ctx.agremiado.id,
              cursoId: curso.id,
              tipo: "aprobacion",
              codigoVerificacion: diplomaData.codigoVerificacion,
              codigoQR: diplomaData.codigoQR,
            });

            // Registrar crédito en Supabase (tabla registros)
            try {
              await supabaseServer.from("registros").insert({
                // Ajusta estos campos si tu tabla cambia
                usuario_id: process.env.REGISTROS_USUARIO_ID ?? null,
                correlativo: null,
                nombre: ctx.agremiado.nombreCompleto,
                telefono: null,
                colegiado_numero: ctx.agremiado.numeroColegiado,
                colegiado_activo: ctx.agremiado.activo,
                actividad: curso.titulo,
                institucion: "Colegio de Psicólogos de Guatemala",
                tipo: "Aula Virtual",
                fecha: new Date().toISOString(),
                horas: 1,
                creditos: 1,
                observaciones:
                  "Registro generado automáticamente desde el Aula Virtual",
                archivo_url: null,
                archivo_mime: "application/pdf",
                hash: diplomaData.codigoVerificacion,
                exportado: false,
              });
            } catch (error) {
              console.error(
                "Error al registrar crédito en Supabase (registros):",
                error
              );
            }

            // Send notification
            await sendDiplomaNotification(
              ctx.agremiado.email,
              ctx.agremiado.nombreCompleto,
              curso.titulo
            );
          }
        }

        return {
          puntajeObtenido,
          aprobado,
          correctas,
          total: input.respuestas.length,
        };
      }),
  }),

  // Diplomas
  diplomas: router({
    getMy: agremiadoProcedure.query(async ({ ctx }) => {
      return await db.getDiplomasByAgremiado(ctx.agremiado.id);
    }),

    verify: publicProcedure
      .input(z.object({ codigo: z.string() }))
      .query(async ({ input }) => {
        const diploma = await db.getDiplomaByCodigoVerificacion(input.codigo);
        
        if (!diploma) {
          return null;
        }

        const agremiado = await db.getAgremiadoById(diploma.agremiadoId);
        const curso = await db.getCursoById(diploma.cursoId);

        return {
          diploma,
          agremiado: agremiado ? {
            nombreCompleto: agremiado.nombreCompleto,
            numeroColegiado: agremiado.numeroColegiado,
          } : null,
          curso: curso ? {
            titulo: curso.titulo,
          } : null,
        };
      }),

    generatePDF: agremiadoProcedure
      .input(z.object({ diplomaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const diplomas = await db.getDiplomasByAgremiado(ctx.agremiado.id);
        const diploma = diplomas.find(d => d.id === input.diplomaId);
        
        if (!diploma) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Diploma no encontrado" });
        }

        const curso = await db.getCursoById(diploma.cursoId);
        
        if (!curso) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Curso no encontrado" });
        }

        const html = generateDiplomaHTML({
          nombreCompleto: ctx.agremiado.nombreCompleto,
          cursoTitulo: curso.titulo,
          tipo: diploma.tipo,
          fechaEmision: diploma.createdAt,
          codigoVerificacion: diploma.codigoVerificacion,
        });

        return { html };
      }),
  }),

  // Admin routes
  admin: router({
    // Import agremiados from Excel
    importAgremiados: adminProcedure
      .input(z.object({
        fileBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const result = parseExcelFile(buffer);

        if (result.errors.length > 0 || result.duplicates.length > 0) {
          return {
            success: false,
            errors: result.errors,
            duplicates: result.duplicates,
          };
        }

        await db.bulkInsertAgremiados(result.agremiados);

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
