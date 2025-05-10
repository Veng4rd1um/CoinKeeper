// src/pages/StatsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchTransactions, fetchCategories } from '../api/index.js';
import { ExclamationTriangleIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const PIE_CHART_COLORS = ['#037DD6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#6366f1', '#d946ef', '#06b6d4'];

const formatCurrency = (amount, currency = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits:0 }).format(amount);
};

const CustomTooltipContent = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = payload[0].value;
        const name = payload[0].name;

        return (
            <div className="bg-surface dark:bg-surface-dark/90 backdrop-blur-sm p-3 rounded-md shadow-lg border border-slate-200 dark:border-slate-600">
                {label && <p className="text-sm font-semibold text-text dark:text-text-dark mb-1">{label}</p>}
                <p className="text-sm text-text dark:text-text-dark">
                    {data?.name || name}: <span className="font-semibold">{formatCurrency(data?.value || value)}</span>
                </p>
                {data?.percent && (
                    <p className="text-xs text-text-muted dark:text-text-dark_muted">({(data.percent * 100).toFixed(1)}%)</p>
                )}
            </div>
        );
    }
    return null;
};

const StatsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [allCategories, setAllCategories] = useState({ income: [], expense: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [transRes, catRes] = await Promise.all([
                fetchTransactions(),
                fetchCategories()
            ]);
            setTransactions(transRes.data || []);
            setAllCategories(catRes.data || { income: [], expense: [] });
        } catch (err) {
            console.error("Failed to load data for stats:", err);
            setError(err.response?.data?.message || "Не удалось загрузить данные для статистики.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getPeriodDateRange = useCallback(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        switch (filterPeriod) {
            case 'week':
                startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Текущая неделя, Пн
                // endDate остается концом текущего дня
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                // endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                // endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    startDate = new Date(customStartDate);
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(customEndDate);
                    endDate.setHours(23,59,59,999);
                    if (startDate > endDate) { // Если начальная дата больше конечной, меняем их местами
                        [startDate, endDate] = [endDate, startDate];
                    }
                } else {
                    // По умолчанию для "custom" без дат - текущий месяц
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                }
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        startDate.setHours(0,0,0,0);
        if (filterPeriod !== 'custom' || !(customStartDate && customEndDate)) { // Для быстрых фильтров endDate - это текущий день
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            if (filterPeriod === 'month') { // Для месяца endDate - это конец текущего дня в этом месяце
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                if (now < lastDayOfMonth) { // Если текущий день не последний в месяце
                    // endDate уже установлен на текущий день
                } else { // Если текущий день - последний в месяце или позже (не должно быть), то берем конец месяца
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                }
            }
            if (filterPeriod === 'year') { // Для года endDate - это конец текущего дня в этом году
                const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
                if (now < lastDayOfYear) {
                    // endDate уже установлен на текущий день
                } else {
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                }
            }
        }
        return { startDate, endDate };
    }, [filterPeriod, customStartDate, customEndDate]);


    const filteredTransactions = useMemo(() => {
        if (!transactions.length) return [];
        const { startDate, endDate } = getPeriodDateRange();

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [transactions, getPeriodDateRange]);

    const statsData = useMemo(() => {
        if (!filteredTransactions.length) {
            return { totalIncome: 0, totalExpense: 0, netResult: 0, expenseByCategory: [], incomeExpenseByDay: [] };
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategoryMap = new Map();
        const incomeByDayMap = new Map();
        const expenseByDayMap = new Map();
        const { startDate, endDate } = getPeriodDateRange(); // Для корректного диапазона дней BarChart

        filteredTransactions.forEach(t => {
            const categoryName = allCategories[t.type]?.find(c => c.id === t.categoryId)?.name || 'Без категории';
            const dateKey = new Date(t.date).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' });

            if (t.type === 'income') {
                totalIncome += parseFloat(t.amount);
                incomeByDayMap.set(dateKey, (incomeByDayMap.get(dateKey) || 0) + parseFloat(t.amount));
            } else {
                totalExpense += parseFloat(t.amount);
                expenseByCategoryMap.set(categoryName, (expenseByCategoryMap.get(categoryName) || 0) + parseFloat(t.amount));
                expenseByDayMap.set(dateKey, (expenseByDayMap.get(dateKey) || 0) + parseFloat(t.amount));
            }
        });

        const expenseByCategory = Array.from(expenseByCategoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const dayKeysInRange = [];
        let currentDate = new Date(startDate);
        while(currentDate <= endDate) {
            dayKeysInRange.push(currentDate.toLocaleDateString('ru-RU', { day:'2-digit', month:'short' }));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        // Убираем дубликаты, если период очень короткий и один день встречается несколько раз (не должно быть при правильном startDate/endDate)
        const uniqueDayKeys = [...new Set(dayKeysInRange)];

        const incomeExpenseByDay = uniqueDayKeys.map(dayKey => ({
            name: dayKey,
            income: incomeByDayMap.get(dayKey) || 0,
            expense: expenseByDayMap.get(dayKey) || 0,
        }));

        return {
            totalIncome,
            totalExpense,
            netResult: totalIncome - totalExpense,
            expenseByCategory,
            incomeExpenseByDay
        };
    }, [filteredTransactions, allCategories, getPeriodDateRange]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><p className="text-lg text-text-muted dark:text-text-dark_muted">Загрузка статистики...</p></div>;
    }

    if (error) {
        return (
            <div className="text-center py-10 px-6 bg-error/10 dark:bg-error-dark/20 rounded-lg shadow border border-error/30 dark:border-error-dark/50">
                <ExclamationTriangleIcon className="h-12 w-12 text-error dark:text-error-dark mx-auto mb-3" />
                <h3 className="text-lg font-medium text-error dark:text-error-dark">{error}</h3>
            </div>
        );
    }

    const noDataForPeriod = filteredTransactions.length === 0;

    return (
        <div className="space-y-6 md:space-y-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text dark:text-text-dark">Финансовый анализ</h1>

            <section className="p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                <h2 className="text-lg font-medium mb-3 text-text dark:text-text-dark">Выберите период</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {['week', 'month', 'year'].map(period => (
                        <button
                            key={period}
                            onClick={() => { setFilterPeriod(period); setCustomStartDate(''); setCustomEndDate(''); }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${filterPeriod === period && !customStartDate && !customEndDate
                                ? 'bg-primary dark:bg-primary-dark text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {period === 'week' ? 'Эта неделя' : period === 'month' ? 'Этот месяц' : 'Этот год'}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="customStartDate" className="block text-sm font-medium text-text dark:text-text-dark_muted mb-1">Начало периода</label>
                        <input type="date" id="customStartDate" value={customStartDate}
                               onChange={e => { setCustomStartDate(e.target.value); if (e.target.value && customEndDate) setFilterPeriod('custom'); else if (e.target.value && !customEndDate) setFilterPeriod('custom_partial'); }}
                               className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-surface dark:bg-surface-dark text-text dark:text-text-dark focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
                        />
                    </div>
                    <div>
                        <label htmlFor="customEndDate" className="block text-sm font-medium text-text dark:text-text-dark_muted mb-1">Конец периода</label>
                        <input type="date" id="customEndDate" value={customEndDate}
                               onChange={e => { setCustomEndDate(e.target.value); if (customStartDate && e.target.value) setFilterPeriod('custom'); else if (!customStartDate && e.target.value) setFilterPeriod('custom_partial'); }}
                               className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-surface dark:bg-surface-dark text-text dark:text-text-dark focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
                               min={customStartDate || undefined}
                        />
                    </div>
                </div>
                {(filterPeriod === 'custom' || filterPeriod === 'custom_partial') && (!customStartDate || !customEndDate) && (
                    <p className="text-xs text-warning dark:text-warning-dark mt-2">Выберите обе даты для точного пользовательского периода или одну для периода до/от нее.</p>
                )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Общий доход</h3>
                    <p className="text-3xl font-semibold text-success dark:text-success-dark mt-1">{formatCurrency(statsData.totalIncome)}</p>
                </div>
                <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Общий расход</h3>
                    <p className="text-3xl font-semibold text-error dark:text-error-dark mt-1">{formatCurrency(statsData.totalExpense)}</p>
                </div>
                <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Чистый результат</h3>
                    <p className={`text-3xl font-semibold mt-1 ${statsData.netResult >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                        {formatCurrency(statsData.netResult)}
                    </p>
                </div>
            </section>

            {noDataForPeriod && !isLoading ? (
                <div className="p-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md text-center">
                    <CalendarDaysIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                    <p className="text-lg font-medium text-text dark:text-text-dark">Нет данных для отображения</p>
                    <p className="text-sm text-text-muted dark:text-text-dark_muted">Попробуйте выбрать другой период или добавить транзакции.</p>
                </div>
            ) : (
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {statsData.expenseByCategory.length > 0 ? (
                        <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark text-center">Структура расходов</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={statsData.expenseByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name">
                                        {statsData.expenseByCategory.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltipContent />} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="lg:col-span-1 p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md text-center text-text-muted dark:text-text-dark_muted">Нет данных по расходам за период.</div>}

                    {statsData.incomeExpenseByDay.length > 0 ? (
                        <div className="p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark text-center">Динамика по дням</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={statsData.incomeExpenseByDay} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}> {/* Уменьшил отступы */}
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                    <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                    <Tooltip content={<CustomTooltipContent />} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
                                    <Bar dataKey="income" fill={PIE_CHART_COLORS[1]} name="Доходы" radius={[4, 4, 0, 0]} barSize={15} />
                                    <Bar dataKey="expense" fill={PIE_CHART_COLORS[3]} name="Расходы" radius={[4, 4, 0, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="lg:col-span-1 p-4 bg-surface dark:bg-surface-dark rounded-lg shadow-md text-center text-text-muted dark:text-text-dark_muted">Нет данных по дням за период.</div>}
                </section>
            )}
        </div>
    );
};

export default StatsPage;