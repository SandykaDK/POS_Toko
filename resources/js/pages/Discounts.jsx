import React, { useEffect, useState } from 'react';
import { money } from '../helpers.js';
import { ArrowPathIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DataGrid } from '@mui/x-data-grid';
import { fetchList, fetchTrashed, createItem, updateItem, deleteItem, restoreItem, forceDeleteItem } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';

export function Discounts() {
    const [discounts, setDiscounts] = useState([]);
    const [view, setView] = useState('active');
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [statusFilter, setStatusFilter] = useState('');
    const [discountSearch, setDiscountSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: '',
        max_discount: '',
        min_purchase: '',
        max_usage: '',
        start_date: '',
        end_date: '',
        is_active: true,
    });

    useEffect(() => {
        setPaginationModel((current) => ({ ...current, page: 0 }));
        loadData();
    }, [view, statusFilter]);

    useEffect(() => {
        if (!confirmDialog) return undefined;
        const handleKeyDown = (event) => { if (event.key === 'Escape') setConfirmDialog(null); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [confirmDialog]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = view === 'trashed' ? await fetchTrashed('discounts', 1, 100) : await fetchList('discounts', 1, 100, statusFilter ? { active: statusFilter } : {});
            setDiscounts(res.data || []);
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
                await updateItem('discounts', editingId, formData);
                setMessage({ type: 'success', text: 'Diskon berhasil diperbarui.' });
            } else {
                await createItem('discounts', formData);
                setMessage({ type: 'success', text: 'Diskon berhasil ditambahkan.' });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                code: '',
                name: '',
                description: '',
                type: 'percentage',
                value: '',
                max_discount: '',
                min_purchase: '',
                max_usage: '',
                start_date: '',
                end_date: '',
                is_active: true,
            });
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (discount) => {
        setFormData(discount);
        setEditingId(discount.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        openConfirmation({ title: 'Hapus diskon?', message: 'Diskon akan dipindahkan ke daftar terhapus dan masih dapat dipulihkan.', confirmLabel: 'Hapus diskon', tone: 'danger', action: async () => {
            try { await deleteItem('discounts', id); setMessage({ type: 'success', text: 'Diskon berhasil dihapus.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleRestore = async (id) => {
        openConfirmation({ title: 'Pulihkan diskon?', message: 'Diskon ini akan kembali muncul di daftar diskon aktif.', confirmLabel: 'Pulihkan diskon', tone: 'default', action: async () => {
            try { await restoreItem('discounts', id); setMessage({ type: 'success', text: 'Diskon berhasil dipulihkan.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleForceDelete = async (id) => {
        openConfirmation({ title: 'Hapus permanen?', message: 'Data diskon akan dihapus selamanya dan tidak dapat dipulihkan.', confirmLabel: 'Hapus permanen', tone: 'danger', action: async () => {
            try { await forceDeleteItem('discounts', id); setMessage({ type: 'success', text: 'Diskon dihapus permanen.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const openConfirmation = (dialog) => setConfirmDialog(dialog);

    const handleConfirm = async () => {
        const action = confirmDialog?.action;
        setConfirmDialog(null);
        if (action) await action();
    };

    const filteredDiscounts = discounts.filter((discount) => {
        const searchTerm = discountSearch.trim().toLowerCase();

        return !searchTerm
            || discount.code.toLowerCase().includes(searchTerm)
            || discount.name.toLowerCase().includes(searchTerm);
    });

    const columns = [
        { field: 'code', headerName: 'Kode', minWidth: 130, flex: 1 },
        { field: 'name', headerName: 'Nama', minWidth: 190, flex: 1.4 },
        {
            field: 'type',
            headerName: 'Tipe',
            minWidth: 100,
            flex: 0.7,
            valueGetter: (_value, row) => row.type === 'percentage' ? '%' : 'Rp',
        },
        {
            field: 'value',
            headerName: 'Nilai',
            minWidth: 130,
            flex: 1,
            type: 'number',
            valueGetter: (_value, row) => Number(row.value),
            renderCell: (params) => params.row.type === 'percentage' ? `${params.value}%` : money(params.value),
        },
        {
            field: 'min_purchase',
            headerName: 'Min Pembelian',
            minWidth: 145,
            flex: 1,
            type: 'number',
            valueGetter: (_value, row) => Number(row.min_purchase),
            renderCell: (params) => money(params.value),
        },
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
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Pulihkan diskon', 'aria-label': 'Pulihkan diskon', onClick: () => handleRestore(params.row.id) }, React.createElement(ArrowPathIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus permanen', 'aria-label': 'Hapus permanen', onClick: () => handleForceDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )
                : React.createElement(React.Fragment, null,
                      React.createElement('button', { className: 'btn-edit', type: 'button', title: 'Edit diskon', 'aria-label': 'Edit diskon', onClick: () => handleEdit(params.row) }, React.createElement(PencilSquareIcon, { 'aria-hidden': 'true' })),
                      React.createElement('button', { className: 'btn-delete', type: 'button', title: 'Hapus diskon', 'aria-label': 'Hapus diskon', onClick: () => handleDelete(params.row.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' })),
                  )),
        },
    ];

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Data Diskon'),
        ),
        showForm
            ? React.createElement(
                  'div',
                  { className: 'form-overlay' },
                  React.createElement(
                      'div',
                      { className: 'form-modal discounts-form-modal' },
                      React.createElement(
                          'div',
                          { className: 'form-header' },
                          React.createElement('h2', null, editingId ? 'Edit Diskon' : 'Tambah Diskon'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { className: 'discounts-form', onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-half' },
                              React.createElement('label', null, 'Kode Diskon'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.code,
                                  onChange: (e) => setFormData({ ...formData, code: e.target.value.toUpperCase() }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-half' },
                              React.createElement('label', null, 'Nama Diskon'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.name,
                                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-full' },
                              React.createElement('label', null, 'Deskripsi'),
                              React.createElement('textarea', {
                                  value: formData.description,
                                  onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                                  rows: 2,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Tipe Diskon'),
                              React.createElement(
                                  'select',
                                  {
                                      value: formData.type,
                                      onChange: (e) => setFormData({ ...formData, type: e.target.value }),
                                  },
                                  React.createElement('option', { value: 'percentage' }, 'Persentase'),
                                  React.createElement('option', { value: 'fixed' }, 'Jumlah Tetap'),
                              ),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Nilai Diskon'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.value,
                                  onChange: (e) => setFormData({ ...formData, value: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Diskon Maksimal'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.max_discount,
                                  onChange: (e) => setFormData({ ...formData, max_discount: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Pembelian Minimum'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.min_purchase,
                                  onChange: (e) => setFormData({ ...formData, min_purchase: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Maksimal Penggunaan'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.max_usage,
                                  onChange: (e) => setFormData({ ...formData, max_usage: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Tanggal Mulai'),
                              React.createElement('input', {
                                  type: 'date',
                                  value: formData.start_date,
                                  onChange: (e) => setFormData({ ...formData, start_date: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group discount-field-quarter' },
                              React.createElement('label', null, 'Tanggal Berakhir'),
                              React.createElement('input', {
                                  type: 'date',
                                  value: formData.end_date,
                                  onChange: (e) => setFormData({ ...formData, end_date: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group checkbox discount-field-quarter' },
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
                              { className: 'form-actions discount-form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Diskon'),
                              React.createElement('button', { type: 'button', className: 'pill secondary', onClick: () => setShowForm(false) }, 'Batal'),
                          ),
                      ),
                  ),
              )
            : null,
        React.createElement(
            'section',
            { className: 'panel category-panel' },
            React.createElement('div', { className: 'category-toolbar' },
                React.createElement('label', { className: 'category-filter product-search-filter' }, React.createElement('span', null, 'Cari Diskon'), React.createElement('input', { className: 'search-box', type: 'search', value: discountSearch, onChange: (event) => { setDiscountSearch(event.target.value); setPaginationModel((current) => ({ ...current, page: 0 })); }, placeholder: 'Kode atau nama diskon' })),
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
                                inputProps: { 'aria-label': 'Filter status diskon' },
                            },
                            React.createElement(MenuItem, { value: '' }, 'Semua Status'),
                            React.createElement(MenuItem, { value: '1' }, 'Aktif'),
                            React.createElement(MenuItem, { value: '0' }, 'Nonaktif'),
                        ),
                    ),
                ),
                React.createElement('button', { className: 'category-add-button', type: 'button', onClick: () => setShowForm(true) }, React.createElement(PlusIcon, { 'aria-hidden': 'true' }), 'Tambah'),
            ),
            React.createElement('div', { className: 'category-tabs' }, React.createElement('button', { className: `pill ${view === 'active' ? 'primary' : 'secondary'}`, onClick: () => setView('active') }, 'Semua Data'), React.createElement('button', { className: `pill ${view === 'trashed' ? 'primary' : 'secondary'}`, onClick: () => setView('trashed') }, 'Terhapus')),
            loading
                ? React.createElement('div', { className: 'empty-state' }, 'Memuat data...')
                : React.createElement(
                      Paper,
                      { sx: { height: 'auto', width: '100%', boxShadow: 'none', borderRadius: 0 } },
                      React.createElement(DataGrid, {
                          rows: filteredDiscounts,
                          columns,
                          autoHeight: true,
                          className: 'discount-data-grid',
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
        confirmDialog ? React.createElement('div', { className: 'confirm-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setConfirmDialog(null); } }, React.createElement('div', { className: 'confirm-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title', 'aria-describedby': 'confirm-message' }, React.createElement('div', { className: `confirm-icon ${confirmDialog.tone}` }, React.createElement(ExclamationTriangleIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-content' }, React.createElement('h2', { id: 'confirm-title' }, confirmDialog.title), React.createElement('p', { id: 'confirm-message' }, confirmDialog.message)), React.createElement('button', { className: 'confirm-close', type: 'button', onClick: () => setConfirmDialog(null), 'aria-label': 'Tutup dialog' }, React.createElement(XMarkIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-actions' }, React.createElement('button', { className: 'confirm-cancel', type: 'button', onClick: () => setConfirmDialog(null) }, 'Batal'), React.createElement('button', { className: `confirm-submit ${confirmDialog.tone}`, type: 'button', onClick: handleConfirm }, confirmDialog.confirmLabel)))) : null,
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
