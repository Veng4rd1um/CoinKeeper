// src/api/index.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Transactions API
export const fetchTransactions = () => apiClient.get('/transactions');
export const addTransaction = (transactionData) => apiClient.post('/transactions', transactionData);
export const updateTransaction = (id, transactionData) => apiClient.put(`/transactions/${id}`, transactionData);
export const deleteTransaction = (id) => apiClient.delete(`/transactions/${id}`);

// Categories API
export const fetchCategories = () => apiClient.get('/categories');
export const addCategory = (categoryData) => apiClient.post('/categories', categoryData);
export const updateCategory = (type, id, categoryData) => apiClient.put(`/categories/${type}/${id}`, categoryData);
export const deleteCategoryAPI = (type, id) => apiClient.delete(`/categories/${type}/${id}`);

export default apiClient; // Экспортируем сам инстанс axios для прямых вызовов, если нужно