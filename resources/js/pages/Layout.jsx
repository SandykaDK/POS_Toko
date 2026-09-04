import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../api.js';
import {
    ArchiveBoxIcon,
    ArrowLeftStartOnRectangleIcon,
    BanknotesIcon,
    BuildingStorefrontIcon,
    CalculatorIcon,
    FolderIcon,
    HomeIcon,
    ReceiptPercentIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

export function Layout({ children, user, onLogout }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: HomeIcon },
        { path: '/cashier', label: 'Kasir', icon: BanknotesIcon },
        { path: '/products', label: 'Produk', icon: ArchiveBoxIcon },
        { path: '/categories', label: 'Kategori', icon: FolderIcon },
        { path: '/customers', label: 'Pelanggan', icon: UsersIcon },
        { path: '/discounts', label: 'Diskon', icon: ReceiptPercentIcon },
        { path: '/transactions', label: 'Riwayat Transaksi', icon: CalculatorIcon },
    ];

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = async () => {
        await logout().catch(() => undefined);
        onLogout(null);
    };

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
                React.createElement('div', { className: 'brand-mark' }, React.createElement(BuildingStorefrontIcon, { 'aria-hidden': 'true' })),
                React.createElement('div', null, 'TokoPOS'),
            ),
            React.createElement(
                'div',
                { className: 'nav-group' },
                menuItems.map((item) =>
                    React.createElement(
                        Link,
                        {
                            key: item.path,
                            to: item.path,
                            className: `nav-item ${location.pathname === item.path ? 'active' : ''}`,
                            onClick: closeSidebar,
                        },
                        React.createElement(item.icon, { 'aria-hidden': 'true' }),
                        React.createElement('span', null, item.label),
                    ),
                ),
            ),
            React.createElement(
                'div',
                { className: 'sidebar-footer' },
                React.createElement('div', { className: 'user-summary' },
                    React.createElement('span', { className: 'user-avatar' }, user?.name?.charAt(0)?.toUpperCase() || 'U'),
                    React.createElement('span', null, user?.name || 'Pengguna'),
                ),
                React.createElement(
                    'button',
                    { className: 'logout-button', onClick: handleLogout },
                    React.createElement(ArrowLeftStartOnRectangleIcon, { 'aria-hidden': 'true' }),
                    React.createElement('span', null, 'Keluar'),
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
