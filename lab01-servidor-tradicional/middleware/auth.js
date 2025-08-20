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