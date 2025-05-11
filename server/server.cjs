// server/server.cjs
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const {
    readDataFile,
    writeDataFile,
    ensureDataDirExists,
    uuidv4,
    defaultCategoryIconName, // УБЕДИТЕСЬ, что это экспортируется из dataUtils.cjs
    // Если defaultCategoryIconName не экспортируется из dataUtils, раскомментируйте следующую строку:
    // defaultCategoryIconName: defaultCategoryIconNameFromUtils // и используйте ее ниже
} = require('./utils/dataUtils.cjs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-coinkeeper';

// Если defaultCategoryIconName не импортируется из dataUtils.cjs, определите его здесь:
// const defaultCategoryIconName = 'QuestionMarkCircleIcon';
// И определите цвет по умолчанию тоже здесь, если он нужен для старых категорий:
const defaultCategoryColor = 'bg-slate-500'; // Соответствует defaultNewQuickCategoryColor на фронте

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

// Initialize data directory
ensureDataDirExists().catch(console.error);

// --- Authentication Middleware ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            const users = await readDataFile('users.json');
            req.user = users.find(u => u.id === decoded.userId);

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            const { password, ...userWithoutPassword } = req.user;
            req.user = userWithoutPassword;

            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- AUTH ROUTES ---
// Register User
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        const users = await readDataFile('users.json');
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = {
            id: uuidv4(),
            email,
            password: hashedPassword
        };

        users.push(newUser);
        await writeDataFile('users.json', users);
        await writeDataFile(`categories_${newUser.id}.json`, { income: [], expense: [] });
        await writeDataFile(`transactions_${newUser.id}.json`, []);

        res.status(201).json({ message: 'User registered successfully. Please log in.' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const users = await readDataFile('users.json');
        const user = users.find(u => u.email === email);

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
            res.json({
                token,
                userId: user.id,
                email: user.email
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- CATEGORY ROUTES ---
// Get all categories for the logged-in user
app.get('/api/categories', protect, async (req, res) => {
    try {
        const categories = await readDataFile(`categories_${req.user.id}.json`);
        // Убедимся, что у всех категорий есть поля icon и color, если они отсутствуют
        const ensureDefaults = (catTypeArray) => (catTypeArray || []).map(cat => ({
            ...cat,
            color: cat.color || defaultCategoryColor, // Добавляем цвет по умолчанию
            icon: cat.icon || defaultCategoryIconName // Добавляем иконку по умолчанию
        }));

        const categoriesWithDefaults = {
            income: ensureDefaults(categories.income),
            expense: ensureDefaults(categories.expense)
        };
        res.json(categoriesWithDefaults);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// Add a new category
app.post('/api/categories', protect, async (req, res) => {
    const { type, name, color, icon } = req.body;
    if (!type || !name || !color || (type !== 'income' && type !== 'expense')) {
        // Icon не является обязательным при создании, если есть значение по умолчанию
        return res.status(400).json({ message: 'Invalid category data. Type (income/expense), name, and color are required.' });
    }

    try {
        const userCategoriesFile = `categories_${req.user.id}.json`;
        const categories = await readDataFile(userCategoriesFile);

        if (!categories[type]) { // Если массив для данного типа не существует, создаем его
            categories[type] = [];
        }
        if (categories[type].some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ message: `Category '${name}' already exists for ${type}.` });
        }

        const newCategory = {
            id: `cat_${type.slice(0,3)}_${uuidv4().slice(0,6)}`,
            name,
            color,
            icon: icon || defaultCategoryIconName
        };
        categories[type].push(newCategory);
        await writeDataFile(userCategoriesFile, categories);
        res.status(201).json(newCategory); // Возвращаем созданную категорию со всеми полями
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category' });
    }
});

// Update a category
app.put('/api/categories/:type/:id', protect, async (req, res) => {
    const { type, id } = req.params;
    const { name, color, icon } = req.body;

    if (!name || !color || (type !== 'income' && type !== 'expense')) {
        // Icon не обязателен при обновлении, если не передан - не меняем
        return res.status(400).json({ message: 'Invalid data. Name and color are required.' });
    }

    try {
        const userCategoriesFile = `categories_${req.user.id}.json`;
        const categories = await readDataFile(userCategoriesFile);

        if (!categories[type]) {
            return res.status(404).json({ message: 'Category not found (invalid type specified)' });
        }

        const categoryIndex = categories[type].findIndex(cat => cat.id === id);
        if (categoryIndex === -1) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (categories[type].some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== id)) {
            return res.status(400).json({ message: `Another category with name '${name}' already exists for this type.` });
        }

        const categoryToUpdate = categories[type][categoryIndex];
        categoryToUpdate.name = name;
        categoryToUpdate.color = color;
        if (icon) { // Обновляем иконку, только если она была передана
            categoryToUpdate.icon = icon;
        }
        // Если icon не был передан, старое значение categoryToUpdate.icon сохранится
        // Если нужно установить иконку по умолчанию, если передали пустую строку:
        // else if (icon === '') { categoryToUpdate.icon = defaultCategoryIconName; }


        await writeDataFile(userCategoriesFile, categories);
        res.json(categoryToUpdate); // Возвращаем обновленную категорию
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Error updating category' });
    }
});

// Delete a category
app.delete('/api/categories/:type/:id', protect, async (req, res) => {
    const { type, id } = req.params;
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Invalid category type.' });
    }
    try {
        const userCategoriesFile = `categories_${req.user.id}.json`;
        const categories = await readDataFile(userCategoriesFile);

        if (!categories[type]) {
            return res.status(404).json({ message: 'Category not found or type is incorrect.' });
        }

        const initialLength = categories[type].length;
        categories[type] = categories[type].filter(cat => cat.id !== id);

        if (categories[type].length === initialLength) {
            return res.status(404).json({ message: 'Category not found' });
        }
        await writeDataFile(userCategoriesFile, categories);
        res.status(200).json({ message: 'Category deleted successfully', id });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Error deleting category' });
    }
});


// --- TRANSACTION ROUTES ---
// (Остаются без изменений, так как они не связаны напрямую с полями icon/color категории,
// они работают с categoryId. Фронтенд отвечает за обогащение транзакций данными категории)
// Get all transactions for the logged-in user
app.get('/api/transactions', protect, async (req, res) => {
    try {
        const transactions = await readDataFile(`transactions_${req.user.id}.json`);
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Add a new transaction
app.post('/api/transactions', protect, async (req, res) => {
    const { type, amount, categoryId, date, comment } = req.body;
    if (!type || !amount || !categoryId || !date || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ message: 'Invalid transaction data.' });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    try {
        const userCategoriesFile = `categories_${req.user.id}.json`;
        const categoriesData = await readDataFile(userCategoriesFile);
        const categoryExists = categoriesData[type]?.find(cat => cat.id === categoryId);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Selected category does not exist or is of wrong type.' });
        }

        const userTransactionsFile = `transactions_${req.user.id}.json`;
        const transactions = await readDataFile(userTransactionsFile);
        const newTransaction = {
            id: `txn_${uuidv4().slice(0,8)}`,
            type,
            amount: parseFloat(amount),
            categoryId,
            date: new Date(date).toISOString(),
            comment: comment || '',
            userId: req.user.id
        };
        transactions.push(newTransaction);
        await writeDataFile(userTransactionsFile, transactions);
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Add transaction error:", error);
        res.status(500).json({ message: 'Error adding transaction' });
    }
});

// Update a transaction
app.put('/api/transactions/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { type, amount, categoryId, date, comment } = req.body;

    if (!type || !amount || !categoryId || !date || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({ message: 'Invalid transaction data for update.' });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    try {
        if (categoryId) {
            const userCategoriesFile = `categories_${req.user.id}.json`;
            const categoriesData = await readDataFile(userCategoriesFile);
            const categoryExists = categoriesData[type]?.find(cat => cat.id === categoryId);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Selected category does not exist or is of wrong type for update.' });
            }
        }

        const userTransactionsFile = `transactions_${req.user.id}.json`;
        const transactions = await readDataFile(userTransactionsFile);
        const transactionIndex = transactions.findIndex(t => t.id === id);

        if (transactionIndex === -1) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        transactions[transactionIndex] = {
            ...transactions[transactionIndex],
            type,
            amount: parseFloat(amount),
            categoryId,
            date: new Date(date).toISOString(),
            comment: comment || ''
        };
        await writeDataFile(userTransactionsFile, transactions);
        res.json(transactions[transactionIndex]);
    } catch (error)
    {
        console.error("Update transaction error:", error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

// Delete a transaction
app.delete('/api/transactions/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const userTransactionsFile = `transactions_${req.user.id}.json`;
        const transactions = await readDataFile(userTransactionsFile);

        const initialLength = transactions.length;
        const updatedTransactions = transactions.filter(t => t.id !== id);

        if (updatedTransactions.length === initialLength) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await writeDataFile(userTransactionsFile, updatedTransactions);
        res.status(200).json({ message: 'Transaction deleted successfully', id });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ message: 'Error deleting transaction' });
    }
});


// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack || err);
    res.status(500).json({ message: 'Something broke on the server!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});