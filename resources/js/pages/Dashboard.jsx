import React, { useEffect, useState } from 'react';
import { money } from '../helpers.js';
import { fetchList } from '../api.js';

export function Dashboard() {
    const [stats, setStats] = useState([
        { label: 'Penjualan Hari Ini', value: money(1250000), trend: '+12.5%', icon: '💰' },
        { label: 'Produk Aktif', value: '0', trend: 'Update real-time', icon: '📦' },
        { label: 'Total Transaksi', value: '0', trend: 'Hari ini', icon: '🛒' },
        { label: 'Stok Rendah', value: '0', trend: 'Perlu restock', icon: '⚠️' },
    ]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [productsRes, transactionsRes] = await Promise.all([
                fetchList('products', 1, 100),
                fetchList('transactions', 1, 100),
            ]);

            const products = productsRes.data || [];
            const transactions = transactionsRes.data || [];
            const lowStock = products.filter((p) => Number(p.stock) <= Number(p.min_stock)).length;

            setStats([
                { label: 'Penjualan Hari Ini', value: money(1250000), trend: '+12.5%', icon: '💰' },
                { label: 'Produk Aktif', value: String(products.filter((p) => p.is_active).length), trend: 'Tersedia', icon: '📦' },
                { label: 'Total Transaksi', value: String(transactions.length), trend: 'Semua waktu', icon: '🛒' },
                { label: 'Stok Rendah', value: String(lowStock), trend: 'Perlu perhatian', icon: '⚠️' },
            ]);
        } catch (error) {
            console.error('Gagal memuat statistik:', error);
        }
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Dashboard'),
        ),
        React.createElement(
            'section',
            { className: 'stats-grid' },
            stats.map((stat) =>
                React.createElement(
                    'div',
                    { key: stat.label, className: 'stat-card' },
                    React.createElement('div', { className: 'icon' }, stat.icon),
                    React.createElement('div', { className: 'label' }, stat.label),
                    React.createElement('div', { className: 'value' }, stat.value),
                    React.createElement('div', { className: 'trend' }, stat.trend),
                ),
            ),
        ),
    );
}
