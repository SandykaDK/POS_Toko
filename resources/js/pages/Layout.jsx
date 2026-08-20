import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Layout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: '📊' },
        { path: '/cashier', label: 'Point of Sale', icon: '🛒' },
        { path: '/products', label: 'Produk', icon: '📦' },
        { path: '/categories', label: 'Kategori', icon: '🏷️' },
        { path: '/customers', label: 'Pelanggan', icon: '👥' },
        { path: '/suppliers', label: 'Pemasok', icon: '🚚' },
        { path: '/discounts', label: 'Diskon', icon: '🎁' },
        { path: '/inventory', label: 'Stok', icon: '📊' },
        { path: '/transactions', label: 'Transaksi', icon: '💾' },
    ];

    const closeSidebar = () => setSidebarOpen(false);

    return React.createElement(
        'div',
        { className: 'pos-shell' },
        sidebarOpen && React.createElement('div', {
            className: 'sidebar-overlay',
            onClick: closeSidebar
        }),
        React.createElement(
            'aside',
            { className: `sidebar ${sidebarOpen ? 'open' : ''}` },
            React.createElement(
                'div',
                { className: 'brand' },
                React.createElement('div', { className: 'brand-mark' }, 'P'),
                React.createElement('div', null, 'TokoPOS'),
            ),
            React.createElement(
                'div',
                { className: 'nav-group' },
                menuItems.map((item, index) =>
                    React.createElement(
                        Link,
                        {
                            key: item.path,
                            to: item.path,
                            className: `nav-item ${location.pathname === item.path ? 'active' : ''}`,
                            onClick: closeSidebar,
                        },
                        React.createElement('span', null, item.icon),
                        React.createElement('span', null, item.label),
                    ),
                ),
            ),
        ),
        React.createElement(
            'main',
            { className: 'main-panel' },
            React.createElement(
                'button',
                {
                    className: 'sidebar-toggle',
                    onClick: () => setSidebarOpen(!sidebarOpen),
                    'aria-label': 'Toggle sidebar'
                },
                '☰'
            ),
            children,
        ),
    );
}
