import React, { useState, useEffect } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { XMarkIcon, BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const AccountModal = ({ isOpen, onClose, onSubmit, accountToEdit, existingAccountNames }) => {
    const [name, setName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [error, setError] = useState('');

    const isEditing = !!accountToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing && accountToEdit) {
                setName(accountToEdit.name);
                setInitialBalance(accountToEdit.initialBalance !== undefined ? accountToEdit.initialBalance.toString() : (accountToEdit.balance !== undefined ? accountToEdit.balance.toString() : '0'));
            } else {
                setName('');
                setInitialBalance('0');
            }
            setError('');
        }
    }, [isOpen, accountToEdit, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError("Account name cannot be empty.");
            return;
        }
        if (existingAccountNames.includes(name.trim().toLowerCase()) && (!isEditing || name.trim().toLowerCase() !== accountToEdit.name.toLowerCase())) {
            setError(`An account with the name "${name.trim()}" already exists.`);
            return;
        }

        const balanceValue = parseFloat(initialBalance);
        if (isNaN(balanceValue)) {
            setError("Initial balance must be a valid number.");
            return;
        }
        
        const accountData = {
            name: name.trim(),
            initialBalance: balanceValue 
        };
        if (isEditing && accountToEdit.id) {
            accountData.id = accountToEdit.id;
        }

        onSubmit(accountData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md m-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-scale-in text-text dark:text-text-dark border border-slate-300 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text dark:text-text-dark">
                        {isEditing ? 'Edit Account' : 'Add New Account'}
                    </h2>
                    <button onClick={onClose} className="text-text-muted dark:text-text-dark_muted hover:text-text dark:hover:text-text-dark transition-colors" aria-label="Close">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        id="accountNameModal"
                        label="Account Name:"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<BanknotesIcon />}
                        labelClassName="text-text-muted dark:text-text-dark_muted"
                        wrapperClassName="mb-0"
                        placeholder="e.g., Cash, Bank Card"
                    />
                    <Input
                        id="initialBalanceModal"
                        label={isEditing ? "Current / Initial Balance (KZT):" : "Initial Balance (KZT):"}
                        type="number"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        icon={<CurrencyDollarIcon />}
                        inputMode="decimal"
                        step="0.01"
                        labelClassName="text-text-muted dark:text-text-dark_muted"
                        wrapperClassName="mb-0"
                        placeholder="0.00"
                    />
                     {isEditing && <p className="text-xs text-text-muted dark:text-text-dark_muted opacity-70 mt-1">Note: Modifying balance here might be for reference or initial setup. Actual balance is updated by transactions.</p>}


                    {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400 text-center">{error}</p>}

                    <div className="flex justify-end space-x-3 pt-5">
                        <Button type="button" onClick={onClose} variant="secondary" className="px-6">Cancel</Button>
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-6">
                            {isEditing ? 'Save Changes' : 'Add Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;