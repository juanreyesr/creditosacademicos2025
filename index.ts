// index.ts
import "dotenv/config";
import express from "express";
import session from "express-session";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// Importamos todo lo que ya tienes hecho en la carpeta server
import { registerOAuthRoutes } from "./server/_core/oauth";
import { appRouter } from "./server/routers";
import { createContext } from "./server/_core/context";
import { serveStatic } from "./server/_core/vite";

const app = express();

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

// Middleware de sesión (igual que en tu server/_core/index.ts)
app.use(
  session({
    secret:
      process.env.JWT_SECRET ||
      "aula-virtual-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: ONE_WEEK_MS,
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Rutas de OAuth (no estorban aunque dejes de usar Manus)
registerOAuthRoutes(app);

// API tRPC
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// En Vercel asumimos modo producción: servir el frontend ya compilado
serveStatic(app);

// 👉 Parte clave para Vercel: exportar la app Express
export default app;
