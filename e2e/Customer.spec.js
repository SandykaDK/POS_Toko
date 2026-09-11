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

    await expect(page.getByRole('link', { name: 'Pelanggan', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Pelanggan', exact: true }).click();
    await expect(page).toHaveURL('http://tokopos.test/customers');

    await expect(page.getByRole('heading', { level: 1, name: 'Data Pelanggan' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Pelanggan' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah' })).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Telepon' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Alamat' })).toBeVisible();
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
    const rowProducts = page.locator('.MuiDataGrid-row');

    await expect(statusFilter).toHaveValue('');
    await expect(statusFilter).toHaveText('Semua Status');

    await statusFilter.click();
    await expect(statusOptions).toHaveText(['Semua Status', 'Aktif', 'Nonaktif']);
    await statusOptions.getByText('Aktif', { exact: true }).click();

    // Check Status Aktif
    await expect(statusFilter).toHaveText('Aktif');
    await expect(rowProducts).not.toHaveCount(0);
    await expect.poll(async () => {
        const statuses = await rowProducts.locator('.category-status').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);

    // Check Status Nonaktif
    await statusFilter.click();
    await page.getByRole('listbox').getByRole('option', { name: 'Nonaktif', exact: true }).click();
    await expect(statusFilter).toHaveText('Nonaktif');
    await expect.poll(async () => {
    const statuses = await rowProducts
        .locator('.category-status')
        .allTextContents();

    return statuses.length > 0
        && statuses.every((status) => status.trim() === 'Nonaktif');
    }).toBe(true);
});

test('Open Header Column', async ({ page }) =>{
    const sortableColumns = ['Nama', 'Email', 'Telepon', 'Alamat', 'Status'];
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

        await page.getByRole('heading', { name: 'Data Pelanggan' }).click();
    }

    await aksiHeader.hover();
    await aksiHeader.getByRole('button', { name: 'Aksi column menu' }).click();

    await expect(activeMenu.getByText('Sort by ASC')).not.toBeVisible();
    await expect(activeMenu.getByText('Sort by DESC')).not.toBeVisible();
    await expect(activeMenu.getByText('Filter')).not.toBeVisible();
});

test('Sort ASC/DESC - All sortable columns', async ({ page }) =>{
    const sortableColumns = [
        { name: 'Nama', field: 'name' },
        { name: 'Email', field: 'email' },
        { name: 'Telepon', field: 'phone' },
        { name: 'Alamat', field: 'address' },
        { name: 'Status', field: 'status' },
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

test('Search Pelanggan', async ({ page }) =>{
    const rows = page.locator('.MuiDataGrid-row');
    const searchbox = page.getByRole('searchbox', { name: 'Cari Pelanggan' });
    const customersCode = page.locator('.MuiDataGrid-row [data-field="customers_code"]');

    const initialCodes = (await customersCode.allTextContents()).map((value) => value.trim());

    await searchbox.fill('Citra');
    await expect(rows.first()).toContainText('Citra');

    await searchbox.fill('');
    await expect(searchbox).toHaveValue('');

    await expect.poll(async () => {
        return (await customersCode.allTextContents())
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

test('Add Customers - Success', async ({ page }) =>{
    const modalCreate = page.locator('.customers-form-modal');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Pelanggan' })).toBeVisible()

    await modalCreate.getByRole('textbox', { name: 'Nama' }).fill('Sandyka Dwi Kurniawan');
    await modalCreate.getByRole('textbox', { name: 'Email' }).fill('sandyka@gmail.com');
    await modalCreate.getByRole('spinbutton', { name: 'Telepon' }).fill('089917718272');
    await modalCreate.getByRole('textbox', { name: 'Alamat' }).fill('Surabaya');
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalCreate.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Pelanggan berhasil ditambahkan.');
});

test('Add Customers - Failed (duplicate entry)', async ({ page }) =>{
    const modalCreate = page.locator('.customers-form-modal');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Pelanggan' })).toBeVisible()

    await modalCreate.getByRole('textbox', { name: 'Nama' }).fill('Sandyka');
    await modalCreate.getByRole('textbox', { name: 'Email' }).fill('pelanggan@tokopos.net');
    await modalCreate.getByRole('spinbutton', { name: 'Telepon' }).fill('089917718272');
    await modalCreate.getByRole('textbox', { name: 'Alamat' }).fill('Surabaya');
    await modalCreate.getByRole('checkbox', { name: 'Aktif' }).check();

    await modalCreate.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Email sudah digunakan')
});

// Empty Field Test
const requiredFields = [
    { name: 'Nama ', role: 'textbox' },
    { name: 'Email', role: 'textbox' },
    { name: 'Telepon', role: 'spinbutton' },
];

for (const field of requiredFields) {
  test(`Add Customers - Failed (${field.name} is empty)`, async ({ page }) => {
    const modalCreate = page.locator('.customers-form-modal');
    await page.getByRole('button', { name: 'Tambah' }).click();

    // Isi field wajib lain dengan data valid.
    await modalCreate.getByRole('textbox', { name: 'Nama' }).fill('Test empty');
    await modalCreate.getByRole('textbox', { name: 'Email' }).fill('Test@gmail.com');
    await modalCreate.getByRole('spinbutton', { name: 'Telepon' }).fill('089927671926');

    // Kosongkan field yang sedang diuji.
    const targetField = modalCreate.getByRole(field.role, { name: field.name, exact: field.exact });

    await targetField.fill('');

    await modalCreate.getByRole('button', {name: 'Tambah Pelanggan',exact: true}).click();
    expect(await targetField.evaluate((input) => input.validity.valid)).toBe(false);
  });
}



