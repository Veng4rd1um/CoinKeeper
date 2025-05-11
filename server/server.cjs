const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // Если вы используете JWT для authenticateToken
const bcrypt = require('bcryptjs'); // Для регистрации/логина, если еще нету
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key-for-jwt'; // ВАЖНО: Используйте переменную окружения

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Пути к файлам данных
const dataDir = path.join(__dirname, 'data');
const usersFilePath = path.join(dataDir, 'users.json');

// Функция для чтения пользователей (пример, адаптируйте)
const getUsers = () => {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([]));
        return [];
    }
    return JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
};

// Функция для сохранения пользователей (пример, адаптируйте)
const saveUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Middleware для аутентификации токена (ПРИМЕР - у вас может быть свой)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // Если нет токена

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            return res.sendStatus(403); // Неверный токен
        }
        req.user = user; // Добавляем payload токена (который должен содержать userId) в req
        next();
    });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = {
            id: uuidv4(),
            email,
            password: hashedPassword
        };
        users.push(newUser);
        saveUsers(users);

        // Создаем пустые файлы транзакций и категорий для нового пользователя
        const userTransactionsFilePath = path.join(dataDir, `transactions_${newUser.id}.json`);
        const userCategoriesFilePath = path.join(dataDir, `categories_${newUser.id}.json`);
        const userAccountsFilePath = path.join(dataDir, `accounts_${newUser.id}.json`); // И для счетов

        if (!fs.existsSync(userTransactionsFilePath)) {
            fs.writeFileSync(userTransactionsFilePath, JSON.stringify([]));
        }
        if (!fs.existsSync(userCategoriesFilePath)) {
            // Можно скопировать дефолтные категории или создать пустые
             const defaultCategoriesPath = path.join(dataDir, 'categories.json');
             if (fs.existsSync(defaultCategoriesPath)) {
                fs.copyFileSync(defaultCategoriesPath, userCategoriesFilePath);
             } else {
                fs.writeFileSync(userCategoriesFilePath, JSON.stringify({ income: [], expense: [] }));
             }
        }
        if (!fs.existsSync(userAccountsFilePath)) { // Создаем файл счетов с дефолтными счетами
            const defaultAccounts = [ // Пример дефолтных счетов
                { id: `acc_${uuidv4().slice(0,6)}`, name: "Cash", balance: 0, initialBalance: 0, userId: newUser.id },
                { id: `acc_${uuidv4().slice(0,6)}`, name: "Bank Card", balance: 0, initialBalance: 0, userId: newUser.id }
            ];
            fs.writeFileSync(userAccountsFilePath, JSON.stringify(defaultAccounts, null, 2));
        }


        res.status(201).json({ message: 'User registered successfully. Please log in.' });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials (user not found).' });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password mismatch).' });
        }

        const tokenPayload = { userId: user.id, email: user.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Токен на 1 час

        res.json({ token, userId: user.id, email: user.email });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- DATA ACCESS FUNCTIONS (helper functions to read/write user-specific data) ---
const getUserDataPath = (dataType, userId) => {
    return path.join(dataDir, `${dataType}_${userId}.json`);
};

const readUserData = (dataType, userId, defaultValue = []) => {
    const filePath = getUserDataPath(dataType, userId);
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error(`Error reading or parsing ${dataType} file for user ${userId}:`, e);
            return defaultValue; // Возвращаем значение по умолчанию при ошибке
        }
    }
    // Если это категории, значением по умолчанию должен быть объект
    if (dataType === 'categories') return { income: [], expense: [] };
    return defaultValue;
};

const writeUserData = (dataType, userId, data) => {
    const filePath = getUserDataPath(dataType, userId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// --- TRANSACTION ROUTES ---
app.get('/api/transactions', authenticateToken, (req, res) => {
    const transactions = readUserData('transactions', req.user.userId);
    res.json(transactions);
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const transactions = readUserData('transactions', req.user.userId);
    const newTransaction = { id: `txn_${uuidv4().slice(0,8)}`, ...req.body, userId: req.user.userId }; // Добавляем userId
    transactions.push(newTransaction);
    writeUserData('transactions', req.user.userId, transactions);

    // ОБНОВЛЕНИЕ БАЛАНСА СЧЕТА
    const accounts = readUserData('accounts', req.user.userId);
    const accountIndex = accounts.findIndex(acc => acc.id === newTransaction.accountId);
    if (accountIndex !== -1) {
        const amount = parseFloat(newTransaction.amount);
        if (newTransaction.type === 'income') {
            accounts[accountIndex].balance += amount;
        } else if (newTransaction.type === 'expense') {
            accounts[accountIndex].balance -= amount;
        }
        writeUserData('accounts', req.user.userId, accounts);
    } else {
        console.warn(`Account with ID ${newTransaction.accountId} not found for user ${req.user.userId} when adding transaction.`);
    }

    res.status(201).json(newTransaction);
});

app.put('/api/transactions/:id', authenticateToken, (req, res) => {
    let transactions = readUserData('transactions', req.user.userId);
    const transactionId = req.params.id;
    const transactionIndex = transactions.findIndex(t => t.id === transactionId && t.userId === req.user.userId);

    if (transactionIndex === -1) {
        return res.status(404).json({ message: 'Transaction not found or access denied.' });
    }

    const oldTransaction = { ...transactions[transactionIndex] }; // Копия для отката баланса
    const updatedTransaction = { ...transactions[transactionIndex], ...req.body };
    transactions[transactionIndex] = updatedTransaction;
    writeUserData('transactions', req.user.userId, transactions);

    // ОБНОВЛЕНИЕ БАЛАНСОВ СЧЕТОВ ПРИ ИЗМЕНЕНИИ ТРАНЗАКЦИИ
    const accounts = readUserData('accounts', req.user.userId);
    const oldAmount = parseFloat(oldTransaction.amount);
    const newAmount = parseFloat(updatedTransaction.amount);

    // Откатить старую транзакцию со старого счета (если счет изменился)
    const oldAccountIndex = accounts.findIndex(acc => acc.id === oldTransaction.accountId);
    if (oldAccountIndex !== -1) {
        if (oldTransaction.type === 'income') accounts[oldAccountIndex].balance -= oldAmount;
        else accounts[oldAccountIndex].balance += oldAmount;
    }

    // Применить новую транзакцию к новому (или тому же) счету
    const newAccountIndex = accounts.findIndex(acc => acc.id === updatedTransaction.accountId);
    if (newAccountIndex !== -1) {
        if (updatedTransaction.type === 'income') accounts[newAccountIndex].balance += newAmount;
        else accounts[newAccountIndex].balance -= newAmount;
    }
    writeUserData('accounts', req.user.userId, accounts);


    res.json(updatedTransaction);
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    let transactions = readUserData('transactions', req.user.userId);
    const transactionId = req.params.id;
    const transactionIndex = transactions.findIndex(t => t.id === transactionId && t.userId === req.user.userId);
    
    if (transactionIndex === -1) {
        return res.status(404).json({ message: 'Transaction not found or access denied.' });
    }

    const deletedTransaction = transactions.splice(transactionIndex, 1)[0]; // Удаляем и получаем удаленный элемент
    writeUserData('transactions', req.user.userId, transactions);

    // ОБНОВЛЕНИЕ БАЛАНСА СЧЕТА ПОСЛЕ УДАЛЕНИЯ ТРАНЗАКЦИИ
    const accounts = readUserData('accounts', req.user.userId);
    const accountIndex = accounts.findIndex(acc => acc.id === deletedTransaction.accountId);
    if (accountIndex !== -1) {
        const amount = parseFloat(deletedTransaction.amount);
        if (deletedTransaction.type === 'income') {
            accounts[accountIndex].balance -= amount; // Уменьшаем баланс при удалении дохода
        } else if (deletedTransaction.type === 'expense') {
            accounts[accountIndex].balance += amount; // Увеличиваем баланс при удалении расхода
        }
        writeUserData('accounts', req.user.userId, accounts);
    }

    res.status(204).send();
});


// --- CATEGORY ROUTES ---
app.get('/api/categories', authenticateToken, (req, res) => {
    const categories = readUserData('categories', req.user.userId, { income: [], expense: [] });
    res.json(categories);
});

app.post('/api/categories', authenticateToken, (req, res) => {
    const categories = readUserData('categories', req.user.userId, { income: [], expense: [] });
    const { type, name, color, icon } = req.body; // type: 'income' or 'expense'

    if (!type || !name || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Category type and name are required.' });
    }

    const newCategory = {
        id: `cat_${type.slice(0,3)}_${uuidv4().slice(0,6)}`,
        name,
        color: color || (type === 'income' ? '#4caf50' : '#f44336'), // Default colors
        icon: icon || 'QuestionMarkCircleIcon' // Default icon
    };

    if (categories[type].find(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ message: `Category "${name}" already exists in ${type}.` });
    }

    categories[type].push(newCategory);
    writeUserData('categories', req.user.userId, categories);
    res.status(201).json(newCategory); // Возвращаем созданную категорию
});

app.put('/api/categories/:type/:id', authenticateToken, (req, res) => {
    const categories = readUserData('categories', req.user.userId, { income: [], expense: [] });
    const { type, id } = req.params;
    const { name, color, icon } = req.body;

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Invalid category type.' });
    }

    const categoryIndex = categories[type].findIndex(cat => cat.id === id);
    if (categoryIndex === -1) {
        return res.status(404).json({ message: 'Category not found.' });
    }

    // Проверка на дубликат имени при изменении, исключая саму себя
    if (name && categories[type].find(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ message: `Category "${name}" already exists in ${type}.` });
    }

    categories[type][categoryIndex] = {
        ...categories[type][categoryIndex],
        name: name || categories[type][categoryIndex].name,
        color: color || categories[type][categoryIndex].color,
        icon: icon || categories[type][categoryIndex].icon,
    };
    writeUserData('categories', req.user.userId, categories);
    res.json(categories[type][categoryIndex]);
});

app.delete('/api/categories/:type/:id', authenticateToken, (req, res) => {
    const categories = readUserData('categories', req.user.userId, { income: [], expense: [] });
    const transactions = readUserData('transactions', req.user.userId);
    const { type, id } = req.params;

    if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ message: 'Invalid category type.' });
    }
    
    // Проверка, используется ли категория в транзакциях
    const isCategoryUsed = transactions.some(transaction => transaction.categoryId === id);
    if (isCategoryUsed) {
        return res.status(400).json({ message: 'Cannot delete category. It is currently used in transactions. Please reassign or delete those transactions first.' });
    }

    const initialLength = categories[type].length;
    categories[type] = categories[type].filter(cat => cat.id !== id);

    if (categories[type].length === initialLength) {
        return res.status(404).json({ message: 'Category not found.' });
    }

    writeUserData('categories', req.user.userId, categories);
    res.status(204).send();
});


// --- ACCOUNT ROUTES ---
app.get('/api/accounts', authenticateToken, (req, res) => {
    const accounts = readUserData('accounts', req.user.userId);
    res.json(accounts);
});

app.post('/api/accounts', authenticateToken, (req, res) => {
    const accounts = readUserData('accounts', req.user.userId);
    const { name, initialBalance } = req.body;

    if (name === undefined || typeof initialBalance !== 'number') {
        return res.status(400).json({ message: 'Account name and a numeric initial balance are required.' });
    }
    if (!name.trim()) {
        return res.status(400).json({ message: 'Account name cannot be empty.' });
    }
    if (accounts.some(acc => acc.name.toLowerCase() === name.trim().toLowerCase())) {
        return res.status(409).json({ message: `Account with name "${name.trim()}" already exists.` });
    }

    const newAccount = {
        id: `acc_${uuidv4().slice(0, 6)}`,
        name: name.trim(),
        balance: initialBalance,
        initialBalance: initialBalance,
        userId: req.user.userId
    };
    accounts.push(newAccount);
    writeUserData('accounts', req.user.userId, accounts);
    res.status(201).json(newAccount);
});

app.put('/api/accounts/:id', authenticateToken, (req, res) => {
    const accounts = readUserData('accounts', req.user.userId);
    const accountId = req.params.id;
    const { name, initialBalance } = req.body; // На клиенте initialBalance может быть балансом

    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) {
        return res.status(404).json({ message: 'Account not found.' });
    }

    const updatedAccount = { ...accounts[accountIndex] };

    if (name !== undefined) {
        if (!name.trim()) return res.status(400).json({ message: 'Account name cannot be empty.' });
        if (accounts.some(acc => acc.id !== accountId && acc.name.toLowerCase() === name.trim().toLowerCase())) {
            return res.status(409).json({ message: `Another account with name "${name.trim()}" already exists.` });
        }
        updatedAccount.name = name.trim();
    }

    if (initialBalance !== undefined && typeof initialBalance === 'number') {
        // При обновлении счета, 'initialBalance' от клиента может означать новый текущий баланс,
        // или же именно изменение начального баланса.
        // Здесь важно решить, как это обрабатывать.
        // Вариант 1: Клиент передает новый *текущий* баланс, и мы просто его устанавливаем.
        //            Это упрощает, но отвязывает initialBalance от его первоначального смысла.
        // Вариант 2: Клиент передает новый *начальный* баланс, и мы должны пересчитать текущий баланс
        //            на основе всех транзакций. Это сложнее, но более корректно.
        // Вариант 3: Не позволять изменять баланс напрямую через этот эндпоинт, только имя.
        //            Баланс меняется только транзакциями.
        //
        // Для простоты сейчас сделаем так: если initialBalance пришел, обновляем и initialBalance, и balance.
        // НО! В DashboardPage и TransactionModal баланс счета отображается как `balance`.
        // При редактировании счета в AccountModal мы передаем `initialBalance` (или `balance`, если `initialBalance` нет).
        // Сервер должен решить, что делать.
        // Если мы позволяем редактировать `initialBalance` И он влияет на `balance`, то
        // при изменении `initialBalance` нужно пересчитать `balance` по всем транзакциям этого счета.
        // ЭТО СЛОЖНО с текущей файловой структурой без базы данных.

        // Простой вариант: обновляем initialBalance, и если это ЕДИНСТВЕННОЕ изменение,
        // то это может быть использовано для корректировки баланса.
        // Если же `balance` рассчитывается строго по транзакциям + `initialBalance`,
        // то изменение `initialBalance` здесь должно влечь пересчет.

        // Сейчас: если пришел initialBalance, обновляем его. И обновляем balance, если он равен initialBalance (как при создании)
        // или если это единственное переданное поле (подразумевается корректировка).
        // Это НЕ ИДЕАЛЬНО. Баланс должен строго считаться по транзакциям и initialBalance.
        const diff = initialBalance - updatedAccount.initialBalance;
        updatedAccount.initialBalance = initialBalance;
        // Если initialBalance меняется, это должно отразиться на текущем балансе,
        // как если бы начальная сумма была другой.
        updatedAccount.balance += diff; 
    }

    accounts[accountIndex] = updatedAccount;
    writeUserData('accounts', req.user.userId, accounts);
    res.json(updatedAccount);
});

app.delete('/api/accounts/:id', authenticateToken, (req, res) => {
    let accounts = readUserData('accounts', req.user.userId);
    const transactions = readUserData('transactions', req.user.userId);
    const accountId = req.params.id;

    // Проверка, используется ли счет в транзакциях
    if (transactions.some(t => t.accountId === accountId)) {
        return res.status(400).json({ message: 'Cannot delete account. It has associated transactions. Please reassign or delete them first.' });
    }

    const initialLength = accounts.length;
    accounts = accounts.filter(acc => acc.id !== accountId);

    if (accounts.length === initialLength) {
        return res.status(404).json({ message: 'Account not found.' });
    }

    writeUserData('accounts', req.user.userId, accounts);
    res.status(204).send();
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Проверка и создание папки data, если ее нет
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
        console.log(`Created directory: ${dataDir}`);
    }
    // Проверка и создание users.json, если его нет
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([]));
        console.log(`Created file: ${usersFilePath}`);
    }
    // Проверка и создание categories.json (дефолтный), если его нет
    const defaultCategoriesPath = path.join(dataDir, 'categories.json');
    if (!fs.existsSync(defaultCategoriesPath)) {
        const defaultCategories = {
          "income": [
            { "id": "cat_inc_1", "name": "Salary", "color": "#22c55e", "icon": "BuildingLibraryIcon" },
            { "id": "cat_inc_2", "name": "Freelance", "color": "#3b82f6", "icon": "ComputerDesktopIcon" },
            { "id": "cat_inc_3", "name": "Gifts", "color": "#eab308", "icon": "GiftIcon" }
          ],
          "expense": [
            { "id": "cat_exp_1", "name": "Groceries", "color": "#f97316", "icon": "ShoppingCartIcon" },
            { "id": "cat_exp_2", "name": "Transport", "color": "#0ea5e9", "icon": "TruckIcon" },
            { "id": "cat_exp_3", "name": "Entertainment", "color": "#a855f7", "icon": "TicketIcon" },
            { "id": "cat_exp_4", "name": "Utilities", "color": "#ef4444", "icon": "HomeModernIcon" }
          ]
        };
        fs.writeFileSync(defaultCategoriesPath, JSON.stringify(defaultCategories, null, 2));
        console.log(`Created file: ${defaultCategoriesPath}`);
    }
});