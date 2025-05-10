// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/ui/Button.jsx';
import TransactionModal from '../components/transactions/TransactionModal.jsx';
import {
    fetchTransactions,
    addTransaction as apiAddTransaction,
    updateTransaction as apiUpdateTransaction,
    deleteTransaction as apiDeleteTransaction,
    fetchCategories
} from '../api/index.js';
import {
    PlusCircleIcon, CurrencyDollarIcon, PencilSquareIcon, ExclamationTriangleIcon, TagIcon as DefaultCategoryIcon
} from '@heroicons/react/24/outline';

const defaultCategoryColorHEX = '#6b7280'; // HEX для gray-500 (цвет для "Без категории" или если цвет не найден)

const formatCurrency = (amount, currency = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 2 }).format(amount);
};
const formatDateForDisplay = (isoDateString) => {
    if (!isoDateString) return 'N/A';
    const date = new Date(isoDateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const DashboardPage = () => {
    const [currentBalance, setCurrentBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [allCategoriesData, setAllCategoriesData] = useState({ income: [], expense: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [transactionsRes, categoriesRes] = await Promise.all([
                fetchTransactions(),
                fetchCategories()
            ]);

            const fetchedCategories = categoriesRes.data || { income: [], expense: [] };
            setAllCategoriesData(fetchedCategories);

            const categoryMap = {};
            fetchedCategories.income.forEach(cat => categoryMap[cat.id] = cat);
            fetchedCategories.expense.forEach(cat => categoryMap[cat.id] = cat);

            const enrichedTransactions = (transactionsRes.data || []).map(t => {
                const category = categoryMap[t.categoryId];
                return {
                    ...t,
                    categoryName: category?.name || 'Без категории',
                    categoryColor: category?.color || defaultCategoryColorHEX // Используем HEX цвет
                };
            });
            setTransactions(enrichedTransactions);

        } catch (err) {
            console.error("Failed to load initial data:", err);
            setError(err.response?.data?.message || "Не удалось загрузить данные. Попробуйте обновить страницу.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        const newBalance = transactions.reduce((acc, t) => {
            const amount = parseFloat(t.amount);
            return t.type === 'income' ? acc + amount : acc - amount;
        }, 0);
        setCurrentBalance(newBalance);
    }, [transactions]);

    const openAddModal = () => {
        setTransactionToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (transaction) => {
        const originalTransaction = transactions.find(t => t.id === transaction.id);
        setTransactionToEdit(originalTransaction ? { ...originalTransaction } : null); // Передаем копию
        setIsModalOpen(true);
    };


    const closeModal = () => {
        setIsModalOpen(false);
        setTransactionToEdit(null);
    };

    const handleFormSubmit = async (transactionData) => {
        try {
            if (transactionToEdit) {
                await apiUpdateTransaction(transactionToEdit.id, transactionData);
            } else {
                await apiAddTransaction(transactionData);
            }
            loadInitialData();
            closeModal();
        } catch (err) {
            console.error("Failed to save transaction:", err);
            alert(`Ошибка сохранения транзакции: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (window.confirm("Вы уверены, что хотите удалить эту транзакцию?")) {
            try {
                await apiDeleteTransaction(transactionId);
                loadInitialData();
                closeModal();
            } catch (err) {
                console.error("Failed to delete transaction:", err);
                alert(`Ошибка удаления транзакции: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const TransactionItem = ({ transaction, onEdit }) => {
        const isIncome = transaction.type === 'income';
        const amountColor = isIncome ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark';
        const sign = isIncome ? '+' : '-';
        const categoryColorHEX = transaction.categoryColor || defaultCategoryColorHEX;

        return (
            <li className="bg-surface dark:bg-surface-dark p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-150 ease-in-out group">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1 border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: categoryColorHEX }}
                        ></span>
                        <div>
                            <p className="text-sm font-medium text-text dark:text-text-dark">{transaction.categoryName}</p>
                            <p className="text-xs text-text-muted dark:text-text-dark_muted truncate max-w-[150px] sm:max-w-xs md:max-w-sm" title={transaction.comment}>
                                {transaction.comment || 'Без описания'}
                            </p>
                            <p className="text-xs text-text-muted dark:text-text-dark_muted mt-0.5">{formatDateForDisplay(transaction.date)}</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className={`text-md font-semibold ${amountColor} whitespace-nowrap`}>
                            {sign} {formatCurrency(parseFloat(transaction.amount), 'RUB').replace('₽', '').trim()} <span className="text-xs">₽</span>
                        </p>
                        <button
                            onClick={() => onEdit(transaction)}
                            className="mt-1 text-xs text-text-muted dark:text-text-dark_muted hover:text-primary dark:hover:text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            title="Редактировать транзакцию"
                        >
                            <PencilSquareIcon className="h-4 w-4 inline mr-1"/> Редактировать
                        </button>
                    </div>
                </div>
            </li>
        );
    };

    // ... остальной JSX без изменений (isLoading, error, Balance, Add Button, List/Empty State, Modal)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-lg text-text-muted dark:text-text-dark_muted">Загрузка данных...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 px-6 bg-error/10 dark:bg-error-dark/20 rounded-lg shadow border border-error/30 dark:border-error-dark/50">
                <ExclamationTriangleIcon className="h-12 w-12 text-error dark:text-error-dark mx-auto mb-3" />
                <h3 className="text-lg font-medium text-error dark:text-error-dark">{error}</h3>
                <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1">
                    Пожалуйста, проверьте ваше интернет-соединение или работу сервера.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <section className="bg-gradient-to-br from-primary dark:from-primary-dark via-primary/80 dark:via-primary-dark/80 to-primary/70 dark:to-primary-dark/70 text-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-medium text-amber-100 dark:text-amber-200">Текущий баланс</h2>
                    <CurrencyDollarIcon className="h-8 w-8 text-amber-200 dark:text-amber-300 opacity-70"/>
                </div>
                <p className="text-5xl font-bold tracking-tight">
                    {formatCurrency(currentBalance)}
                </p>
                <p className="text-sm text-amber-100 dark:text-amber-200 mt-1 opacity-90">
                    Доступно для использования
                </p>
            </section>

            <section>
                <Button
                    onClick={openAddModal}
                    variant="primary"
                    className="w-full md:w-auto py-3 text-base"
                    leftIcon={<PlusCircleIcon className="h-5 w-5"/>}
                >
                    Добавить транзакцию
                </Button>
            </section>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text dark:text-text-dark">Недавние операции</h2>
                    {transactions.length > 10 && (
                        <a href="#" className="text-sm text-primary dark:text-primary-dark hover:underline" onClick={(e) => {e.preventDefault(); alert("Функционал 'Посмотреть все' пока не реализован.")}}>Посмотреть все</a>
                    )}
                </div>
                {transactions.length > 0 ? (
                    <ul className="space-y-3">
                        {transactions.slice(0, 10).map((transaction) => (
                            <TransactionItem key={transaction.id} transaction={transaction} onEdit={openEditModal} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow">
                        <DefaultCategoryIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-text dark:text-text-dark">Транзакций пока нет</h3>
                        <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1 mb-4">
                            Начните отслеживать свои финансы, добавив первую операцию.
                        </p>
                        <Button onClick={openAddModal} variant="secondary" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                            Добавить первую транзакцию
                        </Button>
                    </div>
                )}
            </section>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleFormSubmit}
                transactionToEdit={transactionToEdit}
                onDelete={handleDeleteTransaction}
            />
        </div>
    );
};
export default DashboardPage;