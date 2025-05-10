const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });
console.log("JWT_SECRET in server.cjs after config:", process.env.JWT_SECRET);
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Пути к файлам роутов теперь должны быть корректными для require
const transactionRoutes = require('./routes/transactionRoutes.cjs'); // Node должен найти transactionRoutes.cjs
const categoryRoutes = require('./routes/categoryRoutes.cjs');
const authRoutes = require('./routes/authRoutes.cjs');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.send('CoinKeeper API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});