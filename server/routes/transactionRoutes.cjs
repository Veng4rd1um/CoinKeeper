// server/routes/transactionRoutes.cjs
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware.cjs');

const router = express.Router();

const getTransactionsFilePath = (userId) => path.join(__dirname, '..', 'data', `transactions_${userId}.json`);
const getCategoriesFilePath = (userId) => path.join(__dirname, '..', 'data', `categories_${userId}.json`); // Для обогащения

const readUserTransactions = async (userId) => {
    const filePath = getTransactionsFilePath(userId);
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeUserTransactions(userId, []); // Создаем пустой файл, если не существует
            return [];
        }
        console.error(`Error reading transactions for user ${userId}:`, error);
        throw error;
    }
};

const writeUserTransactions = async (userId, data) => {
    const filePath = getTransactionsFilePath(userId);
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

// Вспомогательная функция для чтения категорий пользователя (уже есть в categoryRoutes, но для независимости)
const readUserCategoriesForEnrichment = async (userId) => {
    const filePath = getCategoriesFilePath(userId);
    try {
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf-8');
        return data ? JSON.parse(data) : { income: [], expense: [] };
    } catch (error) {
        if (error.code === 'ENOENT') return { income: [], expense: [] }; // Если нет файла категорий, не страшно
        console.warn(`Warning: Could not read categories for enrichment for user ${userId}:`, error.message);
        return { income: [], expense: [] }; // Возвращаем пустую структуру, чтобы не ломать обогащение
    }
};


// GET all transactions FOR A USER
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const transactions = await readUserTransactions(userId);
        const categories = await readUserCategoriesForEnrichment(userId);

        const enrichedTransactions = transactions.map(t => {
            const categoryList = categories[t.type] || [];
            const category = categoryList.find(c => c.id === t.categoryId);
            return {
                ...t,
                categoryName: category ? category.name : 'Без категории' // Изменено на "Без категории"
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(enrichedTransactions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching transactions", error: error.message });
    }
});

// POST a new transaction FOR A USER
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, amount, categoryId, date, comment } = req.body;

        if (!type || !amount || !categoryId || !date || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ message: "Invalid transaction data. Type, amount, categoryId, date are required." });
        }
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number." });
        }

        const userCategories = await readUserCategoriesForEnrichment(userId);
        const categoryExists = (userCategories[type] || []).some(cat => cat.id === categoryId);
        if (!categoryExists) {
            return res.status(400).json({ message: "Category not found for this user." });
        }

        const transactions = await readUserTransactions(userId);
        const newTransaction = {
            id: `txn_${uuidv4().slice(0,8)}`, // Префикс для ID транзакций
            type,
            amount: parseFloat(amount),
            categoryId,
            date: new Date(date).toISOString(),
            comment: comment || ""
        };
        transactions.push(newTransaction);
        await writeUserTransactions(userId, transactions);

        const category = (userCategories[type] || []).find(c => c.id === categoryId);
        res.status(201).json({
            ...newTransaction,
            categoryName: category ? category.name : 'Без категории'
        });
    } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).json({ message: "Error adding transaction", error: error.message });
    }
});

// PUT (update) a transaction FOR A USER
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { type, amount, categoryId, date, comment } = req.body;

        if (!type || !amount || !categoryId || !date || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ message: "Invalid transaction data for update." });
        }
        if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number for update." });
        }

        const userCategories = await readUserCategoriesForEnrichment(userId);
        const categoryExists = (userCategories[type] || []).some(cat => cat.id === categoryId);
        if (!categoryExists) {
            return res.status(400).json({ message: "Category not found for this user for update." });
        }

        let transactions = await readUserTransactions(userId);
        const transactionIndex = transactions.findIndex(t => t.id === id);

        if (transactionIndex === -1) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const updatedTransaction = {
            ...transactions[transactionIndex], // Сохраняем оригинальный ID
            type,
            amount: parseFloat(amount),
            categoryId,
            date: new Date(date).toISOString(),
            comment: comment || ""
        };
        transactions[transactionIndex] = updatedTransaction;
        await writeUserTransactions(userId, transactions);

        const category = (userCategories[type] || []).find(c => c.id === categoryId);
        res.status(200).json({
            ...updatedTransaction,
            categoryName: category ? category.name : 'Без категории'
        });
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
});

// DELETE a transaction FOR A USER
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        let transactions = await readUserTransactions(userId);
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== id);

        if (transactions.length === initialLength) {
            return res.status(404).json({ message: "Transaction not found to delete" });
        }

        await writeUserTransactions(userId, transactions);
        res.status(200).json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ message: "Error deleting transaction", error: error.message });
    }
});

module.exports = router;