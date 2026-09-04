import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('http://tokopos.test/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('link', { name: 'Kategori' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('Open URL', async ({ page }) =>{
    await expect(page).toHaveURL('http://tokopos.test/')
    await expect(page).toHaveTitle('TokoPOS')
});

test('Open Menu - Categories', async ({ page }) => {
    await page.getByRole('link', {name:'Kategori'}).click()
    await expect(page).toHaveURL('http://tokopos.test/categories')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible()

    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Kode Kategori' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Slug' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Deskripsi' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible()
});

test('Add Categories - Success', async ({ page }) =>{
    const categoryName = `Kategori E2E ${Date.now()}`;
    const categoryCode = `K${String.fromCharCode(65 + (Date.now() % 26))}${String.fromCharCode(65 + (Math.floor(Date.now() / 26) % 26))}`;

    await page.getByRole('link', {name:'Kategori'}).click()
    await expect(page).toHaveURL('http://tokopos.test/categories')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible()
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()

    await page.locator('input[type="text"]').nth(0).fill(categoryName)
    await page.getByLabel('Kode Kategori').fill(categoryCode)
    await page.getByRole('textbox', { name: 'Deskripsi' }).fill('Ini adalah kategori baru')
    await page.getByRole('checkbox', { name: 'Aktif' }).check()

    await page.getByRole('button', { name: 'Tambah Kategori', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Kategori berhasil ditambahkan.')
});

test('Add Categories - Failed (duplicate entry)', async ({ page }) =>{
    await page.getByRole('link', {name:'Kategori'}).click()
    await expect(page).toHaveURL('http://tokopos.test/categories')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible()
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()
})


