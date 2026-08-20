import React, { useEffect, useState } from 'react';
import { fetchList, createItem, updateItem, deleteItem } from '../api.js';

export function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postal_code: '',
        is_active: true,
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('suppliers', 1, 100);
            setSuppliers(res.data || []);
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
                await updateItem('suppliers', editingId, formData);
                setMessage({ type: 'success', text: 'Pemasok berhasil diperbarui.' });
            } else {
                await createItem('suppliers', formData);
                setMessage({ type: 'success', text: 'Pemasok berhasil ditambahkan.' });
            }
            setShowForm(false);
            setEditingId(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                province: '',
                postal_code: '',
                is_active: true,
                notes: '',
            });
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleEdit = (supplier) => {
        setFormData(supplier);
        setEditingId(supplier.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus pemasok ini?')) {
            try {
                await deleteItem('suppliers', id);
                setMessage({ type: 'success', text: 'Pemasok berhasil dihapus.' });
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
            React.createElement('h1', null, 'Data Pemasok'),
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
                                email: '',
                                phone: '',
                                address: '',
                                city: '',
                                province: '',
                                postal_code: '',
                                is_active: true,
                                notes: '',
                            });
                            setShowForm(true);
                        },
                    },
                    '+ Tambah Pemasok',
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
                          React.createElement('h2', null, editingId ? 'Edit Pemasok' : 'Tambah Pemasok'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Nama Pemasok'),
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
                              React.createElement('label', null, 'Email'),
                              React.createElement('input', {
                                  type: 'email',
                                  value: formData.email,
                                  onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Telepon'),
                              React.createElement('input', {
                                  type: 'tel',
                                  value: formData.phone,
                                  onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Alamat'),
                              React.createElement('textarea', {
                                  value: formData.address,
                                  onChange: (e) => setFormData({ ...formData, address: e.target.value }),
                                  rows: 2,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Kota'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.city,
                                  onChange: (e) => setFormData({ ...formData, city: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Provinsi'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.province,
                                  onChange: (e) => setFormData({ ...formData, province: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Kode Pos'),
                              React.createElement('input', {
                                  type: 'text',
                                  value: formData.postal_code,
                                  onChange: (e) => setFormData({ ...formData, postal_code: e.target.value }),
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
                              { className: 'form-group' },
                              React.createElement('label', null, 'Catatan'),
                              React.createElement('textarea', {
                                  value: formData.notes,
                                  onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
                                  rows: 2,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-actions' },
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Pemasok'),
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
                React.createElement('h2', null, 'Daftar Pemasok'),
                React.createElement('span', { className: 'subtle' }, `${suppliers.length} item`),
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
                                  React.createElement('th', null, 'Email'),
                                  React.createElement('th', null, 'Telepon'),
                                  React.createElement('th', null, 'Kota'),
                                  React.createElement('th', null, 'Status'),
                                  React.createElement('th', null, 'Aksi'),
                              ),
                          ),
                          React.createElement(
                              'tbody',
                              null,
                              suppliers.map((supplier) =>
                                  React.createElement(
                                      'tr',
                                      { key: supplier.id },
                                      React.createElement('td', null, supplier.name),
                                      React.createElement('td', null, supplier.email),
                                      React.createElement('td', null, supplier.phone),
                                      React.createElement('td', null, supplier.city),
                                      React.createElement('td', null, supplier.is_active ? '✓ Aktif' : '✗ Nonaktif'),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          React.createElement('button', { className: 'btn-edit', onClick: () => handleEdit(supplier) }, '✎'),
                                          React.createElement('button', { className: 'btn-delete', onClick: () => handleDelete(supplier.id) }, '🗑'),
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
