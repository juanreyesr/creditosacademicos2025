import { COOKIE_NAME } from "@shared/const";
import "./types";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { 
  hashPassword, 
  verifyPassword, 
  generateRandomPassword, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewCourseNotification,
  sendWebinarReminder,
  sendDiplomaNotification,
} from "./auth";
import { 
  parseExcelFile, 
  convertToAgremiadosData, 
  generateExcelTemplate 
} from "./excel";
import { 
  generateDiplomaData, 
  generateDiplomaHTML 
} from "./diploma";

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
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const agremiado = await db.getAgremiadoByEmail(input.email);
        
        if (!agremiado) {
          // Don't reveal if email exists
          return { success: true };
        }

        const resetToken = Math.random().toString(36).substring(2, 15);
        
        // In a real app, store reset token in database with expiration
        // For now, we'll just send the email
        await sendPasswordResetEmail(
          agremiado.email,
          agremiado.nombreCompleto,
          resetToken
        );

        return { success: true };
      }),

    changePassword: agremiadoProcedure
      .input(z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        // If not first login, verify current password
        if (!ctx.agremiado.primerIngreso && input.currentPassword) {
          if (!ctx.agremiado.passwordHash) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "No hay contraseña actual" });
          }

          const isValid = await verifyPassword(input.currentPassword, ctx.agremiado.passwordHash);
          
          if (!isValid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña actual incorrecta" });
          }
        }

        const newPasswordHash = await hashPassword(input.newPassword);
        
        await db.updateAgremiado(ctx.agremiado.id, {
          passwordHash: newPasswordHash,
          primerIngreso: false,
        });

        return { success: true };
      }),
  }),

  // Categorias
  categorias: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCategorias();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoriaById(input.id);
      }),
  }),

  // Cursos
  cursos: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCursos();
    }),

    getByCategoria: publicProcedure
      .input(z.object({ categoriaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCursosByCategoria(input.categoriaId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const curso = await db.getCursoById(input.id);
        if (!curso) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Curso no encontrado" });
        }
        return curso;
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchCursos(input.query);
      }),

    getWithProgress: agremiadoProcedure
      .input(z.object({ cursoId: z.number() }))
      .query(async ({ input, ctx }) => {
        const curso = await db.getCursoById(input.cursoId);
        if (!curso) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Curso no encontrado" });
        }

        const progreso = await db.getProgresoCurso(ctx.agremiado.id, input.cursoId);
        const videos = await db.getVideosByCurso(input.cursoId);

        return {
          curso,
          progreso,
          videos,
        };
      }),
    
    create: adminProcedure
      .input(z.object({
        titulo: z.string(),
        descripcion: z.string(),
        categoriaId: z.number(),
        duracionMinutos: z.number().optional(),
        nivel: z.enum(["basico", "intermedio", "avanzado"]),
        orden: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const curso = await db.createCurso(input);
        return curso;
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descripcion: z.string().optional(),
        categoriaId: z.number().optional(),
        duracionMinutos: z.number().optional(),
        nivel: z.enum(["basico", "intermedio", "avanzado"]).optional(),
        orden: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCurso(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCurso(input.id);
        return { success: true };
      }),
    
    toggleActivo: adminProcedure
      .input(z.object({ id: z.number(), activo: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateCurso(input.id, { activo: input.activo });
        return { success: true };
      }),
  }),

  // Videos
  videos: router({
    getByCurso: publicProcedure
      .input(z.object({ cursoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideosByCurso(input.cursoId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        cursoId: z.number(),
        titulo: z.string(),
        descripcion: z.string().optional(),
        youtubeUrl: z.string(),
        duracionMinutos: z.number().optional(),
        orden: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const video = await db.createVideo(input);
        return video;
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descripcion: z.string().optional(),
        youtubeUrl: z.string().optional(),
        duracionMinutos: z.number().optional(),
        orden: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVideo(id, data);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideo(input.id);
        return { success: true };
      }),
    
    toggleActivo: adminProcedure
      .input(z.object({ id: z.number(), activo: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateVideo(input.id, { activo: input.activo });
        return { success: true };
      }),
    
    reorder: adminProcedure
      .input(z.object({ videoId: z.number(), newOrden: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateVideo(input.videoId, { orden: input.newOrden });
        return { success: true };
      }),
  }),

  // Progreso
  progreso: router({
    getMyCursos: agremiadoProcedure.query(async ({ ctx }) => {
      return await db.getProgresosByAgremiado(ctx.agremiado.id);
    }),

    updateProgreso: agremiadoProcedure
      .input(z.object({
        cursoId: z.number(),
        videoId: z.number().optional(),
        porcentajeCompletado: z.number().min(0).max(100),
        completado: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertProgresoCurso({
          agremiadoId: ctx.agremiado.id,
          cursoId: input.cursoId,
          videoId: input.videoId,
          porcentajeCompletado: input.porcentajeCompletado,
          completado: input.completado,
        });

        return { success: true };
      }),
  }),

  // Evaluaciones
  evaluaciones: router({
    getByCurso: agremiadoProcedure
      .input(z.object({ cursoId: z.number() }))
      .query(async ({ input, ctx }) => {
        const evaluacion = await db.getEvaluacionByCurso(input.cursoId);
        
        if (!evaluacion) {
          return null;
        }

        const intentos = await db.getIntentosEvaluacion(ctx.agremiado.id, evaluacion.id);
        
        return {
          evaluacion,
          intentos,
          intentosRestantes: Math.max(0, evaluacion.intentosMaximos - intentos.length),
        };
      }),

    getPreguntas: agremiadoProcedure
      .input(z.object({ evaluacionId: z.number() }))
      .query(async ({ input }) => {
        const preguntas = await db.getPreguntasByEvaluacion(input.evaluacionId);
        
        // Shuffle and select 10 random questions
        const shuffled = preguntas.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 10);
        
        // Return without correct answers
        return selected.map(p => ({
          id: p.id,
          textoPregunta: p.textoPregunta,
          opcionA: p.opcionA,
          opcionB: p.opcionB,
          opcionC: p.opcionC,
          opcionD: p.opcionD,
        }));
      }),

    submitRespuestas: agremiadoProcedure
      .input(z.object({
        evaluacionId: z.number(),
        respuestas: z.array(z.object({
          preguntaId: z.number(),
          respuesta: z.enum(["A", "B", "C", "D"]),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const evaluacion = await db.getEvaluacionByCurso(input.evaluacionId);
        
        if (!evaluacion) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evaluación no encontrada" });
        }

        const intentos = await db.getIntentosEvaluacion(ctx.agremiado.id, input.evaluacionId);
        
        if (intentos.length >= evaluacion.intentosMaximos) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Ha alcanzado el número máximo de intentos" 
          });
        }

        // Check if needs to wait
        if (intentos.length > 0) {
          const lastIntento = intentos[0];
          const horasDesdeUltimoIntento = 
            (Date.now() - lastIntento.fechaIntento.getTime()) / (1000 * 60 * 60);
          
          if (horasDesdeUltimoIntento < evaluacion.tiempoEsperaHoras) {
            const horasRestantes = Math.ceil(evaluacion.tiempoEsperaHoras - horasDesdeUltimoIntento);
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: `Debe esperar ${horasRestantes} horas antes del siguiente intento` 
            });
          }
        }

        // Get all questions and check answers
        const preguntas = await db.getPreguntasByEvaluacion(input.evaluacionId);
        const preguntasMap = new Map(preguntas.map(p => [p.id, p]));
        
        let correctas = 0;
        const respuestasDetalle = input.respuestas.map(r => {
          const pregunta = preguntasMap.get(r.preguntaId);
          const esCorrecta = pregunta?.respuestaCorrecta === r.respuesta;
          if (esCorrecta) correctas++;
          
          return {
            preguntaId: r.preguntaId,
            respuesta: r.respuesta,
            correcta: esCorrecta,
          };
        });

        const puntajeObtenido = Math.round((correctas / input.respuestas.length) * 100);
        const aprobado = puntajeObtenido >= evaluacion.puntajeMinimo;

        // Save attempt
        await db.createIntentoEvaluacion({
          agremiadoId: ctx.agremiado.id,
          evaluacionId: input.evaluacionId,
          numeroIntento: intentos.length + 1,
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
          fechaEmision: diploma.fechaEmision,
          codigoVerificacion: diploma.codigoVerificacion,
          codigoQR: diploma.codigoQR || "",
        });

        return { html };
      }),
  }),

  // Webinars
  webinars: router({
    getProximos: publicProcedure.query(async () => {
      return await db.getWebinarsProximos();
    }),

    getFinalizados: publicProcedure.query(async () => {
      return await db.getWebinarsFinalizados();
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
            validCount: result.valid.length,
          };
        }

        const agremiadosData = await convertToAgremiadosData(result.valid, true);
        
        // Check for existing agremiados in database
        const existing = [];
        for (const data of agremiadosData) {
          const existingAgremiado = await db.getAgremiadoByNumeroColegiado(data.numeroColegiado!);
          if (existingAgremiado) {
            existing.push(data.numeroColegiado);
          }
        }

        if (existing.length > 0) {
          return {
            success: false,
            errors: [],
            duplicates: existing.map(nc => `Número de colegiado ya existe en la base de datos: ${nc}`),
            validCount: result.valid.length - existing.length,
          };
        }

        await db.bulkInsertAgremiados(agremiadosData);

        return {
          success: true,
          imported: agremiadosData.length,
        };
      }),

    downloadTemplate: adminProcedure.query(() => {
      const buffer = generateExcelTemplate();
      return {
        base64: buffer.toString("base64"),
        filename: "plantilla_agremiados.xlsx",
      };
    }),

    getEstadisticas: adminProcedure.query(async () => {
      const stats = await db.getEstadisticasGenerales();
      const cursosPopulares = await db.getCursosPopulares(5);
      
      return {
        ...stats,
        cursosPopulares,
      };
    }),

    getAllAgremiados: adminProcedure.query(async () => {
      return await db.getAllAgremiados();
    }),
    
    toggleAgremiadoActivo: adminProcedure
      .input(z.object({
        id: z.number(),
        activo: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateAgremiado(input.id, { activo: input.activo });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
