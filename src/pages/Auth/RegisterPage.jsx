// src/pages/Auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { EnvelopeIcon, LockClosedIcon, UserPlusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';

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
            const result = await register(email, password);
            setIsLoading(false);
            if (result.success) {
                setIsSuccess(true);
                // Не перенаправляем сразу, показываем сообщение об успехе
            } else {
                setFormError(result.message || "Ошибка регистрации. Пожалуйста, попробуйте еще раз.");
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-background-dark p-4">
                <div className="bg-authFormBg backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
                    <UserPlusIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-green-400 mb-4">Регистрация успешна!</h2>
                    <p className="text-text-dark_muted mb-6">Теперь вы можете войти, используя указанные данные.</p>
                    <Button
                        onClick={() => navigate('/login', { state: { from: location.state?.from } })} // Передаем from
                        fullWidth
                        className="py-3 text-base"
                    >
                        Перейти ко входу
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-background-dark p-4">
            <div className="bg-authFormBg backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <CurrencyDollarIcon className="h-16 w-16 text-primary-dark mb-3" />
                    <h1 className="text-3xl font-bold text-white">CoinKeeper</h1>
                    <p className="text-text-dark_muted">Создайте аккаунт для начала работы</p>
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
                        themeVariant="auth"
                    />
                    <Input
                        id="password" type="password" label="Пароль (мин. 6 символов)" placeholder="••••••••"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        error={fieldErrors.password} icon={<LockClosedIcon />}
                        themeVariant="auth"
                    />
                    <Input
                        id="confirmPassword" type="password" label="Подтвердите пароль" placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        error={fieldErrors.confirmPassword} icon={<LockClosedIcon />}
                        themeVariant="auth"
                    />
                    <Button type="submit" fullWidth className="mt-8 py-3 text-base" disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </Button>
                </form>
                <p className="text-sm text-center mt-8 text-slate-400">
                    Уже есть аккаунт?{' '}
                    <Link
                        to="/login"
                        state={{ from: location.state?.from }} // Передаем from
                        className="font-medium text-primary-dark hover:underline"
                    >
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
};
export default RegisterPage;