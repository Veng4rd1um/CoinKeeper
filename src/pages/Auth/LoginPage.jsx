// src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { EnvelopeIcon, LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({}); // Для ошибок полей
    const [formError, setFormError] = useState(''); // Для общих ошибок формы от сервера
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
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
            const result = await login(email, password); // login уже делает navigate
            setIsLoading(false);
            if (!result.success) {
                setFormError(result.message || "Ошибка входа. Пожалуйста, проверьте ваши данные.");
            }
            // navigate (если логин успешен) происходит внутри AuthContext.login
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-background-dark p-4">
            <div className="bg-authFormBg backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <CurrencyDollarIcon className="h-16 w-16 text-primary-dark mb-3" />
                    <h1 className="text-3xl font-bold text-white">CoinKeeper</h1>
                    <p className="text-text-dark_muted">Войдите, чтобы управлять финансами</p>
                </div>

                {formError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-md text-sm text-center">
                        {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <Input
                        id="email" type="email" label="Email" placeholder="your@email.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        error={fieldErrors.email} icon={<EnvelopeIcon />}
                        themeVariant="auth" // Используем специальную тему для инпутов авторизации
                    />
                    <Input
                        id="password" type="password" label="Пароль" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        error={fieldErrors.password} icon={<LockClosedIcon />}
                        themeVariant="auth"
                    />
                    <Button type="submit" fullWidth className="mt-8 py-3 text-base" disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                </form>
                <p className="text-sm text-center mt-8 text-slate-400">
                    Нет аккаунта?{' '}
                    <Link
                        to="/register"
                        state={{ from: location.state?.from }} // Передаем from для редиректа после регистрации и логина
                        className="font-medium text-primary-dark hover:underline"
                    >
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default LoginPage;