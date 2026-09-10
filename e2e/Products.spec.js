import { test, expect } from '@playwright/test';
import path from 'path';

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

test('Open Header Column', async ({ page }) =>{
    const sortableColumns = ['Kode Produk', 'Nama', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Status'];
    const aksiHeader = page.getByRole('columnheader', { name: 'Aksi' })
    const activeMenu = page.locator('[role="menu"]:visible');

    for (const columnName of sortableColumns) {
        const columnHeader = page.getByRole('columnheader', { name: columnName });

        await columnHeader.hover();
        await columnHeader.getByRole('button', { name: `${columnName} column menu` }).click();

        await expect(activeMenu).toHaveCount(1);

        await expect(activeMenu.getByText('Sort by ASC', { exact: true })).toBeVisible();
        await expect(activeMenu.getByText('Sort by DESC', { exact: true })).toBeVisible();
        await expect(activeMenu.getByText('Filter', { exact: true })).toBeVisible();
        await expect(activeMenu.getByText('Hide column', { exact: true })).toBeVisible();
        await expect(activeMenu.getByText('Manage columns', { exact: true })).toBeVisible();

        await page.getByRole('heading', { name: 'Data Produk' }).click();
    }

    await aksiHeader.hover();
    await aksiHeader.getByRole('button', { name: 'Aksi column menu' }).click();

    await expect(activeMenu.getByText('Sort by ASC', { exact: true })).not.toBeVisible();
    await expect(activeMenu.getByText('Sort by DESC', { exact: true })).not.toBeVisible();
    await expect(activeMenu.getByText('Filter', { exact: true })).not.toBeVisible();
});

test('Sort ASC/DESC - All sortable column', async ({ page }) =>{
    const sortableColumns = [
        { name: 'Kode Produk', field: 'product_code' },
        { name: 'Nama', field: 'name' },
        { name: 'Kategori', field: 'category_id' },
        { name: 'Harga Beli', field: 'cost_price' },
        { name: 'Harga Jual', field: 'selling_price' },
        { name: 'Stok', field: 'stock' },
        { name: 'Status', field: 'is_active' },
    ];

    for (const { name, field } of sortableColumns) {
        const columnHeader = page.getByRole('columnheader', { name });
        const cells = page.locator(`.MuiDataGrid-row [data-field="${field}"]`);

        for (const direction of ['ASC', 'DESC']) {
            await columnHeader.hover();
            await columnHeader.getByRole('button', { name: `${name} column menu` }).click();
            await page.getByRole('menu').last().getByText(`Sort by ${direction}`, { exact: true }).click();

            const sort = direction === 'ASC'
                ? { ariaValue: 'ascending', icon: 'ArrowUpwardIcon', compare: (previous, current) => previous.localeCompare(current) <= 0 }
                : { ariaValue: 'descending', icon: 'ArrowDownwardIcon', compare: (previous, current) => previous.localeCompare(current) >= 0 };

            await expect(columnHeader).toHaveAttribute('aria-sort', sort.ariaValue);
            await expect(columnHeader.locator('.MuiDataGrid-sortIcon')).toBeVisible();

            await expect.poll(async () => {
                const values = (await cells.allTextContents()).map((value) => value.trim());

                return values.length > 0 && values.every((value, index) => {
                    return index === 0 || sort.compare(values[index - 1], value);
                });
            }).toBe(true);
        }
    }
});

test ('Search Produk', async ({ page }) =>{
    const rows = page.locator('.MuiDataGrid-row');
    const searchbox = page.getByRole('searchbox', { name: 'Cari Produk' });
    const productCodes = page.locator('.MuiDataGrid-row [data-field="category_code"]');

    const initialCodes = (await productCodes.allTextContents()).map((value) => value.trim());

    await searchbox.fill('Adem Sari');
    await expect(rows.first()).toContainText('Adem Sari');

    await searchbox.fill('');
    await expect(searchbox).toHaveValue('');

    await expect.poll(async () => {
        return (await productCodes.allTextContents())
            .map((value) => value.trim());
    }).toEqual(initialCodes);
});

test('Test Pagination', async ({ page }) =>{
    const rowsPerPage = page.getByRole('combobox', { name: 'Rows per page:' });

    await rowsPerPage.click();
    await page.getByRole('option', { name: '5', exact: true }).click();

    await expect(rowsPerPage).toHaveText('5');

    await expect(page.locator('.MuiTablePagination-displayedRows')).toHaveText(/1–5 of \d+/);

    await expect(page.locator('.MuiDataGrid-row')).toHaveCount(5);
});

test('Add Products - Success', async ({ page }) =>{
    const productsName = `Produk ${Date.now()}`;
    const modalCreate = page.locator('.products-form-modal');
    const imagePath = path.resolve('e2e/fixtures/test-file.png');

    await page.getByRole('button', { name: 'Tambah' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Produk' })).toBeVisible();

    await modalCreate.getByRole('textbox', { name: 'Nama Produk' }).fill(productsName);
    await modalCreate.getByRole('combobox', { name: 'Kategori', exact: true }).selectOption({ label: 'Minuman' });
    await modalCreate.getByRole('spinbutton', { name: 'Harga Beli' }).fill('5000');
    await modalCreate.getByRole('spinbutton', { name: 'Harga Jual' }).fill('6000');
    await modalCreate.getByRole('spinbutton', { name: 'Stok', exact: true }).fill('15');
    await modalCreate.getByRole('spinbutton', { name: 'Stok Minimal' }).fill('5');
    await modalCreate.getByRole('combobox', { name: 'Unit' }).selectOption('pcs');
    await modalCreate.locator('#product_image').setInputFiles(imagePath);
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check();
    await modalCreate.getByRole('textbox', { name: 'Deskripsi' }).fill(`Ini adalah produk baru ${Date.now()}`);


    await page.getByRole('button', { name: 'Tambah Produk', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Produk berhasil ditambahkan.');
});

test('Add Products Failed (duplicate entry)', async ({ page }) =>{
    const productsName = 'Adem Sari';
    const modalCreate = page.locator('.products-form-modal');
    const imagePath = path.resolve('e2e/fixtures/test-file.png');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Produk' })).toBeVisible()

    await modalCreate.getByRole('textbox', { name: 'Nama Produk' }).fill(productsName)
    await modalCreate.getByRole('combobox', { name: 'Kategori', exact: true }).selectOption({ label: 'Minuman' });
    await modalCreate.getByRole('spinbutton', { name: 'Harga Beli' }).fill('5000');
    await modalCreate.getByRole('spinbutton', { name: 'Harga Jual' }).fill('6000');
    await modalCreate.getByRole('spinbutton', { name: 'Stok', exact: true }).fill('15');
    await modalCreate.getByRole('spinbutton', { name: 'Stok Minimal' }).fill('5');
    await modalCreate.getByRole('combobox', { name: 'Unit' }).selectOption('pcs');
    await modalCreate.locator('#product_image').setInputFiles(imagePath);
    await modalCreate.getByRole('textbox', { name: 'Deskripsi' }).fill(`Ini adalah produk baru ${Date.now()}`);
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalCreate.getByRole('button', { name: 'Tambah Produk', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Nama sudah digunakan.')
});

// Empty Field Test
const requiredFields = [
        { name: 'Nama Produk', role: 'textbox' },
        { name: 'Harga Beli', role: 'spinbutton' },
        { name: 'Harga Jual', role: 'spinbutton' },
        { name: 'Stok', role: 'spinbutton', exact: true },
        { name: 'Stok Minimal', role: 'spinbutton' },
];

for (const field of requiredFields) {
  test(`Add Products - Failed (${field.name} is empty)`, async ({ page }) => {
    const modalCreate = page.locator('.products-form-modal');
    await page.getByRole('button', { name: 'Tambah' }).click();

    // Isi field wajib lain dengan data valid.
    await modalCreate.getByRole('textbox', { name: 'Nama Produk' }).fill('Test Product');
    await modalCreate.getByRole('combobox', { name: 'Kategori', exact: true }).selectOption({ label: 'Minuman' });
    await modalCreate.getByRole('spinbutton', { name: 'Harga Beli' }).fill('5000');
    await modalCreate.getByRole('spinbutton', { name: 'Harga Jual' }).fill('6000');
    await modalCreate.getByRole('spinbutton', { name: 'Stok', exact: true }).fill('10');
    await modalCreate.getByRole('spinbutton', { name: 'Stok Minimal' }).fill('5');

    // Kosongkan field yang sedang diuji.
    const targetField = modalCreate.getByRole(field.role, { name: field.name, exact: field.exact });

    await targetField.fill('');

    await page.getByRole('button', {name: 'Tambah Produk',exact: true}).click();
    expect(await targetField.evaluate((input) => input.validity.valid)).toBe(false);
  });
};

test('Edit Categories - Success', async ({ page }) =>{
    const productsRow = page.getByRole('row').filter({ hasText: 'Hansaplast' });
    const productsEdited = page.getByRole('row').filter({ hasText: 'Hansaplast Baru' });
    const modalEdit = page.locator('.products-form-modal');
    const imagePath = path.resolve('e2e/fixtures/test-file.png');

    await page.getByRole('searchbox', { name: 'Cari Produk' }).fill('Hansaplast');

    await expect(productsRow).toHaveCount(1);
    await productsRow.getByRole('button', { name: 'Edit Produk' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Produk' })).toBeVisible();

    await expect(modalEdit.getByRole('textbox', { name: 'Nama Produk' })).toHaveValue('Hansaplast');
    await modalEdit.getByRole('textbox', { name: 'Nama Produk' }).fill('Hansaplast Baru');

    await expect(modalEdit.getByRole('combobox', { name: 'Kategori' }).locator('option:checked')).toHaveText('Obat');
    await modalEdit.getByRole('combobox', { name: 'Kategori' }).selectOption({label: 'Perawatan Pribadi'});

    await expect(modalEdit.getByRole('spinbutton', { name: 'Harga Beli' })).toHaveValue('0.00');
    await modalEdit.getByRole('spinbutton', { name: 'Harga Beli' }).fill('200');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Harga Jual' })).toHaveValue('500.00');
    await modalEdit.getByRole('spinbutton', { name: 'Harga Jual' }).fill('600');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Stok', exact: true })).toHaveValue('10');
    await modalEdit.getByRole('spinbutton', { name: 'Stok', exact: true }).fill('20');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Stok Minimal' })).toHaveValue('5');
    await modalEdit.getByRole('spinbutton', { name: 'Stok Minimal' }).fill('7');

    await expect(modalEdit.getByRole('combobox', { name: 'Unit' })).toHaveValue('pcs');
    await modalEdit.getByRole('combobox', { name: 'Unit' }).selectOption('box');

    await modalEdit.locator('#product_image').setInputFiles(imagePath);

    await expect(modalEdit.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue('');
    await modalEdit.getByRole('textbox', { name: 'Deskripsi' }).fill('Deskripsi baru');

    await expect(modalEdit.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
    await modalEdit.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalEdit.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await expect(page.getByRole('alert')).toContainText('Produk berhasil diperbarui.');

    // Validasi after edited
    await expect(productsEdited).toHaveCount(1);
    const updatedRow = page.getByRole('row').filter({hasText: 'Hansaplast Baru',});

    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Perawatan Pribadi');
    await expect(updatedRow).toContainText('200');
    await expect(updatedRow).toContainText('600');
    await expect(updatedRow).toContainText('20');
    await expect(updatedRow).toContainText('box');

    await updatedRow.getByRole('button', { name: 'Edit Produk' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Produk' })).toBeVisible();

    await expect(modalEdit.getByRole('spinbutton', { name: 'Stok Minimal' })).toHaveValue('7');
    await expect(modalEdit.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue('Deskripsi baru');
    await expect(modalEdit.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
    await expect(modalEdit.locator('.product-image-preview')).toBeVisible();
    await expect(modalEdit.locator('.product-image-preview')).toHaveAttribute('src', /.+/);
});

test('Edit Categories - Failed (duplicate entry)', async ({ page }) =>{
    const productsRow = page.getByRole('row').filter({ hasText: 'Ladaku Merica Bubuk' });
    const productsEdited = page.getByRole('row').filter({ hasText: 'Adem Sari' });
    const modalEdit = page.locator('.products-form-modal');
    const imagePath = path.resolve('e2e/fixtures/test-file.png');

    await page.getByRole('searchbox', { name: 'Cari Produk' }).fill('Ladaku');

    await expect(productsRow).toHaveCount(1);
    await productsRow.getByRole('button', { name: 'Edit Produk' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Produk' })).toBeVisible();

    await expect(modalEdit.getByRole('textbox', { name: 'Nama Produk' })).toHaveValue('Ladaku Merica Bubuk');
    await modalEdit.getByRole('textbox', { name: 'Nama Produk' }).fill('Adem Sari');

    await expect(modalEdit.getByRole('combobox', { name: 'Kategori' }).locator('option:checked')).toHaveText('Bumbu');
    await modalEdit.getByRole('combobox', { name: 'Kategori' }).selectOption({label: 'Perawatan Pribadi'});

    await expect(modalEdit.getByRole('spinbutton', { name: 'Harga Beli' })).toHaveValue('0.00');
    await modalEdit.getByRole('spinbutton', { name: 'Harga Beli' }).fill('100');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Harga Jual' })).toHaveValue('1000.00');
    await modalEdit.getByRole('spinbutton', { name: 'Harga Jual' }).fill('1100.00');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Stok', exact: true })).toHaveValue('10');
    await modalEdit.getByRole('spinbutton', { name: 'Stok', exact: true }).fill('20');

    await expect(modalEdit.getByRole('spinbutton', { name: 'Stok Minimal' })).toHaveValue('5');
    await modalEdit.getByRole('spinbutton', { name: 'Stok Minimal' }).fill('7');

    await expect(modalEdit.getByRole('combobox', { name: 'Unit' })).toHaveValue('pcs');
    await modalEdit.getByRole('combobox', { name: 'Unit' }).selectOption('box');

    await modalEdit.locator('#product_image').setInputFiles(imagePath);

    await expect(modalEdit.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue('');
    await modalEdit.getByRole('textbox', { name: 'Deskripsi' }).fill('Deskripsi baru');

    await expect(modalEdit.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
    await modalEdit.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalEdit.getByRole('button', { name: 'Simpan Perubahan' }).click();
    await expect(page.getByRole('alert')).toContainText('Nama sudah digunakan.')
});

test('Delete Products - Success', async ({ page }) =>{
    const productsRow = page.getByRole('row').filter({ hasText: 'Uleg Sambal Terasi' });

    await expect(productsRow).toHaveCount(1);
    await productsRow.getByRole('button', { name: 'Hapus Produk' }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus produk?' })).toBeVisible();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus produk', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Produk berhasil dihapus.');
});
