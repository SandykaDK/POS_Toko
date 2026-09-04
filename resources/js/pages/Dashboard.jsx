import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRightIcon,
    BanknotesIcon,
    ChartBarIcon,
    ClockIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '../api.js';
import { money } from '../helpers.js';

const initialData = {
    stats: { sales_today: 0, transactions_today: 0, average_transaction: 0, active_products: 0, low_stock_count: 0, customers_count: 0, active_discounts: 0 },
    sales_by_day: [],
    top_products: [],
    low_stock_products: [],
    recent_transactions: [],
};

const formatDay = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short' }).replace('.', '');
const formatDateTime = (date) => new Date(date).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const formatLastUpdated = (date) => {
    const value = new Date(date);
    const datePart = value.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timePart = value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return `${datePart}, ${timePart}`;
};

export function Dashboard() {
    const [dashboard, setDashboard] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const loadDashboard = async (showLoading = true) => {
        try {
            setLoading(showLoading);
            setError('');
            const response = await apiFetch('/dashboard');
            setDashboard(response.data || initialData);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();

        const refreshIfVisible = () => {
            if (document.visibilityState === 'visible') loadDashboard(false);
        };
        const refreshInterval = window.setInterval(refreshIfVisible, 30000);
        const clockInterval = window.setInterval(() => setCurrentTime(new Date()), 1000);
        document.addEventListener('visibilitychange', refreshIfVisible);

        return () => {
            window.clearInterval(refreshInterval);
            window.clearInterval(clockInterval);
            document.removeEventListener('visibilitychange', refreshIfVisible);
        };
    }, []);

    const { stats, sales_by_day: salesByDay, top_products: topProducts, low_stock_products: lowStockProducts, recent_transactions: recentTransactions } = dashboard;
    const maxSales = Math.max(...salesByDay.map((item) => Number(item.sales || 0)), 1);
    const statCards = [
        { label: 'Omzet hari ini', value: money(stats.sales_today), note: `${stats.transactions_today} transaksi selesai`, icon: BanknotesIcon, tone: 'blue' },
        { label: 'Rata-rata transaksi', value: money(stats.average_transaction), note: 'Nilai per transaksi', icon: ChartBarIcon, tone: 'teal' },
        { label: 'Produk aktif', value: stats.active_products, note: `${stats.low_stock_count} perlu dicek stoknya`, icon: CubeIcon, tone: 'amber' },
        { label: 'Transaksi hari ini', value: stats.transactions_today, note: 'Transaksi berhasil', icon: ShoppingCartIcon, tone: 'violet' },
    ];

    return React.createElement(
        'div', { className: 'dashboard-page' },
        React.createElement('header', { className: 'dashboard-header' },
            React.createElement('div', null,
                React.createElement('p', { className: 'dashboard-eyebrow' }, 'Ringkasan toko'),
                React.createElement('h1', null, 'Dashboard'),
                React.createElement('p', { className: 'dashboard-subtitle' }, formatLastUpdated(currentTime)),
            ),
        ),
        error && React.createElement('div', { className: 'dashboard-error', role: 'alert' }, error),
        React.createElement('section', { className: 'dashboard-stats', 'aria-label': 'Ringkasan performa toko' },
            statCards.map((stat) => React.createElement('article', { key: stat.label, className: `dashboard-stat-card ${stat.tone}` },
                React.createElement('div', { className: 'dashboard-stat-icon' }, React.createElement(stat.icon, { 'aria-hidden': 'true' })),
                React.createElement('div', { className: 'dashboard-stat-label' }, stat.label),
                React.createElement('div', { className: 'dashboard-stat-value' }, loading ? '...' : stat.value),
                React.createElement('div', { className: 'dashboard-stat-note' }, stat.note),
            )),
        ),
        React.createElement('section', { className: 'dashboard-primary-grid' },
            React.createElement('article', { className: 'dashboard-panel sales-panel' },
                React.createElement('div', { className: 'dashboard-panel-heading' },
                    React.createElement('div', null, React.createElement('h2', null, 'Performa penjualan'), React.createElement('p', null, 'Omzet 7 hari terakhir')),
                    React.createElement(ChartBarIcon, { 'aria-hidden': 'true' }),
                ),
                React.createElement('div', { className: 'sales-chart', 'aria-label': 'Grafik omzet tujuh hari terakhir' },
                    salesByDay.map((item) => React.createElement('div', { className: 'sales-bar-group', key: item.date, tabIndex: 0, 'aria-label': `${formatDay(item.date)}: ${money(item.sales)}, ${item.transactions} transaksi` },
                        React.createElement('div', { className: 'sales-bar-track' }, React.createElement('div', { className: 'sales-bar', style: { height: `${Math.max(Number(item.sales) ? 8 : 3, (Number(item.sales || 0) / maxSales) * 100)}%` } })),
                        React.createElement('div', { className: 'sales-tooltip', role: 'tooltip' }, React.createElement('strong', null, money(item.sales)), React.createElement('span', null, `${item.transactions} transaksi`)),
                        React.createElement('span', { className: 'sales-bar-label' }, formatDay(item.date)),
                    )),
                    !salesByDay.length && React.createElement('div', { className: 'dashboard-empty' }, 'Belum ada penjualan dalam periode ini.'),
                ),
            ),
            React.createElement('article', { className: 'dashboard-panel low-stock-panel' },
                React.createElement('div', { className: 'dashboard-panel-heading' },
                    React.createElement('div', null, React.createElement('h2', null, 'Perlu perhatian'), React.createElement('p', null, `${stats.low_stock_count} produk stok rendah`)),
                    React.createElement(ExclamationTriangleIcon, { 'aria-hidden': 'true' }),
                ),
                lowStockProducts.length
                    ? React.createElement('div', { className: 'low-stock-list' }, lowStockProducts.map((product) => React.createElement('div', { className: 'low-stock-row', key: product.id },
                        React.createElement('div', { className: 'low-stock-product' }, React.createElement('strong', null, product.name), React.createElement('span', null, product.product_code)),
                        React.createElement('div', { className: 'low-stock-value' }, `${product.stock} ${product.unit}`, React.createElement('small', null, `min. ${product.min_stock}`)),
                    )))
                    : React.createElement('div', { className: 'dashboard-empty success-empty' }, 'Semua stok dalam kondisi aman.'),
                lowStockProducts.length > 0 && React.createElement(Link, { className: 'dashboard-panel-link', to: '/products' }, 'Kelola produk', React.createElement(ArrowRightIcon, { 'aria-hidden': 'true' })),
            ),
        ),
        React.createElement('section', { className: 'dashboard-secondary-grid' },
            React.createElement('article', { className: 'dashboard-panel' },
                React.createElement('div', { className: 'dashboard-panel-heading' },
                    React.createElement('div', null, React.createElement('h2', null, 'Produk terlaris'), React.createElement('p', null, 'Berdasarkan penjualan 30 hari terakhir')),
                    React.createElement(Link, { to: '/products', className: 'dashboard-icon-link', title: 'Lihat produk' }, React.createElement(ArrowRightIcon, { 'aria-hidden': 'true' })),
                ),
                topProducts.length
                    ? React.createElement('div', { className: 'top-products-list' }, topProducts.map((product, index) => React.createElement('div', { className: 'top-product-row', key: product.id },
                        React.createElement('span', { className: 'top-product-rank' }, String(index + 1).padStart(2, '0')),
                        React.createElement('div', { className: 'top-product-name' }, React.createElement('strong', null, product.name), React.createElement('span', null, product.product_code)),
                        React.createElement('div', { className: 'top-product-sales' }, React.createElement('strong', null, `${product.quantity_sold} terjual`), React.createElement('span', null, money(product.sales))),
                    )))
                    : React.createElement('div', { className: 'dashboard-empty' }, 'Belum ada data produk terlaris.'),
            ),
            React.createElement('article', { className: 'dashboard-panel' },
                React.createElement('div', { className: 'dashboard-panel-heading' },
                    React.createElement('div', null, React.createElement('h2', null, 'Transaksi terbaru'), React.createElement('p', null, 'Penjualan yang baru selesai')),
                    React.createElement(Link, { to: '/transactions', className: 'dashboard-icon-link', title: 'Lihat transaksi' }, React.createElement(ArrowRightIcon, { 'aria-hidden': 'true' })),
                ),
                recentTransactions.length
                    ? React.createElement('div', { className: 'recent-transactions-list' }, recentTransactions.map((transaction) => React.createElement('div', { className: 'recent-transaction-row', key: transaction.id },
                        React.createElement('div', { className: 'recent-transaction-icon' }, React.createElement(ClockIcon, { 'aria-hidden': 'true' })),
                        React.createElement('div', { className: 'recent-transaction-info' }, React.createElement('strong', null, transaction.invoice_number), React.createElement('span', null, transaction.customer?.name || 'Pelanggan umum'), React.createElement('small', null, formatDateTime(transaction.transaction_date))),
                        React.createElement('strong', { className: 'recent-transaction-amount' }, money(transaction.total_amount)),
                    )))
                    : React.createElement('div', { className: 'dashboard-empty' }, 'Belum ada transaksi.'),
            ),
        ),
    );
}
