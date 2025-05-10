// server/config.cjs
const dotenv = require('dotenv');
const path = require('path');

// Убедимся, что путь к .env файлу правильный относительно этого файла
// Если config.cjs в server/, то .env в server/
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Или если .env в корне проекта, а config.cjs в server/
// dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
// Но вы указали path: './server/.env' в server.cjs, что значит .env в server/

module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '24h'
};