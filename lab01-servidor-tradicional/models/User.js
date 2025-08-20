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