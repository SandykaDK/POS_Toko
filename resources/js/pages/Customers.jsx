import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TablePagination from '@mui/material/TablePagination';
import { fetchList, fetchTrashed, createItem, updateItem, deleteItem, restoreItem, forceDeleteItem } from '../api.js';
import { AlertPopup } from '../components/AlertPopup.jsx';

export function Customers() {
    const [customers, setCustomers] = useState([]);
    const [view, setView] = useState('active');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
    });

    useEffect(() => {
        setPage(0);
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
            const res = view === 'trashed'
                ? await fetchTrashed('customers', 1, 100)
                : await fetchList('customers', 1, 100, statusFilter ? { status: statusFilter } : {});
            setCustomers(res.data || []);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => setStatusFilter('');

    const resetCustomerForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            status: 'active',
        });
    };

    const handleRestore = async (id) => {
        openConfirmation({ title: 'Pulihkan pelanggan?', message: 'Pelanggan ini akan kembali muncul di daftar pelanggan aktif.', confirmLabel: 'Pulihkan pelanggan', tone: 'default', action: async () => {
            try { await restoreItem('customers', id); setMessage({ type: 'success', text: 'Pelanggan berhasil dipulihkan.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleForceDelete = async (id) => {
        openConfirmation({ title: 'Hapus permanen?', message: 'Data pelanggan akan dihapus selamanya dan tidak dapat dipulihkan.', confirmLabel: 'Hapus permanen', tone: 'danger', action: async () => {
            try { await forceDeleteItem('customers', id); setMessage({ type: 'success', text: 'Pelanggan dihapus permanen.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateItem('customers', editingId, formData);
                setMessage({ type: 'success', text: 'Pelanggan berhasil diperbarui.' });
            } else {
                await createItem('customers', formData);
                setMessage({ type: 'success', text: 'Pelanggan berhasil ditambahkan.' });
            }
            setShowForm(false);
            resetCustomerForm();
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (customer) => {
        setFormData(customer);
        setEditingId(customer.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        openConfirmation({ title: 'Hapus pelanggan?', message: 'Pelanggan akan dipindahkan ke daftar terhapus dan masih dapat dipulihkan.', confirmLabel: 'Hapus pelanggan', tone: 'danger', action: async () => {
            try { await deleteItem('customers', id); setMessage({ type: 'success', text: 'Pelanggan berhasil dihapus.' }); loadData(); }
            catch (error) { setMessage({ type: 'error', text: error.message }); }
        } });
    };

    const openConfirmation = (dialog) => setConfirmDialog(dialog);

    const handleConfirm = async () => {
        const action = confirmDialog?.action;
        setConfirmDialog(null);
        if (action) await action();
    };

    const handleChangePage = (event, nextPage) => {
        setPage(nextPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(Number.parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedCustomers = customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return React.createElement(
        React.Fragment,
        null,
        React.createElement(
            'header',
            { className: 'topbar' },
            React.createElement('h1', null, 'Data Pelanggan'),
        ),
        showForm
            ? React.createElement(
                  'div',
                  { className: 'form-overlay' },
                  React.createElement(
                      'div',
                      { className: 'form-modal customers-form-modal' },
                      React.createElement(
                          'div',
                          { className: 'form-header' },
                          React.createElement('h2', null, editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'),
                          React.createElement('button', { type: 'button', onClick: () => { resetCustomerForm(); setShowForm(false); } }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { className: 'customers-form', onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group customer-field-full' },
                              React.createElement('label', null, 'Nama'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.name,
                                  onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                                  required: true,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group customer-field-half' },
                              React.createElement('label', null, 'Email'),
                              React.createElement('input', {
                                  type: 'email',
                                  value: formData.email,
                                  onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group customer-field-half' },
                              React.createElement('label', null, 'Telepon'),
                              React.createElement('input', {
                                  type: 'tel',
                                  value: formData.phone,
                                  onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group customer-field-full' },
                              React.createElement('label', null, 'Alamat'),
                              React.createElement('textarea', {
                                  value: formData.address,
                                  onChange: (e) => setFormData({ ...formData, address: e.target.value }),
                                  rows: 2,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group checkbox customer-field-half' },
                              React.createElement('input', {
                                  type: 'checkbox',
                                  id: 'customer_is_active',
                                  checked: formData.status === 'active',
                                  onChange: (e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' }),
                              }),
                              React.createElement('label', { htmlFor: 'customer_is_active' }, 'Aktif'),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Pelanggan'),
                              React.createElement('button', { type: 'button', className: 'pill secondary', onClick: () => { resetCustomerForm(); setShowForm(false); } }, 'Batal'),
                          ),
                      ),
                  ),
              )
            : null,
        React.createElement(
            'section',
            { className: 'panel category-panel' },
            React.createElement('div', { className: 'category-toolbar' },
                React.createElement('label', { className: 'category-filter' }, React.createElement('span', null, 'Status'), React.createElement('select', { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), disabled: view === 'trashed' }, React.createElement('option', { value: '' }, 'Semua Status'), React.createElement('option', { value: 'active' }, 'Aktif'), React.createElement('option', { value: 'inactive' }, 'Nonaktif'), React.createElement('option', { value: 'vip' }, 'VIP'))),
                React.createElement('button', { className: 'filter-reset', type: 'button', onClick: resetFilters }, React.createElement(ArrowUturnLeftIcon, { 'aria-hidden': 'true' }), 'Reset'),
                React.createElement('button', { className: 'category-add-button', type: 'button', onClick: () => { resetCustomerForm(); setShowForm(true); } }, React.createElement(PlusIcon, { 'aria-hidden': 'true' }), 'Tambah'),
            ),
            React.createElement('div', { className: 'category-tabs' }, React.createElement('button', { className: `pill ${view === 'active' ? 'primary' : 'secondary'}`, onClick: () => setView('active') }, 'Aktif'), React.createElement('button', { className: `pill ${view === 'trashed' ? 'primary' : 'secondary'}`, onClick: () => setView('trashed') }, 'Terhapus')),
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
                                  React.createElement('th', null, 'Nama'),
                                  React.createElement('th', null, 'Email'),
                                  React.createElement('th', null, 'Telepon'),
                                  React.createElement('th', null, 'Status'),
                                  React.createElement('th', null, 'Aksi'),
                              ),
                          ),
                          React.createElement(
                              'tbody',
                              null,
                              paginatedCustomers.map((customer) =>
                                  React.createElement(
                                      'tr',
                                      { key: customer.id },
                                      React.createElement('td', null, customer.name),
                                      React.createElement('td', null, customer.email),
                                      React.createElement('td', null, customer.phone),
                                      React.createElement('td', null, React.createElement('span', { className: `category-status ${view === 'trashed' ? 'deleted' : customer.status === 'active' ? 'active' : 'inactive'}` }, view === 'trashed' ? 'Terhapus' : customer.status === 'active' ? 'Aktif' : customer.status === 'vip' ? 'VIP' : 'Nonaktif')),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          view === 'trashed' ? React.createElement(React.Fragment, null, React.createElement('button', { className: 'btn-edit', title: 'Pulihkan pelanggan', 'aria-label': 'Pulihkan pelanggan', onClick: () => handleRestore(customer.id) }, React.createElement(ArrowPathIcon, { 'aria-hidden': 'true' })), React.createElement('button', { className: 'btn-delete', title: 'Hapus permanen', 'aria-label': 'Hapus permanen', onClick: () => handleForceDelete(customer.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' }))) : React.createElement(React.Fragment, null, React.createElement('button', { className: 'btn-edit', title: 'Edit pelanggan', 'aria-label': 'Edit pelanggan', onClick: () => handleEdit(customer) }, React.createElement(PencilSquareIcon, { 'aria-hidden': 'true' })), React.createElement('button', { className: 'btn-delete', title: 'Hapus pelanggan', 'aria-label': 'Hapus pelanggan', onClick: () => handleDelete(customer.id) }, React.createElement(TrashIcon, { 'aria-hidden': 'true' }))),
                                      ),
                                  ),
                              ),
                          ),
                      ),
                      React.createElement(TablePagination, {
                          component: 'div',
                          count: customers.length,
                          page,
                          onPageChange: handleChangePage,
                          rowsPerPage,
                          onRowsPerPageChange: handleChangeRowsPerPage,
                          rowsPerPageOptions: [5, 10, 25, 50],
                          labelRowsPerPage: 'Baris per halaman',
                          labelDisplayedRows: ({ from, to, count }) => `${from}-${to} dari ${count}`,
                          sx: {
                              fontFamily: 'inherit',
                              '& .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select, & .MuiTablePagination-actions': {
                                  fontFamily: 'inherit',
                              },
                          },
                      }),
                  ),
        ),
        confirmDialog ? React.createElement('div', { className: 'confirm-overlay', role: 'presentation', onMouseDown: (event) => { if (event.target === event.currentTarget) setConfirmDialog(null); } }, React.createElement('div', { className: 'confirm-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title', 'aria-describedby': 'confirm-message' }, React.createElement('div', { className: `confirm-icon ${confirmDialog.tone}` }, React.createElement(ExclamationTriangleIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-content' }, React.createElement('h2', { id: 'confirm-title' }, confirmDialog.title), React.createElement('p', { id: 'confirm-message' }, confirmDialog.message)), React.createElement('button', { className: 'confirm-close', type: 'button', onClick: () => setConfirmDialog(null), 'aria-label': 'Tutup dialog' }, React.createElement(XMarkIcon, { 'aria-hidden': 'true' })), React.createElement('div', { className: 'confirm-actions' }, React.createElement('button', { className: 'confirm-cancel', type: 'button', onClick: () => setConfirmDialog(null) }, 'Batal'), React.createElement('button', { className: `confirm-submit ${confirmDialog.tone}`, type: 'button', onClick: handleConfirm }, confirmDialog.confirmLabel)))) : null,
        message.text ? React.createElement(AlertPopup, { message, onClose: () => setMessage({ type: '', text: '' }) }) : null,
    );
}
