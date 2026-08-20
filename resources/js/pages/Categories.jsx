import React, { useEffect, useState } from 'react';
import { fetchList, createItem, updateItem, deleteItem } from '../api.js';

export function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('categories', 1, 100);
            setCategories(res.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateItem('categories', editingId, formData);
                setMessage({ type: 'success', text: 'Kategori berhasil diperbarui.' });
            } else {
                await createItem('categories', formData);
                setMessage({ type: 'success', text: 'Kategori berhasil ditambahkan.' });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                is_active: true,
            });
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (category) => {
        setFormData(category);
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus kategori ini?')) {
            try {
                await deleteItem('categories', id);
                setMessage({ type: 'success', text: 'Kategori berhasil dihapus.' });
                loadData();
            } catch (error) {
                setMessage({ type: 'error', text: error.message });
            }
        }
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Kategori Produk'),
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
                                slug: '',
                                description: '',
                                is_active: true,
                            });
                            setShowForm(true);
                        },
                    },
                    '+ Tambah Kategori',
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
                          React.createElement('h2', null, editingId ? 'Edit Kategori' : 'Tambah Kategori'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Nama Kategori'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.name,
                                  onChange: handleNameChange,
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Slug'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.slug,
                                  onChange: (e) => setFormData({ ...formData, slug: e.target.value }),
                                  required: true,
                              }),
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
                              { className: 'form-group checkbox' },
                              React.createElement('input', {
                                  type: 'checkbox',
                                  id: 'is_active',
                                  checked: formData.is_active,
                                  onChange: (e) => setFormData({ ...formData, is_active: e.target.checked }),
                              }),
                              React.createElement('label', { htmlFor: 'is_active' }, 'Aktif'),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Kategori'),
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
                React.createElement('h2', null, 'Daftar Kategori'),
                React.createElement('span', { className: 'subtle' }, `${categories.length} item`),
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
                                  React.createElement('th', null, 'Nama'),
                                  React.createElement('th', null, 'Slug'),
                                  React.createElement('th', null, 'Deskripsi'),
                                  React.createElement('th', null, 'Status'),
                                  React.createElement('th', null, 'Aksi'),
                              ),
                          ),
                          React.createElement(
                              'tbody',
                              null,
                              categories.map((category) =>
                                  React.createElement(
                                      'tr',
                                      { key: category.id },
                                      React.createElement('td', null, category.name),
                                      React.createElement('td', null, category.slug),
                                      React.createElement('td', null, category.description),
                                      React.createElement('td', null, category.is_active ? '✓ Aktif' : '✗ Nonaktif'),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          React.createElement('button', { className: 'btn-edit', onClick: () => handleEdit(category) }, '✎'),
                                          React.createElement('button', { className: 'btn-delete', onClick: () => handleDelete(category.id) }, '🗑'),
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
