// src/components/ui/Button.jsx
import React from 'react';

const Button = ({
                    children,
                    variant = 'primary',
                    fullWidth = false,
                    className = '',
                    leftIcon, // Новый проп для иконки слева
                    rightIcon, // Новый проп для иконки справа
                    disabled, // Стандартный HTML атрибут
                    ...props
                }) => {
    const baseStyle = "inline-flex items-center justify-center py-2.5 px-5 text-sm font-medium rounded-lg focus:outline-none focus:ring-4 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed";
    const widthStyle = fullWidth ? "w-full" : "";

    let variantStyle = '';
    switch (variant) {
        case 'secondary':
            variantStyle = "text-text bg-surface dark:text-text-dark dark:bg-surface-dark border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-300 dark:focus:ring-slate-500";
            break;
        case 'danger':
            variantStyle = "text-white bg-error dark:bg-error-dark hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-300 dark:focus:ring-red-900";
            break;
        case 'success': // Добавим вариант success
            variantStyle = "text-white bg-success dark:bg-success-dark hover:bg-green-700 dark:hover:bg-green-600 focus:ring-green-300 dark:focus:ring-green-800";
            break;
        case 'primary':
        default:
            variantStyle = "text-white bg-primary dark:bg-primary-dark hover:bg-primary-hover dark:hover:bg-primary-dark_hover focus:ring-primary/50 dark:focus:ring-primary-dark/50";
            break;
    }

    return (
        <button
            className={`${baseStyle} ${variantStyle} ${widthStyle} ${className}`}
            disabled={disabled}
            {...props}
        >
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
};

export default Button;