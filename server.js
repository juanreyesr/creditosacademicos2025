const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Datos temporales en memoria (para probar)
let registros = [];
let correlativoCounter = 1001;

// Función para generar correlativo
function generarCorrelativo() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const numero = String(correlativoCounter++).padStart(4, '0');
    return `CPG-${año}${mes}-${numero}`;
}

// Ruta principal - HTML del sistema
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Créditos Académicos</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 { 
            text-align: center; 
            color: #2c3e50; 
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .status { 
            background: #27ae60; 
            color: white; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center; 
            margin: 20px 0;
            font-size: 1.2em;
        }
        .form-group { 
            margin: 20px 0; 
        }
        label { 
            display: block; 
            margin-bottom: 8px; 
            color: #2c3e50; 
            font-weight: bold;
        }
        input, select, textarea { 
            width: 100%; 
            padding: 15px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            font-size: 1em;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #3498db;
        }
        .btn { 
            background: #3498db; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 1.1em;
            width: 100%;
            margin: 10px 0;
        }
        .btn:hover { 
            background: #2980b9; 
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #3498db;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
        }
        .credits-display {
            background: #e8f6f3;
            border-left: 4px solid #27ae60;
            padding: 15px;
            margin: 20px 0;
        }
        .credits-number {
            font-size: 1.5em;
            font-weight: bold;
            color: #27ae60;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Sistema de Créditos Académicos</h1>
        <p style="text-align: center; font-size: 1.1em; color: #666; margin-bottom: 30px;">
            Colegio de Psicólogos de Guatemala
        </p>
        
        <div class="status">
            ✅ Sistema funcionando correctamente en Railway
        </div>

        <form id="registroForm">
            <div class="form-group">
                <label for="nombre">Nombre Completo *</label>
                <input type="text" id="nombre" name="nombre" required>
            </div>

            <div class="form-group">
                <label for="telefono">Teléfono *</label>
                <input type="tel" id="telefono" name="telefono" required>
            </div>

            <div class="form-group">
                <label for="colegiado">Número de Colegiado *</label>
                <input type="text" id="colegiado" name="colegiado" required>
            </div>

            <div class="form-group">
                <label for="estado">Estado de Colegiación *</label>
                <select id="estado" name="estado" required>
                    <option value="">Seleccione...</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select>
            </div>

            <div class="form-group">
                <label for="actividad">Actividad Académica *</label>
                <input type="text" id="actividad" name="actividad" required>
            </div>

            <div class="form-group">
                <label for="horas">Horas de la Actividad *</label>
                <input type="number" id="horas" name="horas" min="1" step="0.5" required>
            </div>

            <div class="form-group">
                <label for="fecha">Fecha de la Actividad *</label>
                <input type="date" id="fecha" name="fecha" required>
            </div>

            <div class="credits-display">
                <h4>Cálculo de Créditos Académicos</h4>
                <p>Un crédito = 16 horas de educación</p>
                <div class="credits-number" id="creditosCalculados">
                    Créditos: 0.00
                </div>
            </div>

            <div class="form-group">
                <label for="observaciones">Observaciones</label>
                <textarea id="observaciones" name="observaciones" rows="3"></textarea>
            </div>

            <button type="submit" class="btn">📝 Registrar Actividad</button>
        </form>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="totalRegistros">0</div>
                <div>Total Registros</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalCreditos">0.00</div>
                <div>Total Créditos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalHoras">0</div>
                <div>Total Horas</div>
            </div>
        </div>

        <div id="resultado" style="display: none; margin-top: 30px;"></div>
    </div>

    <script>
        // Calcular créditos automáticamente
        document.getElementById('horas').addEventListener('input', function() {
            const horas = parseFloat(this.value) || 0;
            const creditos = (horas / 16).toFixed(2);
            document.getElementById('creditosCalculados').textContent = 'Créditos: ' + creditos;
        });

        // Procesar formulario
        document.getElementById('registroForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                nombre: document.getElementById('nombre').value,
                telefono: document.getElementById('telefono').value,
                numero_colegiado: document.getElementById('colegiado').value,
                estado_colegiacion: document.getElementById('estado').value,
                nombre_actividad: document.getElementById('actividad').value,
                horas_actividad: document.getElementById('horas').value,
                fecha_actividad: document.getElementById('fecha').value,
                observaciones: document.getElementById('observaciones').value
            };

            try {
                const response = await fetch('/api/registros', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('resultado').innerHTML = 
                        '<div class="status">' +
                        '<h3>✅ Registro Exitoso</h3>' +
                        '<p><strong>Correlativo:</strong> ' + result.correlativo + '</p>' +
                        '<p><strong>Créditos:</strong> ' + result.creditos + '</p>' +
                        '<p>Su solicitud ha sido registrada correctamente.</p>' +
                        '</div>';
                    document.getElementById('resultado').style.display = 'block';
                    
                    // Limpiar formulario
                    this.reset();
                    document.getElementById('creditosCalculados').textContent = 'Créditos: 0.00';
                    
                    // Actualizar estadísticas
                    cargarEstadisticas();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error al procesar registro: ' + error.message);
            }
        });

        // Cargar estadísticas
        async function cargarEstadisticas() {
            try {
                const response = await fetch('/api/estadisticas');
                const stats = await response.json();
                
                document.getElementById('totalRegistros').textContent = stats.totalRegistros;
                document.getElementById('totalCreditos').textContent = stats.totalCreditos;
                document.getElementById('totalHoras').textContent = stats.totalHoras;
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }
        }

        // Cargar estadísticas al inicio
        cargarEstadisticas();
    </script>
</body>
</html>
    `);
});

// API - Información del servidor
app.get('/api/info', (req, res) => {
    res.json({
        status: 'online',
        service: 'Sistema de Créditos Académicos',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// API - Crear registro
app.post('/api/registros', (req, res) => {
    try {
        const {
            nombre, telefono, numero_colegiado, estado_colegiacion,
            nombre_actividad, horas_actividad, fecha_actividad, observaciones
        } = req.body;
        
        // Validaciones básicas
        if (!nombre || !telefono || !numero_colegiado || !estado_colegiacion || !nombre_actividad || !horas_actividad || !fecha_actividad) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const correlativo = generarCorrelativo();
        const creditos_obtenidos = (parseFloat(horas_actividad) / 16).toFixed(2);
        
        const registro = {
            id: Date.now(),
            correlativo: correlativo,
            fecha_registro: new Date().toISOString(),
            nombre,
            telefono,
            numero_colegiado,
            estado_colegiacion,
            nombre_actividad,
            horas_actividad: parseFloat(horas_actividad),
            fecha_actividad,
            creditos_obtenidos: parseFloat(creditos_obtenidos),
            observaciones: observaciones || ''
        };
        
        registros.push(registro);
        
        console.log('Registro creado:', correlativo);
        
        res.json({
            success: true,
            correlativo: correlativo,
            id: registro.id,
            creditos: creditos_obtenidos,
            mensaje: 'Registro guardado exitosamente'
        });
        
    } catch (error) {
        console.error('Error al crear registro:', error);
        res.status(500).json({ error: 'Error al procesar registro' });
    }
});

// API - Estadísticas
app.get('/api/estadisticas', (req, res) => {
    const totalRegistros = registros.length;
    const totalCreditos = registros.reduce((sum, reg) => sum + reg.creditos_obtenidos, 0).toFixed(2);
    const totalHoras = registros.reduce((sum, reg) => sum + reg.horas_actividad, 0);
    const colegiadosActivos = registros.filter(reg => reg.estado_colegiacion === 'Activo').length;
    
    res.json({
        totalRegistros,
        totalCreditos,
        totalHoras,
        colegiadosActivos
    });
});

// API - Login admin (simplificado)
app.post('/api/admin/login', (req, res) => {
    const { usuario, password } = req.body;
    
    if (usuario === 'admin' && password === (process.env.ADMIN_PASSWORD || 'ColegioPsicologos2024')) {
        res.json({
            success: true,
            token: 'admin-token-simplificado',
            usuario: {
                id: 1,
                usuario: 'admin',
                nombre: 'Administrador'
            }
        });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// API - Obtener registros (admin)
app.get('/api/admin/registros', (req, res) => {
    // Verificación simple de token
    const auth = req.headers.authorization;
    if (!auth || !auth.includes('admin-token')) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    
    res.json(registros);
});

// Manejar rutas no encontradas
app.get('*', (req, res) => {
    res.redirect('/');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('✅ Sistema funcionando correctamente');
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada:', reason);
});
