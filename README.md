# Aula Virtual - Colegio de Psicólogos de Guatemala

Sistema completo de gestión de cursos, evaluaciones y certificaciones para el Colegio de Psicólogos de Guatemala.

## 🚀 Características Principales

### Para Agremiados
- **Autenticación personalizada** con número de colegiado
- **Catálogo de cursos** estilo Netflix organizado por categorías
- **Reproductor de videos** integrado con YouTube
- **Sistema de evaluaciones** con preguntas de selección múltiple
- **Diplomas digitales** con códigos QR para verificación
- **Dashboard personalizado** con estadísticas de progreso
- **Recuperación de contraseña** por correo electrónico

### Para Administradores
- **Panel de administración** completo
- **Importación masiva** de agremiados desde Excel
- **Gestión de cursos** y contenido multimedia
- **Creación de evaluaciones** con banco de preguntas
- **Estadísticas y reportes** del sistema
- **Control de acceso** por roles

## 🛠️ Tecnologías Utilizadas

### Frontend
- React 19
- TypeScript
- Tailwind CSS 4
- Wouter (routing)
- shadcn/ui (componentes)
- tRPC (cliente)

### Backend
- Node.js
- Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB

### Servicios
- YouTube API (videos)
- Nodemailer (correos)
- QRCode (generación de códigos QR)
- ExcelJS (importación/exportación)
- bcrypt (encriptación de contraseñas)

## 📦 Instalación y Configuración

### Requisitos Previos
- Node.js 22.x o superior
- pnpm
- Base de datos MySQL/TiDB

### Variables de Entorno

El sistema utiliza las siguientes variables de entorno (ya configuradas automáticamente):

```env
# Base de datos
DATABASE_URL=mysql://...

# Autenticación
JWT_SECRET=...

# OAuth (Manus)
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...

# Aplicación
VITE_APP_TITLE=Aula Virtual - Colegio de Psicólogos de Guatemala
VITE_APP_LOGO=/logo.png

# APIs internas
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...
```

### Instalación

```bash
# Instalar dependencias
pnpm install

# Aplicar migraciones de base de datos
pnpm db:push

# Cargar datos de prueba (opcional)
npx tsx seed-data.ts

# Iniciar servidor de desarrollo
pnpm dev
```

## 📊 Estructura de la Base de Datos

El sistema cuenta con 16 tablas principales:

1. **agremiados** - Usuarios del sistema
2. **categorias** - Categorías de cursos
3. **cursos** - Cursos disponibles
4. **videos** - Videos de YouTube por curso
5. **webinars** - Transmisiones en vivo
6. **progreso_cursos** - Seguimiento de progreso
7. **evaluaciones** - Evaluaciones por curso
8. **preguntas** - Banco de preguntas
9. **intentos_evaluacion** - Historial de intentos
10. **respuestas_evaluacion** - Respuestas de agremiados
11. **diplomas** - Certificados emitidos
12. **notificaciones** - Sistema de notificaciones
13. **comentarios** - Comentarios en cursos
14. **encuestas** - Encuestas de satisfacción
15. **respuestas_encuestas** - Respuestas de encuestas
16. **insignias** - Sistema de gamificación

## 🔐 Sistema de Autenticación

### Roles de Usuario
- **agremiado** - Acceso a cursos y evaluaciones
- **administrador** - Gestión de contenido
- **superadministrador** - Control total del sistema

### Flujo de Autenticación
1. Login con número de colegiado y contraseña
2. Generación de sesión con JWT
3. Middleware de autorización en tRPC
4. Protección de rutas en frontend

## 📝 Importación de Agremiados

### Formato del Excel

El archivo debe contener las siguientes columnas:

| Numero Colegiado | Nombre Completo | Email |
|------------------|-----------------|-------|
| 12345 | Juan Pérez López | juan.perez@example.com |
| 67890 | María García | maria.garcia@example.com |

### Proceso de Importación

1. Descarga de plantilla desde el panel de administración
2. Completar datos en Excel
3. Subir archivo al sistema
4. Validación automática:
   - Formato de correo electrónico
   - Números de colegiado únicos
   - Campos obligatorios
5. Generación de contraseñas temporales
6. Envío de credenciales por correo

## 🎓 Sistema de Evaluaciones

### Configuración
- **Preguntas por evaluación:** 10 (seleccionadas aleatoriamente)
- **Puntaje mínimo:** 70%
- **Intentos máximos:** 3
- **Tiempo de espera:** 24 horas entre intentos

### Tipos de Preguntas
- Selección múltiple con 4 opciones (A, B, C, D)
- Una respuesta correcta por pregunta
- Banco de 15-20 preguntas por curso

## 🏆 Sistema de Diplomas

### Generación Automática
- Al aprobar una evaluación con 70% o más
- Código QR único para verificación
- Información incluida:
  - Nombre del agremiado
  - Título del curso
  - Fecha de emisión
  - Código de verificación
  - Logos institucionales

### Verificación Pública
- Escaneo de código QR
- Ingreso manual de código
- Página pública de verificación
- No requiere autenticación

## 🎥 Integración con YouTube

### Videos de Cursos
- URLs de YouTube embebidas
- Reproductor responsive
- Seguimiento de progreso (futuro)

### Webinars (Futuro)
- YouTube Live para transmisiones
- Grabaciones automáticas
- Notificaciones de eventos

## 📧 Sistema de Notificaciones

### Correos Automáticos
- Contraseña temporal (primer ingreso)
- Recuperación de contraseña
- Diploma disponible
- Recordatorios de cursos

### Configuración SMTP
Utiliza Nodemailer con configuración personalizable.

## 🔧 Comandos Útiles

```bash
# Desarrollo
pnpm dev              # Iniciar servidor de desarrollo
pnpm build            # Construir para producción
pnpm preview          # Vista previa de producción

# Base de datos
pnpm db:push          # Aplicar cambios de esquema
pnpm db:studio        # Abrir Drizzle Studio

# Utilidades
npx tsx seed-data.ts  # Cargar datos de prueba
```

## 📱 Diseño Responsive

El sistema está optimizado para:
- Computadoras de escritorio (1920x1080+)
- Laptops (1366x768+)
- Tablets (768x1024+)
- Smartphones (375x667+)

## 🎨 Diseño Institucional

### Paleta de Colores
- **Azul Oscuro/Morado:** #2B2E5F (títulos)
- **Rosa/Magenta:** #D91C7A (acentos)
- **Naranja/Amarillo:** #F5A623 (secundario)
- **Morado Oscuro:** #4A2C5B (secciones)

### Tipografía
- **Títulos:** Montserrat
- **Cuerpo:** Open Sans

## 🚀 Despliegue

### Plataforma Recomendada
- **Vercel** (configurado)
- Despliegue automático desde Git
- Variables de entorno en dashboard
- SSL automático

### Proceso de Publicación
1. Crear checkpoint en el sistema
2. Hacer clic en "Publish" en el dashboard
3. El sistema se desplegará automáticamente

## 📊 Monitoreo y Analíticas

El sistema incluye:
- Estadísticas de uso
- Cursos más populares
- Tasa de aprobación
- Diplomas emitidos

## 🔒 Seguridad

### Medidas Implementadas
- Contraseñas encriptadas con bcrypt
- Sesiones JWT con expiración
- Validación de entrada en backend
- Protección contra SQL injection (Drizzle ORM)
- CORS configurado
- Rate limiting (futuro)

## 📝 Credenciales de Prueba

```
Agremiado:
- Usuario: 12345
- Contraseña: password123

Administrador:
- Usuario: admin
- Contraseña: password123
```

## 🐛 Solución de Problemas

### Error de conexión a base de datos
- Verificar DATABASE_URL en variables de entorno
- Confirmar que la base de datos está accesible

### Videos no cargan
- Verificar URLs de YouTube
- Revisar configuración de CORS

### Correos no se envían
- Verificar configuración SMTP
- Revisar logs del servidor

## 📞 Soporte

Para soporte técnico:
- Email: soporte@colegiodepsicologos.org.gt
- Documentación: Ver GUIA_USUARIO.md

## 📄 Licencia

Sistema propietario del Colegio de Psicólogos de Guatemala.

---

**Desarrollado para:** Colegio de Psicólogos de Guatemala  
**Versión:** 1.0.0  
**Última actualización:** Enero 2025
