import React, { useEffect, useState } from 'react';
import { money } from '../helpers.js';
import { fetchList, createItem, updateItem, deleteItem } from '../api.js';

export function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        stock: '',
        min_stock: '',
        unit: 'pcs',
        description: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                fetchList('products', 1, 100),
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateItem('products', editingId, formData);
                setMessage({ type: 'success', text: 'Produk berhasil diperbarui.' });
            } else {
                await createItem('products', formData);
                setMessage({ type: 'success', text: 'Produk berhasil ditambahkan.' });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                name: '',
                sku: '',
                category_id: '',
                cost_price: '',
                selling_price: '',
                stock: '',
                min_stock: '',
                unit: 'pcs',
                description: '',
            });
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (product) => {
        setFormData(product);
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus produk ini?')) {
            try {
                await deleteItem('products', id);
                setMessage({ type: 'success', text: 'Produk berhasil dihapus.' });
                loadData();
            } catch (error) {
                setMessage({ type: 'error', text: error.message });
            }
        }
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        return category ? category.name : '-';
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Data Produk'),
            React.createElement(
                'div',
                { className: 'topbar-actions' },
                React.createElement(
                    'button',
                    {
                        className: 'pill primary',
                        onClick: () => {
                            setEditingId(null);
                            setFormData({
                                name: '',
                                sku: '',
                                category_id: '',
                                cost_price: '',
                                selling_price: '',
                                stock: '',
                                min_stock: '',
                                unit: 'pcs',
                                description: '',
                            });
                            setShowForm(true);
                        },
                    },
                    '+ Tambah Produk',
                ),
            ),
        ),
        showForm
            ? React.createElement(
                  'div',
                  { className: 'form-overlay' },
                  React.createElement(
                      'div',
                      { className: 'form-modal' },
                      React.createElement(
                          'div',
                          { className: 'form-header' },
                          React.createElement('h2', null, editingId ? 'Edit Produk' : 'Tambah Produk'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Nama Produk'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.name,
                                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'SKU'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.sku,
                                  onChange: (e) => setFormData({ ...formData, sku: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Kategori'),
                              React.createElement(
                                  'select',
                                  {
                                      value: formData.category_id,
                                      onChange: (e) => setFormData({ ...formData, category_id: e.target.value }),
                                      required: true,
                                  },
                                  React.createElement('option', { value: '' }, 'Pilih Kategori'),
                                  categories.map((cat) =>
                                      React.createElement('option', { key: cat.id, value: cat.id }, cat.name),
                                  ),
                              ),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Harga Beli'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.cost_price,
                                  onChange: (e) => setFormData({ ...formData, cost_price: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Harga Jual'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.selling_price,
                                  onChange: (e) => setFormData({ ...formData, selling_price: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Stok'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.stock,
                                  onChange: (e) => setFormData({ ...formData, stock: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Stok Minimal'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.min_stock,
                                  onChange: (e) => setFormData({ ...formData, min_stock: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Unit'),
                              React.createElement('select', {
                                  value: formData.unit,
                                  onChange: (e) => setFormData({ ...formData, unit: e.target.value }),
                              }, React.createElement('option', null, 'pcs'), React.createElement('option', null, 'box'), React.createElement('option', null, 'lusin')),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Deskripsi'),
                              React.createElement('textarea', {
                                  value: formData.description,
                                  onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                                  rows: 3,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Produk'),
                              React.createElement('button', { type: 'button', className: 'pill secondary', onClick: () => setShowForm(false) }, 'Batal'),
                          ),
                      ),
                  ),
              )
            : null,
        React.createElement(
            'section',
            { className: 'panel' },
            React.createElement(
                'div',
                { className: 'panel-header' },
                React.createElement('h2', null, 'Daftar Produk'),
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
                                  React.createElement('th', null, 'Nama'),
                                  React.createElement('th', null, 'Kategori'),
                                  React.createElement('th', null, 'Harga Beli'),
                                  React.createElement('th', null, 'Harga Jual'),
                                  React.createElement('th', null, 'Stok'),
                                  React.createElement('th', null, 'Aksi'),
                              ),
                          ),
                          React.createElement(
                              'tbody',
                              null,
                              products.map((product) =>
                                  React.createElement(
                                      'tr',
                                      { key: product.id },
                                      React.createElement('td', null, product.sku),
                                      React.createElement('td', null, product.name),
                                      React.createElement('td', null, getCategoryName(product.category_id)),
                                      React.createElement('td', null, money(product.cost_price)),
                                      React.createElement('td', null, money(product.selling_price)),
                                      React.createElement('td', null, `${product.stock} ${product.unit}`),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          React.createElement('button', { className: 'btn-edit', onClick: () => handleEdit(product) }, '✎'),
                                          React.createElement('button', { className: 'btn-delete', onClick: () => handleDelete(product.id) }, '🗑'),
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
