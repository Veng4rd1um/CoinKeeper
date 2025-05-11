// server/routes/categoryRoutes.cjs
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware.cjs');

const router = express.Router();

const getCategoriesFilePath = (userId) => path.join(__dirname, '..', 'data', `categories_${userId}.json`);

const readUserCategories = async (userId) => {
    const filePath = getCategoriesFilePath(userId);
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return data ? JSON.parse(data) : { income: [], expense: [] };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Если файл не существует, создаем его с пустой структурой
            const initialData = { income: [], expense: [] };
            await writeUserCategories(userId, initialData);
            return initialData;
        }
        console.error(`Error reading categories for user ${userId}:`, error);
        throw error;
    }
};

const writeUserCategories = async (userId, data) => {
    const filePath = getCategoriesFilePath(userId);
    const dir = path.dirname(filePath);
    try {
        await fs.access(dir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dir, { recursive: true });
        } else {
            throw error;
        }
    }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// GET all categories FOR A USER
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const categories = await readUserCategories(userId);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
});

// POST a new category FOR A USER
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, name } = req.body;
        if (!type || !name || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ message: "Invalid category data. 'type' (income/expense) and 'name' are required." });
        }

        const categories = await readUserCategories(userId);
        const newCategory = { id: `cat_${type.slice(0,3)}_${uuidv4().slice(0,6)}`, name }; // Укороченный ID

        if (!categories[type]) { // На всякий случай, если структура нарушена
            categories[type] = [];
        }
        categories[type].push(newCategory);
        await writeUserCategories(userId, categories);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: "Error adding category", error: error.message });
    }
});

// PUT (Update) a category FOR A USER
router.put('/:type/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, id } = req.params;
        const { name } = req.body;

        if (!name || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ message: "Invalid category data for update." });
        }

        const categories = await readUserCategories(userId);
        if (!categories[type]) {
            return res.status(404).json({ message: "Category type not found" });
        }

        const categoryIndex = categories[type].findIndex(cat => cat.id === id);
        if (categoryIndex === -1) {
            return res.status(404).json({ message: "Category not found" });
        }

        categories[type][categoryIndex].name = name.trim();
        await writeUserCategories(userId, categories);
        res.status(200).json(categories[type][categoryIndex]);
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
});

// DELETE a category FOR A USER
router.delete('/:type/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, id } = req.params;
        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ message: "Invalid category type." });
        }

        const categories = await readUserCategories(userId);
        if (!categories[type]) {
            return res.status(404).json({ message: "Category type not found" });
        }

        const initialLength = categories[type].length;
        categories[type] = categories[type].filter(cat => cat.id !== id);

        if (categories[type].length === initialLength) {
            return res.status(404).json({ message: "Category not found to delete" });
        }

        await writeUserCategories(userId, categories);
        // Также нужно обновить транзакции, где использовалась эта категория (сделать categoryId = null или 'deleted')
        // Это более сложная операция, для MVP пока пропустим, но в реальном приложении важно.
        // Можно просто удалить категорию, а на фронте обрабатывать транзакции с несуществующим categoryId.
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
});

module.exports = router;