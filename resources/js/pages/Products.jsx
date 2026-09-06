import React, { useEffect, useState } from 'react';
import { money } from '../helpers.js';
import { ArrowPathIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Paper from '@mui/material/Paper';
import { DataGrid } from '@mui/x-data-grid';
import { fetchList, fetchTrashed, createItem, updateItem, deleteItem, restoreItem, forceDeleteItem } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';

export function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [view, setView] = useState('active');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        product_code: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        stock: '',
        min_stock: '',
        unit: 'pcs',
        description: '',
        is_active: true,
        image_file: null,
    });

    useEffect(() => {
        setPaginationModel((current) => ({ ...current, page: 0 }));
        loadData();
    }, [view, statusFilter, categoryFilter]);

    useEffect(() => {
        if (!confirmDialog) return undefined;
        const handleKeyDown = (event) => { if (event.key === 'Escape') setConfirmDialog(null); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [confirmDialog]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                view === 'trashed'
                    ? fetchTrashed('products', 1, 100)
                    : fetchList('products', 1, 100, {
                        ...(statusFilter ? { active: statusFilter } : {}),
                        ...(categoryFilter ? { category_id: categoryFilter } : {}),
                    }),
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

    const generateProductCode = (categoryId) => {
        const category = categories.find((item) => String(item.id) === String(categoryId));
        if (!category?.category_code) return '';

        const nextNumber = Number(category.products_count || 0) + 1;
        return `${category.category_code}-${String(nextNumber).padStart(3, '0')}`;
    };

    const resetProductForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            product_code: '',
            category_id: '',
            cost_price: '',
            selling_price: '',
            stock: '',
            min_stock: '',
            unit: 'pcs',
            description: '',
            is_active: true,
            image_file: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'image_file' && key !== 'image' && value !== null && value !== undefined) {
                    payload.append(key, key === 'is_active' ? (value ? '1' : '0') : value);
                }
            });
            if (formData.image_file) payload.append('image', formData.image_file);

            if (editingId) {
                payload.append('_method', 'PUT');
                await updateItem('products', editingId, payload);
                setMessage({ type: 'success', text: 'Produk berhasil diperbarui.' });
            } else {
                await createItem('products', payload);
                setMessage({ type: 'success', text: 'Produk berhasil ditambahkan.' });
            }
            setShowForm(false);
            resetProductForm();
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (product) => {
        setFormData({ ...product, image_file: null });
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        openConfirmation({ title: 'Hapus produk?', message: 'Produk akan dipindahkan ke daftar terhapus dan masih dapat dipulihkan.', confirmLabel: 'Hapus produk', tone: 'danger', action: async () => {
            try { await deleteItem('products', id); setMessage({ type: 'success', text: 'Produk berhasil dihapus.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleRestore = async (id) => {
        openConfirmation({ title: 'Pulihkan produk?', message: 'Produk ini akan kembali muncul di daftar produk aktif.', confirmLabel: 'Pulihkan produk', tone: 'default', action: async () => {
            try { await restoreItem('products', id); setMessage({ type: 'success', text: 'Produk berhasil dipulihkan.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleForceDelete = async (id) => {
        openConfirmation({ title: 'Hapus permanen?', message: 'Data produk akan dihapus selamanya dan tidak dapat dipulihkan.', confirmLabel: 'Hapus permanen', tone: 'danger', action: async () => {
            try { await forceDeleteItem('products', id); setMessage({ type: 'success', text: 'Produk dihapus permanen.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const openConfirmation = (dialog) => setConfirmDialog(dialog);

    const handleConfirm = async () => {
        const action = confirmDialog?.action;
        setConfirmDialog(null);
        if (action) await action();
    };

    const filteredProducts = products.filter((product) => {
        const searchTerm = productSearch.trim().toLowerCase();

        return !searchTerm
            || product.name.toLowerCase().includes(searchTerm)
            || product.product_code.toLowerCase().includes(searchTerm);
    });

    const getCategoryName = (categoryId) => {
        const category = categories.find((c) => c.id === categoryId);
        return category ? category.name : '-';
    };

    const columns = [
        { field: 'product_code', headerName: 'Kode Produk', minWidth: 135, flex: 1 },
        { field: 'name', headerName: 'Nama', minWidth: 200, flex: 1.5 },
        {
            field: 'category_id',
            headerName: 'Kategori',
            minWidth: 140,
            flex: 1,
            valueGetter: (_value, row) => getCategoryName(row.category_id),
        },
        {
            field: 'cost_price',
            headerName: 'Harga Beli',
            minWidth: 125,
            flex: 1,
            type: 'number',
            valueGetter: (_value, row) => Number(row.cost_price),
            renderCell: (params) => money(params.value),
        },
        {
            field: 'selling_price',
            headerName: 'Harga Jual',
            minWidth: 125,
            flex: 1,
            type: 'number',
            valueGetter: (_value, row) => Number(row.selling_price),
            renderCell: (params) => money(params.value),
        },
        {
            field: 'stock',
            headerName: 'Stok',
            minWidth: 100,
            flex: 0.8,
            type: 'number',
            valueGetter: (_value, row) => Number(row.stock),
            renderCell: (params) => `${params.value} ${params.row.unit}`,
        },
        {
            field: 'is_active',
            headerName: 'Status',
            minWidth: 110,
            flex: 0.8,
            valueGetter: (_value, row) => view === 'trashed' ? 'Terhapus' : (row.is_active ? 'Aktif' : 'Nonaktif'),
            renderCell: (params) => React.createElement('span', { className: `category-status product-status-badge ${view === 'trashed' ? 'deleted' : (params.row.is_active ? 'active' : 'inactive')}` }, params.value),
        },
        {
            field: 'actions',
            headerName: 'Aksi',
            minWidth: 125,
            sortable: false,
            filterable: false,
            renderCell: (params) => React.createElement('div', { className: 'action-buttons' }, view === 'trashed'
                ? React.createElement(React.Fragment, null,
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Pulihkan produk', 'aria-label': 'Pulihkan produk', onClick: () => handleRestore(params.row.id) }, React.createElement(ArrowPathIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus permanen', 'aria-label': 'Hapus permanen', onClick: () => handleForceDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )
                : React.createElement(React.Fragment, null,
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Edit produk', 'aria-label': 'Edit produk', onClick: () => handleEdit(params.row) }, React.createElement(PencilSquareIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus produk', 'aria-label': 'Hapus produk', onClick: () => handleDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )),
        },
    ];

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Data Produk'),
        ),
        showForm
            ? React.createElement(
                  'div',
                  { className: 'form-overlay' },
                  React.createElement(
                      'div',
                      { className: 'form-modal products-form-modal' },
                      React.createElement(
                          'div',
                          { className: 'form-header' },
                          React.createElement('h2', null, editingId ? 'Edit Produk' : 'Tambah Produk'),
                          React.createElement('button', { type: 'button', onClick: () => { resetProductForm(); setShowForm(false); } }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { className: 'products-form', onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group product-field-full' },
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
                              { className: 'form-group product-field-half' },
                              React.createElement('label', null, 'Kode Produk'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.product_code,
                                  readOnly: true,
                                  placeholder: 'Pilih kategori terlebih dahulu',
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group product-field-half' },
                              React.createElement('label', null, 'Kategori'),
                              React.createElement(
                                  'select',
                                  {
                                      value: formData.category_id,
                                      onChange: (e) => setFormData({
                                          ...formData,
                                          category_id: e.target.value,
                                          product_code: generateProductCode(e.target.value),
                                      }),
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
                              { className: 'form-group product-field-half' },
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
                              { className: 'form-group product-field-half' },
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
                              { className: 'form-group product-field-third' },
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
                              { className: 'form-group product-field-third' },
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
                              { className: 'form-group product-field-third' },
                              React.createElement('label', null, 'Unit'),
                              React.createElement('select', {
                                  value: formData.unit,
                                  onChange: (e) => setFormData({ ...formData, unit: e.target.value }),
                              }, React.createElement('option', null, 'pcs'), React.createElement('option', null, 'box'), React.createElement('option', null, 'lusin')),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group checkbox product-field-third' },
                              React.createElement('input', {
                                  type: 'checkbox',
                                  id: 'product_is_active',
                                  checked: Boolean(formData.is_active),
                                  onChange: (e) => setFormData({ ...formData, is_active: e.target.checked }),
                              }),
                              React.createElement('label', { htmlFor: 'product_is_active' }, 'Aktif'),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group product-field-full' },
                              React.createElement('label', { htmlFor: 'product_image' }, 'Gambar Produk'),
                              React.createElement('input', {
                                  id: 'product_image',
                                  type: 'file',
                                  accept: 'image/jpeg,image/png,image/webp',
                                  onChange: (e) => setFormData({ ...formData, image_file: e.target.files[0] || null }),
                              }),
                              formData.image && !formData.image_file
                                  ? React.createElement('small', { className: 'product-image-hint' }, 'Gambar saat ini akan dipertahankan jika tidak memilih file baru.')
                                  : null,
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group product-field-full' },
                              React.createElement('label', null, 'Deskripsi'),
                              React.createElement('textarea', {
                                  value: formData.description,
                                  onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                                  rows: 3,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-actions product-form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Produk'),
                              React.createElement('button', { type: 'button', className: 'pill secondary', onClick: () => { resetProductForm(); setShowForm(false); } }, 'Batal'),
                          ),
                      ),
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
                    React.createElement('span', null, 'Cari Produk'),
                    React.createElement('input', {
                        className: 'search-box',
                        type: 'search',
                        value: productSearch,
                        onChange: (event) => {
                            setProductSearch(event.target.value);
                            setPaginationModel((current) => ({ ...current, page: 0 }));
                        },
                        placeholder: 'Nama atau kode produk',
                    }),
                ),
                React.createElement('label', { className: 'category-filter' }, React.createElement('span', null, 'Kategori'), React.createElement('select', { value: categoryFilter, onChange: (event) => setCategoryFilter(event.target.value) }, React.createElement('option', { value: '' }, 'Semua Kategori'), categories.map((category) => React.createElement('option', { key: category.id, value: category.id }, category.name)))),
                React.createElement('label', { className: 'category-filter' }, React.createElement('span', null, 'Status'), React.createElement('select', { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), disabled: view === 'trashed' }, React.createElement('option', { value: '' }, 'Semua Status'), React.createElement('option', { value: '1' }, 'Aktif'), React.createElement('option', { value: '0' }, 'Nonaktif'))),
                React.createElement('button', { className: 'category-add-button', type: 'button', onClick: () => { resetProductForm(); setShowForm(true); } }, React.createElement(PlusIcon, { 'aria-hidden': 'true' }), 'Tambah'),
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
                        rows: filteredProducts,
                        columns,
                        autoHeight: true,
                        className: 'product-data-grid',
                        getRowId: (row) => row.id,
                        rowHeight: 48,
                        columnHeaderHeight: 56,
                        paginationModel,
                        onPaginationModelChange: setPaginationModel,
                        pageSizeOptions: [5, 10, 25, 50],
                        disableRowSelectionOnClick: true,
                        disableColumnMenu: false,
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
        confirmDialog ? React.createElement('div', { className: 'confirm-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setConfirmDialog(null); } }, React.createElement('div', { className: 'confirm-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title', 'aria-describedby': 'confirm-message' }, React.createElement('div', { className: `confirm-icon ${confirmDialog.tone}` }, React.createElement(ExclamationTriangleIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-content' }, React.createElement('h2', { id: 'confirm-title' }, confirmDialog.title), React.createElement('p', { id: 'confirm-message' }, confirmDialog.message)), React.createElement('button', { className: 'confirm-close', type: 'button', onClick: () => setConfirmDialog(null), 'aria-label': 'Tutup dialog' }, React.createElement(XMarkIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-actions' }, React.createElement('button', { className: 'confirm-cancel', type: 'button', onClick: () => setConfirmDialog(null) }, 'Batal'), React.createElement('button', { className: `confirm-submit ${confirmDialog.tone}`, type: 'button', onClick: handleConfirm }, confirmDialog.confirmLabel)))) : null,
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
