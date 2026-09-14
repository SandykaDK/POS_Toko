import React, { useEffect, useMemo, useState } from 'react';
import { money } from '../helpers.js';
import { apiFetch, fetchList } from '../api.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AlertPopup } from '../components/AlertPopup.jsx';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const getLocalDateTime = () => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function Cashier() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [productSearch, setProductSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [qrisPayment, setQrisPayment] = useState(null);
    const [cashReceived, setCashReceived] = useState('');
    const [cashPaymentModalOpen, setCashPaymentModalOpen] = useState(false);

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.quantity * item.selling_price, 0),
        [cart],
    );
    const discountAmount = discountResult?.discount_amount || 0;
    const total = Math.max(subtotal - discountAmount, 0);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (discountResult) {
            setDiscountResult(null);
            setMessage({ type: 'error', text: 'Subtotal berubah. Silakan cek ulang kode diskon.' });
        }
    }, [subtotal]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes, customersRes] = await Promise.all([
                fetchList('products', 1, 100, { active: true }),
                fetchList('categories', 1, 100),
                fetchList('customers', 1, 100, { status: 'active' }),
            ]);

            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);
            setCustomers(customersRes.data || []);
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

    const handleCheckout = async (receivedAmount = null) => {
        if (!cart.length) {
            setMessage({ type: 'error', text: 'Keranjang masih kosong.' });
            return;
        }

        if (!selectedCustomerId) {
            setMessage({ type: 'error', text: 'Silakan pilih pelanggan sebelum checkout.' });
            return;
        }

        if (paymentMethod === 'cash' && receivedAmount === null) {
            setCashReceived('');
            setCashPaymentModalOpen(true);
            return;
        }

        const parsedCashReceived = paymentMethod === 'cash' ? Number(receivedAmount) : null;
        if (paymentMethod === 'cash' && (!Number.isFinite(parsedCashReceived) || parsedCashReceived < total)) {
            setMessage({ type: 'error', text: 'Jumlah uang dibayarkan harus sama dengan atau lebih dari total.' });
            return;
        }

        try {
            const transactionPayload = {
                invoice_number: `INV-${Date.now()}`,
                user_id: 1,
                customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
                discount_code: discountCode.trim() || null,
                transaction_date: getLocalDateTime(),
                subtotal,
                discount_amount: discountAmount,
                total_amount: total,
                payment_method: paymentMethod,
                cash_received: paymentMethod === 'cash' ? parsedCashReceived : null,
                status: paymentMethod === 'qris' ? 'pending' : 'completed',
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

            const createdPayment = result.data.payments?.find((payment) => payment.payment_method === 'qris');
            if (paymentMethod === 'qris' && createdPayment?.qr_code_data) {
                setQrisPayment({
                    invoice: result.data.invoice_number,
                    amount: result.data.total_amount,
                    qrCode: createdPayment.qr_code_data,
                    expiresAt: createdPayment.expires_at,
                });
            }

            setCart([]);
            setDiscountCode('');
            setDiscountResult(null);
            setSelectedCustomerId('');
            setPaymentMethod('cash');
            setCashReceived('');
            setCashPaymentModalOpen(false);
            setMessage({
                type: 'success',
                text: paymentMethod === 'qris'
                    ? `Transaksi ${result.data.invoice_number} menunggu konfirmasi pembayaran QRIS.`
                    : `Transaksi ${result.data.invoice_number} berhasil disimpan.`,
            });
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
                            Tabs,
                            {
                                value: selectedCategory,
                                onChange: (_event, value) => setSelectedCategory(value),
                                variant: 'scrollable',
                                scrollButtons: 'auto',
                                allowScrollButtonsMobile: true,
                                'aria-label': 'Filter kategori produk',
                                className: 'category-list',
                            },
                            React.createElement(Tab, { value: 'all', label: 'Semua' }),
                            categories.map((category) =>
                                React.createElement(Tab, {
                                    key: category.id,
                                    value: String(category.id),
                                    label: category.name,
                                }),
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
                        'label',
                        { className: 'customer-select' },
                        React.createElement('span', null, 'Pelanggan'),
                        React.createElement(
                            Autocomplete,
                            {
                                className: 'customer-autocomplete',
                                options: customers,
                                value: customers.find((customer) => String(customer.id) === String(selectedCustomerId)) || null,
                                onChange: (_event, customer) => setSelectedCustomerId(customer ? String(customer.id) : ''),
                                getOptionLabel: (customer) => customer ? `${customer.name} - ${customer.phone}` : '',
                                isOptionEqualToValue: (option, value) => option.id === value.id,
                                clearOnEscape: true,
                                fullWidth: true,
                                noOptionsText: 'Pelanggan tidak ditemukan',
                                renderInput: (params) => React.createElement(TextField, { ...params, placeholder: 'Cari pelanggan...' }),
                            },
                        ),
                    ),
                    React.createElement(
                        'label',
                        { className: 'category-filter payment-method-select' },
                        React.createElement('span', null, 'Metode Pembayaran'),
                        React.createElement(
                            FormControl,
                            { size: 'small', fullWidth: true },
                            React.createElement(
                                Select,
                                {
                                    value: paymentMethod,
                                    onChange: (event) => setPaymentMethod(event.target.value),
                                    inputProps: { 'aria-label': 'Metode Pembayaran' },
                                    sx: {
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        fontWeight: 400,
                                        lineHeight: 1.4,
                                    },
                                },
                                React.createElement(MenuItem, { value: 'cash', sx: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 } }, 'Cash'),
                                React.createElement(MenuItem, { value: 'qris', sx: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 400 } }, 'QRIS'),
                            ),
                        ),
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
                        { className: 'checkout-btn', type: 'button', onClick: () => handleCheckout() },
                        'Checkout',
                    ),
                    message.text
                        ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) })
                        : null,
                ),
            ),
        ),
        qrisPayment
            ? React.createElement(
                  'div',
                  { className: 'qris-overlay', role: 'presentation' },
                  React.createElement(
                      'div',
                      { className: 'qris-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'qris-title' },
                      React.createElement('h2', { id: 'qris-title' }, 'Scan QRIS untuk Membayar'),
                      React.createElement('p', null, `Invoice ${qrisPayment.invoice}`),
                      React.createElement('img', { className: 'qris-code', src: qrisPayment.qrCode, alt: `QRIS pembayaran ${qrisPayment.invoice}` }),
                      React.createElement('strong', { className: 'qris-amount' }, money(qrisPayment.amount)),
                      React.createElement('p', { className: 'qris-hint' }, 'Selesaikan pembayaran melalui aplikasi pembayaran pelanggan. Status akan diperbarui otomatis setelah Midtrans mengirim konfirmasi.'),
                      React.createElement('button', { className: 'pill secondary', type: 'button', onClick: () => setQrisPayment(null) }, 'Tutup'),
                  ),
              )
            : null,
                cashPaymentModalOpen
                        ? React.createElement(
                                    'div',
                                    { className: 'cash-payment-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setCashPaymentModalOpen(false); } },
                                    React.createElement(
                                            'div',
                                            { className: 'cash-payment-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cash-payment-title' },
                                            React.createElement('h2', { id: 'cash-payment-title' }, 'Pembayaran Cash'),
                                            React.createElement('div', { className: 'cash-payment-total' }, React.createElement('span', null, 'Total yang harus dibayar'), React.createElement('strong', null, money(total))),
                                            React.createElement('label', { className: 'cash-payment-field' }, React.createElement('span', null, 'Jumlah uang dibayarkan'), React.createElement('input', { type: 'number', min: total, step: '1', value: cashReceived, autoFocus: true, onChange: (event) => setCashReceived(event.target.value), onKeyDown: (event) => { if (event.key === 'Enter') handleCheckout(cashReceived); }, placeholder: 'Masukkan nominal' })),
                                            React.createElement('div', { className: 'cash-payment-change' }, React.createElement('span', null, 'Kembalian'), React.createElement('strong', null, money(Math.max(Number(cashReceived || 0) - total, 0)))),
                                            React.createElement('div', { className: 'cash-payment-actions' }, React.createElement('button', { className: 'pill secondary', type: 'button', onClick: () => setCashPaymentModalOpen(false) }, 'Batal'), React.createElement('button', { className: 'checkout-btn', type: 'button', onClick: () => handleCheckout(cashReceived) }, 'Simpan Transaksi')),
                                    ),
                            )
                        : null,
    );
}
