const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/database');
const { ipKeyGenerator } = require('express-rate-limit');

const userRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: (req) => {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, jwtSecret);
                return decoded.id || decoded.email || ipKeyGenerator(req); 
            } catch (err) {
                return ipKeyGenerator(req);  aqui
            }
        }
        return ipKeyGenerator(req);
    },
    message: { success: false, message: 'Limite de requisições atingido para este usuário.' }
});

module.exports = userRateLimiter;