# Aula Virtual (SPA) + Módulo de Créditos (RLS: user_id = auth.uid())

Este proyecto es un **SPA (Vite + React)** pensado para integrarse dentro de una plataforma existente.  
Por diseño **no incluye pantalla de login**, porque el acceso se asume gestionado externamente (la sesión de Supabase debe existir ya en el navegador).

Incluye:
- Rutas principales (Dashboard, Cursos, Mis cursos, Diplomas, Créditos, Admin).
- **Módulo de créditos dentro del SPA** con:
  - Registro de actividades, horas y créditos.
  - Subida opcional de comprobante a Storage (`comprobantes`).
  - PDF de constancia con QR.
  - Exportación a Excel.
  - **Filtro automático por usuario** (RLS: `usuario_id = auth.uid()`).
  - **Modo admin** según `perfiles.is_admin`.

## 1) Requisitos

- Proyecto Supabase (Postgres + Auth + Storage).
- Vercel (o cualquier hosting estático compatible con Vite + funciones).

## 2) Configuración Supabase

### 2.1 Ejecutar el esquema SQL

1. En Supabase: **SQL Editor**  
2. Ejecuta el archivo:

- `supabase/schema.sql`

### 2.2 Crear bucket de Storage

En Supabase: **Storage → Buckets → New bucket**
- Nombre: `comprobantes`
- Público: **No** (recomendado)

Luego, crea estas políticas en Storage (en la UI o SQL) para permitir que el dueño suba/lea sus archivos y que admin pueda ver todo.

### 2.3 Crear perfil admin (si aplica)

En la tabla `perfiles`, marca `is_admin = true` para los usuarios que deben ver modo admin.

> Nota: por defecto, los perfiles se crean automáticamente por trigger cuando un usuario se registra (ver SQL).

## 3) Variables de entorno (Vercel)

En Vercel → Project → Settings → Environment Variables

**Frontend (Build):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Funciones (/api):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DIPLOMA_HMAC_SECRET` (cadena larga aleatoria)

Usa `.env.example` como guía.

## 4) Deploy en Vercel

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

Este repo incluye `vercel.json` para el fallback del SPA.

## 5) Comportamiento de seguridad (lo solicitado)

### Filtro automático por usuario
El módulo de créditos consulta normalmente:
- `registros` filtrado por `usuario_id = auth.uid()` (RLS lo hace efectivo aunque el cliente no filtre).

### Modo admin según perfil
Si `perfiles.is_admin = true`:
- Se habilita en **Créditos** el selector:  
  - “Solo mi usuario (auth.uid())”  
  - “Ver todos (modo admin)”

## 6) Archivos principales

- `src/pages/CreditosPage.tsx` → Módulo de créditos (SPA).
- `api/diplomas-sign.js` → Firma HMAC de diplomas (se llama al descargar PDF).
- `supabase/schema.sql` → Tablas, funciones y políticas base.

---
Si deseas que el módulo de créditos se renderice como **componente embebible** (sin navegación), se puede crear una ruta “/embed/creditos” con layout mínimo en una iteración rápida.
