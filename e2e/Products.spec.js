import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page).toHaveURL('http://tokopos.test')
    await expect(page).toHaveTitle('TokoPOS')
};

test.beforeEach(async ({ page }) => {
    await login(page);

    await expect(page.getByRole('link', { name: 'Produk', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Produk', exact: true }).click();
    await expect(page).toHaveURL('http://tokopos.test/products');

    await expect(page.getByRole('heading', { level: 1, name: 'Data Produk' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Produk' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Kategori' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah' })).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Kode Produk' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Kategori' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Harga Beli' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Harga Jual' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Stok' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible();

    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toHaveText('10');
    await expect(page.getByRole('button', {name: 'Go to previous page',})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Go to next page'})).toBeVisible();
});

test('Check Filter Status', async ({ page }) =>{
    const kategoriFilter = page.getByRole('combobox', { name: 'Kategori' });
    const statusFilter = page.getByRole('combobox', { name: 'Status' });
    const statusOptions = page.getByRole('listbox').getByRole('option');
    const rowProducts = page.locator('.MuiDataGrid-row');

    await expect(statusFilter).toHaveValue('');
    await expect(kategoriFilter).toHaveValue('');
    await expect(statusFilter).toHaveText('Semua Status');

    await statusFilter.click();
    await expect(statusOptions).toHaveText(['Semua Status', 'Aktif', 'Nonaktif']);
    await statusOptions.getByText('Aktif', { exact: true }).click();

    // Check Status Aktif
    await expect(statusFilter).toHaveText('Aktif');
    await expect(rowProducts).not.toHaveCount(0);
    await expect.poll(async () => {
        const statuses = await rowProducts.locator('.product-status-badge').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);

    // Check Status Nonaktif
    await statusFilter.click();
    await page.getByRole('listbox').getByRole('option', { name: 'Nonaktif', exact: true }).click();
    await expect(statusFilter).toHaveText('Nonaktif');
    await expect.poll(async () => {
    const statuses = await rowProducts
        .locator('.product-status-badge')
        .allTextContents();

    return statuses.length > 0
        && statuses.every((status) => status.trim() === 'Nonaktif');
    }).toBe(true);
});
