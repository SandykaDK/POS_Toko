import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './pages/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Cashier } from './pages/Cashier.jsx';
import { Products } from './pages/Products.jsx';
import { Categories } from './pages/Categories.jsx';
import { Customers } from './pages/Customers.jsx';
import { Suppliers } from './pages/Suppliers.jsx';
import { Discounts } from './pages/Discounts.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { Transactions } from './pages/Transactions.jsx';

function App() {
    return React.createElement(
        Router,
        null,
        React.createElement(
            Layout,
            null,
            React.createElement(
                Routes,
                null,
                React.createElement(Route, { path: '/', element: React.createElement(Dashboard) }),
                React.createElement(Route, { path: '/cashier', element: React.createElement(Cashier) }),
                React.createElement(Route, { path: '/products', element: React.createElement(Products) }),
                React.createElement(Route, { path: '/categories', element: React.createElement(Categories) }),
                React.createElement(Route, { path: '/customers', element: React.createElement(Customers) }),
                React.createElement(Route, { path: '/suppliers', element: React.createElement(Suppliers) }),
                React.createElement(Route, { path: '/discounts', element: React.createElement(Discounts) }),
                React.createElement(Route, { path: '/inventory', element: React.createElement(Inventory) }),
                React.createElement(Route, { path: '/transactions', element: React.createElement(Transactions) }),
            ),
        ),
    );
}

export default App;
