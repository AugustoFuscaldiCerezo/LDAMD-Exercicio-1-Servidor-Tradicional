const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const userRateLimiter = require('../middleware/rateLimitUser');
const { number } = require('joi');
const { sendPaginatedResponse } = require('../utils/response');
const { getTasksWithFilter } = require('../services/taskService');

const router = express.Router();
const tasksCache = {};

// Todas as rotas requerem autenticação
//router.use(authMiddleware);
router.use(authMiddleware, userRateLimiter);

// Listar tarefas
router.get('/', async (req, res) => {
    try {
        const { completed, priority, page = 1, limit = 10 } = req.query;
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

        sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(Number(limit));
        params.push((Number(page) - 1) * Number(limit));

        const rows = await database.all(sql, params);
        const countSql = 'SELECT COUNT(*) as total FROM tasks WHERE userId = ?' +
            (completed !== undefined ? ' AND completed = ?' : '') +
            (priority ? ' AND priority = ?' : '');
        const countParams = [req.user.id];
        if (completed !== undefined) countParams.push(completed === 'true' ? 1 : 0);
        if (priority) countParams.push(priority);
        const countRow = await database.get(countSql, countParams);

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            success: true,
            data: rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: countRow ? countRow.total : 0
            }
        }, null, 2));
        console.log(`[${new Date().toISOString()}] Tarefas listadas para o usuário: ${req.user.username}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao listar tarefas para o usuário: ${req.user.username}`, error.message);
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
        console.log(`[${new Date().toISOString()}] Tarefa criada: ${task.id} ${task.title}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao criar tarefa`, error.message);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefas por descrição
router.get('/by-description', async (req, res) => {
    try {
        const { description} = req.query;
        if (!description) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "description" é obrigatório (ex: test)'
            });
        }

        const { rows, countRow, page, limit } = await getTasksWithFilter({
            userId: req.user.id,
            filterSql: 'AND description LIKE ?',
            filterParams: [`%${description}%`],
            query: req.query
        });

        console.log(`[${new Date().toISOString()}] Tarefas listadas para o usuário: ${req.user.username}`);
        return sendPaginatedResponse(res, rows, countRow, page, limit);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao buscar tarefas por descrição:`, error.message);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefas por data
router.get('/by-date', async (req, res) => {
    try {

        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "date" é obrigatório (ex: 2025-08-12 ou 2025-08)'
            });
        }

        const { rows, countRow, page, limit } = await getTasksWithFilter({
            userId: req.user.id,
            filterSql: 'AND createdAt LIKE ?',
            filterParams: [`${date}%`],
            query: req.query
        });

        console.log(`[${new Date().toISOString()}] Tarefas listadas para o usuário: ${req.user.username}`);
        return sendPaginatedResponse(res, rows, countRow, page, limit);
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao buscar tarefas por data:`, error.message);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefas por prioridade
router.get('/by-priority', async (req, res) => {
    try {

        const { priority } = req.query;
        if (!priority) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "priority" é obrigatório (ex: urgent, high, medium, low)'
            });

        }

        const { rows, countRow, page, limit } = await getTasksWithFilter({
            userId: req.user.id,
            filterSql: 'AND priority = ?',
            filterParams: [priority],
            query: req.query
        });

        console.log(`[${new Date().toISOString()}] Tarefas listadas para o usuário: ${req.user.username}`);
        return sendPaginatedResponse(res, rows, countRow, page, limit);
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao buscar tarefas por prioridade:`, error.message);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefa por ID
router.get('/:id', async (req, res) => {
    try {
        if (tasksCache[req.params.id]) {
            return res.json({
                success: true,
                data: tasksCache[req.params.id].toJSON(),
                message: 'Tarefa encontrada no cache'
            });
        }

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

        const task = new Task({ ...row, completed: row.completed === 1 });
        if (!tasksCache[req.params.id]) {
            tasksCache[req.params.id] = task;
            const cacheKeys = Object.keys(tasksCache);
            //O cache está em apenas 5 para facilitar os testes
            if (cacheKeys.length > 5) {
                delete tasksCache[cacheKeys[0]];
            }
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            success: true,
            data: row,
        }, null, 2));
        console.log(`[${new Date().toISOString()}] Tarefa buscada: ${req.params.id} (Cache: ${tasksCache[req.params.id] ? 'Hit' : 'Miss'})`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao buscar tarefa: ${req.params.id}`, error.message);
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

        const task = new Task({ ...updatedRow, completed: updatedRow.completed === 1 });

        
        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
        console.log(`[${new Date().toISOString()}] Tarefa atualizada: ${req.params.id}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao atualizar tarefa: ${req.params.id}`, error.message);
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
        console.log(`[${new Date().toISOString()}] Tarefa deletada: ${req.params.id}`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro ao deletar tarefa: ${req.params.id}`, error.message);
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