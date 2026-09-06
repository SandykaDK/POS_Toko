import React, { useEffect, useMemo, useState } from 'react';
import { money } from '../helpers.js';
import { apiFetch, fetchList } from '../api.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AlertPopup } from '../components/AlertPopup.jsx';

const getLocalDateTime = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function Cashier() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [productSearch, setProductSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.quantity * item.selling_price, 0),
        [cart],
    );
    const discountAmount = discountResult?.discount_amount || 0;
    const total = Math.max(subtotal - discountAmount, 0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                fetchList('products', 1, 100, { active: true }),
                fetchList('categories', 1, 100),
            ]);

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart((current) => {
            const existing = current.find((item) => item.id === product.id);
            if (existing) {
                return current.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
                );
            }

            return [...current, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart((current) =>
            current
                .map((item) =>
                    item.id === productId
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const applyDiscount = async () => {
        if (!discountCode.trim()) {
            setDiscountResult(null);
            return;
        }

        try {
            const result = await apiFetch('/discounts/validate', {
                method: 'POST',
                body: JSON.stringify({
                    code: discountCode,
                    purchase_amount: subtotal,
                }),
            });

            setDiscountResult(result.data);
            setMessage({ type: 'success', text: 'Diskon berhasil diterapkan.' });
        } catch (error) {
            setDiscountResult(null);
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleCheckout = async () => {
        if (!cart.length) {
            setMessage({ type: 'error', text: 'Keranjang masih kosong.' });
            return;
        }

        try {
            const transactionPayload = {
                invoice_number: `INV-${Date.now()}`,
                user_id: 1,
                customer_id: null,
                transaction_date: getLocalDateTime(),
                subtotal,
                discount_amount: discountAmount,
                total_amount: total,
                payment_method: 'cash',
                status: 'completed',
                items: cart.map((item) => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.selling_price,
                    discount_per_item: 0,
                })),
            };

            const result = await apiFetch('/transactions', {
                method: 'POST',
                body: JSON.stringify(transactionPayload),
            });

            setCart([]);
            setDiscountCode('');
            setDiscountResult(null);
            setMessage({ type: 'success', text: `Transaksi ${result.data.invoice_number} berhasil disimpan.` });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const visibleProducts = useMemo(() => {
        const searchTerm = productSearch.trim().toLowerCase();

        return products.filter((product) => {
            const hasStock = Number(product.stock) > 0;
            const matchesCategory = selectedCategory === 'all'
                || String(product.category_id) === String(selectedCategory);
            const matchesSearch = !searchTerm
                || product.name.toLowerCase().includes(searchTerm)
                || product.product_code.toLowerCase().includes(searchTerm);

            return hasStock && matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, productSearch]);

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Kasir'),
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
                    React.createElement('h2', null, 'Katalog Produk'),
                    React.createElement(
                        'div',
                        { className: 'catalog-search-wrap' },
                        React.createElement(MagnifyingGlassIcon, { className: 'catalog-search-icon', 'aria-hidden': 'true' }),
                        React.createElement('input', { className: 'search-box catalog-search', value: productSearch, onChange: (e) => setProductSearch(e.target.value), placeholder: 'Cari produk...' }),
                    ),
                ),
                React.createElement(
                    'div',
                    { className: 'catalog-body' },
                    React.createElement(
                        'div',
                        { className: 'category-list' },
                        React.createElement(
                            'button',
                            { className: `category-chip ${selectedCategory === 'all' ? 'active' : ''}`, type: 'button', onClick: () => setSelectedCategory('all') },
                            'Semua',
                        ),
                        categories.map((category) =>
                            React.createElement(
                                'button',
                                {
                                    key: category.id,
                                    className: `category-chip ${selectedCategory === String(category.id) ? 'active' : ''}`,
                                    type: 'button',
                                    onClick: () => setSelectedCategory(String(category.id)),
                                },
                                category.name,
                            ),
                        ),
                    ),
                    loading
                        ? React.createElement('div', { className: 'empty-state' }, 'Memuat produk...')
                        : React.createElement(
                              'div',
                              { className: 'product-grid' },
                              visibleProducts.map((product) =>
                                  React.createElement(
                                      'div',
                                      { key: product.id, className: 'product-card', onClick: () => addToCart(product) },
                                      React.createElement('div', { className: 'thumb' }, product.image ? React.createElement('img', { src: product.image.startsWith('http') ? product.image : `/storage/${product.image}`, alt: product.name }) : product.name.slice(0, 1).toUpperCase()),
                                      React.createElement('h3', null, product.name),
                                      React.createElement(
                                          'div',
                                          { className: 'product-meta' },
                                          React.createElement('span', null, `Kode Produk: ${product.product_code}`),
                                          React.createElement('span', null, `${product.stock} stok`),
                                      ),
                                      React.createElement(
                                          'div',
                                          { className: 'product-price' },
                                          React.createElement('span', null, money(product.selling_price)),
                                              React.createElement('span', {
                                                  className: `dot ${product.stock > product.min_stock ? '' : 'low-stock'}`,
                                                  'aria-label': product.stock > product.min_stock ? 'Stok aman' : 'Stok menipis',
                                              }),
                                      ),
                                  ),
                              ),
                          ),
                ),
            ),
            React.createElement(
                'aside',
                { className: 'panel cart-panel' },
                React.createElement(
                    'div',
                    { className: 'panel-header' },
                    React.createElement('h2', null, 'Keranjang'),
                    React.createElement('span', { className: 'subtle' }, `${cart.reduce((sum, item) => sum + item.quantity, 0)} item`),
                ),
                React.createElement(
                    'div',
                    { className: 'cart-body' },
                    React.createElement(
                        'div',
                        { className: 'cart-item-list' },
                        cart.length === 0
                            ? React.createElement(
                                  'div',
                                  { className: 'empty-state' },
                                  React.createElement('strong', null, 'Keranjang kosong'),
                                  'Pilih produk untuk mulai transaksi',
                              )
                            : cart.map((item) =>
                                  React.createElement(
                                      'div',
                                      { key: item.id, className: 'cart-item' },
                                      React.createElement(
                                          'div',
                                          { className: 'cart-item-main' },
                                          React.createElement('span', { className: 'name' }, item.name),
                                          React.createElement('span', { className: 'meta' }, `${money(item.selling_price)} / pcs`),
                                      ),
                                      React.createElement(
                                          'div',
                                          { className: 'quantity-wrap' },
                                          React.createElement('button', { className: 'qty-btn', type: 'button', onClick: () => updateQuantity(item.id, -1) }, '-'),
                                          React.createElement('span', { className: 'qty-value' }, item.quantity),
                                          React.createElement('button', { className: 'qty-btn', type: 'button', onClick: () => updateQuantity(item.id, 1) }, '+'),
                                      ),
                                  ),
                              ),
                    ),
                    React.createElement(
                        'div',
                        { className: 'discount-box' },
                        React.createElement('input', {
                            className: 'control-input',
                            value: discountCode,
                            onChange: (e) => setDiscountCode(e.target.value.toUpperCase()),
                            placeholder: 'Kode diskon',
                        }),
                        React.createElement('button', { className: 'pill secondary', type: 'button', onClick: applyDiscount }, 'Cek'),
                    ),
                    React.createElement(
                        'div',
                        { className: 'total-box' },
                        React.createElement(
                            'div',
                            { className: 'total-row' },
                            React.createElement('span', null, 'Subtotal'),
                            React.createElement('strong', null, money(subtotal)),
                        ),
                        React.createElement(
                            'div',
                            { className: 'total-row' },
                            React.createElement('span', null, 'Diskon'),
                            React.createElement('strong', null, `-${money(discountAmount)}`),
                        ),
                        React.createElement(
                            'div',
                            { className: 'total-row total' },
                            React.createElement('span', null, 'Total'),
                            React.createElement('strong', null, money(total)),
                        ),
                    ),
                    React.createElement(
                        'button',
                        { className: 'checkout-btn', type: 'button', onClick: handleCheckout },
                        'Checkout',
                    ),
                    message.text
                        ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) })
                        : null,
                ),
            ),
        ),
    );
}
