// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { fetchCategories, addCategory, updateCategory, deleteCategoryAPI } from '../api/index.js';
import { PlusCircleIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon, ExclamationTriangleIcon, TagIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const [editingCategory, setEditingCategory] = useState(null); // {type, id, name}
    const [editName, setEditName] = useState('');
    const [formError, setFormError] = useState(''); // Для ошибок формы добавления

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchCategories();
            setCategories(response.data || { income: [], expense: [] });
        } catch (err) {
            setError(err.response?.data?.message || "Не удалось загрузить категории.");
            console.error("Failed to load categories:", err);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newCategoryName.trim()) {
            setFormError("Название категории не может быть пустым.");
            return;
        }
        try {
            await addCategory({ type: newCategoryType, name: newCategoryName.trim() });
            setNewCategoryName(''); // Очищаем поле после добавления
            loadCategories(); // Перезагружаем категории
        } catch (err) {
            setFormError(err.response?.data?.message || `Ошибка добавления категории.`);
            console.error("Failed to add category:", err);
        }
    };

    const handleStartEdit = (type, category) => {
        setEditingCategory({ type, id: category.id, name: category.name });
        setEditName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditName('');
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editName.trim()) {
            alert("Название категории не может быть пустым.");
            return;
        }
        try {
            await updateCategory(editingCategory.type, editingCategory.id, { name: editName.trim() });
            loadCategories(); // Перезагружаем категории
            handleCancelEdit();
        } catch (err) {
            alert(`Ошибка обновления категории: ${err.response?.data?.message || err.message}`);
            console.error("Failed to update category:", err);
        }
    };

    const handleDeleteCategory = async (type, id) => {
        if (window.confirm("Вы уверены, что хотите удалить эту категорию? Это действие необратимо. Связанные транзакции могут потерять свою категорию.")) {
            try {
                await deleteCategoryAPI(type, id);
                loadCategories(); // Перезагружаем категории
            } catch (err) {
                alert(`Ошибка удаления категории: ${err.response?.data?.message || err.message}`);
                console.error("Failed to delete category:", err);
            }
        }
    };

    const CategoryList = ({ title, type, list }) => (
        <div className="mb-6 p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-text dark:text-text-dark">{title}</h3>
            {list && list.length > 0 ? (
                <ul className="space-y-2">
                    {list.map((cat) => (
                        <li key={cat.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                            {editingCategory && editingCategory.id === cat.id ? (
                                <>
                                    <Input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="py-1 px-2 text-sm mr-2 flex-grow h-9" // Уменьшили высоту
                                        wrapperClassName="mb-0 flex-grow"
                                    />
                                    <div className="flex-shrink-0 space-x-1.5">
                                        <button onClick={handleSaveEdit} className="p-1.5 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300" title="Сохранить"><CheckIcon className="h-5 w-5"/></button>
                                        <button onClick={handleCancelEdit} className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" title="Отмена"><XMarkIcon className="h-5 w-5"/></button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-text dark:text-text-dark">{cat.name}</span>
                                    <div className="space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEdit(type, cat)} className="p-1.5 text-primary dark:text-primary-dark hover:opacity-75" title="Редактировать">
                                            <PencilIcon className="h-4 w-4"/>
                                        </button>
                                        <button onClick={() => handleDeleteCategory(type, cat.id)} className="p-1.5 text-error dark:text-error-dark hover:opacity-75" title="Удалить">
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-text-muted dark:text-text-dark_muted">Категорий этого типа пока нет.</p>
            )}
        </div>
    );

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><p className="text-lg text-text-muted dark:text-text-dark_muted">Загрузка категорий...</p></div>;
    }
    if (error) {
        return (
            <div className="text-center py-10 px-6 bg-error/10 dark:bg-error-dark/20 rounded-lg shadow border border-error/30 dark:border-error-dark/50">
                <ExclamationTriangleIcon className="h-12 w-12 text-error dark:text-error-dark mx-auto mb-3" />
                <h3 className="text-lg font-medium text-error dark:text-error-dark">{error}</h3>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-text dark:text-text-dark">Управление категориями</h1>

            <form onSubmit={handleAddCategory} className="mb-8 p-4 sm:p-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-text dark:text-text-dark">Добавить новую категорию</h2>
                {formError && <p className="text-sm text-error dark:text-error-dark mb-3">{formError}</p>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <Input
                        id="newCategoryName"
                        label="Название категории"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Например, 'Кофе'"
                        wrapperClassName="mb-0 md:col-span-1" // Адаптивность
                    />
                    <div className="md:col-span-1">
                        <label htmlFor="newCategoryType" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Тип</label>
                        <select
                            id="newCategoryType"
                            value={newCategoryType}
                            onChange={(e) => setNewCategoryType(e.target.value)}
                            className="block w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark bg-surface dark:bg-surface-dark text-text dark:text-text-dark"
                        >
                            <option value="expense">Расход</option>
                            <option value="income">Доход</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full md:w-auto md:col-span-1" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                        Добавить
                    </Button>
                </div>
            </form>

            <div className="grid md:grid-cols-2 gap-6">
                <CategoryList title="Категории доходов" type="income" list={categories.income} />
                <CategoryList title="Категории расходов" type="expense" list={categories.expense} />
            </div>
            {categories.income.length === 0 && categories.expense.length === 0 && !isLoading && (
                <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md col-span-full">
                    <TagIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-text dark:text-text-dark">Категорий пока нет</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1">
                        Добавьте свою первую категорию, чтобы начать классифицировать транзакции.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;