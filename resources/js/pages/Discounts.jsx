import React, { useEffect, useState } from 'react';
import { money } from '../helpers.js';
import { fetchList, createItem, updateItem, deleteItem } from '../api.js';

export function Discounts() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
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
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await fetchList('discounts', 1, 100);
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
        if (window.confirm('Yakin ingin menghapus diskon ini?')) {
            try {
                await deleteItem('discounts', id);
                setMessage({ type: 'success', text: 'Diskon berhasil dihapus.' });
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
            React.createElement('h1', null, 'Data Diskon'),
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
                            setShowForm(true);
                        },
                    },
                    '+ Tambah Diskon',
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
                          React.createElement('h2', null, editingId ? 'Edit Diskon' : 'Tambah Diskon'),
                          React.createElement('button', { type: 'button', onClick: () => setShowForm(false) }, '✕'),
                      ),
                      React.createElement(
                          'form',
                          { onSubmit: handleSubmit },
                          React.createElement(
                              'div',
                              { className: 'form-group' },
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
                              { className: 'form-group' },
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
                              { className: 'form-group' },
                              React.createElement('label', null, 'Deskripsi'),
                              React.createElement('textarea', {
                                  value: formData.description,
                                  onChange: (e) => setFormData({ ...formData, description: e.target.value }),
                                  rows: 2,
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
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
                              { className: 'form-group' },
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
                              { className: 'form-group' },
                              React.createElement('label', null, 'Diskon Maksimal'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.max_discount,
                                  onChange: (e) => setFormData({ ...formData, max_discount: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Pembelian Minimum'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.min_purchase,
                                  onChange: (e) => setFormData({ ...formData, min_purchase: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Maksimal Penggunaan'),
                              React.createElement('input', {
                                  type: 'number',
                                  value: formData.max_usage,
                                  onChange: (e) => setFormData({ ...formData, max_usage: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Tanggal Mulai'),
                              React.createElement('input', {
                                  type: 'date',
                                  value: formData.start_date,
                                  onChange: (e) => setFormData({ ...formData, start_date: e.target.value }),
                              }),
                          ),
                          React.createElement(
                              'div',
                              { className: 'form-group' },
                              React.createElement('label', null, 'Tanggal Berakhir'),
                              React.createElement('input', {
                                  type: 'date',
                                  value: formData.end_date,
                                  onChange: (e) => setFormData({ ...formData, end_date: e.target.value }),
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
                              React.createElement('button', { type: 'submit', className: 'pill primary' }, editingId ? 'Simpan Perubahan' : 'Tambah Diskon'),
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
                React.createElement('h2', null, 'Daftar Diskon'),
                React.createElement('span', { className: 'subtle' }, `${discounts.length} item`),
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
                                  React.createElement('th', null, 'Kode'),
                                  React.createElement('th', null, 'Nama'),
                                  React.createElement('th', null, 'Tipe'),
                                  React.createElement('th', null, 'Nilai'),
                                  React.createElement('th', null, 'Min Pembelian'),
                                  React.createElement('th', null, 'Status'),
                                  React.createElement('th', null, 'Aksi'),
                              ),
                          ),
                          React.createElement(
                              'tbody',
                              null,
                              discounts.map((discount) =>
                                  React.createElement(
                                      'tr',
                                      { key: discount.id },
                                      React.createElement('td', null, discount.code),
                                      React.createElement('td', null, discount.name),
                                      React.createElement('td', null, discount.type === 'percentage' ? '%' : 'Rp'),
                                      React.createElement(
                                          'td',
                                          null,
                                          discount.type === 'percentage' ? `${discount.value}%` : money(discount.value),
                                      ),
                                      React.createElement('td', null, money(discount.min_purchase)),
                                      React.createElement('td', null, discount.is_active ? '✓ Aktif' : '✗ Nonaktif'),
                                      React.createElement(
                                          'td',
                                          { className: 'action-buttons' },
                                          React.createElement('button', { className: 'btn-edit', onClick: () => handleEdit(discount) }, '✎'),
                                          React.createElement('button', { className: 'btn-delete', onClick: () => handleDelete(discount.id) }, '🗑'),
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
