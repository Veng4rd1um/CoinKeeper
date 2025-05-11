import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { fetchCategories, addCategory, updateCategory, deleteCategoryAPI } from '../api/index.js';
import {
    XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon, PencilIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { CategoryIcon, availableIconsForPicker, defaultCategoryIconName } from '../components/ui/CategoryIcons.jsx';
import { normalizeCategoryProperties } from '../utils/categoryUtils.js';

const categoryColorPalette = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-400',
    'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400',
    'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400', 'bg-slate-400'
];
const defaultNewCategoryColor = 'bg-sky-400';

const CategoryModal = ({ isOpen, onClose, onSubmit, categoryToEdit, currentCategories }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [selectedColor, setSelectedColor] = useState(defaultNewCategoryColor);
    const [selectedIconName, setSelectedIconName] = useState(defaultCategoryIconName);
    const [error, setError] = useState('');

    const isEditing = !!categoryToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing && categoryToEdit) {
                setName(categoryToEdit.name);
                setType(categoryToEdit.originalType || categoryToEdit.type || 'expense');
                setSelectedColor(categoryToEdit.color || defaultNewCategoryColor);
                setSelectedIconName(categoryToEdit.icon || defaultCategoryIconName);
            } else {
                setName('');
                setType('expense');
                setSelectedColor(defaultNewCategoryColor);
                setSelectedIconName(defaultCategoryIconName);
            }
            setError('');
        }
    }, [isOpen, categoryToEdit, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError("Название категории не может быть пустым.");
            return;
        }

        const categoriesOfType = currentCategories[type] || [];
        const existingCategory = categoriesOfType.find(
            cat => cat.name.toLowerCase() === name.trim().toLowerCase() &&
                (!isEditing || cat.id !== categoryToEdit.id)
        );

        if (existingCategory) {
            setError(`Категория с именем "${name.trim()}" уже существует для типа "${type === 'income' ? 'Доход' : 'Расход'}".`);
            return;
        }

        const categoryData = {
            name: name.trim(),
            type: type,
            color: selectedColor,
            icon: selectedIconName,
        };
        onSubmit(categoryData, isEditing ? categoryToEdit.id : null, isEditing ? categoryToEdit.originalType : type);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md m-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-scale-in text-text dark:text-text-dark border border-slate-300 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text dark:text-text-dark">
                        {isEditing ? 'Редактировать категорию' : 'Добавить категорию'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted dark:text-text-dark_muted hover:text-text dark:hover:text-text-dark transition-colors" aria-label="Закрыть">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        id="categoryNameModal" label="Название категории:" type="text"
                        value={name} onChange={(e) => setName(e.target.value)}
                        // Removed hardcoded dark theme classes, Input component will handle theming
                        labelClassName="text-text-muted dark:text-text-dark_muted"
                        wrapperClassName="mb-0"
                    />
                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-text-muted dark:text-text-dark_muted">Тип категории:</label>
                        <div className="flex space-x-4">
                            {[{label: 'Расход', value: 'expense'}, {label: 'Доход', value: 'income'}].map(option => (
                                <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="categoryTypeModal"
                                        value={option.value}
                                        checked={type === option.value}
                                        onChange={() => setType(option.value)}
                                        className="form-radio h-4 w-4 text-amber-500 bg-slate-100 dark:bg-slate-600 border-slate-400 dark:border-slate-500 focus:ring-amber-500"
                                        disabled={isEditing && categoryToEdit?.originalType && categoryToEdit.originalType !== option.value}
                                    />
                                    <span className={`text-sm text-text dark:text-text-dark ${isEditing && categoryToEdit?.originalType && categoryToEdit.originalType !== option.value ? 'text-text-muted dark:text-text-dark_muted opacity-70' : ''}`}>{option.label}</span>
                                </label>
                            ))}
                        </div>
                        {isEditing && categoryToEdit?.originalType && <p className="text-xs text-text-muted dark:text-text-dark_muted opacity-70 mt-1">Тип категории нельзя изменить после создания.</p>}
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-text-muted dark:text-text-dark_muted">Цвет:</label>
                        <div className="flex flex-wrap gap-2">
                            {categoryColorPalette.map(color => (
                                <button
                                    type="button" key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-7 h-7 rounded-full ${color} border-2 transition-all
                                        ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-surface dark:ring-offset-slate-800 ring-primary dark:ring-primary-dark scale-110' : 'border-transparent hover:opacity-80'}`}
                                    aria-label={`Выбрать цвет ${color}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-medium text-text-muted dark:text-text-dark_muted">Иконка:</label>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md max-h-32 overflow-y-auto">
                            {availableIconsForPicker.map(iconItem => (
                                <button
                                    type="button" key={iconItem.name}
                                    onClick={() => setSelectedIconName(iconItem.name)}
                                    className={`p-1.5 rounded-md flex items-center justify-center transition-all
                                        ${selectedIconName === iconItem.name ? 'bg-amber-500 text-white scale-110' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-300'}`}
                                    aria-label={`Выбрать иконку ${iconItem.name.replace('Icon', '')}`}
                                >
                                    <iconItem.Component className="w-5 h-5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                        <p className="text-sm font-medium text-text-muted dark:text-text-dark_muted mb-1">Предпросмотр:</p>
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${selectedColor}`}>
                                <CategoryIcon iconName={selectedIconName} className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-medium text-text dark:text-text-dark">{name || "Название категории"}</p>
                                <p className="text-xs text-text-muted dark:text-text-dark_muted">
                                    {type === 'income' ? "Только доход" : "Только расход"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400 text-center">{error}</p>}

                    <div className="flex justify-end space-x-3 pt-5">
                        <Button type="button" onClick={onClose} variant="secondary" className="px-6">Отмена</Button> {/* Variant secondary is theme-aware */}
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-6">Сохранить</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SettingsPage = () => {
    const [categories, setCategories] = useState({ income: [], expense: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchCategories();
            let fetched = response.data || { income: [], expense: [] };

            fetched.income = (fetched.income || [])
                .map(cat => ({ ...normalizeCategoryProperties(cat), originalType: 'income' }))
                .sort((a, b) => a.name.localeCompare(b.name));
            fetched.expense = (fetched.expense || [])
                .map(cat => ({ ...normalizeCategoryProperties(cat), originalType: 'expense' }))
                .sort((a, b) => a.name.localeCompare(b.name));

            setCategories(fetched);
        } catch (err) {
            setError(err.response?.data?.message || "Не удалось загрузить категории.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleOpenModal = (catToEdit = null) => {
        setCategoryToEdit(catToEdit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCategoryToEdit(null);
    };

    const handleFormSubmit = async (categoryData, editingId, originalApiType) => {
        try {
            if (editingId) {
                await updateCategory(originalApiType, editingId, categoryData);
            } else {
                await addCategory(categoryData);
            }
            await loadCategories();
            handleCloseModal();
        } catch (err) {
            console.error("Failed to save category:", err.response || err);
            alert(`Ошибка сохранения категории: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteCategory = async (catToDelete) => {
        if (window.confirm(`Вы уверены, что хотите удалить категорию "${catToDelete.name}"?`)) {
            try {
                await deleteCategoryAPI(catToDelete.originalType, catToDelete.id);
                await loadCategories();
            } catch (err) {
                alert(`Ошибка удаления категории: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    const CategoryListItem = ({ category }) => (
        <div className="flex items-center justify-between p-3 bg-surface dark:bg-slate-700 rounded-md shadow hover:shadow-md transition-shadow"> {/* Changed dark:bg-surface-dark to dark:bg-slate-700 for slight differentiation if needed */}
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${category.color}`}>
                    <CategoryIcon iconName={category.icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-medium text-text dark:text-text-dark">{category.name}</p>
                    <p className="text-xs text-text-muted dark:text-text-dark_muted">
                        {category.originalType === 'income' ? "Только доход" : "Только расход"}
                    </p>
                </div>
            </div>
            <div className="space-x-2">
                {/* Button variants primary/secondary/danger are already theme-aware or accent based */}
                <Button onClick={() => handleOpenModal(category)} variant="secondary" className="text-xs px-3 py-1"> {/* Use secondary for neutral edit button */}
                    <PencilIcon className="w-3 h-3 inline mr-1"/> Редактировать
                </Button>
                <Button onClick={() => handleDeleteCategory(category)} variant="danger" className="text-xs px-3 py-1">
                    <TrashIcon className="w-3 h-3 inline mr-1"/> Удалить
                </Button>
            </div>
        </div>
    );

    if (isLoading) return <div className="p-6 text-center text-text-muted dark:text-text-dark_muted">Загрузка категорий...</div>;
    if (error && !categories.income.length && !categories.expense.length) {
        return (
            <div className="p-6 text-center text-error dark:text-error-dark bg-error/10 dark:bg-error-dark/20 rounded-md">
                <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2"/>
                {error}
            </div>
        );
    }

    const allUserCategories = [
        ...(categories.income || []),
        ...(categories.expense || [])
    ].sort((a,b) => a.name.localeCompare(b.name));

    return (
        // Changed main page background and text to be theme-aware
        <div className="p-4 sm:p-6 md:p-8 bg-background dark:bg-background-dark min-h-screen text-text dark:text-text-dark">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-text dark:text-text-dark">Управление категориями</h1>
                    <Button onClick={() => handleOpenModal()} className="bg-amber-500 hover:bg-amber-600 text-white">
                        Добавить категорию
                    </Button>
                </div>

                {allUserCategories.length > 0 ? (
                    <div className="space-y-3">
                        {allUserCategories.map(cat => (
                            <CategoryListItem key={cat.id} category={cat} />
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow">
                            <InformationCircleIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-text dark:text-text-dark">Категорий пока нет</h3>
                            <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1">
                                Добавьте свою первую категорию, чтобы начать.
                            </p>
                        </div>
                    )
                )}
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleFormSubmit}
                categoryToEdit={categoryToEdit}
                currentCategories={categories}
            />
        </div>
    );
};

export default SettingsPage;
