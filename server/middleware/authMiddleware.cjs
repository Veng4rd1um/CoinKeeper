// server/middleware/authMiddleware.cjs
console.log("JWT_SECRET in authMiddleware.cjs:", process.env.JWT_SECRET);
const jwt = require('jsonwebtoken');
// JWT_SECRET будет взят из process.env благодаря dotenv в server.cjs
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Пользователь не авторизован: токен отсутствует" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        console.error("Auth middleware error:", e.message);
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Пользователь не авторизован: срок действия токена истек" });
        }
        if (e.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Пользователь не авторизован: невалидный токен" });
        }
        return res.status(401).json({ message: "Пользователь не авторизован: общая ошибка токена" });
    }
};