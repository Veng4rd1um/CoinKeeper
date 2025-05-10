// src/components/transactions/TransactionModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { fetchCategories, addCategory as apiAddCategory } from '../../api/index.js';
import {
    XMarkIcon, CurrencyDollarIcon, CalendarDaysIcon,
    TrashIcon, PlusIcon
} from '@heroicons/react/24/outline';
// InputColor не нужен здесь, если быстрое добавление не предполагает выбора цвета

const defaultNewCategoryColorHEX = '#64748b'; // Цвет по умолчанию в HEX для быстро добавленной категории (slate-500)

const TransactionModal = ({ isOpen, onClose, onSubmit, transactionToEdit, onDelete }) => {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryIdState] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState({});
    const [allCategories, setAllCategories] = useState({ income: [], expense: [] });
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const isEditing = !!transactionToEdit;

    const loadCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        try {
            const response = await fetchCategories(); // API должен возвращать HEX цвет
            setAllCategories(response.data || { income: [], expense: [] });
            setErrors(prev => ({ ...prev, categories: null }));
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setErrors(prev => ({ ...prev, categories: "Не удалось загрузить категории." }));
        }
        setIsLoadingCategories(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            if (isEditing && transactionToEdit) {
                setType(transactionToEdit.type || 'expense');
                setAmount(transactionToEdit.amount?.toString() || '');
                setCategoryIdState(transactionToEdit.categoryId || '');
                setDate(transactionToEdit.date ? new Date(transactionToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setComment(transactionToEdit.comment || '');
                setErrors({});
            } else {
                setType('expense');
                setAmount('');
                setCategoryIdState('');
                setDate(new Date().toISOString().split('T')[0]);
                setComment('');
                setErrors({});
            }
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    }, [isOpen, transactionToEdit, isEditing, loadCategories]);

    const availableCategories = allCategories[type] || [];
    const selectedCategoryFull = availableCategories.find(cat => cat.id === categoryId);

    const validateForm = () => {
        const newErrors = {};
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = 'Введите корректную сумму (больше 0).';
        }
        if (!categoryId) {
            newErrors.category = 'Выберите категорию.';
        }
        if (!date) {
            newErrors.date = 'Выберите дату.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const transactionData = {
                ...(isEditing && { id: transactionToEdit.id }),
                type,
                amount: parseFloat(amount),
                categoryId: categoryId,
                date: new Date(date).toISOString(),
                comment,
            };
            onSubmit(transactionData);
        }
    };

    const handleAddNewCategoryLocal = async () => {
        if (!newCategoryName.trim()) {
            setErrors(prev => ({ ...prev, newCategory: "Название категории не может быть пустым." }));
            return;
        }
        try {
            const response = await apiAddCategory({
                type,
                name: newCategoryName.trim(),
                color: defaultNewCategoryColorHEX // Отправляем HEX цвет по умолчанию
            });
            const newCat = response.data;
            setAllCategories(prev => ({
                ...prev,
                [type]: [...(prev[type] || []), newCat]
            }));
            setCategoryIdState(newCat.id);
            setNewCategoryName('');
            setShowNewCategoryInput(false);
            setErrors(prev => ({ ...prev, newCategory: null }));
        } catch (error) {
            console.error("Failed to add category:", error);
            setErrors(prev => ({ ...prev, newCategory: error.response?.data?.message || "Ошибка добавления категории." }));
        }
    };

    const handleDeleteLocal = () => {
        if (isEditing && onDelete) {
            if (window.confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
                onDelete(transactionToEdit.id);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-surface dark:bg-surface-dark p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg m-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-text dark:text-text-dark">
                        {isEditing ? 'Редактировать транзакцию' : 'Новая транзакция'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted dark:text-text-dark_muted hover:text-text dark:hover:text-text-dark transition-colors" aria-label="Закрыть">
                        <XMarkIcon className="h-7 w-7" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Тип транзакции</label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => { setType('expense'); setCategoryIdState(''); setShowNewCategoryInput(false); }}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-l-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-surface-dark
                                  ${type === 'expense'
                                    ? 'bg-error dark:bg-error-dark text-white focus:ring-error/70 dark:focus:ring-error-dark/70'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-400'
                                }`}
                            >Расход</button>
                            <button
                                type="button"
                                onClick={() => { setType('income'); setCategoryIdState(''); setShowNewCategoryInput(false); }}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-surface-dark
                                  ${type === 'income'
                                    ? 'bg-success dark:bg-success-dark text-white focus:ring-success/70 dark:focus:ring-success-dark/70'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-400'
                                }`}
                            >Доход</button>
                        </div>
                    </div>

                    <Input
                        id="amount" label="Сумма" type="number" placeholder="0.00" value={amount}
                        onChange={(e) => setAmount(e.target.value)} error={errors.amount}
                        icon={<CurrencyDollarIcon />}
                        inputClassName="text-lg" inputMode="decimal" step="0.01"
                    />

                    <div>
                        <label htmlFor="category" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Категория</label>
                        {isLoadingCategories && <p className="text-sm text-text-muted dark:text-text-dark_muted">Загрузка категорий...</p>}
                        {errors.categories && !isLoadingCategories && <p className="text-xs text-error dark:text-error-dark mb-2">{errors.categories}</p>}

                        {!showNewCategoryInput ? (
                            <div className="flex items-center space-x-2">
                                <div className="relative flex-grow">
                                    {selectedCategoryFull?.color && (
                                        <span
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-black/20 dark:border-white/20"
                                            style={{ backgroundColor: selectedCategoryFull.color }}
                                        ></span>
                                    )}
                                    <select
                                        id="category" value={categoryId} onChange={(e) => setCategoryIdState(e.target.value)}
                                        className={`block w-full p-2.5 text-sm rounded-lg border ${selectedCategoryFull?.color ? 'pl-8' : ''} ${errors.category ? 'border-error dark:border-error-dark focus:ring-error dark:focus:ring-error-dark' : 'border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark'} bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark_muted`}
                                        disabled={isLoadingCategories || (!isLoadingCategories && availableCategories.length === 0 && !errors.categories)}
                                    >
                                        <option value="">
                                            {isLoadingCategories ? 'Загрузка...' :
                                                errors.categories ? 'Ошибка загрузки категорий' :
                                                    availableCategories.length === 0 ? `Нет категорий ${type === 'income' ? 'дохода':'расхода'}`
                                                        : 'Выберите категорию'}
                                        </option>
                                        {availableCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                    </select>
                                </div>
                                <Button type="button" onClick={() => setShowNewCategoryInput(true)} variant="secondary" className="p-2.5 flex-shrink-0" title="Добавить новую категорию">
                                    <PlusIcon className="h-5 w-5"/>
                                </Button>
                            </div>
                        ) : (
                            <div className="p-3 border border-slate-300 dark:border-slate-600 rounded-md space-y-3">
                                <Input
                                    id="newCategoryName" label="Название новой категории" type="text" placeholder="Например, 'Такси'"
                                    value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                    error={errors.newCategory} wrapperClassName="mb-2"
                                />
                                <div className="flex space-x-2">
                                    <Button type="button" variant="success" onClick={handleAddNewCategoryLocal} className="text-sm py-1.5 px-3">Сохранить</Button>
                                    <Button type="button" variant="secondary" onClick={() => {setShowNewCategoryInput(false); setNewCategoryName(''); setErrors(prev => ({...prev, newCategory: null}))}} className="text-sm py-1.5 px-3">Отмена</Button>
                                </div>
                                <p className="text-xs text-text-muted dark:text-text-dark_muted">Цвет для этой категории (будет по умолчанию) можно будет изменить позже на странице "Управление категориями".</p>
                            </div>
                        )}
                        {errors.category && !showNewCategoryInput && <p className="mt-1 text-xs text-error dark:text-error-dark">{errors.category}</p>}
                    </div>

                    <Input
                        id="date" label="Дата" type="date" value={date}
                        onChange={(e) => setDate(e.target.value)} error={errors.date}
                        icon={<CalendarDaysIcon />}
                    />

                    <div>
                        <label htmlFor="comment" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Комментарий (необязательно)</label>
                        <textarea id="comment" rows="3" placeholder="Детали транзакции..." value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="block w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark_muted"
                        ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center pt-3 gap-3">
                        {isEditing && onDelete && (
                            <Button type="button" variant="danger" onClick={handleDeleteLocal} className="w-full sm:w-auto sm:mr-auto" leftIcon={<TrashIcon className="h-5 w-5"/>}>
                                Удалить
                            </Button>
                        )}
                        <div className={`flex flex-1 space-x-3 ${!isEditing ? 'sm:justify-end' : ''}`}>
                            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 sm:flex-initial">Отмена</Button>
                            <Button type="submit" variant="primary" className="flex-1 sm:flex-initial">
                                {isEditing ? 'Сохранить изменения' : 'Добавить транзакцию'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;