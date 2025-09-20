const express = require('express');
const multer = require('multer');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_2024';

// Variables de entorno para base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'creditos_academicos',
    port: process.env.DB_PORT || 3306
};

// Para Railway, Heroku u otros servicios cloud
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig.host = url.hostname;
    dbConfig.user = url.username;
    dbConfig.password = url.password;
    dbConfig.database = url.pathname.substring(1);
    dbConfig.port = url.port || 3306;
}

let db;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de multer para archivos (compatible con servicios cloud)
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const uploadDir = path.join(__dirname, 'uploads', year.toString(), month);
        
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const correlativo = req.body.correlativo || Date.now();
        const extension = path.extname(file.originalname);
        const safeFilename = `${correlativo}_${Date.now()}${extension}`;
        cb(null, safeFilename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf', 
            'image/jpeg', 
            'image/png', 
            'image/jpg'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// Inicializar base de datos
async function initializeDatabase() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a MySQL');
        
        // Crear base de datos si no existe (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
            await db.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
            await db.execute(`USE ${dbConfig.database}`);
        }
        
        // Crear tabla de registros
        await db.execute(`
            CREATE TABLE IF NOT EXISTS registros_academicos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                correlativo VARCHAR(50) UNIQUE NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                nombre VARCHAR(200) NOT NULL,
                telefono VARCHAR(20) NOT NULL,
                numero_colegiado VARCHAR(50) NOT NULL,
                estado_colegiacion ENUM('Activo', 'Inactivo') NOT NULL,
                nombre_actividad TEXT NOT NULL,
                horas_actividad DECIMAL(6,2) NOT NULL,
                fecha_actividad DATE NOT NULL,
                creditos_obtenidos DECIMAL(8,2) NOT NULL,
                observaciones TEXT,
                archivo_constancia VARCHAR(255) NOT NULL,
                tipo_archivo VARCHAR(50) NOT NULL,
                tamaño_archivo BIGINT NOT NULL,
                ruta_archivo VARCHAR(500) NOT NULL,
                estado_registro ENUM('Pendiente', 'Aprobado', 'Rechazado') DEFAULT 'Pendiente',
                fecha_procesamiento TIMESTAMP NULL,
                procesado_por VARCHAR(100),
                INDEX idx_correlativo (correlativo),
                INDEX idx_colegiado (numero_colegiado),
                INDEX idx_fecha (fecha_registro)
            )
        `);
        
        // Crear tabla de administradores
        await db.execute(`
            CREATE TABLE IF NOT EXISTS usuarios_admin (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nombre_completo VARCHAR(200) NOT NULL,
                ultimo_acceso TIMESTAMP NULL,
                activo BOOLEAN DEFAULT TRUE
            )
        `);
        
        // Crear usuario admin por defecto si no existe
        const [adminExists] = await db.execute('SELECT * FROM usuarios_admin WHERE usuario = ?', ['admin']);
        if (adminExists.length === 0) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ColegioPsicologos2024', 10);
            await db.execute(
                'INSERT INTO usuarios_admin (usuario, password_hash, nombre_completo) VALUES (?, ?, ?)',
                ['admin', hashedPassword, 'Administrador Sistema']
            );
            console.log('✅ Usuario administrador creado');
        }
        
        console.log('✅ Base de datos inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar base de datos:', error);
        
        // Si no puede conectar, usar modo de prueba
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️ Iniciando en modo de prueba sin base de datos');
            db = null;
        } else {
            process.exit(1);
        }
    }
}

// Middleware de autenticación
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Generar correlativo
function generarCorrelativo() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `CPG-${año}${mes}-${timestamp}`;
}

// Actualizar Excel automáticamente
async function actualizarExcel() {
    if (!db) return;
    
    try {
        await fs.mkdir('datos', { recursive: true });
        
        const workbook = new ExcelJS.Workbook();
        let worksheet;
        
        try {
            await workbook.xlsx.readFile('datos/creditos_academicos.xlsx');
            worksheet = workbook.getWorksheet('Registros');
        } catch (error) {
            worksheet = workbook.addWorksheet('Registros');
            
            const headers = [
                'Correlativo', 'Fecha Registro', 'Nombre', 'Teléfono', 'Colegiado',
                'Estado', 'Actividad', 'Horas', 'Créditos', 'Fecha Actividad',
                'Observaciones', 'Archivo', 'Tipo Archivo', 'Tamaño (MB)', 'Ruta'
            ];
            
            worksheet.addRow(headers);
            
            worksheet.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: '2F75B5' }
                };
            });
        }
        
        const [registros] = await db.execute(`
            SELECT * FROM registros_academicos 
            ORDER BY fecha_registro DESC
        `);
        
        if (worksheet.rowCount > 1) {
            worksheet.spliceRows(2, worksheet.rowCount);
        }
        
        registros.forEach(registro => {
            worksheet.addRow([
                registro.correlativo,
                registro.fecha_registro,
                registro.nombre,
                registro.telefono,
                registro.numero_colegiado,
                registro.estado_colegiacion,
                registro.nombre_actividad,
                registro.horas_actividad,
                registro.creditos_obtenidos,
                registro.fecha_actividad,
                registro.observaciones || '',
                registro.archivo_constancia,
                registro.tipo_archivo,
                (registro.tamaño_archivo / 1024 / 1024).toFixed(2),
                registro.ruta_archivo
            ]);
        });
        
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
        
        await workbook.xlsx.writeFile('datos/creditos_academicos.xlsx');
        console.log('✅ Excel actualizado automáticamente');
        
    } catch (error) {
        console.error('❌ Error al actualizar Excel:', error);
    }
}

// RUTAS DE LA API

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Información del servidor
app.get('/api/info', (req, res) => {
    res.json({
        status: 'online',
        service: 'Sistema de Créditos Académicos',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: db ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Login de administrador
app.post('/api/admin/login', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Base de datos no disponible' });
    }
    
    try {
        const { usuario, password } = req.body;
        
        const [users] = await db.execute(
            'SELECT * FROM usuarios_admin WHERE usuario = ? AND activo = TRUE',
            [usuario]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        await db.execute(
            'UPDATE usuarios_admin SET ultimo_acceso = NOW() WHERE id = ?',
            [user.id]
        );
        
        const token = jwt.sign(
            { id: user.id, usuario: user.usuario },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({
            success: true,
            token,
            usuario: {
                id: user.id,
                usuario: user.usuario,
                nombre: user.nombre_completo
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear nuevo registro
app.post('/api/registros', upload.single('constancia'), async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Base de datos no disponible' });
    }
    
    try {
        const {
            nombre, telefono, numero_colegiado, estado_colegiacion,
            nombre_actividad, horas_actividad, fecha_actividad, observaciones
        } = req.body;
        
        const archivo = req.file;
        if (!archivo) {
            return res.status(400).json({ error: 'Archivo de constancia requerido' });
        }
        
        const correlativo = generarCorrelativo();
        const creditos_obtenidos = (parseFloat(horas_actividad) / 16).toFixed(2);
        
        const [result] = await db.execute(`
            INSERT INTO registros_academicos 
            (correlativo, nombre, telefono, numero_colegiado, estado_colegiacion,
             nombre_actividad, horas_actividad, fecha_actividad, creditos_obtenidos,
             observaciones, archivo_constancia, tipo_archivo, tamaño_archivo, ruta_archivo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            correlativo, nombre, telefono, numero_colegiado, estado_colegiacion,
            nombre_actividad, horas_actividad, fecha_actividad, creditos_obtenidos,
            observaciones || '', archivo.originalname, archivo.mimetype, archivo.size, archivo.path
        ]);
        
        // Actualizar Excel automáticamente
        await actualizarExcel();
        
        console.log(`✅ Registro creado: ${correlativo}`);
        
        res.json({
            success: true,
            correlativo: correlativo,
            id: result.insertId,
            creditos: creditos_obtenidos,
            mensaje: 'Registro guardado exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error al crear registro:', error);
        res.status(500).json({ error: 'Error al procesar registro' });
    }
});

// Obtener estadísticas públicas
app.get('/api/estadisticas', async (req, res) => {
    if (!db) {
        return res.json({
            totalRegistros: 0,
            totalCreditos: '0.00',
            totalHoras: 0,
            colegiadosActivos: 0
        });
    }
    
    try {
        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_registros,
                SUM(creditos_obtenidos) as total_creditos,
                SUM(horas_actividad) as total_horas,
                COUNT(CASE WHEN estado_colegiacion = 'Activo' THEN 1 END) as colegiados_activos
            FROM registros_academicos
        `);
        
        res.json({
            totalRegistros: stats[0].total_registros || 0,
            totalCreditos: parseFloat(stats[0].total_creditos || 0).toFixed(2),
            totalHoras: stats[0].total_horas || 0,
            colegiadosActivos: stats[0].colegiados_activos || 0
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Obtener todos los registros (solo admin)
app.get('/api/admin/registros', authenticateAdmin, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Base de datos no disponible' });
    }
    
    try {
        const [registros] = await db.execute(`
            SELECT * FROM registros_academicos 
            ORDER BY fecha_registro DESC
        `);
        
        res.json(registros);
        
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    }
});

// Descargar Excel completo (solo admin)
app.get('/api/admin/excel', authenticateAdmin, async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Base de datos no disponible' });
    }
    
    try {
        await actualizarExcel();
        const filePath = path.join(__dirname, 'datos/creditos_academicos.xlsx');
        res.download(filePath, `creditos_academicos_${new Date().toISOString().split('T')[0]}.xlsx`);
        
    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ error: 'Error al generar Excel' });
    }
});

// Manejo de errores
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo demasiado grande (máximo 10MB)' });
        }
    }
    
    if (error.message === 'Tipo de archivo no permitido') {
        return res.status(400).json({ error: 'Tipo de archivo no permitido' });
    }
    
    console.error('Error no manejado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
        console.log(`🌐 Acceso: http://localhost:${PORT}`);
        console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log('📊 Panel admin: Ctrl+Shift+A');
    });
}

startServer();

// Manejo graceful de cierre
process.on('SIGTERM', async () => {
    console.log('🔄 Cerrando servidor...');
    if (db) {
        await db.end();
    }
    process.exit(0);
});