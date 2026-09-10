import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DataGrid } from '@mui/x-data-grid';
import { fetchList, fetchTrashed, createItem, updateItem, deleteItem, restoreItem, forceDeleteItem } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';

export function Categories() {
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState('active');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [statusFilter, setStatusFilter] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
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
        setPaginationModel((current) => ({ ...current, page: 0 }));
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

    const filteredCategories = categories.filter((category) => {
        const searchTerm = categorySearch.trim().toLowerCase();

        return !searchTerm
            || category.name.toLowerCase().includes(searchTerm)
            || category.category_code.toLowerCase().includes(searchTerm)
            || category.slug.toLowerCase().includes(searchTerm);
    });

    const columns = [
        { field: 'category_code', headerName: 'Kode Kategori', minWidth: 140, flex: 1 },
        { field: 'name', headerName: 'Nama', minWidth: 180, flex: 1.2 },
        { field: 'slug', headerName: 'Slug', minWidth: 170, flex: 1.2 },
        { field: 'description', headerName: 'Deskripsi', minWidth: 220, flex: 1.5 },
        {
            field: 'is_active',
            headerName: 'Status',
            minWidth: 110,
            flex: 0.8,
            valueGetter: (_value, row) => view === 'trashed' ? 'Terhapus' : (row.is_active ? 'Aktif' : 'Nonaktif'),
            renderCell: (params) => React.createElement('span', { className: `category-status ${view === 'trashed' ? 'deleted' : (params.row.is_active ? 'active' : 'inactive')}` }, params.value),
        },
        {
            field: 'actions',
            headerName: 'Aksi',
            minWidth: 125,
            sortable: false,
            filterable: false,
            renderCell: (params) => React.createElement('div', { className: 'action-buttons' }, view === 'trashed'
                ? React.createElement(React.Fragment, null,
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Pulihkan kategori', 'aria-label': 'Pulihkan kategori', onClick: () => handleRestore(params.row.id) }, React.createElement(ArrowPathIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus permanen', 'aria-label': 'Hapus permanen', onClick: () => handleForceDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )
                : React.createElement(React.Fragment, null,
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Edit Kategori', 'aria-label': 'Edit Kategori', onClick: () => handleEdit(params.row) }, React.createElement(PencilSquareIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus kategori', 'aria-label': 'Hapus kategori', onClick: () => handleDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )),
        },
    ];

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
                      { className: 'form-modal categories-form-modal' },
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
                              React.createElement('label', { htmlFor: 'category_name' }, 'Nama Kategori'),
                              React.createElement('input', {
                                  id: 'category_name',
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
                    { className: 'category-filter product-search-filter' },
                    React.createElement('span', null, 'Cari Kategori'),
                    React.createElement('input', {
                        className: 'search-box',
                        type: 'search',
                        value: categorySearch,
                        onChange: (event) => {
                            setCategorySearch(event.target.value);
                            setPaginationModel((current) => ({ ...current, page: 0 }));
                        },
                        placeholder: 'Nama, kode, atau slug',
                    }),
                ),
                React.createElement(
                    'label',
                    { className: 'category-filter' },
                    React.createElement('span', null, 'Status'),
                    React.createElement(
                        FormControl,
                        { size: 'small', fullWidth: true, disabled: view === 'trashed' },
                        React.createElement(
                            Select,
                            {
                                value: statusFilter,
                                onChange: (event) => setStatusFilter(event.target.value),
                                displayEmpty: true,
                                inputProps: { 'aria-label': 'Filter status kategori' },
                            },
                            React.createElement(MenuItem, { value: '' }, 'Semua Status'),
                            React.createElement(MenuItem, { value: '1' }, 'Aktif'),
                            React.createElement(MenuItem, { value: '0' }, 'Nonaktif'),
                        ),
                    ),
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
                React.createElement('button', { className: `pill ${view === 'active' ? 'primary' : 'secondary'}`, onClick: () => setView('active') }, 'Semua Data'),
                React.createElement('button', { className: `pill ${view === 'trashed' ? 'primary' : 'secondary'}`, onClick: () => setView('trashed') }, 'Terhapus'),
            ),
            loading
                ? React.createElement('div', { className: 'empty-state' }, 'Memuat data...')
                    : React.createElement(
                        Paper,
                          { sx: { height: 'auto', width: '100%', boxShadow: 'none', borderRadius: 0 } },
                          React.createElement(DataGrid, {
                              rows: filteredCategories,
                              columns,
                              autoHeight: true,
                              className: 'category-data-grid',
                              getRowId: (row) => row.id,
                              rowHeight: 48,
                              columnHeaderHeight: 56,
                              paginationModel,
                              onPaginationModelChange: setPaginationModel,
                              pageSizeOptions: [5, 10, 25, 50],
                              disableRowSelectionOnClick: true,
                              sx: {
                                  border: 0,
                                  fontFamily: 'inherit',
                                  '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
                                  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' },
                                  '& .MuiDataGrid-cellContent': { fontFamily: 'inherit' },
                              },
                          }),
                      ),
        ),
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
