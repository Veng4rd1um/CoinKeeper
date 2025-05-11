import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { fetchCategories, addCategory as apiAddCategory, fetchAccounts } from '../../api/index.js';
import {
    XMarkIcon, CurrencyDollarIcon, CalendarDaysIcon, BanknotesIcon, 
    TrashIcon, PlusIcon, TagIcon
} from '@heroicons/react/24/outline';
import { CategoryIcon, defaultCategoryIconName } from '../ui/CategoryIcons.jsx';
import { normalizeCategoryProperties } from '../../utils/categoryUtils.js';

const defaultNewQuickCategoryTailwindColor = 'bg-slate-500';

const formatCurrencyForSelect = (amount, currencyCode = 'KZT') => {
    const numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return `${numberFormatter.format(amount)} ${currencyCode}`;
};


const TransactionModal = ({ isOpen, onClose, onSubmit, transactionToEdit, onDelete, accounts: propAccounts, allCategories: propAllCategories }) => {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryIdState] = useState('');
    const [accountId, setAccountIdState] = useState(''); 
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState({});
    
    const [allCategories, setAllCategories] = useState(propAllCategories || { income: [], expense: [] });
    const [accounts, setAccounts] = useState(propAccounts || []);
    
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);


    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const isEditing = !!transactionToEdit;

    const loadDataForModal = useCallback(async () => {
        let categoriesLoaded = false;
        let accountsLoaded = false;

        if (!propAllCategories || (!propAllCategories.income?.length && !propAllCategories.expense?.length)) {
            setIsLoadingCategories(true);
            try {
                const response = await fetchCategories();
                let fetchedCategories = response.data || { income: [], expense: [] };
                fetchedCategories.income = (fetchedCategories.income || []).map(normalizeCategoryProperties);
                fetchedCategories.expense = (fetchedCategories.expense || []).map(normalizeCategoryProperties);
                setAllCategories(fetchedCategories);
                setErrors(prev => ({ ...prev, categories: null }));
                categoriesLoaded = true;
            } catch (error) {
                console.error("Failed to fetch categories for modal:", error);
                setErrors(prev => ({ ...prev, categories: "Could not load categories." }));
            }
            setIsLoadingCategories(false);
        } else {
             setAllCategories(propAllCategories);
             categoriesLoaded = true;
        }

        if (!propAccounts || propAccounts.length === 0) {
            setIsLoadingAccounts(true);
            try {
                const response = await fetchAccounts();
                const fetchedAccountsData = (response.data || []).map(acc => ({...acc, balance: acc.balance !== undefined ? acc.balance : 0 }));
                setAccounts(fetchedAccountsData);
                setErrors(prev => ({ ...prev, accounts: null }));
                accountsLoaded = true;
                if (!isEditing && fetchedAccountsData.length > 0 && !accountId) { // Проверяем accountId перед установкой
                    setAccountIdState(fetchedAccountsData[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch accounts for modal:", error);
                setErrors(prev => ({ ...prev, accounts: "Could not load accounts." }));
            }
            setIsLoadingAccounts(false);
        } else {
            setAccounts(propAccounts);
            accountsLoaded = true;
            if (!isEditing && propAccounts.length > 0 && !accountId) { // Проверяем accountId перед установкой
                 setAccountIdState(propAccounts[0].id);
            }
        }
        
        if (isEditing && transactionToEdit && transactionToEdit.accountId && accountsLoaded) {
            setAccountIdState(transactionToEdit.accountId);
        }

    }, [propAllCategories, propAccounts, isEditing, transactionToEdit, accountId]);


    useEffect(() => {
        if (isOpen) {
            loadDataForModal(); 

            if (isEditing && transactionToEdit) {
                setType(transactionToEdit.type || 'expense');
                setAmount(transactionToEdit.amount?.toString() || '');
                setCategoryIdState(transactionToEdit.categoryId || '');
                setDate(transactionToEdit.date ? new Date(transactionToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setComment(transactionToEdit.comment || '');
                // accountId устанавливается в loadDataForModal
            } else { 
                setType('expense');
                setAmount('');
                setCategoryIdState('');
                // accountId по умолчанию также устанавливается в loadDataForModal
                setDate(new Date().toISOString().split('T')[0]);
                setComment('');
            }
            setErrors({});
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    }, [isOpen, transactionToEdit, isEditing, loadDataForModal]);

    useEffect(() => {
        if (isOpen) {
            setCategoryIdState('');
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    }, [type, isOpen]);

    const availableCategories = allCategories[type] || [];
    const selectedCategoryDetails = categoryId ? availableCategories.find(c => c.id === categoryId) : null;


    const validateForm = () => {
        const newErrors = {};
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = 'Enter a valid amount (greater than 0).';
        }
        if (!showNewCategoryInput && !categoryId) {
            newErrors.category = 'Select a category.';
        }
        if (showNewCategoryInput && !newCategoryName.trim()) {
            newErrors.newCategory = 'New category name cannot be empty.';
        }
        if (!accountId) { 
            newErrors.account = 'Select an account.';
        }
        if (!date) {
            newErrors.date = 'Select a date.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        let finalCategoryId = categoryId;

        if (showNewCategoryInput && newCategoryName.trim()) {
            try {
                const response = await apiAddCategory({
                    type,
                    name: newCategoryName.trim(),
                    color: defaultNewQuickCategoryTailwindColor,
                    icon: defaultCategoryIconName
                });
                const newCat = normalizeCategoryProperties(response.data);
                setAllCategories(prev => ({
                    ...prev,
                    [type]: [...(prev[type] || []), newCat].sort((a,b) => a.name.localeCompare(b.name))
                }));
                finalCategoryId = newCat.id;
                setNewCategoryName('');
                setShowNewCategoryInput(false);
                setErrors(prev => ({ ...prev, newCategory: null, category: null }));
                setCategoryIdState(newCat.id);
            } catch (error) {
                console.error("Failed to quick add category:", error);
                setErrors(prev => ({ ...prev, newCategory: error.response?.data?.message || "Error adding category." }));
                return;
            }
        }
        
        if (!finalCategoryId && !showNewCategoryInput) { 
            setErrors(prev => ({...prev, category: "Category is required."}));
            return;
        }
        if (!accountId) { 
             setErrors(prev => ({...prev, account: "Account is required."}));
            return;
        }


        const transactionData = {
            type,
            amount: parseFloat(amount),
            categoryId: finalCategoryId,
            accountId: accountId, 
            date: new Date(date).toISOString(),
            comment,
        };
        onSubmit(transactionData);
    };

    const handleDeleteLocal = () => {
        if (isEditing && onDelete) {
            onDelete(transactionToEdit.id);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-surface dark:bg-surface-dark p-6 md:p-8 rounded-xl shadow-xl w-full max-w-lg m-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-scale-in">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-text dark:text-text-dark">
                        {isEditing ? 'Edit Transaction' : 'New Transaction'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted dark:text-text-dark_muted hover:text-text dark:hover:text-text-dark transition-colors" aria-label="Close">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Transaction Type</label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-l-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark border border-r-0
                                  ${type === 'expense'
                                    ? 'bg-red-500/90 hover:bg-red-600 text-white focus:ring-red-400 border-red-500/90'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-400 border-slate-300 dark:border-slate-600'
                                }`}
                            >Expense</button>
                            <button
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-r-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-surface-dark border
                                  ${type === 'income'
                                    ? 'bg-green-500/90 hover:bg-green-600 text-white focus:ring-green-400 border-green-500/90'
                                    : 'bg-slate-200 dark:bg-slate-700 text-text dark:text-text-dark hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-400 border-slate-300 dark:border-slate-600'
                                }`}
                            >Income</button>
                        </div>
                    </div>

                    <Input
                        id="amount" label="Amount (KZT)" type="number" placeholder="0.00" value={amount}
                        onChange={(e) => setAmount(e.target.value)} error={errors.amount}
                        icon={<CurrencyDollarIcon />}
                        inputClassName="text-lg" inputMode="decimal" step="0.01"
                        wrapperClassName="mb-0"
                    />
                    
                    <div>
                        <label htmlFor="account" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Account</label>
                        {isLoadingAccounts && <p className="text-sm text-text-muted dark:text-text-dark_muted py-2">Loading accounts...</p>}
                        {errors.accounts && !isLoadingAccounts && <p className="text-xs text-error dark:text-error-dark mb-2 py-2">{errors.accounts}</p>}
                        {!isLoadingAccounts && !errors.accounts && (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                                    <BanknotesIcon className="w-4 h-4 text-text-muted dark:text-text-dark_muted" />
                                </div>
                                <select
                                    id="account" value={accountId} onChange={(e) => setAccountIdState(e.target.value)}
                                    className={`block w-full p-2.5 pl-10 text-sm rounded-lg border ${errors.account ? 'border-error dark:border-error-dark focus:ring-error dark:focus:ring-error-dark' : 'border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark'} bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark_muted`}
                                    disabled={accounts.length === 0}
                                >
                                    <option value="">
                                        {accounts.length === 0 ? 'No accounts available' : 'Select an account'}
                                    </option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({formatCurrencyForSelect(acc.balance !== undefined ? acc.balance : 0)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {errors.account && <p className="mt-1 text-xs text-error dark:text-error-dark">{errors.account}</p>}
                    </div>


                    <div>
                        <label htmlFor="category" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Category</label>
                        {isLoadingCategories && <p className="text-sm text-text-muted dark:text-text-dark_muted py-2">Loading categories...</p>}
                        {errors.categories && !isLoadingCategories && <p className="text-xs text-error dark:text-error-dark mb-2 py-2">{errors.categories}</p>}

                        {!showNewCategoryInput && !isLoadingCategories && !errors.categories && (
                            <div className="flex items-stretch space-x-2">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                                        {selectedCategoryDetails ? (
                                            <div className={`p-1 rounded-full ${selectedCategoryDetails.color}`}>
                                                <CategoryIcon
                                                    iconName={selectedCategoryDetails.icon}
                                                    className="w-3.5 h-3.5 text-white"
                                                />
                                            </div>
                                        ) : (
                                            <TagIcon className="w-4 h-4 text-text-muted dark:text-text-dark_muted" />
                                        )}
                                    </div>
                                    <select
                                        id="category" value={categoryId} onChange={(e) => setCategoryIdState(e.target.value)}
                                        className={`block w-full p-2.5 pl-10 text-sm rounded-lg border ${errors.category ? 'border-error dark:border-error-dark focus:ring-error dark:focus:ring-error-dark' : 'border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark'} bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark_muted`}
                                        disabled={availableCategories.length === 0}
                                    >
                                        <option value="">
                                            {availableCategories.length === 0 ? `No ${type === 'income' ? 'income' : 'expense'} categories` : 'Select a category'}
                                        </option>
                                        {availableCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button type="button" onClick={() => setShowNewCategoryInput(true)} variant="secondary" className="p-2.5 flex-shrink-0 h-full" title="Add new category">
                                    <PlusIcon className="h-5 w-5"/>
                                </Button>
                            </div>
                        )}
                        {showNewCategoryInput && (
                            <div className="p-3 border border-dashed border-slate-400 dark:border-slate-500 rounded-md space-y-3 bg-slate-50 dark:bg-slate-700/30">
                                <Input
                                    id="newCategoryName" label="New category name (quick add)" type="text" placeholder="e.g., 'Taxi'"
                                    value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                                    error={errors.newCategory} wrapperClassName="mb-0" labelClassName='text-xs'
                                />
                                <div className="flex space-x-2">
                                    <Button type="button" variant="secondary" onClick={() => {setShowNewCategoryInput(false); setNewCategoryName(''); setErrors(prev => ({...prev, newCategory: null}))}} className="text-sm py-1.5 px-3">Cancel</Button>
                                </div>
                                <p className="text-xs text-text-muted dark:text-text-dark_muted">Category will be created with default color/icon. Edit in 'Manage Categories'.</p>
                            </div>
                        )}
                        {errors.category && !showNewCategoryInput && <p className="mt-1 text-xs text-error dark:text-error-dark">{errors.category}</p>}
                    </div>

                    <Input
                        id="date" label="Date" type="date" value={date}
                        onChange={(e) => setDate(e.target.value)} error={errors.date}
                        icon={<CalendarDaysIcon />}
                        wrapperClassName="mb-0"
                    />

                    <div>
                        <label htmlFor="comment" className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">Comment (optional)</label>
                        <textarea id="comment" rows="2" placeholder="Transaction details..." value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="block w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark bg-surface dark:bg-surface-dark text-text dark:text-text-dark placeholder-text-muted dark:placeholder-text-dark_muted"
                        ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center pt-4 gap-3 border-t border-slate-200 dark:border-slate-700">
                        {isEditing && onDelete && (
                            <Button type="button" variant="danger" onClick={handleDeleteLocal} className="w-full sm:w-auto sm:mr-auto order-last sm:order-first" leftIcon={<TrashIcon className="h-4 w-4"/>}>
                                Delete
                            </Button>
                        )}
                        <div className={`flex flex-1 space-x-3 ${!isEditing || !onDelete ? 'sm:ml-auto' : ''}`}>
                            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 sm:flex-initial">Cancel</Button>
                            <Button type="submit" variant="primary" className="flex-1 sm:flex-initial">
                                {isEditing ? 'Save' : 'Add'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;