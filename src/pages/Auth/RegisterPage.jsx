// src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { EnvelopeIcon, LockClosedIcon, UserPlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'; // Changed icon
import { useAuth } from '../../context/AuthContext.jsx';

// const backgroundStyle = { backgroundImage: `url('/path/to/your/auth-bg.jpg')` };
// Пока используем градиент, если изображение не настроено.
const backgroundStyle = { backgroundImage: `url('/auth-bg.jpg')` }; // Если auth-bg.jpg в /public


const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();

    const validateFields = () => {
        const newErrors = {};
        if (!email) newErrors.email = "Email обязателен";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Некорректный email";

        if (!password) newErrors.password = "Пароль обязателен";
        else if (password.length < 6) newErrors.password = "Пароль должен быть не менее 6 символов";

        if (!confirmPassword) newErrors.confirmPassword = "Подтверждение пароля обязательно";
        else if (password !== confirmPassword) newErrors.confirmPassword = "Пароли не совпадают";

        setFieldErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSuccess(false);
        if (validateFields()) {
            setIsLoading(true);
            const result = await register(email, password); // register из AuthContext
            setIsLoading(false);
            if (result.success) {
                setIsSuccess(true);
            } else {
                setFormError(result.message || "Ошибка регистрации. Пожалуйста, попробуйте еще раз.");
            }
        }
    };

    if (isSuccess) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
                style={backgroundStyle}
            >
                <div className="bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md text-center border border-slate-700">
                    <UserPlusIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-green-300 mb-4">Регистрация успешна!</h2>
                    <p className="text-slate-300 dark:text-slate-400 mb-6">Теперь вы можете войти, используя указанные данные.</p>
                    <Button
                        onClick={() => navigate('/login', { state: { from: location.state?.from } })}
                        fullWidth
                        className="py-3 text-base !bg-primary hover:!bg-primary-hover dark:!bg-primary-dark dark:hover:!bg-primary-dark_hover"
                    >
                        Перейти ко входу
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={backgroundStyle}
        >
            <div className="bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-md p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
                <div className="flex flex-col items-center mb-8">
                    {/* <BuildingStorefrontIcon className="h-16 w-16 text-primary dark:text-primary-dark mb-3" /> */}
                    <img src="/free-icon-coin-4153647.png" alt="CoinKeeper Logo" className="h-16 w-16 mb-3" />
                    <h1 className="text-3xl font-bold text-white">CoinKeeper</h1>
                    <p className="text-slate-300 dark:text-slate-400">Создайте аккаунт для начала работы</p>
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
                        id="password" type="password" label="Пароль (мин. 6 символов)" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        error={fieldErrors.password} icon={<LockClosedIcon />}
                        themeVariant="auth"
                        labelClassName="text-slate-300 dark:text-slate-400"
                    />
                    <Input
                        id="confirmPassword" type="password" label="Подтвердите пароль" placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        error={fieldErrors.confirmPassword} icon={<LockClosedIcon />}
                        themeVariant="auth"
                        labelClassName="text-slate-300 dark:text-slate-400"
                    />
                    <Button type="submit" fullWidth className="mt-8 py-3 text-base !bg-primary hover:!bg-primary-hover dark:!bg-primary-dark dark:hover:!bg-primary-dark_hover" disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>
                <p className="text-sm text-center mt-8 text-slate-400 dark:text-slate-500">
                    Уже есть аккаунт?{' '}
                    <Link
                        to="/login"
                        state={{ from: location.state?.from }}
                        className="font-medium text-primary-light dark:text-primary-dark hover:underline"
                    >
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default RegisterPage;