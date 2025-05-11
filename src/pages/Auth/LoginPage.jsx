// src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { EnvelopeIcon, LockClosedIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'; // Changed icon
import { useAuth } from '../../context/AuthContext.jsx';

// Предполагается, что auth-bg.jpg находится в public или src/assets
// Если в src/assets, то импортировать: import AuthBackground from '../../assets/auth-bg.jpg';
// const backgroundStyle = { backgroundImage: `url(${AuthBackground})` };
// Пока используем градиент, если изображение не настроено.
const backgroundStyle = { backgroundImage: `url('/auth-bg.jpg')` }; // Если auth-bg.jpg в /public

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const navigate = useNavigate(); // navigate теперь внутри useAuth().login
    const location = useLocation();
    const { login } = useAuth();

    const validateFields = () => {
        const newErrors = {};
        if (!email) newErrors.email = "Email обязателен";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Некорректный email";
        if (!password) newErrors.password = "Пароль обязателен";
        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (validateFields()) {
            setIsLoading(true);
            const result = await login(email, password);
            setIsLoading(false);
            if (!result.success) {
                setFormError(result.message || "Ошибка входа. Пожалуйста, проверьте ваши данные.");
            }
            // navigate (если логин успешен) происходит внутри AuthContext.login
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={backgroundStyle} // Применяем фон
        >
            <div className="bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    {/* <BuildingStorefrontIcon className="h-16 w-16 text-primary dark:text-primary-dark mb-3" /> */}
                    <img src="/free-icon-coin-4153647.png" alt="CoinKeeper Logo" className="h-16 w-16 mb-3" />
                    <h1 className="text-3xl font-bold text-white">CoinKeeper</h1>
                    <p className="text-slate-300 dark:text-slate-400">Войдите, чтобы управлять финансами</p>
                </div>

                {formError && (
                    <div className="mb-4 p-3 bg-red-500/30 border border-red-600 text-red-200 rounded-md text-sm text-center">
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    <Input
                        id="email" type="email" label="Email" placeholder="your@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        error={fieldErrors.email} icon={<EnvelopeIcon />}
                        themeVariant="auth"
                        labelClassName="text-slate-300 dark:text-slate-400"
                    />
                    <Input
                        id="password" type="password" label="Пароль" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        error={fieldErrors.password} icon={<LockClosedIcon />}
                        themeVariant="auth"
                        labelClassName="text-slate-300 dark:text-slate-400"
                    />
                    <Button type="submit" fullWidth className="mt-8 py-3 text-base !bg-primary hover:!bg-primary-hover dark:!bg-primary-dark dark:hover:!bg-primary-dark_hover" disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>
                <p className="text-sm text-center mt-8 text-slate-400 dark:text-slate-500">
                    Нет аккаунта?{' '}
                    <Link
                        to="/register"
                        state={{ from: location.state?.from }}
                        className="font-medium text-primary-light dark:text-primary-dark hover:underline"
                    >
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;