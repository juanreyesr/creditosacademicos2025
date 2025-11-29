CREATE TABLE `agremiados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroColegiado` varchar(50) NOT NULL,
	`nombreCompleto` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`primerIngreso` boolean NOT NULL DEFAULT true,
	`activo` boolean NOT NULL DEFAULT true,
	`role` enum('agremiado','administrador','superadministrador') NOT NULL DEFAULT 'agremiado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `agremiados_id` PRIMARY KEY(`id`),
	CONSTRAINT `agremiados_numeroColegiado_unique` UNIQUE(`numeroColegiado`)
);
--> statement-breakpoint
CREATE TABLE `agremiadosInsignias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`insigniaId` int NOT NULL,
	`fechaObtencion` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agremiadosInsignias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categorias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`orden` int NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categorias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comentarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`cursoId` int NOT NULL,
	`comentario` text NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comentarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cursos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descripcion` text,
	`categoriaId` int NOT NULL,
	`imagenUrl` varchar(500),
	`duracionMinutos` int,
	`nivel` enum('basico','intermedio','avanzado') DEFAULT 'basico',
	`activo` boolean NOT NULL DEFAULT true,
	`orden` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cursos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diplomas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`cursoId` int NOT NULL,
	`tipo` enum('participacion','aprobacion') NOT NULL,
	`codigoVerificacion` varchar(100) NOT NULL,
	`codigoQR` text,
	`pdfUrl` varchar(500),
	`fechaEmision` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diplomas_id` PRIMARY KEY(`id`),
	CONSTRAINT `diplomas_codigoVerificacion_unique` UNIQUE(`codigoVerificacion`)
);
--> statement-breakpoint
CREATE TABLE `encuestas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`cursoId` int NOT NULL,
	`calidadContenido` int NOT NULL,
	`claridadInstructor` int NOT NULL,
	`relevancia` int NOT NULL,
	`comentarios` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encuestas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluaciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cursoId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descripcion` text,
	`puntajeMinimo` int NOT NULL DEFAULT 70,
	`intentosMaximos` int NOT NULL DEFAULT 3,
	`tiempoEsperaHoras` int NOT NULL DEFAULT 24,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluaciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insignias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`descripcion` text,
	`iconoUrl` varchar(500),
	`criterio` text NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insignias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intentosEvaluacion` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`evaluacionId` int NOT NULL,
	`numeroIntento` int NOT NULL,
	`puntajeObtenido` int NOT NULL,
	`aprobado` boolean NOT NULL,
	`respuestas` text NOT NULL,
	`fechaIntento` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intentosEvaluacion_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificaciones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`tipo` enum('curso_nuevo','webinar','diploma','evaluacion','general') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`mensaje` text NOT NULL,
	`leida` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificaciones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `preguntas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluacionId` int NOT NULL,
	`textoPregunta` text NOT NULL,
	`opcionA` text NOT NULL,
	`opcionB` text NOT NULL,
	`opcionC` text NOT NULL,
	`opcionD` text NOT NULL,
	`respuestaCorrecta` enum('A','B','C','D') NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preguntas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `progresoCursos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agremiadoId` int NOT NULL,
	`cursoId` int NOT NULL,
	`videoId` int,
	`porcentajeCompletado` int NOT NULL DEFAULT 0,
	`completado` boolean NOT NULL DEFAULT false,
	`ultimaVisualizacion` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `progresoCursos_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_agremiado_curso` UNIQUE(`agremiadoId`,`cursoId`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cursoId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descripcion` text,
	`youtubeVideoId` varchar(100) NOT NULL,
	`duracionSegundos` int,
	`orden` int NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webinars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descripcion` text,
	`categoriaId` int,
	`fechaInicio` timestamp NOT NULL,
	`fechaFin` timestamp,
	`youtubeVideoId` varchar(100),
	`youtubeLiveId` varchar(100),
	`estado` enum('programado','en_vivo','finalizado','cancelado') NOT NULL DEFAULT 'programado',
	`activo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webinars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `agremiados` (`email`);--> statement-breakpoint
CREATE INDEX `numero_colegiado_idx` ON `agremiados` (`numeroColegiado`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `agremiadosInsignias` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `insignia_idx` ON `agremiadosInsignias` (`insigniaId`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `comentarios` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `comentarios` (`cursoId`);--> statement-breakpoint
CREATE INDEX `categoria_idx` ON `cursos` (`categoriaId`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `diplomas` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `diplomas` (`cursoId`);--> statement-breakpoint
CREATE INDEX `codigo_idx` ON `diplomas` (`codigoVerificacion`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `encuestas` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `encuestas` (`cursoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `evaluaciones` (`cursoId`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `intentosEvaluacion` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `evaluacion_idx` ON `intentosEvaluacion` (`evaluacionId`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `notificaciones` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `leida_idx` ON `notificaciones` (`leida`);--> statement-breakpoint
CREATE INDEX `evaluacion_idx` ON `preguntas` (`evaluacionId`);--> statement-breakpoint
CREATE INDEX `agremiado_idx` ON `progresoCursos` (`agremiadoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `progresoCursos` (`cursoId`);--> statement-breakpoint
CREATE INDEX `curso_idx` ON `videos` (`cursoId`);--> statement-breakpoint
CREATE INDEX `categoria_idx` ON `webinars` (`categoriaId`);--> statement-breakpoint
CREATE INDEX `estado_idx` ON `webinars` (`estado`);