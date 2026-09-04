import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchList, fetchTrashed, createItem, updateItem, deleteItem, restoreItem, forceDeleteItem } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';

export function Categories() {
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState('active');
        const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        category_code: '',
        slug: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, [view, statusFilter]);

    useEffect(() => {
        if (!confirmDialog) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setConfirmDialog(null);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [confirmDialog]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = view === 'trashed'
                ? await fetchTrashed('categories', 1, 100)
                : await fetchList('categories', 1, 100, statusFilter ? { active: statusFilter } : {});
            setCategories(res.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setStatusFilter('');
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

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            category_code: '',
            slug: '',
            description: '',
            is_active: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const name = String(formData.name || '').trim();
        const categoryCode = String(formData.category_code || '').trim().toUpperCase();
        const slug = String(formData.slug || '').trim();

        if (!name || !categoryCode || !slug) {
            setMessage({ type: 'error', text: 'Nama kategori, kode kategori, dan slug wajib diisi.' });
            return;
        }

        if (!/^[A-Z]{3}$/.test(categoryCode)) {
            setMessage({ type: 'error', text: 'Kode kategori harus terdiri dari tepat 3 huruf besar.' });
            return;
        }

        try {
            const payload = {
                name,
                category_code: categoryCode,
                slug,
                description: String(formData.description || ''),
                is_active: formData.is_active ? 1 : 0,
            };

            if (editingId) {
                await updateItem('categories', editingId, payload);
                setMessage({ type: 'success', text: 'Kategori berhasil diperbarui.' });
            } else {
                await createItem('categories', payload);
                setMessage({ type: 'success', text: 'Kategori berhasil ditambahkan.' });
            }
            setShowForm(false);
            resetForm();
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (category) => {
        setFormData({
            ...category,
            description: category.description || '',
        });
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        openConfirmation({ title: 'Hapus kategori?', message: 'Kategori akan dipindahkan ke daftar terhapus dan masih dapat dipulihkan.', confirmLabel: 'Hapus kategori', tone: 'danger', action: async () => {
            try { await deleteItem('categories', id); setMessage({ type: 'success', text: 'Kategori berhasil dihapus.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleRestore = async (id) => {
        openConfirmation({ title: 'Pulihkan kategori?', message: 'Kategori ini akan kembali muncul di daftar kategori aktif.', confirmLabel: 'Pulihkan kategori', tone: 'default', action: async () => {
            try { await restoreItem('categories', id); setMessage({ type: 'success', text: 'Kategori berhasil dipulihkan.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleForceDelete = async (id) => {
        openConfirmation({ title: 'Hapus permanen?', message: 'Data kategori akan dihapus selamanya dan tidak dapat dipulihkan.', confirmLabel: 'Hapus permanen', tone: 'danger', action: async () => {
            try { await forceDeleteItem('categories', id); setMessage({ type: 'success', text: 'Kategori dihapus permanen.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const openConfirmation = (dialog) => setConfirmDialog(dialog);

    const handleConfirm = async () => {
        const action = confirmDialog?.action;
        setConfirmDialog(null);
        if (action) await action();
    };

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Kategori Produk'),
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
                              React.createElement('label', { htmlFor: 'category_code' }, 'Kode Kategori'),
                              React.createElement('input', {
                                  id: 'category_code',
                                  type: 'text',
                                  value: formData.category_code,
                                  onChange: (e) => setFormData({ ...formData, category_code: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() }),
                                  maxLength: 3,
                                  pattern: '[A-Z]{3}',
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
                              React.createElement('label', { htmlFor: 'description' }, 'Deskripsi'),
                              React.createElement('textarea', {
                                  id: 'description',
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
        confirmDialog
            ? React.createElement(
                  'div',
                  { className: 'confirm-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setConfirmDialog(null); } },
                  React.createElement(
                      'div',
                      { className: 'confirm-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title', 'aria-describedby': 'confirm-message' },
                      React.createElement('div', { className: `confirm-icon ${confirmDialog.tone}` }, React.createElement(ExclamationTriangleIcon, { 'aria-hidden': 'true' })),
                      React.createElement('div', { className: 'confirm-content' }, React.createElement('h2', { id: 'confirm-title' }, confirmDialog.title), React.createElement('p', { id: 'confirm-message' }, confirmDialog.message)),
                      React.createElement('button', { className: 'confirm-close', type: 'button', onClick: () => setConfirmDialog(null), 'aria-label': 'Tutup dialog' }, React.createElement(XMarkIcon, { 'aria-hidden': 'true' })),
                      React.createElement('div', { className: 'confirm-actions' }, React.createElement('button', { className: 'confirm-cancel', type: 'button', onClick: () => setConfirmDialog(null) }, 'Batal'), React.createElement('button', { className: `confirm-submit ${confirmDialog.tone}`, type: 'button', onClick: handleConfirm }, confirmDialog.confirmLabel)),
                  ),
              )
            : null,
        React.createElement(
            'section',
            { className: 'panel category-panel' },
            React.createElement(
                'div',
                { className: 'category-toolbar' },
                React.createElement(
                    'label',
                    { className: 'category-filter' },
                    React.createElement('span', null, 'Status'),
                    React.createElement(
                        'select',
                        {
                            value: statusFilter,
                            onChange: (event) => setStatusFilter(event.target.value),
                            disabled: view === 'trashed',
                        },
                        React.createElement('option', { value: '' }, 'Semua Status'),
                        React.createElement('option', { value: '1' }, 'Aktif'),
                        React.createElement('option', { value: '0' }, 'Nonaktif'),
                    ),
                ),
                React.createElement(
                    'button',
                    { className: 'filter-reset', type: 'button', onClick: resetFilters },
                    React.createElement(ArrowUturnLeftIcon, { 'aria-hidden': 'true' }),
                    'Reset',
                ),
                React.createElement(
                    'button',
                    {
                        className: 'category-add-button',
                        type: 'button',
                        onClick: () => {
                            resetForm();
                            setShowForm(true);
                        },
                    },
                    React.createElement(PlusIcon, { 'aria-hidden': 'true' }),
                    'Tambah',
                ),
            ),
            React.createElement(
                'div',
                { className: 'category-tabs' },
                React.createElement('button', { className: `pill ${view === 'active' ? 'primary' : 'secondary'}`, onClick: () => setView('active') }, 'Aktif'),
                React.createElement('button', { className: `pill ${view === 'trashed' ? 'primary' : 'secondary'}`, onClick: () => setView('trashed') }, 'Terhapus'),
            ),
            loading
                ? React.createElement('div', { className: 'empty-state' }, 'Memuat data...')
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
                                  React.createElement('th', null, 'Kode Kategori'),
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
                                      React.createElement('td', null, category.category_code),
                                      React.createElement('td', null, category.name),
                                      React.createElement('td', null, category.slug),
                                      React.createElement('td', null, category.description),
                                      React.createElement(
                                          'td',
                                          null,
                                          React.createElement(
                                              'span',
                                              { className: `category-status ${view === 'trashed' ? 'deleted' : (category.is_active ? 'active' : 'inactive')}` },
                                              view === 'trashed' ? 'Terhapus' : (category.is_active ? 'Aktif' : 'Nonaktif'),
                                          ),
                                      ),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          view === 'trashed'
                                              ? React.createElement(
                                                    React.Fragment,
                                                    null,
                                                    React.createElement(
                                                        'button',
                                                        { className: 'btn-edit', type: 'button', title: 'Pulihkan kategori', 'aria-label': 'Pulihkan kategori', onClick: () => handleRestore(category.id) },
                                                        React.createElement(ArrowPathIcon, { 'aria-hidden': 'true' }),
                                                    ),
                                                    React.createElement(
                                                        'button',
                                                        { className: 'btn-delete', type: 'button', title: 'Hapus permanen', 'aria-label': 'Hapus permanen', onClick: () => handleForceDelete(category.id) },
                                                        React.createElement(TrashIcon, { 'aria-hidden': 'true' }),
                                                    ),
                                                )
                                              : React.createElement(
                                                    React.Fragment,
                                                    null,
                                                    React.createElement(
                                                        'button',
                                                        { className: 'btn-edit', type: 'button', title: 'Edit kategori', 'aria-label': 'Edit kategori', onClick: () => handleEdit(category) },
                                                        React.createElement(PencilSquareIcon, { 'aria-hidden': 'true' }),
                                                    ),
                                                    React.createElement(
                                                        'button',
                                                        { className: 'btn-delete', type: 'button', title: 'Hapus kategori', 'aria-label': 'Hapus kategori', onClick: () => handleDelete(category.id) },
                                                        React.createElement(TrashIcon, { 'aria-hidden': 'true' }),
                                                    ),
                                                ),
                                      ),
                                  ),
                              ),
                          ),
                      ),
                  ),
        ),
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
