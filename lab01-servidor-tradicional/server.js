const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/database');
const database = require('./database/database');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

/**
 * Servidor de Aplicação Tradicional
 * 
 * Implementa arquitetura cliente-servidor conforme Coulouris et al. (2012):
 * - Centralização do estado da aplicação
 * - Comunicação Request-Reply via HTTP
 * - Processamento síncrono das requisições
 */

const app = express();

// Middleware de segurança
app.use(helmet());
app.use(rateLimit(config.rateLimit));
app.use(cors());

// Parsing de dados
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging de requisições aprimorado
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        let statusMsg = 'Sucesso';
        if (res.statusCode === 401) statusMsg = 'Falha de autentificação';
        if (res.statusCode === 404) statusMsg = 'Endpoint não encontrado';
        if (res.statusCode === 500) statusMsg = 'Erro interno do Servidor';
        console.log(
            `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - status: ${res.statusCode} - ${statusMsg} - tempo: ${duration}ms - IP: ${req.ip}`
        );
    });
    next();
});

// Rotas principais
app.get('/', (req, res) => {
    res.json({
        service: 'Task Management API',
        version: '1.0.0',
        architecture: 'Traditional Client-Server',
        endpoints: {
            auth: ['POST /api/auth/register', 'POST /api/auth/login'],
            tasks: ['GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id', 'DELETE /api/tasks/:id']
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/simular-erro', (req, res) => {
    throw new Error('Erro interno simulado para teste');
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

// Error handler global
app.use((error, req, res, next) => {
    console.error('Erro:', {
        mensagem: error.message,
        stack: error.stack,
        metodo: req.method,
        url: req.originalUrl,
        body: req.body,
        usuario: req.user ? req.user : null,
        ip: req.ip
    });
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

// Inicialização
async function startServer() {
    try {
        await database.init();

        app.listen(config.port, () => {
            console.log('🚀 =================================');
            console.log(`🚀 Servidor iniciado na porta ${config.port}`);
            console.log(`🚀 URL: http://localhost:${config.port}`);
            console.log(`🚀 Health: http://localhost:${config.port}/health`);
            console.log('🚀 =================================');
        });
    } catch (error) {
        console.error('❌ Falha na inicialização:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;