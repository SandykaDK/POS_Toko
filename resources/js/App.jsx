import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { fetchCurrentUser } from './api.js';
import { Login } from './pages/Login.jsx';
import { Layout } from './pages/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Cashier } from './pages/Cashier.jsx';
import { Products } from './pages/Products.jsx';
import { Categories } from './pages/Categories.jsx';
import { Customers } from './pages/Customers.jsx';
import { Discounts } from './pages/Discounts.jsx';
import { Transactions } from './pages/Transactions.jsx';

function ProtectedRoutes({ user, onLogout }) {
    if (!user) {
        return React.createElement(Login, { onLogin: onLogout });
    }

    return React.createElement(
        Layout,
        { user, onLogout },
        React.createElement(
            Routes,
            null,
            React.createElement(Route, { path: '/', element: React.createElement(Dashboard) }),
            React.createElement(Route, { path: '/cashier', element: React.createElement(Cashier) }),
            React.createElement(Route, { path: '/products', element: React.createElement(Products) }),
            React.createElement(Route, { path: '/categories', element: React.createElement(Categories) }),
            React.createElement(Route, { path: '/customers', element: React.createElement(Customers) }),
            React.createElement(Route, { path: '/discounts', element: React.createElement(Discounts) }),
            React.createElement(Route, { path: '/transactions', element: React.createElement(Transactions) }),
        ),
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        fetchCurrentUser()
            .then((response) => setUser(response.user))
            .catch(() => setUser(null))
            .finally(() => setCheckingAuth(false));
    }, []);

    if (checkingAuth) {
        return React.createElement('div', { className: 'auth-loading' }, 'Memeriksa sesi...');
    }

    return React.createElement(
        Router,
        null,
        React.createElement(ProtectedRoutes, { user, onLogout: setUser }),
    );
}

export default App;
