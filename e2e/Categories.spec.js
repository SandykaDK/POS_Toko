import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page).toHaveURL('http://tokopos.test')
    await expect(page).toHaveTitle('TokoPOS')
}

test.beforeEach(async ({ page }) => {
    await login(page);

    await expect(page.getByRole('link', { name: 'Kategori' })).toBeVisible();
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
    const categoryName = 'Makanan';
    const categoryCode = 'MKN';

    await page.getByRole('link', {name:'Kategori'}).click()
    await expect(page).toHaveURL('http://tokopos.test/categories')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible()
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()

    await page.getByRole('textbox', { name: 'Nama Kategori' }).fill(categoryName)
    await page.getByRole('textbox', { name: 'Kode Kategori' }).fill(categoryCode)
    await page.getByRole('textbox', { name: 'Deskripsi' }).fill('Ini adalah kategori baru')
    await page.getByRole('checkbox', { name: 'Aktif' }).check()

    await page.getByRole('button', { name: 'Tambah Kategori', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('category code sudah digunakan. (and 1 more error)')
})

test('Add Categories - Failed (empty required field)', async ({ page }) =>{
    await page.getByRole('link', {name:'Kategori'}).click()
    await expect(page).toHaveURL('http://tokopos.test/categories')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible()
    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()

    await page.getByRole('button', { name: 'Tambah Kategori', exact: true }).click()

    const categoryName = page.getByRole('textbox', { name: 'Nama Kategori' })
    await expect.poll(() => categoryName.evaluate((input) => input.validity.valid)).toBe(false)
    await expect(categoryName).toHaveJSProperty('validationMessage', 'Please fill out this field.')

    const formIsInvalid = await page.locator('form').evaluate((form) => !form.checkValidity())
    expect(formIsInvalid).toBe(true)
})

test('Edit Categories - Success', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Sembako' });
    const categoryEdited = page.getByRole('row').filter({ hasText: 'Tes ganti' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Edit Kategori' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Kategori' })).toBeVisible()

    await expect(page.getByRole('textbox', { name: 'Nama Kategori' })).toHaveValue('Sembako')
    await page.getByRole('textbox', { name: 'Nama Kategori' }).fill('Tes Ganti')
    await expect(page.getByRole('textbox', { name: 'Kode Kategori' })).toHaveValue('SBK')
    await page.getByRole('textbox', { name: 'Kode Kategori' }).fill('GNT')
    await expect(page.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue('Kategori Sembako')
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect(categoryEdited).toHaveCount(1)
})

test('Edit Categories - Failed (duplicate entry)', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Tes Ganti' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Edit Kategori' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Kategori' })).toBeVisible()

    await expect(page.getByRole('textbox', { name: 'Nama Kategori' })).toHaveValue('Tes Ganti')
    await page.getByRole('textbox', { name: 'Nama Kategori' }).fill('Makanan')
    await expect(page.getByRole('textbox', { name: 'Kode Kategori' })).toHaveValue('GNT')
    await page.getByRole('textbox', { name: 'Kode Kategori' }).fill('MKN')
    await expect(page.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue('Kategori Sembako')
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click()

    await expect(page.getByRole('alert')).toContainText('category code sudah digunakan. (and 1 more error)')
})

test('Delete Categories - Success', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Tes Ganti' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Hapus Kategori' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus kategori?' })).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus kategori', exact: true }).click()
})

test('Delete Categories - Failed (Used)', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Makanan' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Hapus Kategori' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus kategori?' })).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus kategori', exact: true }).click()

    await expect(page.getByRole('alert')).toContainText('Kategori tidak dapat dihapus karena masih memiliki produk')
})



