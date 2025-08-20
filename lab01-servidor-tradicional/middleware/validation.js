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