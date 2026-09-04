import React, { useEffect, useState } from 'react';
import { money, formatDate, formatTime } from '../helpers.js';
import { fetchList } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';
import { ArrowDownTrayIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const getLocalDate = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};

export function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const today = getLocalDate();
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        loadData();
    }, [startDate, endDate]);

    useEffect(() => {
        if (!selectedTransaction) return undefined;
        const handleKeyDown = (event) => { if (event.key === 'Escape') setSelectedTransaction(null); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedTransaction]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('transactions', 1, 100, { start_date: startDate, end_date: endDate });
            setTransactions(res.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const printTransaction = (transaction) => {
        const printWindow = window.open('', '_blank', 'width=420,height=720');
        if (!printWindow) {
            setMessage({ type: 'error', text: 'Jendela cetak tidak dapat dibuka. Izinkan pop-up pada browser Anda.' });
            return;
        }

        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        const items = transaction.transaction_items || transaction.transactionItems || [];
        const itemRows = items.map((item) => `
            <div class="item">
                <div class="item-name">${escapeHtml(item.product?.name || `Produk #${item.product_id}`)}</div>
                <div class="item-detail"><span>${item.quantity} x ${money(item.unit_price)}</span><strong>${money(item.subtotal)}</strong></div>
            </div>
        `).join('');

        printWindow.document.write(`
            <!doctype html>
            <html lang="id">
                <head>
                    <meta charset="UTF-8">
                    <title>${transaction.invoice_number}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        * { box-sizing: border-box; }
                        body { width: 80mm; margin: 0; padding: 8mm 5mm; color: #111; font: 12px "Courier New", monospace; }
                        main { width: 100%; }
                        .store { margin: 0; text-align: center; font-size: 20px; font-weight: 700; }
                        .address, .thanks { margin: 3px 0; text-align: center; }
                        .meta { margin: 12px 0 8px; }
                        .meta div, .summary div, .item-detail { display: flex; justify-content: space-between; gap: 8px; }
                        .divider { margin: 8px 0; border-top: 1px dashed #111; }
                        .item { padding: 4px 0; }
                        .item-name { overflow-wrap: anywhere; }
                        .item-detail { padding-left: 8px; }
                        .summary { margin-top: 8px; }
                        .summary div { padding: 3px 0; }
                        .grand-total { margin-top: 5px; padding-top: 6px; border-top: 1px solid #111; font-size: 15px; font-weight: 700; }
                        .thanks { margin-top: 18px; }
                        .no-items { padding: 8px 0; text-align: center; }
                    </style>
                </head>
                <body>
                    <main>
                        <h1 class="store">TokoPOS</h1>
                        <p class="address">Struk Pembelian</p>
                        <div class="divider"></div>
                        <div class="meta">
                            <div><span>No. Invoice</span><strong>${escapeHtml(transaction.invoice_number)}</strong></div>
                            <div><span>Tanggal</span><strong>${escapeHtml(formatDate(transaction.transaction_date))}</strong></div>
                            <div><span>Kasir</span><strong>${escapeHtml(transaction.user?.name || 'Admin')}</strong></div>
                        </div>
                        <div class="divider"></div>
                        ${itemRows || '<div class="no-items">Tidak ada rincian barang</div>'}
                        <div class="divider"></div>
                        <div class="summary">
                            <div><span>Subtotal</span><strong>${money(transaction.subtotal)}</strong></div>
                            <div><span>Diskon</span><strong>${money(transaction.discount_amount)}</strong></div>
                            <div><span>Pembayaran</span><strong>${escapeHtml(transaction.payment_method)}</strong></div>
                            <div class="grand-total"><span>TOTAL</span><strong>${money(transaction.total_amount)}</strong></div>
                        </div>
                        <p class="thanks">Terima kasih telah berbelanja</p>
                    </main>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

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
            { className: 'panel' },
            React.createElement(
                'div',
                { className: 'transaction-filters' },
                React.createElement(
                    'label',
                    null,
                    React.createElement('span', null, 'Tanggal Awal'),
                    React.createElement('input', { type: 'date', value: startDate, max: endDate, onChange: (event) => setStartDate(event.target.value) }),
                ),
                React.createElement(
                    'label',
                    null,
                    React.createElement('span', null, 'Tanggal Akhir'),
                    React.createElement('input', { type: 'date', value: endDate, min: startDate, onChange: (event) => setEndDate(event.target.value) }),
                ),
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
                            { className: 'data-table category-data-table' },
                            React.createElement(
                                'thead',
                                null,
                                React.createElement(
                                    'tr',
                                    null,
                                    React.createElement('th', null, 'Invoice'),
                                    React.createElement('th', null, 'Tanggal & Jam'),
                                    React.createElement('th', null, 'Total'),
                                    React.createElement('th', null, 'Diskon'),
                                    React.createElement('th', null, 'Metode'),
                                    React.createElement('th', null, 'Status'),
                                    React.createElement('th', null, 'Aksi'),
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
                                        React.createElement('td', null, React.createElement('div', { className: 'transaction-date' }, React.createElement('span', null, formatDate(transaction.transaction_date)), React.createElement('small', null, formatTime(transaction.transaction_date)))),
                                        React.createElement('td', null, money(transaction.total_amount)),
                                        React.createElement('td', null, money(transaction.discount_amount)),
                                        React.createElement('td', null, transaction.payment_method),
                                        React.createElement('td', null, transaction.status === 'completed' ? '✓ Selesai' : '○ Pending'),
                                        React.createElement(
                                            'td',
                                            { className: 'action-buttons' },
                                            React.createElement('button', { className: 'btn-view', type: 'button', title: 'Lihat detail transaksi', 'aria-label': 'Lihat detail transaksi', onClick: () => setSelectedTransaction(transaction) }, React.createElement(InformationCircleIcon, { 'aria-hidden': 'true' })),
                                            React.createElement('button', { className: 'btn-print', type: 'button', title: 'Cetak transaksi', 'aria-label': 'Cetak transaksi', onClick: () => printTransaction(transaction) }, React.createElement(ArrowDownTrayIcon, { 'aria-hidden': 'true' })),
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
        ),
        selectedTransaction
            ? React.createElement(
                  'div',
                  { className: 'transaction-detail-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setSelectedTransaction(null); } },
                  React.createElement(
                      'div',
                      { className: 'transaction-detail-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'transaction-detail-title' },
                      React.createElement(
                          'div',
                          { className: 'transaction-detail-header' },
                          React.createElement('div', null, React.createElement('span', { className: 'transaction-detail-eyebrow' }, 'Detail pembelian'), React.createElement('h2', { id: 'transaction-detail-title' }, selectedTransaction.invoice_number)),
                          React.createElement('button', { className: 'transaction-detail-close', type: 'button', onClick: () => setSelectedTransaction(null), 'aria-label': 'Tutup detail transaksi' }, React.createElement(XMarkIcon, { 'aria-hidden': 'true' })),
                      ),
                      React.createElement(
                          'div',
                          { className: 'transaction-detail-meta' },
                          React.createElement('div', null, React.createElement('span', null, 'Tanggal'), React.createElement('strong', null, formatDate(selectedTransaction.transaction_date))),
                          React.createElement('div', null, React.createElement('span', null, 'Jam'), React.createElement('strong', null, formatTime(selectedTransaction.transaction_date))),
                          React.createElement('div', null, React.createElement('span', null, 'Metode pembayaran'), React.createElement('strong', null, selectedTransaction.payment_method)),
                          React.createElement('div', null, React.createElement('span', null, 'Status'), React.createElement('strong', null, selectedTransaction.status === 'completed' ? 'Selesai' : 'Pending')),
                      ),
                      React.createElement('h3', { className: 'transaction-detail-section-title' }, 'Item yang dibeli'),
                      React.createElement(
                          'div',
                          { className: 'transaction-detail-items' },
                          (selectedTransaction.transaction_items || selectedTransaction.transactionItems || []).map((item) => React.createElement(
                              'div',
                              { className: 'transaction-detail-item', key: item.id },
                              React.createElement('div', null, React.createElement('strong', null, item.product?.name || `Produk #${item.product_id}`), React.createElement('span', null, `${item.quantity} x ${money(item.unit_price)}`)),
                              React.createElement('strong', null, money(item.subtotal)),
                          )),
                      ),
                      React.createElement(
                          'div',
                          { className: 'transaction-detail-summary' },
                          React.createElement('div', null, React.createElement('span', null, 'Subtotal'), React.createElement('strong', null, money(selectedTransaction.subtotal))),
                          React.createElement('div', null, React.createElement('span', null, 'Diskon'), React.createElement('strong', null, money(selectedTransaction.discount_amount))),
                          React.createElement('div', { className: 'transaction-detail-total' }, React.createElement('span', null, 'Total'), React.createElement('strong', null, money(selectedTransaction.total_amount))),
                      ),
                  ),
              )
            : null,
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
