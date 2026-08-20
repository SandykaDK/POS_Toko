import React, { useEffect, useState } from 'react';
import { fetchList, createItem, updateItem, deleteItem } from '../api.js';

export function Customers() {
    const [customers, setCustomers] = useState([]);
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
        status: 'active',
        notes: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('customers', 1, 100);
            setCustomers(res.data || []);
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
                await updateItem('customers', editingId, formData);
                setMessage({ type: 'success', text: 'Pelanggan berhasil diperbarui.' });
            } else {
                await createItem('customers', formData);
                setMessage({ type: 'success', text: 'Pelanggan berhasil ditambahkan.' });
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
                status: 'active',
                notes: '',
            });
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
        if (window.confirm('Yakin ingin menghapus pelanggan ini?')) {
            try {
                await deleteItem('customers', id);
                setMessage({ type: 'success', text: 'Pelanggan berhasil dihapus.' });
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
            React.createElement('h1', null, 'Data Pelanggan'),
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
                                status: 'active',
                                notes: '',
                            });
                            setShowForm(true);
                        },
                    },
                    '+ Tambah Pelanggan',
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
                          React.createElement('h2', null, editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group' },
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
                              { className: 'form-group' },
                              React.createElement('label', null, 'Status'),
                              React.createElement(
                                  'select',
                                  {
                                      value: formData.status,
                                      onChange: (e) => setFormData({ ...formData, status: e.target.value }),
                                  },
                                  React.createElement('option', { value: 'active' }, 'Aktif'),
                                  React.createElement('option', { value: 'inactive' }, 'Nonaktif'),
                              ),
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
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Pelanggan'),
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
                React.createElement('h2', null, 'Daftar Pelanggan'),
                React.createElement('span', { className: 'subtle' }, `${customers.length} item`),
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
                              customers.map((customer) =>
                                  React.createElement(
                                      'tr',
                                      { key: customer.id },
                                      React.createElement('td', null, customer.name),
                                      React.createElement('td', null, customer.email),
                                      React.createElement('td', null, customer.phone),
                                      React.createElement('td', null, customer.city),
                                      React.createElement('td', null, customer.status === 'active' ? '✓ Aktif' : '✗ Nonaktif'),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          React.createElement('button', { className: 'btn-edit', onClick: () => handleEdit(customer) }, '✎'),
                                          React.createElement('button', { className: 'btn-delete', onClick: () => handleDelete(customer.id) }, '🗑'),
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
