// server/routes/authRoutes.cjs
console.log("JWT_SECRET in authRoutes.cjs:", process.env.JWT_SECRET);
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

const readUsers = async () => {
    try {
        await fs.access(usersFilePath); // Проверяем существование файла
        const data = await fs.readFile(usersFilePath, 'utf-8');
        return data ? JSON.parse(data) : []; // Если файл пуст, возвращаем []
    } catch (error) {
        if (error.code === 'ENOENT') { // Файл не найден
            await fs.writeFile(usersFilePath, JSON.stringify([], null, 2), 'utf-8'); // Создаем пустой файл
            return [];
        }
        console.error("Error reading users file:", error);
        throw error; // Перебрасываем другие ошибки
    }
};

const writeUsers = async (data) => {
    await fs.writeFile(usersFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email и пароль обязательны" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
        }

        const users = await readUsers();
        const candidate = users.find(user => user.email === email);
        if (candidate) {
            return res.status(400).json({ message: "Пользователь с таким email уже существует" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = { id: uuidv4(), email, password: hashedPassword };
        users.push(newUser);
        await writeUsers(users);

        res.status(201).json({ message: "Пользователь успешно зарегистрирован" });
    } catch (e) {
        console.error("Register error:", e);
        res.status(500).json({ message: "Ошибка сервера при регистрации" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email и пароль обязательны" });
        }

        const users = await readUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: "Пользователь с таким email не найден" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Неверный пароль" });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ token, userId: user.id, email: user.email });
    } catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ message: "Ошибка сервера при входе" });
    }
});

module.exports = router;