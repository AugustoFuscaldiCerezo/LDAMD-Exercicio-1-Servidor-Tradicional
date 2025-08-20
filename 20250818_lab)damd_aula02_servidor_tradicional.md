# Roteiro 1: Servidor de Aplicação Tradicional

**Laboratório de Desenvolvimento de Aplicações Móveis e Distribuídas**  
**Curso de Engenharia de Software - PUC Minas**

---

## Objetivos

- Implementar um servidor HTTP tradicional usando Node.js e Express
- Compreender os fundamentos de APIs REST e sistemas cliente-servidor
- Gerenciar estado de aplicação de forma centralizada
- Implementar operações CRUD com autenticação JWT
- Estabelecer base para comparação com arquiteturas distribuídas

## Fundamentação Teórica

Segundo Coulouris et al. (2012), "um sistema distribuído é aquele no qual os componentes de hardware ou software localizados em computadores em rede se comunicam e coordenam suas ações apenas por meio de passagem de mensagens" <sup>[1]</sup>. 

A arquitetura cliente-servidor tradicional representa o modelo mais básico de sistema distribuído, onde:
- **Cliente**: Solicita serviços e recursos
- **Servidor**: Fornece serviços centralizados
- **Comunicação**: HTTP Request-Reply (Tanenbaum & Van Steen, 2017) <sup>[2]</sup>

### Características da Arquitetura

**Vantagens:**
- Simplicidade de desenvolvimento e deploy
- Controle centralizado de dados e estado
- Consistência garantida (transações ACID)

**Limitações:**
- Ponto único de falha
- Escalabilidade vertical limitada
- Possível gargalo de performance

## Cenário do Laboratório

Sistema de gerenciamento de tarefas (To-Do List) implementado como monólito, demonstrando os fundamentos de sistemas distribuídos através de comunicação HTTP/REST.

## Pré-requisitos

- Node.js 16+ e NPM
- Editor de código (VS Code)
- Postman ou similar para testes

---

## **PASSO 1: Configuração Inicial do Projeto**

### 1.1 Criar Estrutura do Projeto

```bash
mkdir lab01-servidor-tradicional
cd lab01-servidor-tradicional
npm init -y
```

### 1.2 Instalar Dependências

```bash
# Dependências principais
npm install express sqlite3 cors body-parser uuid joi bcryptjs jsonwebtoken helmet express-rate-limit

# Dependências de desenvolvimento  
npm install --save-dev nodemon jest supertest
```

### 1.3 Estrutura de Diretórios

```
lab01-servidor-tradicional/
├── package.json
├── server.js                 # Servidor principal
├── config/
│   └── database.js          # Configuração do banco
├── models/
│   ├── User.js              # Modelo de usuário
│   └── Task.js              # Modelo de tarefa
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── users.js             # Rotas de usuários
│   └── tasks.js             # Rotas de tarefas
├── middleware/
│   ├── auth.js              # Middleware de autenticação
│   └── validation.js        # Middleware de validação
├── database/
    └── database.js          # Manager do banco SQLite
```

---

## **PASSO 2: Implementação do Banco de Dados**

### 2.1 Database Manager (`database/database.js`)

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'tasks.db');
        this.db = null;
    }

    async init() {
        this.db = new sqlite3.Database(this.dbPath);
        await this.createTables();
        console.log('✅ Database inicializado');
    }

    async createTables() {
        const userTable = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`;

        const taskTable = `
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                completed INTEGER DEFAULT 0,
                priority TEXT DEFAULT 'medium',
                userId TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users (id)
            )`;

        return Promise.all([
            this.run(userTable),
            this.run(taskTable)
        ]);
    }

    // Métodos auxiliares para promisificar SQLite
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new Database();
```

### 2.2 Configuração (`config/database.js`)

```javascript
module.exports = {
    // Configurações do servidor
    port: process.env.PORT || 3000,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET || 'seu-secret-aqui',
    jwtExpiration: '24h',
    
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000 // máximo 1000 requests por IP
    }
};
```

---

## **PASSO 3: Implementação dos Modelos**

### 3.1 Modelo de Usuário (`models/User.js`)

```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.username = data.username;
        this.password = data.password;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.createdAt = data.createdAt;
    }

    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 12);
    }

    async comparePassword(candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    }

    generateToken() {
        return jwt.sign(
            { id: this.id, email: this.email, username: this.username },
            config.jwtSecret,
            { expiresIn: config.jwtExpiration }
        );
    }

    toJSON() {
        const { password, ...user } = this;
        return user;
    }
}

module.exports = User;
```

### 3.2 Modelo de Tarefa (`models/Task.js`)

```javascript
class Task {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description || '';
        this.completed = data.completed || false;
        this.priority = data.priority || 'medium';
        this.userId = data.userId;
        this.createdAt = data.createdAt;
    }

    validate() {
        const errors = [];
        if (!this.title?.trim()) errors.push('Título é obrigatório');
        if (!this.userId) errors.push('Usuário é obrigatório');
        return { isValid: errors.length === 0, errors };
    }

    toJSON() {
        return { ...this };
    }
}

module.exports = Task;
```

---

## **PASSO 4: Middleware de Autenticação e Validação**

### 4.1 Middleware de Autenticação (`middleware/auth.js`)

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/database');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso obrigatório' 
        });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token inválido' 
        });
    }
};

module.exports = { authMiddleware };
```

### 4.2 Middleware de Validação (`middleware/validation.js`)

```javascript
const Joi = require('joi');

const schemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(6).required(),
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required()
    }),

    login: Joi.object({
        identifier: Joi.string().required(),
        password: Joi.string().required()
    }),

    task: Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(1000).allow(''),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
    })
};

const validate = (schemaName) => (req, res, next) => {
    const { error, value } = schemas[schemaName].validate(req.body);
    
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: error.details.map(detail => detail.message)
        });
    }
    
    req.body = value;
    next();
};

module.exports = { validate };
```

---

## **PASSO 5: Implementação das Rotas**

### 5.1 Rotas de Autenticação (`routes/auth.js`)

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const database = require('../database/database');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Registrar usuário
router.post('/register', validate('register'), async (req, res) => {
    try {
        const { email, username, password, firstName, lastName } = req.body;

        // Verificar se usuário já existe
        const existingUser = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email ou username já existe'
            });
        }

        // Criar usuário
        const userData = { id: uuidv4(), email, username, password, firstName, lastName };
        const user = new User(userData);
        await user.hashPassword();

        await database.run(
            'INSERT INTO users (id, email, username, password, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, user.email, user.username, user.password, user.firstName, user.lastName]
        );

        const token = user.generateToken();

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Login
router.post('/login', validate('login'), async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const userData = await database.get(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );

        if (!userData) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const user = new User(userData);
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        const token = user.generateToken();

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
```

### 5.2 Rotas de Tarefas (`routes/tasks.js`)

```javascript
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar tarefas
router.get('/', async (req, res) => {
    try {
        const { completed, priority } = req.query;
        let sql = 'SELECT * FROM tasks WHERE userId = ?';
        const params = [req.user.id];

        if (completed !== undefined) {
            sql += ' AND completed = ?';
            params.push(completed === 'true' ? 1 : 0);
        }
        
        if (priority) {
            sql += ' AND priority = ?';
            params.push(priority);
        }

        sql += ' ORDER BY createdAt DESC';

        const rows = await database.all(sql, params);
        const tasks = rows.map(row => new Task({...row, completed: row.completed === 1}));

        res.json({
            success: true,
            data: tasks.map(task => task.toJSON())
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Criar tarefa
router.post('/', validate('task'), async (req, res) => {
    try {
        const taskData = { 
            id: uuidv4(), 
            ...req.body, 
            userId: req.user.id 
        };
        
        const task = new Task(taskData);
        const validation = task.validate();
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validation.errors
            });
        }

        await database.run(
            'INSERT INTO tasks (id, title, description, priority, userId) VALUES (?, ?, ?, ?, ?)',
            [task.id, task.title, task.description, task.priority, task.userId]
        );

        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefa por ID
router.get('/:id', async (req, res) => {
    try {
        const row = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({...row, completed: row.completed === 1});
        res.json({
            success: true,
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority } = req.body;
        
        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const updatedRow = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        const task = new Task({...updatedRow, completed: updatedRow.completed === 1});
        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Deletar tarefa
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Estatísticas
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM tasks WHERE userId = ?
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;
```

---

## **PASSO 6: Servidor Principal**

### 6.1 Implementação do Servidor (`server.js`)

```javascript
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

// Logging de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
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

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado'
    });
});

// Error handler global
app.use((error, req, res, next) => {
    console.error('Erro:', error);
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
```

---

## **PASSO 7: Configuração de Scripts**

### 7.1 Atualizar Package.json

```json
{
  "name": "lab01-servidor-tradicional",
  "version": "1.0.0",
  "description": "Sistema de tarefas com arquitetura cliente-servidor tradicional",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": ["sistemas-distribuidos", "cliente-servidor", "rest-api"],
  "author": "Aluno PUC Minas",
  "license": "MIT"
}
```

---

## **PASSO 8: Execução e Testes**

### 8.1 Executar o Servidor

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

### 8.2 Testar com cURL

```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","username":"testuser","password":"123456","firstName":"João","lastName":"Silva"}'

# 2. Fazer login (salvar o token retornado)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@test.com","password":"123456"}'

# 3. Criar tarefa (usar token do login)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha Tarefa","description":"Descrição","priority":"high"}'

# 4. Listar tarefas
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## **PASSO 9: Análise e Documentação**

### 9.1 Análise Arquitetural

**Características Implementadas:**
- ✅ Arquitetura monolítica centralizada
- ✅ API REST com operações CRUD
- ✅ Autenticação JWT stateless
- ✅ Validação de dados robusta
- ✅ Persistência com SQLite

**Métricas de Performance Esperadas:**
- Latência: ~30-50ms por requisição
- Throughput: ~500-1000 req/sec
- Memória: ~50-100MB

**Limitações Identificadas:**
- Escalabilidade limitada (vertical apenas)
- Ponto único de falha
- Estado centralizado
- Sem distribuição de carga

### 9.2 Comparação com Próximas Arquiteturas

| Aspecto | Tradicional | gRPC | Microsserviços | Serverless |
|---------|-------------|------|----------------|------------|
| **Complexidade** | Baixa | Média | Alta | Média |
| **Performance** | Baseline | +60% | Variável | Variável |
| **Escalabilidade** | Limitada | Boa | Excelente | Automática |
| **Manutenção** | Simples | Média | Complexa | Mínima |

## Exercícios Complementares

1. **Implementar Paginação**: Adicionar suporte a paginação na listagem de tarefas
2. **Cache em Memória**: Implementar cache simples para consultas frequentes
3. **Logs Estruturados**: Adicionar sistema de logging mais robusto
4. **Rate Limiting por Usuário**: Implementar limites específicos por usuário
5. **Filtros Avançados**: Adicionar filtros por data, categoria, tags

## Entregáveis

- [ ] Código fonte completo e funcional
- [ ] API REST com todas as operações CRUD
- [ ] Sistema de autenticação JWT
- [ ] Documentação da API (endpoints e payloads)
- [ ] Análise de performance básica
- [ ] Identificação de limitações arquiteturais

## Comandos de Execução

```bash
# Setup
npm install

# Desenvolvimento
npm run dev

# Produção
npm start
```

## Referências

<sup>[1]</sup> COULOURIS, George; DOLLIMORE, Jean; KINDBERG, Tim; BLAIR, Gordon. **Distributed Systems: Concepts and Design**. 5th ed. Boston: Pearson, 2012.

<sup>[2]</sup> TANENBAUM, Andrew S.; VAN STEEN, Maarten. **Distributed Systems: Principles and Paradigms**. 3rd ed. Boston: Pearson, 2017.

---

## Próximos Passos

Este roteiro estabelece a **base arquitetural** para os laboratórios seguintes:

- **Roteiro 2**: Migração para comunicação gRPC (performance e type safety)
- **Roteiro 3**: Decomposição em microsserviços (escalabilidade e resiliência)  
- **Roteiro 4**: Implementação serverless (auto-scaling e zero-ops)

### Questões para Responder

1. **Escalabilidade**: Como esta arquitetura se comportaria com 1000 usuários simultâneos?
2. **Disponibilidade**: Quais são os pontos de falha identificados?
3. **Performance**: Onde estão os possíveis gargalos do sistema?
4. **Manutenção**: Como seria o processo de atualização em produção?
5. **Evolução**: Que mudanças seriam necessárias para suportar múltiplas regiões?
