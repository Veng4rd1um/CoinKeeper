import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { fetchTransactions, fetchCategories } from '../api/index.js';
import { ExclamationTriangleIcon, CalendarDaysIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { CategoryIcon, defaultCategoryIconName } from '../components/ui/CategoryIcons.jsx';
import { normalizeCategoryProperties } from '../utils/categoryUtils.js'; // IMPORT THE NORMALIZER

const defaultCategoryStatsColorHex = '#64748b'; // slate-500 hex for charts (default for tailwindToHex)

const formatCurrencyForStat = (amount, currency = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits:0 }).format(amount);
};

const tailwindToHex = (tailwindColorClass) => {
    if (!tailwindColorClass) return defaultCategoryStatsColorHex;
    if (tailwindColorClass.startsWith('#')) return tailwindColorClass; // Already HEX

    const map = {
        'bg-slate-100': '#f1f5f9', // Example, add if needed
        'bg-slate-200': '#e2e8f0',
        'bg-slate-300': '#cbd5e1',
        'bg-slate-400': '#94a3b8', // Default color for normalization if original is missing
        'bg-slate-500': '#64748b', // Used as defaultTailwindColor in normalization
        'bg-slate-600': '#475569',
        'bg-slate-700': '#334155',
        'bg-slate-800': '#1e293b',
        'bg-gray-500': '#6b7280',
        'bg-red-400': '#f87171', 'bg-red-500': '#ef4444', 'bg-red-600': '#dc2626',
        'bg-orange-400': '#fb923c', 'bg-orange-500': '#f97316', 'bg-orange-600': '#ea580c',
        'bg-amber-400': '#fbbf24', 'bg-amber-500': '#f59e0b',
        'bg-yellow-400': '#facc15', 'bg-yellow-500': '#eab308',
        'bg-lime-400': '#a3e635', 'bg-lime-500': '#84cc16',
        'bg-green-400': '#4ade80', 'bg-green-500': '#22c55e', 'bg-green-600': '#16a34a',
        'bg-emerald-400': '#34d399', 'bg-emerald-500': '#10b981',
        'bg-teal-400': '#2dd4bf', 'bg-teal-500': '#14b8a6',
        'bg-cyan-400': '#22d3ee', 'bg-cyan-500': '#06b6d4',
        'bg-sky-400': '#38bdf8', 'bg-sky-500': '#0ea5e9', // bg-sky-400 is defaultNewCategoryColor in Settings
        'bg-blue-400': '#60a5fa', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb',
        'bg-indigo-400': '#818cf8', 'bg-indigo-500': '#6366f1',
        'bg-violet-400': '#a78bfa', 'bg-violet-500': '#8b5cf6',
        'bg-purple-400': '#c084fc', 'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea',
        'bg-fuchsia-400': '#e879f9', 'bg-fuchsia-500': '#d946ef',
        'bg-pink-400': '#f472b6', 'bg-pink-500': '#ec4899',
        'bg-rose-400': '#fb7185', 'bg-rose-500': '#f43f5e',
        // Theme colors
        'bg-primary': '#037DD6',
        'bg-primary-dark': '#2F72FA'
        // Ensure all colors from categoryColorPalette in SettingsPage and any defaults are here
    };
    return map[tailwindColorClass] || defaultCategoryStatsColorHex;
};


const CustomTooltipContent = ({ active, payload, label, type }) => {
    if (active && payload && payload.length) {
        if (type === "pie" && payload[0].payload) {
            const data = payload[0].payload; // data = { name, value, color (Tailwind class), icon (name) }
            return (
                <div className="bg-surface dark:bg-slate-800/90 backdrop-blur-sm p-2.5 rounded-md shadow-lg border border-slate-300 dark:border-slate-700 text-xs">
                    <div className="flex items-center">
                        {data.icon ? (
                            // data.color is a Tailwind class, used for the background div
                            <div className={`p-0.5 mr-1.5 rounded-sm ${data.color}`}>
                                <CategoryIcon iconName={data.icon} className="w-3 h-3 text-white" />
                            </div>
                        ) : ( // Fallback if icon somehow still missing, use color square
                            data.color && <span style={{ backgroundColor: tailwindToHex(data.color), width: '10px', height: '10px', borderRadius: '2px', marginRight: '6px', display: 'inline-block' }}></span>
                        )}
                        <p className="text-text dark:text-text-dark">
                            {data.name}: <span className="font-semibold">{formatCurrencyForStat(data.value)}</span>
                        </p>
                    </div>
                    {payload[0].percent && (
                        <p className="text-text-muted dark:text-text-dark_muted ml-4">({(payload[0].percent * 100).toFixed(1)}%)</p>
                    )}
                </div>
            );
        }
        if ((type === "bar" || type === "line") && label) {
            return (
                <div className="bg-surface dark:bg-slate-800/90 backdrop-blur-sm p-2.5 rounded-md shadow-lg border border-slate-300 dark:border-slate-700 text-xs">
                    <p className="font-semibold text-text dark:text-text-dark mb-1">{label}</p>
                    {payload.map((item, index) => (
                        <div key={`tooltip-item-${index}`} className="flex items-center">
                            <span style={{ backgroundColor: item.color /* Bar/Line direct color already HEX */, width: '8px', height: '8px', borderRadius: '2px', marginRight: '6px' }}></span>
                            <p className="text-text dark:text-text-dark">
                                {item.name}: <span className="font-semibold">{formatCurrencyForStat(item.value)}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
    }
    return null;
};

const renderCustomPieLegend = (props) => {
    const { payload } = props; // payload items are { value: categoryName, payload: { name, value, color (Tailwind), icon (name) } }
    return (
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs mt-4 max-w-md mx-auto">
            {payload.map((entry, index) => {
                // entry.payload.color is a Tailwind class, entry.payload.icon is an icon name
                const categoryTailwindColor = entry.payload?.color || 'bg-slate-500'; // Fallback
                const categoryIconName = entry.payload?.icon || defaultCategoryIconName;
                return (
                    <li key={`legend-item-${index}`} className="flex items-center">
                        {/* Use Tailwind class for the background div */}
                        <div className={`p-0.5 rounded-sm mr-1.5 ${categoryTailwindColor}`}>
                            <CategoryIcon iconName={categoryIconName} className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-text-muted dark:text-text-dark_muted">{entry.value}</span> {/* entry.value is category name here */}
                    </li>
                );
            })}
        </ul>
    );
};


const StatsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [allCategories, setAllCategories] = useState({ income: [], expense: [] }); // Will store normalized categories
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

            let fetchedCategories = catRes.data || { income: [], expense: [] };
            // Normalize categories
            fetchedCategories.income = (fetchedCategories.income || []).map(normalizeCategoryProperties);
            fetchedCategories.expense = (fetchedCategories.expense || []).map(normalizeCategoryProperties);
            setAllCategories(fetchedCategories);

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
        let startDate = new Date(now);
        let endDate = new Date(now);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (filterPeriod === 'custom') {
            if (customStartDate) {
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate = new Date(now.getFullYear(), 0, 1);
            }
            if (customEndDate) {
                endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999);
            }
            if (startDate > endDate && customStartDate && customEndDate) {
                [startDate, endDate] = [endDate, startDate];
            }
        } else {
            switch (filterPeriod) {
                case 'week':
                    const dayOfWeek = now.getDay();
                    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    startDate = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + 6);
                    endDate.setHours(23,59,59,999);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    endDate.setHours(23,59,59,999);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    endDate.setHours(23,59,59,999);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
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
        if (!filteredTransactions.length && !allCategories.income.length && !allCategories.expense.length) {
            return { totalIncome: 0, totalExpense: 0, netResult: 0, expenseByCategory: [], incomeExpenseOverTime: [], balanceOverTime: [] };
        }

        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategoryMap = new Map();
        const dailyDataMap = new Map();
        const { startDate, endDate } = getPeriodDateRange();

        const categoryMap = {};
        // allCategories already contains normalized categories
        (allCategories.income || []).forEach(cat => categoryMap[cat.id] = cat);
        (allCategories.expense || []).forEach(cat => categoryMap[cat.id] = cat);

        filteredTransactions.forEach(t => {
            const category = categoryMap[t.categoryId]; // category object has normalized .color (Tailwind) and .icon (name)
            const categoryName = category?.name || 'Без категории';
            const categoryColor = category?.color; // This is the Tailwind class from normalized category
            const categoryIcon = category?.icon;   // This is the icon name from normalized category
            const amount = parseFloat(t.amount);
            const dateKey = new Date(t.date).toISOString().split('T')[0];

            if (!dailyDataMap.has(dateKey)) {
                dailyDataMap.set(dateKey, { income: 0, expense: 0, balanceChange: 0 });
            }
            const dayData = dailyDataMap.get(dateKey);

            if (t.type === 'income') {
                totalIncome += amount;
                dayData.income += amount;
                dayData.balanceChange += amount;
            } else {
                totalExpense += amount;
                dayData.expense += amount;
                dayData.balanceChange -= amount;
                const currentCategoryData = expenseByCategoryMap.get(categoryName);
                expenseByCategoryMap.set(categoryName, {
                    value: (currentCategoryData?.value || 0) + amount,
                    color: categoryColor, // Store Tailwind class
                    icon: categoryIcon,   // Store icon name
                });
            }
        });

        const expenseByCategory = Array.from(expenseByCategoryMap)
            .map(([name, data]) => ({
                name,
                value: data.value,
                color: data.color, // color is Tailwind class
                icon: data.icon    // icon is name
            }))
            .sort((a, b) => b.value - a.value);

        const incomeExpenseOverTime = [];
        const balanceOverTimeData = [];
        let runningBalance = 0;

        const timeKeys = [];
        if (startDate && endDate && startDate <= endDate) {
            let currentDateIter = new Date(startDate);
            currentDateIter.setHours(0,0,0,0);
            const endOfDayOfEndDate = new Date(endDate);
            endOfDayOfEndDate.setHours(23,59,59,999);

            while(currentDateIter <= endOfDayOfEndDate) {
                timeKeys.push(currentDateIter.toISOString().split('T')[0]);
                currentDateIter.setDate(currentDateIter.getDate() + 1);
            }
        }
        timeKeys.sort();

        timeKeys.forEach(key => {
            const dayData = dailyDataMap.get(key) || { income: 0, expense: 0, balanceChange: 0 };
            incomeExpenseOverTime.push({
                name: new Date(key).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' }),
                income: dayData.income,
                expense: dayData.expense,
            });
            runningBalance += dayData.balanceChange;
            balanceOverTimeData.push({
                name: new Date(key).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' }),
                balance: runningBalance
            });
        });

        return {
            totalIncome,
            totalExpense,
            netResult: totalIncome - totalExpense,
            expenseByCategory, // Contains .color (Tailwind class) and .icon (name)
            incomeExpenseOverTime,
            balanceOverTime: balanceOverTimeData,
        };
    }, [filteredTransactions, allCategories, getPeriodDateRange]);

    if (isLoading && !transactions.length) {
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

    const noDataForPeriod = filteredTransactions.length === 0 && !isLoading;

    return (
        <div className="space-y-6 md:space-y-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text dark:text-text-dark">Финансовый анализ</h1>

            <section className="p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                <h2 className="text-lg font-medium mb-3 text-text dark:text-text-dark">Выберите период</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {[{val: 'week', label: 'Эта неделя'}, {val: 'month', label: 'Этот месяц'}, {val: 'year', label: 'Этот год'}].map(p => (
                        <button
                            key={p.val}
                            onClick={() => { setFilterPeriod(p.val); setCustomStartDate(''); setCustomEndDate(''); }}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                                ${filterPeriod === p.val && !customStartDate && !customEndDate
                                ? 'bg-primary dark:bg-primary-dark text-white shadow-md'
                                : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="customStartDate" className="block text-xs font-medium text-text-muted dark:text-text-dark_muted mb-1">Начало периода</label>
                        <input type="date" id="customStartDate" value={customStartDate}
                               onChange={e => { setCustomStartDate(e.target.value); if(e.target.value) setFilterPeriod('custom');}}
                               className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-surface dark:bg-surface-dark text-text dark:text-text-dark focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark text-sm h-10"
                        />
                    </div>
                    <div>
                        <label htmlFor="customEndDate" className="block text-xs font-medium text-text-muted dark:text-text-dark_muted mb-1">Конец периода</label>
                        <input type="date" id="customEndDate" value={customEndDate}
                               onChange={e => { setCustomEndDate(e.target.value); if(e.target.value) setFilterPeriod('custom');}}
                               className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-surface dark:bg-surface-dark text-text dark:text-text-dark focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark text-sm h-10"
                               min={customStartDate || undefined}
                        />
                    </div>
                </div>
                {(filterPeriod === 'custom' && (!customStartDate || !customEndDate)) && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                        Для пользовательского периода укажите начальную и конечную даты.
                    </p>
                )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-5 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Общий доход</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-success dark:text-success-dark mt-1">{formatCurrencyForStat(statsData.totalIncome)}</p>
                </div>
                <div className="p-5 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Общий расход</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-error dark:text-error-dark mt-1">{formatCurrencyForStat(statsData.totalExpense)}</p>
                </div>
                <div className="p-5 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                    <h3 className="text-sm font-medium text-text-muted dark:text-text-dark_muted">Чистый результат</h3>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${statsData.netResult >= 0 ? 'text-success dark:text-success-dark' : 'text-error dark:text-error-dark'}`}>
                        {formatCurrencyForStat(statsData.netResult)}
                    </p>
                </div>
            </section>

            {noDataForPeriod ? (
                <div className="p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg text-center">
                    <InformationCircleIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                    <p className="text-lg font-medium text-text dark:text-text-dark">Нет данных для отображения</p>
                    <p className="text-sm text-text-muted dark:text-text-dark_muted">Попробуйте выбрать другой период или добавить транзакции.</p>
                </div>
            ) : (
                <>
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {statsData.expenseByCategory.length > 0 ? (
                            <div className="p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark text-center">Структура расходов</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        {/* statsData.expenseByCategory has .color (Tailwind class) */}
                                        <Pie data={statsData.expenseByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name">
                                            {statsData.expenseByCategory.map((entry, index) => (
                                                // tailwindToHex converts Tailwind class to HEX for chart fill
                                                <Cell key={`cell-expense-${index}`} fill={tailwindToHex(entry.color)} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltipContent type="pie" />} />
                                        <Legend content={<renderCustomPieLegend />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="lg:col-span-1 p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg text-center text-text-muted dark:text-text-dark_muted flex flex-col justify-center items-center min-h-[200px]"><CalendarDaysIcon className="h-10 w-10 mb-2"/>Нет данных по расходам за период.</div>}

                        {statsData.incomeExpenseOverTime.length > 0 ? (
                            <div className="p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark text-center">Доходы и расходы</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={statsData.incomeExpenseOverTime} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                        <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                        <Tooltip content={<CustomTooltipContent type="bar"/>} />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}/>
                                        <Bar dataKey="income" fill={tailwindToHex('bg-green-500')} name="Доходы" radius={[3, 3, 0, 0]} barSize={12} />
                                        <Bar dataKey="expense" fill={tailwindToHex('bg-red-500')} name="Расходы" radius={[3, 3, 0, 0]} barSize={12} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="lg:col-span-1 p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg text-center text-text-muted dark:text-text-dark_muted flex flex-col justify-center items-center min-h-[200px]"><CalendarDaysIcon className="h-10 w-10 mb-2"/>Нет данных по дням за период.</div>}
                    </section>
                    {statsData.balanceOverTime.length > 1 && (
                        <section className="p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-xl shadow-lg">
                            <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark text-center">Изменение баланса за период</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={statsData.balanceOverTime} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-text-muted dark:text-text-dark_muted" />
                                    <Tooltip content={<CustomTooltipContent type="line"/>} />
                                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                                    <Line type="monotone" dataKey="balance" name="Баланс" stroke={tailwindToHex('bg-primary')} strokeWidth={2} dot={{ r: 3, fill: tailwindToHex('bg-primary') }} activeDot={{ r: 5, stroke: tailwindToHex('bg-primary-dark'), fill: tailwindToHex('bg-primary') }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default StatsPage;