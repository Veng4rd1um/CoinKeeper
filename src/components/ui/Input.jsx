// src/components/ui/Input.jsx
import React from 'react';

const Input = ({
                   label,
                   id,
                   icon,
                   error,
                   className = '', // Для <input> элемента
                   wrapperClassName = '', // Для div-обертки
                   inputClassName = '', // Дополнительные классы для <input>, если className уже используется
                   themeVariant = 'default', // 'default' или 'auth'
                   ...props
               }) => {
    const baseInputStyle = "block w-full p-2.5 text-sm rounded-lg border";

    let currentInputStyle = `${baseInputStyle} `;

    if (themeVariant === 'auth') {
        // Стили для полей на формах авторизации
        currentInputStyle += "bg-authInputBg border-authInputBorder placeholder-authPlaceholder text-slate-200 focus:ring-primary-dark focus:border-primary-dark";
    } else {
        // Стили для обычной темы
        currentInputStyle += "bg-surface border-slate-300 text-text placeholder-slate-400 focus:ring-primary focus:border-primary dark:bg-surface-dark dark:border-slate-600 dark:text-text-dark dark:placeholder-slate-500 dark:focus:ring-primary-dark dark:focus:border-primary-dark";
    }

    const iconPadding = icon ? "pl-10" : "";
    const errorRingStyle = 'focus:ring-error dark:focus:ring-error-dark focus:border-error dark:focus:border-error-dark';
    const defaultRingStyle = themeVariant === 'auth'
        ? 'focus:ring-primary-dark focus:border-primary-dark'
        : 'focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark';

    const errorBorderStyle = error ? 'border-error dark:border-error-dark' : (themeVariant === 'auth' ? 'border-authInputBorder' : 'border-slate-300 dark:border-slate-600');

    const ringStyle = error ? errorRingStyle : defaultRingStyle;


    return (
        <div className={`mb-4 ${wrapperClassName}`}>
            {label && <label htmlFor={id} className="block mb-2 text-sm font-medium text-text dark:text-text-dark_muted">{label}</label>}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        {React.cloneElement(icon, { className: `${icon.props.className || ''} h-5 w-5 text-text-muted dark:text-text-dark_muted` })}
                    </div>
                )}
                <input
                    id={id}
                    className={`${currentInputStyle} ${iconPadding} ${errorBorderStyle} ${ringStyle} ${inputClassName} ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs text-error dark:text-error-dark">{error}</p>}
        </div>
    );
};

export default Input;