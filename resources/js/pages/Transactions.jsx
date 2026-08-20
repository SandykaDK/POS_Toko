import React, { useEffect, useState } from 'react';
import { money, formatDate } from '../helpers.js';
import { fetchList } from '../api.js';

export function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('transactions', 1, 100);
            setTransactions(res.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Total Transaksi', value: String(transactions.length), icon: '🛒' },
        {
            label: 'Total Penjualan',
            value: money(transactions.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0)),
            icon: '💰',
        },
        {
            label: 'Transaksi Hari Ini',
            value: String(transactions.filter((t) => new Date(t.transaction_date).toDateString() === new Date().toDateString()).length),
            icon: '📅',
        },
    ];

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Riwayat Transaksi'),
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
                ),
            ),
        ),
        React.createElement(
            'section',
            { className: 'panel' },
            React.createElement(
                'div',
                { className: 'panel-header' },
                React.createElement('h2', null, 'Daftar Transaksi'),
                React.createElement('span', { className: 'subtle' }, `${transactions.length} item`),
            ),
            loading
                ? React.createElement('div', { className: 'empty-state' }, 'Memuat data...')
                : transactions.length === 0
                  ? React.createElement('div', { className: 'empty-state' }, 'Belum ada transaksi.')
                  : React.createElement(
                        'div',
                        { className: 'table-container' },
                        React.createElement(
                            'table',
                            { className: 'data-table' },
                            React.createElement(
                                'thead',
                                null,
                                React.createElement(
                                    'tr',
                                    null,
                                    React.createElement('th', null, 'Invoice'),
                                    React.createElement('th', null, 'Tanggal'),
                                    React.createElement('th', null, 'Total'),
                                    React.createElement('th', null, 'Diskon'),
                                    React.createElement('th', null, 'Pajak'),
                                    React.createElement('th', null, 'Metode'),
                                    React.createElement('th', null, 'Status'),
                                ),
                            ),
                            React.createElement(
                                'tbody',
                                null,
                                transactions.map((transaction) =>
                                    React.createElement(
                                        'tr',
                                        { key: transaction.id },
                                        React.createElement('td', null, React.createElement('strong', null, transaction.invoice_number)),
                                        React.createElement('td', null, formatDate(transaction.transaction_date)),
                                        React.createElement('td', null, money(transaction.total_amount)),
                                        React.createElement('td', null, money(transaction.discount_amount)),
                                        React.createElement('td', null, money(transaction.tax_amount)),
                                        React.createElement('td', null, transaction.payment_method),
                                        React.createElement('td', null, transaction.status === 'completed' ? '✓ Selesai' : '○ Pending'),
                                    ),
                                ),
                            ),
                        ),
                    ),
        ),
        message.text ? React.createElement('div', { className: `message ${message.type}` }, message.text) : null,
    );
}
