import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/ui/Button.jsx';
import AccountModal from '../components/accounts/AccountModal.jsx';
import { fetchAccounts, addAccount, updateAccount, deleteAccountAPI } from '../api/index.js';
import {
    PlusCircleIcon, WalletIcon, ExclamationTriangleIcon, InformationCircleIcon,
    PencilSquareIcon, TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

const formatCurrency = (amount, currency = 'KZT', showDecimals = true) => {
    return new Intl.NumberFormat('en-US', { // Using en-US for KZT display
        style: 'currency',
        currency: currency,
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
};

const AccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const loadAccounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetchAccounts();
            // Ensure accounts always have a balance, default to 0 if not provided by API
            const fetchedAccounts = (response.data || []).map(acc => ({
                ...acc,
                balance: acc.balance !== undefined ? acc.balance : 0,
                initialBalance: acc.initialBalance !== undefined ? acc.initialBalance : 0, // Keep initial if present
            })).sort((a, b) => a.name.localeCompare(b.name));
            setAccounts(fetchedAccounts);
        } catch (err) {
            console.error("Failed to load accounts:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to load accounts. Please try again.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const openAddModal = () => {
        setAccountToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        setAccountToEdit(account);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setAccountToEdit(null);
    };

    const handleModalFormSubmit = async (accountData) => {
        try {
            if (accountToEdit) {
                await updateAccount(accountToEdit.id, accountData);
            } else {
                await addAccount(accountData);
            }
            loadAccounts();
            closeModal();
        } catch (err) {
            console.error("Failed to save account:", err);
            alert(`Error saving account: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteAccount = async (accountId, accountName) => {
        if (window.confirm(`Are you sure you want to delete the account "${accountName}"? This action cannot be undone and might affect existing transactions.`)) {
            try {
                await deleteAccountAPI(accountId);
                loadAccounts();
            } catch (err) {
                console.error("Failed to delete account:", err);
                alert(`Error deleting account: ${err.response?.data?.message || err.message}`);
            }
        }
    };
    
    const AccountListItem = ({ account }) => (
        <li className="bg-surface dark:bg-surface-dark p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 dark:bg-primary-dark/20 rounded-full">
                        <WalletIcon className="h-5 w-5 text-primary dark:text-primary-dark" />
                    </div>
                    <div>
                        <p className="text-md font-medium text-text dark:text-text-dark">{account.name}</p>
                        <p className="text-sm text-text-muted dark:text-text-dark_muted">
                            Balance: {formatCurrency(parseFloat(account.balance || 0), 'KZT')}
                        </p>
                    </div>
                </div>
                <div className="space-x-2">
                    <Button
                        onClick={() => openEditModal(account)}
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        leftIcon={<PencilSquareIcon className="h-4 w-4"/>}
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={() => handleDeleteAccount(account.id, account.name)}
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        leftIcon={<TrashIcon className="h-4 w-4"/>}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </li>
    );


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-lg text-text-muted dark:text-text-dark_muted">Loading accounts...</p>
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

    return (
        <div className="space-y-6 md:space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-text dark:text-text-dark">
                        Manage Accounts
                    </h1>
                    <p className="text-sm text-text-muted dark:text-text-dark_muted">
                        Add, edit, or remove your financial accounts.
                    </p>
                </div>
                <Button
                    onClick={openAddModal}
                    variant="primary"
                    className="w-full sm:w-auto py-2.5 px-5 text-sm"
                    leftIcon={<PlusCircleIcon className="h-5 w-5"/>}
                >
                    Add Account
                </Button>
            </header>

            <section>
                {accounts.length > 0 ? (
                    <ul className="space-y-3">
                        {accounts.map((account) => (
                            <AccountListItem key={account.id} account={account} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-6 bg-surface dark:bg-surface-dark rounded-lg shadow">
                        <InformationCircleIcon className="h-12 w-12 text-text-muted dark:text-text-dark_muted mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-text dark:text-text-dark">No accounts yet</h3>
                        <p className="text-sm text-text-muted dark:text-text-dark_muted mt-1 mb-4">
                            Create your first account to start managing your finances.
                        </p>
                        <Button onClick={openAddModal} variant="secondary" leftIcon={<PlusCircleIcon className="h-5 w-5"/>}>
                            Add First Account
                        </Button>
                    </div>
                )}
            </section>

            <AccountModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={handleModalFormSubmit}
                accountToEdit={accountToEdit}
                existingAccountNames={accounts.map(acc => acc.name.toLowerCase())}
            />
        </div>
    );
};

export default AccountsPage;