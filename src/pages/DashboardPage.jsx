import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from '../components/ui/Button.jsx';
import TransactionModal from '../components/transactions/TransactionModal.jsx';
import {
    fetchTransactions,
    addTransaction as apiAddTransaction,
    updateTransaction as apiUpdateTransaction,
    deleteTransaction as apiDeleteTransaction,
    fetchCategories,
    fetchAccounts // Import fetchAccounts
} from '../api/index.js';
import {
    PlusCircleIcon, WalletIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
    PencilSquareIcon, ExclamationTriangleIcon, InformationCircleIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { CategoryIcon, defaultCategoryIconName } from '../components/ui/CategoryIcons.jsx';
import { normalizeCategoryProperties } from '../utils/categoryUtils.js';

const defaultCategoryDisplayColor = "bg-slate-400 dark:bg-slate-600";

const formatCurrency = (amount, currencyCode = 'KZT', showDecimals = true) => {
    const numberFormatter = new Intl.NumberFormat('en-US', { // 'kk-KZ' для казахских разделителей или 'en-US' для точек
        style: 'decimal', // Используем decimal для гибкости
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0
    });
    return `${numberFormatter.format(amount)} ${currencyCode}`; // Добавляем код валюты справа
};

const formatDateForDisplay = (isoDateString) => {
    if (!isoDateString) return 'N/A';
    const date = new Date(isoDateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const SummaryCard = ({ title, amount, icon, trend, trendText, colorClass = "text-text dark:text-text-dark" }) => {
    const IconComponent = icon;
    return (
        <div className="bg-surface dark:bg-surface-dark p-5 rounded-xl shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary-dark/20 transition-shadow duration-200 border border-transparent hover:border-primary/30 dark:hover:border-primary-dark/30">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">{title}</h3>
                {IconComponent && <IconComponent className={`h-7 w-7 ${colorClass} opacity-70`} />}
            </div>
            <p className={`text-3xl font-bold ${colorClass} tracking-tight`}>
                {formatCurrency(amount, 'KZT', !Number.isInteger(amount))}
            </p>
            {trend && trendText && (
                <p className={`text-xs mt-1.5 flex items-center ${trend === 'up' ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                    {trend === 'up' ? <ArrowTrendingUpIcon className="h-3.5 w-3.5 mr-1" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5 mr-1" />}
                    {trendText}
                </p>
            )}
        </div>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [allCategories, setAllCategories] = useState({ income: [], expense: [] });


    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
                fetchTransactions(),
                fetchCategories(),
                fetchAccounts()
            ]);

            const fetchedTransactions = transactionsRes.data || [];
            let fetchedCategoriesData = categoriesRes.data || { income: [], expense: [] };
            const fetchedAccountsData = (accountsRes.data || []).map(acc => ({
                ...acc,
                balance: acc.balance !== undefined ? acc.balance : 0,
            }));
            setAccounts(fetchedAccountsData);
            

            fetchedCategoriesData.income = (fetchedCategoriesData.income || []).map(normalizeCategoryProperties);
            fetchedCategoriesData.expense = (fetchedCategoriesData.expense || []).map(normalizeCategoryProperties);
            setAllCategories(fetchedCategoriesData); // Устанавливаем категории после нормализации

            const categoryMap = {};
            (fetchedCategoriesData.income || []).forEach(cat => categoryMap[cat.id] = cat);
            (fetchedCategoriesData.expense || []).forEach(cat => categoryMap[cat.id] = cat);
            
            const accountMap = {};
            fetchedAccountsData.forEach(acc => accountMap[acc.id] = acc);

            const enrichedTransactions = fetchedTransactions.map(t => {
                const category = categoryMap[t.categoryId];
                const account = accountMap[t.accountId];
                return {
                    ...t,
                    categoryName: category?.name || 'Uncategorized',
                    categoryColor: category?.color || defaultCategoryDisplayColor,
                    categoryIcon: category?.icon || defaultCategoryIconName,
                    accountName: account?.name || 'N/A Account'
                };
            }).sort((a,b) => new Date(b.date) - new Date(a.date));

            setTransactions(enrichedTransactions);

        } catch (err) {
            console.error("Failed to load initial data:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load data. Please refresh the page.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= currentMonthStart);

        let income = 0;
        let expense = 0;
        currentMonthTransactions.forEach(t => {
            if (t.type === 'income') income += parseFloat(t.amount);
            else expense += parseFloat(t.amount);
        });
        return { income, expense };
    }, [transactions]);

    const totalBalance = useMemo(() => {
        return accounts.reduce((acc, currAccount) => acc + parseFloat(currAccount.balance || 0), 0);
    }, [accounts]);


    const openAddModal = () => {
        setTransactionToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (transaction) => {
        const rawTransaction = transactions.find(t => t.id === transaction.id); 
        if (rawTransaction) {
            const { categoryName, categoryColor, categoryIcon, accountName, ...rest } = rawTransaction;
            setTransactionToEdit(rest);
        } else {
            setTransactionToEdit(transaction); 
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTransactionToEdit(null);
    };

    const handleModalFormSubmit = async (transactionDataFromModal) => {
        try {
            if (transactionToEdit) {
                await apiUpdateTransaction(transactionToEdit.id, transactionDataFromModal);
            } else {
                await apiAddTransaction(transactionDataFromModal);
            }
            loadInitialData(); 
            closeModal();
        } catch (err) {
            console.error("Failed to save transaction from modal:", err);
            alert(`Error saving transaction: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (window.confirm("Are you sure you want to delete this transaction?")) {
            try {
                await apiDeleteTransaction(transactionId);
                loadInitialData(); 
                closeModal();
            } catch (err) {
                console.error("Failed to delete transaction:", err);
                alert(`Error deleting transaction: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const TransactionItem = ({ transaction, onEdit }) => {
        const isIncome = transaction.type === 'income';
        const amountColor = isIncome ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark';
        const sign = isIncome ? '+' : '-';

        const categoryColor = transaction.categoryColor;
        const categoryIconName = transaction.categoryIcon;

        return (
            <li className="bg-surface dark:bg-surface-dark p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={`p-1.5 sm:p-2 rounded-full ${categoryColor} flex-shrink-0 shadow-sm`}>
                            <CategoryIcon iconName={categoryIconName} className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text dark:text-text-dark truncate" title={transaction.categoryName}>{transaction.categoryName}</p>
                            <p className="text-xs text-text-muted dark:text-text-dark_muted truncate max-w-[100px] sm:max-w-[150px]" title={transaction.comment || 'No description'}>
                                {transaction.comment || 'No description'}
                            </p>
                             <p className="text-xs text-primary dark:text-primary-dark truncate max-w-[100px] sm:max-w-[150px]" title={transaction.accountName}>
                                Account: {transaction.accountName}
                            </p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end ml-2 flex-shrink-0">
                        <p className={`text-sm font-semibold ${amountColor} whitespace-nowrap`}>
                            {sign} {formatCurrency(parseFloat(transaction.amount), 'KZT', true).replace(/\s?KZT/, '')} <span className="text-xs text-text-muted dark:text-text-dark_muted">KZT</span>
                        </p>
                        <p className="text-xs text-text-muted dark:text-text-dark_muted mt-0.5">{formatDateForDisplay(transaction.date)}</p>
                    </div>
                    <button
                        onClick={() => onEdit(transaction)}
                        className="ml-2 text-text-muted dark:text-text-dark_muted hover:text-primary dark:hover:text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-1 rounded-md flex-shrink-0"
                        title="Edit transaction"
                    >
                        <PencilSquareIcon className="h-4 w-4 sm:h-5 sm:h-5"/>
                    </button>
                </div>
            </li>
        );
    };

    if (isLoading && transactions.length === 0 && accounts.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-lg text-text-muted dark:text-text-dark_muted">Loading data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 px-6 bg-error/10 dark:bg-error-dark/20 rounded-lg shadow border border-error/30 dark:border-error-dark/50">
                <ExclamationTriangleIcon className="h-12 w-12 text-error dark:text-error-dark mx-auto mb-3" />
                <h3 className="text-lg font-medium text-error dark:text-error-dark">{error}</h3>
                <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1">
                    Please check your internet connection or server status.
                </p>
            </div>
        );
    }
    const userName = user?.email?.split('@')[0] || 'user';

    return (
        <div className="space-y-6 md:space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-text dark:text-text-dark">
                        Welcome, <span className="capitalize">{userName}</span>!
                    </h1>
                    <p className="text-sm text-text-muted dark:text-text-dark_muted">
                        Your financial overview.
                    </p>
                </div>
                <Button
                    onClick={openAddModal}
                    variant="primary"
                    className="w-full sm:w-auto py-2.5 px-5 text-sm"
                    leftIcon={<PlusCircleIcon className="h-5 w-5"/>}
                >
                    Add Transaction
                </Button>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <SummaryCard title="Total Balance" amount={totalBalance} icon={WalletIcon} colorClass="text-primary dark:text-primary-dark" />
                <SummaryCard title="Income (this month)" amount={monthlyStats.income} icon={ArrowTrendingUpIcon} colorClass="text-success dark:text-success-dark" />
                <SummaryCard title="Expenses (this month)" amount={monthlyStats.expense} icon={ArrowTrendingDownIcon} colorClass="text-error dark:text-error-dark" />
            </section>
            
            <section>
                <h2 className="text-xl font-semibold text-text dark:text-text-dark mb-4">Accounts</h2>
                {accounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {accounts.map(account => (
                            <div key={account.id} className="bg-surface dark:bg-surface-dark p-4 rounded-xl shadow-lg">
                                <div className="flex items-center mb-2">
                                    <BanknotesIcon className="h-6 w-6 text-primary dark:text-primary-dark mr-2" />
                                    <h3 className="text-md font-medium text-text dark:text-text-dark">{account.name}</h3>
                                </div>
                                <p className="text-2xl font-bold text-text dark:text-text-dark tracking-tight">
                                    {formatCurrency(parseFloat(account.balance || 0), 'KZT')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-6 px-4 bg-surface dark:bg-surface-dark rounded-lg shadow">
                        <InformationCircleIcon className="h-10 w-10 text-text-muted dark:text-text-dark_muted mx-auto mb-2" />
                        <h3 className="text-md font-medium text-text dark:text-text-dark">No accounts found</h3>
                        <p className="text-xs text-text-muted dark:text-text-dark_muted mt-1">
                            Go to 'Accounts' page to add your first account.
                        </p>
                    </div>
                )}
            </section>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text dark:text-text-dark">Recent Transactions</h2>
                </div>
                {transactions.length > 0 ? (
                    <ul className="space-y-3">
                        {transactions.slice(0, 7).map((transaction) => (
                            <TransactionItem key={transaction.id} transaction={transaction} onEdit={openEditModal} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow">
                        <InformationCircleIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-text dark:text-text-dark">No transactions yet</h3>
                        <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1 mb-4">
                            Start tracking your finances by adding your first transaction.
                        </p>
                        <Button onClick={openAddModal} variant="secondary" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                            Add First Transaction
                        </Button>
                    </div>
                )}
            </section>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleModalFormSubmit}
                transactionToEdit={transactionToEdit}
                onDelete={handleDeleteTransaction}
                accounts={accounts} 
                allCategories={allCategories}
            />
        </div>
    );
};
export default DashboardPage;