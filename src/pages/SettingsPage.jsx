// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { fetchCategories, addCategory, updateCategory, deleteCategoryAPI } from '../api/index.js';
import {
    PlusCircleIcon, TrashIcon, PencilIcon, XMarkIcon, CheckIcon,
    ExclamationTriangleIcon, TagIcon as DefaultCategoryIcon
} from '@heroicons/react/24/outline';
import InputColor from 'react-input-color'; // Импортируем react-input-color

// Убираем availableColors, т.к. цвет будет выбираться через палитру компонента
const defaultColor = '#64748b'; // Цвет по умолчанию в HEX (slate-500)

const SettingsPage = () => {
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('expense');
    const [newCategoryColor, setNewCategoryColor] = useState({ hex: defaultColor }); // react-input-color работает с объектом

    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState({ hex: defaultColor });

    const [formError, setFormError] = useState('');

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchCategories();
            // Убедимся, что цвет приходит в HEX с бэкенда или конвертируем его здесь
            // Для простоты, предполагаем, что API уже возвращает цвет в HEX (например, "#RRGGBB")
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
            await addCategory({
                type: newCategoryType,
                name: newCategoryName.trim(),
                color: newCategoryColor.hex // Отправляем HEX значение цвета
            });
            setNewCategoryName('');
            setNewCategoryColor({ hex: defaultColor });
            setNewCategoryType('expense');
            loadCategories();
        } catch (err) {
            setFormError(err.response?.data?.message || `Ошибка добавления категории.`);
            console.error("Failed to add category:", err);
        }
    };

    const handleStartEdit = (type, category) => {
        setEditingCategory({ type, id: category.id, name: category.name, color: category.color });
        setEditName(category.name);
        setEditColor({ hex: category.color || defaultColor }); // Устанавливаем цвет для react-input-color
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditName('');
        setEditColor({ hex: defaultColor });
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editName.trim()) {
            alert("Название категории не может быть пустым.");
            return;
        }
        try {
            await updateCategory(editingCategory.type, editingCategory.id, {
                name: editName.trim(),
                color: editColor.hex // Отправляем HEX значение цвета
            });
            loadCategories();
            handleCancelEdit();
        } catch (err) {
            alert(`Ошибка обновления категории: ${err.response?.data?.message || err.message}`);
            console.error("Failed to update category:", err);
        }
    };

    const handleDeleteCategory = async (type, id) => {
        if (window.confirm("Вы уверены, что хотите удалить эту категорию? Связанные транзакции могут потерять свою категорию.")) {
            try {
                await deleteCategoryAPI(type, id);
                loadCategories();
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
                        <li key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group">
                            {editingCategory && editingCategory.id === cat.id ? (
                                <div className="flex-grow space-y-3 w-full">
                                    <Input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="py-1 px-2 text-sm h-9 w-full"
                                        wrapperClassName="mb-0 flex-grow"
                                    />
                                    <div>
                                        <label className="block text-xs font-medium text-text-muted dark:text-text-dark_muted mb-1">Цвет</label>
                                        <InputColor
                                            initialValue={editColor.hex}
                                            onChange={setEditColor} // Возвращает объект {r, g, b, a, hex, hsv, hsl}
                                            placement="right" // или 'bottom', 'top', 'left'
                                            inputWrapperClassName="w-full" // Класс для обертки инпута
                                            // Можно добавить свои стили для инпута, если нужно, через className
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-1.5 pt-2">
                                        <Button onClick={handleSaveEdit} variant="success" className="py-1.5 px-3 text-sm" leftIcon={<CheckIcon className="h-4 w-4"/>}>Сохранить</Button>
                                        <Button onClick={handleCancelEdit} variant="secondary" className="py-1.5 px-3 text-sm" leftIcon={<XMarkIcon className="h-4 w-4"/>}>Отмена</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center flex-grow mb-2 sm:mb-0">
                                        <span
                                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-black/10 dark:border-white/10"
                                            style={{ backgroundColor: cat.color || defaultColor }} // Используем HEX для style
                                        ></span>
                                        <span className="text-text dark:text-text-dark break-all">{cat.name}</span>
                                    </div>
                                    <div className="flex-shrink-0 space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity self-center sm:self-auto">
                                        <Button onClick={() => handleStartEdit(type, cat)} variant="secondary" size="icon" title="Редактировать" className="p-1.5 text-primary dark:text-primary-dark hover:opacity-75">
                                            <PencilIcon className="h-4 w-4"/>
                                        </Button>
                                        <Button onClick={() => handleDeleteCategory(type, cat.id)} variant="secondary" size="icon" title="Удалить" className="p-1.5 text-error dark:text-error-dark hover:opacity-75">
                                            <TrashIcon className="h-4 w-4"/>
                                        </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <Input
                        id="newCategoryName"
                        label="Название категории"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Например, 'Кофе'"
                        wrapperClassName="mb-0"
                    />
                    <div>
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
                    <div className="md:col-span-2">
                        <label className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Цвет</label>
                        <InputColor
                            initialValue={newCategoryColor.hex}
                            onChange={setNewCategoryColor}
                            placement="right"
                            inputWrapperClassName="w-full"
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full md:w-auto mt-6" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                    Добавить категорию
                </Button>
            </form>

            <div className="grid md:grid-cols-2 gap-6">
                <CategoryList title="Категории доходов" type="income" list={categories.income} />
                <CategoryList title="Категории расходов" type="expense" list={categories.expense} />
            </div>
            {categories.income.length === 0 && categories.expense.length === 0 && !isLoading && (
                <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow-md col-span-full">
                    <DefaultCategoryIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
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