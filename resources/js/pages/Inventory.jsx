import React, { useEffect, useState } from 'react';
import { fetchList } from '../api.js';

export function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [inventoryRes, productsRes] = await Promise.all([
                fetchList('inventory', 1, 100),
                fetchList('products', 1, 100),
            ]);

            setInventory(inventoryRes.data || []);
            setProducts(productsRes.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getProductName = (productId) => {
        const product = products.find((p) => p.id === productId);
        return product ? product.name : '-';
    };

    const lowStockProducts = products.filter((p) => Number(p.stock) <= Number(p.min_stock));

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Manajemen Stok'),
        ),
        React.createElement(
            'section',
            { className: 'stats-grid' },
            React.createElement(
                'div',
                { className: 'stat-card' },
                React.createElement('div', { className: 'icon' }, '📦'),
                React.createElement('div', { className: 'label' }, 'Total Produk'),
                React.createElement('div', { className: 'value' }, String(products.length)),
            ),
            React.createElement(
                'div',
                { className: 'stat-card' },
                React.createElement('div', { className: 'icon' }, '⚠️'),
                React.createElement('div', { className: 'label' }, 'Stok Rendah'),
                React.createElement('div', { className: 'value' }, String(lowStockProducts.length)),
                React.createElement('div', { className: 'trend' }, 'Perlu restock'),
            ),
        ),
        React.createElement(
            'div',
            { className: 'content-grid' },
            React.createElement(
                'section',
                { className: 'panel' },
                React.createElement(
                    'div',
                    { className: 'panel-header' },
                    React.createElement('h2', null, 'Produk dengan Stok Rendah'),
                    React.createElement('span', { className: 'subtle' }, `${lowStockProducts.length} item`),
                ),
                lowStockProducts.length === 0
                    ? React.createElement('div', { className: 'empty-state' }, 'Semua stok terjaga dengan baik.')
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
                                      React.createElement('th', null, 'Produk'),
                                      React.createElement('th', null, 'Stok Saat Ini'),
                                      React.createElement('th', null, 'Stok Minimal'),
                                      React.createElement('th', null, 'Unit'),
                                      React.createElement('th', null, 'Status'),
                                  ),
                              ),
                              React.createElement(
                                  'tbody',
                                  null,
                                  lowStockProducts.map((product) =>
                                      React.createElement(
                                          'tr',
                                          { key: product.id, className: 'warning-row' },
                                          React.createElement('td', null, product.name),
                                          React.createElement('td', null, product.stock),
                                          React.createElement('td', null, product.min_stock),
                                          React.createElement('td', null, product.unit),
                                          React.createElement('td', null, '⚠️ Kritis'),
                                      ),
                                  ),
                              ),
                          ),
                      ),
            ),
            React.createElement(
                'section',
                { className: 'panel' },
                React.createElement(
                    'div',
                    { className: 'panel-header' },
                    React.createElement('h2', null, 'Semua Produk'),
                    React.createElement('span', { className: 'subtle' }, `${products.length} item`),
                ),
                loading
                    ? React.createElement('div', { className: 'empty-state' }, 'Memuat data...')
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
                                      React.createElement('th', null, 'SKU'),
                                      React.createElement('th', null, 'Produk'),
                                      React.createElement('th', null, 'Stok'),
                                      React.createElement('th', null, 'Min'),
                                      React.createElement('th', null, 'Unit'),
                                      React.createElement('th', null, 'Status'),
                                  ),
                              ),
                              React.createElement(
                                  'tbody',
                                  null,
                                  products.map((product) =>
                                      React.createElement(
                                          'tr',
                                          { key: product.id, className: Number(product.stock) <= Number(product.min_stock) ? 'warning-row' : '' },
                                          React.createElement('td', null, product.sku),
                                          React.createElement('td', null, product.name),
                                          React.createElement('td', null, product.stock),
                                          React.createElement('td', null, product.min_stock),
                                          React.createElement('td', null, product.unit),
                                          React.createElement('td', null, Number(product.stock) <= Number(product.min_stock) ? '⚠️ Rendah' : '✓ Normal'),
                                      ),
                                  ),
                              ),
                          ),
                      ),
            ),
        ),
        message.text ? React.createElement('div', { className: `message ${message.type}` }, message.text) : null,
    );
}
