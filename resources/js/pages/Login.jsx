import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingStorefrontIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { login } from '../api.js';

export function Login({ onLogin }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '', remember: false });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const updateField = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
        setError('');
    };

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await login(form);
            onLogin(response.user);
            navigate('/', { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    };

    return React.createElement(
        'main',
        { className: 'login-page' },
        React.createElement('section', { className: 'login-intro' },
            React.createElement('div', { className: 'login-brand' },
                React.createElement('span', { className: 'login-brand-mark' }, React.createElement(BuildingStorefrontIcon, { 'aria-hidden': 'true' })),
                React.createElement('span', null, 'TokoPOS'),
            ),
            React.createElement('p', { className: 'login-kicker' }, 'Operasional toko, lebih teratur'),
            React.createElement('h1', null, 'Mulai hari dengan kendali penuh atas penjualan.'),
            React.createElement('p', { className: 'login-description' }, 'Masuk untuk mengelola kasir, produk, stok, pelanggan, dan transaksi dalam satu tempat.'),
        ),
        React.createElement('section', { className: 'login-panel', 'aria-labelledby': 'login-title' },
            React.createElement('div', { className: 'login-panel-heading' },
                React.createElement('p', { className: 'eyebrow' }, 'Akses staff'),
                React.createElement('h2', { id: 'login-title' }, 'Masuk ke TokoPOS'),
                React.createElement('p', null, 'Gunakan akun staf yang terdaftar untuk melanjutkan.'),
            ),
            error && React.createElement('div', { className: 'login-error', role: 'alert' }, error),
            React.createElement('form', { className: 'login-form', onSubmit: submit },
                React.createElement('label', { className: 'login-field' },
                    React.createElement('span', null, 'Email'),
                    React.createElement('span', { className: 'login-input-wrap' },
                        React.createElement(UserIcon, { 'aria-hidden': 'true' }),
                        React.createElement('input', { name: 'email', type: 'email', value: form.email, onChange: updateField, placeholder: 'nama@toko.com', autoComplete: 'email', required: true, autoFocus: true }),
                    ),
                ),
                React.createElement('label', { className: 'login-field' },
                    React.createElement('span', null, 'Password'),
                    React.createElement('span', { className: 'login-input-wrap' },
                        React.createElement(LockClosedIcon, { 'aria-hidden': 'true' }),
                        React.createElement('input', { name: 'password', type: 'password', value: form.password, onChange: updateField, placeholder: 'Masukkan password', autoComplete: 'current-password', required: true }),
                    ),
                ),
                React.createElement('label', { className: 'login-remember' },
                    React.createElement('input', { name: 'remember', type: 'checkbox', checked: form.remember, onChange: updateField }),
                    React.createElement('span', null, 'Ingat saya di perangkat ini'),
                ),
                React.createElement('button', { className: 'login-submit', type: 'submit', disabled: submitting }, submitting ? 'Memproses...' : 'Masuk'),
            ),
        ),
    );
}
