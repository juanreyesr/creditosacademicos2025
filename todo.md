# TODO - Aula Virtual Colegio de Psicólogos de Guatemala

## Fase 1: Base de Datos y Arquitectura
- [x] Diseñar esquema completo de base de datos
- [x] Crear tablas para agremiados (usuarios personalizados)
- [x] Crear tablas para cursos y categorías
- [x] Crear tablas para videos y contenido multimedia
- [x] Crear tablas para evaluaciones y preguntas
- [x] Crear tablas para diplomas y certificados
- [x] Crear tablas para webinars y transmisiones en vivo
- [x] Crear tablas para progreso de cursos
- [x] Implementar migraciones de base de datos

## Fase 2: Sistema de Autenticación Personalizado
- [x] Implementar autenticación con número de colegiado
- [x] Crear sistema de contraseñas personalizadas
- [x] Implementar recuperación de contraseña por correo
- [x] Crear flujo de primer ingreso con generación de contraseña
- [x] Implementar roles (agremiado, administrador, super administrador)
- [x] Crear middleware de autorización

## Fase 3: Interfaz de Usuario y Diseño
- [x] Aplicar paleta de colores institucional
- [x] Integrar logo del Colegio de Psicólogos
- [x] Crear layout principal con navegación
- [x] Implementar diseño responsive
- [x] Crear página de inicio/login
- [x] Crear dashboard para agremiados
- [x] Crear dashboard para administradores

## Fase 4: Catálogo de Cursos Estilo Netflix
- [x] Crear interfaz de catálogo con filas por categoría
- [x] Implementar navegación horizontal por categorías
- [x] Crear tarjetas de cursos con información
- [x] Implementar sistema de búsqueda de cursos
- [x] Implementar filtros por área temática
- [x] Crear página de detalle de curso
- [x] Mostrar progreso de cursos

## Fase 5: Importación de Datos desde Excel
- [x] Crear endpoint para subir archivos Excel
- [x] Implementar parser de archivos Excel
- [x] Validar formato de datos (correo, número de colegiado)
- [x] Detectar duplicados
- [x] Generar reporte de validación
- [x] Implementar importación masiva de agremiados
- [x] Crear interfaz de administración para importación

## Fase 6: Reproductor de Videos y Gestión
- [x] Integrar reproductor de YouTube
- [ ] Crear sistema de gestión de videos
- [ ] Implementar carga de videos desde YouTube
- [ ] Crear interfaz para catalogar videos
- [ ] Implementar edición de metadatos de videos
- [ ] Registrar progreso de visualización
- [ ] Marcar videos como completados

## Fase 7: Sistema de Evaluaciones
- [x] Crear interfaz para crear evaluaciones
- [x] Implementar preguntas de selección múltiple
- [x] Crear banco de preguntas por curso
- [x] Implementar selección aleatoria de 10 preguntas
- [x] Crear interfaz de evaluación para agremiados
- [x] Implementar sistema de calificación (70% mínimo)
- [x] Permitir múltiples intentos (3 máximo)
- [x] Implementar período de espera entre intentos
- [x] Registrar historial de intentos

## Fase 8: Generación de Diplomas
- [x] Crear plantilla de diploma en PDF
- [x] Integrar logos institucionales
- [x] Generar códigos QR únicos
- [x] Implementar generación automática al aprobar
- [x] Crear sistema de verificación pública de diplomas
- [x] Implementar página de verificación con QR
- [ ] Permitir descarga de diplomas
- [ ] Diferenciar certificados de participación vs diplomas de aprobación

## Fase 9: Panel de Super Administrador
- [ ] Crear dashboard administrativo
- [ ] Implementar gestión de cursos (CRUD)
- [ ] Implementar gestión de categorías
- [ ] Implementar gestión de videos
- [ ] Implementar gestión de evaluaciones
- [ ] Crear interfaz para asignar evaluaciones a cursos
- [ ] Implementar métricas y reportes
- [ ] Mostrar cursos más populares
- [ ] Mostrar tasas de aprobación
- [ ] Exportar reportes en Excel/PDF

## Fase 10: Sistema de Webinars en Vivo
- [ ] Integrar YouTube Live API
- [ ] Crear interfaz para programar webinars
- [ ] Implementar visualización de transmisiones en vivo
- [ ] Guardar automáticamente grabaciones
- [ ] Crear catálogo de webinars grabados
- [ ] Implementar notificaciones de webinars próximos

## Fase 11: Dashboard de Progreso y Notificaciones
- [ ] Crear dashboard personalizado para agremiados
- [ ] Mostrar cursos completados
- [ ] Mostrar cursos en progreso
- [ ] Mostrar diplomas obtenidos
- [ ] Mostrar horas de capacitación
- [ ] Implementar sistema de notificaciones por correo
- [ ] Notificar nuevos cursos disponibles
- [ ] Notificar webinars próximos
- [ ] Notificar diplomas disponibles
- [ ] Notificar aprobación de evaluaciones

## Fase 12: Funcionalidades Adicionales
- [ ] Implementar sistema de comentarios por curso
- [ ] Implementar encuestas de satisfacción post-curso
- [ ] Implementar gamificación (insignias, niveles)
- [ ] Crear tabla de líderes
- [ ] Implementar integración con calendario
- [ ] Agregar transcripciones/subtítulos a videos

## Fase 13: Pruebas y Documentación
- [ ] Realizar pruebas de autenticación
- [ ] Realizar pruebas de importación de Excel
- [ ] Realizar pruebas de evaluaciones
- [ ] Realizar pruebas de generación de diplomas
- [ ] Realizar pruebas de verificación de diplomas
- [ ] Crear documentación de usuario
- [ ] Crear manual de administrador
- [ ] Crear guía de importación de datos
- [ ] Preparar checkpoint final


## Mejoras Solicitadas - Enero 2025
- [x] Agregar botón de acceso al panel de administración en el dashboard
- [x] Crear usuario superadministrador con número de colegiado 4661
- [x] Configurar contraseña personalizada para el nuevo usuario
- [x] Verificar acceso completo al panel de administración

## Nuevas Funcionalidades - Panel Admin Completo
- [x] Agregar validación de agremiados activos en el login
- [x] Mostrar mensaje "No te encuentras activo" para agremiados inactivos
- [x] Implementar botón para activar/desactivar agremiados en panel admin
- [x] Crear panel CRUD completo para gestión de cursos
- [ ] Crear panel CRUD para gestión de videos por curso
- [ ] Crear panel CRUD para gestión de evaluaciones
- [ ] Crear panel CRUD para gestión de preguntas
- [ ] Implementar edición de perfil para agremiados
- [ ] Permitir cambio de contraseña desde el perfil

## Correcciones y Nuevas Funcionalidades - Fase Final
- [x] Investigar y corregir problema de login (no redirige al dashboard)
- [x] Implementar panel CRUD para gestión de videos por curso
- [ ] Implementar panel CRUD para gestión de evaluaciones
- [ ] Implementar panel CRUD para gestión de preguntas
- [ ] Crear página de perfil de usuario
- [ ] Implementar edición de datos personales
- [ ] Implementar cambio de contraseña desde perfil
- [ ] Crear sistema de reportes exportables en Excel
- [ ] Reporte de agremiados activos
- [ ] Reporte de cursos populares
- [ ] Reporte de diplomas emitidos
