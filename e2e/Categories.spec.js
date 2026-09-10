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

    await expect(page.getByRole('link', { name: 'Kategori' })).toBeVisible();
    await page.getByRole('link', {name:'Kategori'}).click();
    await expect(page).toHaveURL('http://tokopos.test/categories');

    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Kategori' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Kode Kategori' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Slug' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Deskripsi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible();

    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toHaveText('10');
    await expect(page.getByRole('button', {name: 'Go to previous page',})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Go to next page'})).toBeVisible();
});

test('Check Filter Status', async ({ page }) =>{
    const statusFilter = page.getByRole('combobox', { name: 'Status' });
    const statusOptions = page.getByRole('listbox').getByRole('option');
    const rowKategori = page.locator('.MuiDataGrid-row');

    await expect(statusFilter).toBeVisible();
    await expect(statusFilter).toHaveText('Semua Status');
    await statusFilter.click();
    await expect(statusOptions).toHaveText(['Semua Status', 'Aktif', 'Nonaktif']);

    // Check Status Aktif
    await statusOptions.getByText('Aktif', { exact: true }).click();
    await expect(statusFilter).toHaveText('Aktif');

    await expect(rowKategori).not.toHaveCount(0);
    await expect.poll(async () => {
        const statuses = await rowKategori.locator('.category-status').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);

    // Check Status Nonaktif
    await statusFilter.click();
    await page.getByRole('listbox').getByRole('option', { name: 'Nonaktif' }).click();
    await expect(statusFilter).toHaveText('Nonaktif');

    await expect.poll(async () => {
        const statuses = await rowKategori.locator('.category-status').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);
});

test('Open Header Column', async ({ page }) =>{
    const sortableColumns = ['Kode Kategori', 'Nama', 'Slug', 'Deskripsi', 'Status'];
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

        await page.getByRole('heading', { name: 'Kategori Produk' }).click();
    }

    await aksiHeader.hover();
    await aksiHeader.getByRole('button', { name: 'Aksi column menu' }).click();

    await expect(activeMenu.getByText('Sort by ASC')).not.toBeVisible();
    await expect(activeMenu.getByText('Sort by DESC')).not.toBeVisible();
    await expect(activeMenu.getByText('Filter')).not.toBeVisible();
});

test('Sort ASC/DESC - All sortable columns', async ({ page }) =>{
    const sortableColumns = [
        { name: 'Kode Kategori', field: 'category_code' },
        { name: 'Nama', field: 'name' },
        { name: 'Slug', field: 'slug' },
        { name: 'Deskripsi', field: 'description' },
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

test('Search Kategori', async ({ page }) =>{
    const rows = page.locator('.MuiDataGrid-row');
    const searchbox = page.getByRole('searchbox', { name: 'Cari Kategori' });
    const categoryCodes = page.locator('.MuiDataGrid-row [data-field="category_code"]');

    const initialCodes = (await categoryCodes.allTextContents()).map((value) => value.trim());

    await searchbox.fill('Makanan');
    await expect(rows.first()).toContainText('Makanan');

    await searchbox.fill('');
    await expect(searchbox).toHaveValue('');

    await expect.poll(async () => {
        return (await categoryCodes.allTextContents())
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

test('Add Categories - Success', async ({ page }) =>{
    const categoryName = `Kategori ${Date.now()}`;
    const categoryCode = `K${String.fromCharCode(65 + (Date.now() % 26))}${String.fromCharCode(65 + (Math.floor(Date.now() / 26) % 26))}`;
    const modalCreate = page.locator('.categories-form-modal');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()

    await modalCreate.getByRole('textbox', { name: 'Nama Kategori' }).fill(categoryName);
    await modalCreate.getByRole('textbox', { name: 'Kode Kategori' }).fill(categoryCode);
    await modalCreate.getByRole('textbox', { name: 'Deskripsi' }).fill('Ini adalah kategori baru');
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalCreate.getByRole('button', { name: 'Tambah Kategori', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Kategori berhasil ditambahkan.');
});

test('Add Categories - Failed (duplicate entry)', async ({ page }) =>{
    const categoryName = 'Makanan';
    const categoryCode = 'MKN';
    const modalCreate = page.locator('.categories-form-modal');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Kategori' })).toBeVisible()

    await modalCreate.getByRole('textbox', { name: 'Nama Kategori' }).fill(categoryName)
    await modalCreate.getByRole('textbox', { name: 'Kode Kategori' }).fill(categoryCode)
    await modalCreate.getByRole('textbox', { name: 'Deskripsi' }).fill('Ini adalah kategori baru')
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check()

    await modalCreate.getByRole('button', { name: 'Tambah Kategori', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Kode Kategori sudah digunakan. Slug sudah digunakan.')
});

// Empty Field Test
const requiredFields = [
    { name: 'Nama Kategori', role: 'textbox' },
    { name: 'Kode Kategori', role: 'textbox' }
];

for (const field of requiredFields) {
  test(`Add Categories - Failed (${field.name} is empty)`, async ({ page }) => {
    const modalCreate = page.locator('.categories-form-modal');
    await page.getByRole('button', { name: 'Tambah' }).click();

    // Isi field wajib lain dengan data valid.
    await modalCreate.getByRole('textbox', { name: 'Nama Kategori' }).fill('Kategori test');
    await modalCreate.getByRole('textbox', { name: 'Kode Kategori' }).fill('KTS');

    // Kosongkan field yang sedang diuji.
    const targetField = modalCreate.getByRole(field.role, { name: field.name, exact: field.exact });

    await targetField.fill('');

    await modalCreate.getByRole('button', {name: 'Tambah Kategori',exact: true}).click();
    expect(await targetField.evaluate((input) => input.validity.valid)).toBe(false);
  });
}

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
});

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

    await expect(page.getByRole('alert')).toContainText('Kode Kategori sudah digunakan. Slug sudah digunakan.')
});

test('Delete Categories - Success', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Tes Ganti' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Hapus Kategori' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus kategori?' })).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus kategori', exact: true }).click()
});

test('Delete Categories - Failed (Used)', async ({ page }) =>{
    const categoryRow = page.getByRole('row').filter({ hasText: 'Makanan' })

    await expect(categoryRow).toHaveCount(1)
    await categoryRow.getByRole('button', { name: 'Hapus Kategori' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus kategori?' })).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus kategori', exact: true }).click()

    await expect(page.getByRole('alert')).toContainText('Kategori tidak dapat dihapus karena masih memiliki produk')
});

test('Open tab Terhapus', async ({ page }) => {
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kategori Produk' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Kategori' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Kode Kategori' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Slug' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Deskripsi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible();

    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan kategori' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toHaveText('10');
    await expect(page.getByRole('button', {name: 'Go to previous page',})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Go to next page'})).toBeVisible();
});

test('Restore category data', async ({ page }) =>{
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');
    const categoryRow = page.getByRole('row').filter({ hasText: 'Kategori Terhapus 1' })

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan kategori' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await categoryRow.getByRole('button', { name: 'Pulihkan kategori' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Kategori ini akan kembali muncul di daftar kategori aktif.');

    await dialog.getByRole('button', { name: 'Pulihkan kategori' }).click();
    await expect(page.getByRole('alert')).toContainText('Kategori berhasil dipulihkan.');
});

test('Delete data permanently', async ({ page }) =>{
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');
    const categoryRow = page.getByRole('row').filter({ hasText: 'Kategori Terhapus 2' })

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan kategori' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await categoryRow.getByRole('button', { name: 'Hapus permanen' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Data kategori akan dihapus selamanya dan tidak dapat dipulihkan.');

    await dialog.getByRole('button', { name: 'Hapus permanen' }).click();
    await expect(page.getByRole('alert')).toContainText('Kategori dihapus permanen.');
});
