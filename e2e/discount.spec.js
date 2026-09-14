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

    await expect(page.getByRole('link', { name: 'Diskon', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Diskon', exact: true }).click();
    await expect(page).toHaveURL('http://tokopos.test/discounts');

    await expect(page.getByRole('heading', { level: 1, name: 'Data Diskon' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Diskon' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah' })).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Kode' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tipe' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nilai' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Min Pembelian' })).toBeVisible();
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
    const discountRow = page.locator('.MuiDataGrid-row');

    await expect(statusFilter).toHaveValue('');
    await expect(statusFilter).toHaveText('Semua Status');

    await statusFilter.click();
    await expect(statusOptions).toHaveText(['Semua Status', 'Aktif', 'Nonaktif']);
    await statusOptions.getByText('Aktif', { exact: true }).click();

    // Check Status Aktif
    await expect(statusFilter).toHaveText('Aktif');
    await expect(discountRow).not.toHaveCount(0);
    await expect.poll(async () => {
        const statuses = await discountRow.locator('.discount-status').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);

    // Check Status Nonaktif
    await statusFilter.click();
    await page.getByRole('listbox').getByRole('option', { name: 'Nonaktif', exact: true }).click();
    await expect(statusFilter).toHaveText('Nonaktif');
    await expect.poll(async () => {
    const statuses = await discountRow
        .locator('.discount-status')
        .allTextContents();

    return statuses.length > 0
        && statuses.every((status) => status.trim() === 'Nonaktif');
    }).toBe(true);
});

test('Open Header Column', async ({ page }) =>{
    const sortableColumns = ['Kode', 'Nama', 'Tipe', 'Nilai', 'Min Pembelian', 'Status'];
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

        await page.getByRole('heading', { name: 'Data Diskon' }).click();
    }

    await aksiHeader.hover();
    await aksiHeader.getByRole('button', { name: 'Aksi column menu' }).click();

    await expect(activeMenu.getByText('Sort by ASC')).not.toBeVisible();
    await expect(activeMenu.getByText('Sort by DESC')).not.toBeVisible();
    await expect(activeMenu.getByText('Filter')).not.toBeVisible();
});

test('Sort ASC/DESC - All sortable columns', async ({ page }) =>{
    const toNumber = (value) => Number(value.replace(/[^\d-]/g, ''));
    const sortableColumns = [
        { name: 'Kode', field: 'code', compare: (previous, current) => previous.localeCompare(current) },
        { name: 'Nama', field: 'name' },
        { name: 'Tipe', field: 'type' },
        { name: 'Nilai', field: 'value', numeric: true },
        { name: 'Min Pembelian', field: 'min_purchase', numeric: true },
        { name: 'Status', field: 'is_active' },
    ];

    for (const { name, field, numeric } of sortableColumns) {
        const columnHeader = page.getByRole('columnheader', { name });
        const cells = page.locator(`.MuiDataGrid-row [data-field="${field}"]`);

        for (const direction of ['ASC', 'DESC']) {
            await columnHeader.hover();
            await columnHeader.getByRole('button', { name: `${name} column menu` }).click();
            await page.getByRole('menu').last().getByText(`Sort by ${direction}`, { exact: true }).click();

            const sort = direction === 'ASC'
                ? { ariaValue: 'ascending', compare: (previous, current) => numeric ? toNumber(previous) <= toNumber(current) : previous.localeCompare(current) <= 0 }
                : { ariaValue: 'descending', compare: (previous, current) => numeric ? toNumber(previous) >= toNumber(current) : previous.localeCompare(current) >= 0 };

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

test('Search Diskon', async ({ page }) =>{
    const rows = page.locator('.MuiDataGrid-row');
    const searchbox = page.getByRole('searchbox', { name: 'Cari Diskon' });
    const discountsCode = page.locator('.MuiDataGrid-row [data-field="dicounts_code"]');

    const initialCodes = (await discountsCode.allTextContents()).map((value) => value.trim());

    await searchbox.fill('Flash');
    await expect(rows.first()).toContainText('Flash');

    await searchbox.fill('');
    await expect(searchbox).toHaveValue('');

    await expect.poll(async () => {
        return (await discountsCode.allTextContents())
            .map((value) => value.trim());
    }).toEqual(initialCodes);
});

test('Test Pagination', async ({ page }) =>{
    const rowsPerPage = page.getByRole('combobox', { name: 'Rows per page:' });

    await rowsPerPage.click();
    await page.getByRole('option', { name: '5', exact: true }).click();

    await expect(rowsPerPage).toHaveText('5');

    await expect(page.locator('.MuiTablePagination-displayedRows')).toHaveText(/1–4 of \d+/);

    await expect(page.locator('.MuiDataGrid-row')).toHaveCount(4);
});

test('Add Discounts - Success', async ({ page }) =>{
    const discountData = {
        code: 'TEST123',
        name: 'Diskon Test',
        description: 'Ini adalah kode diskon baru',
        type: 'percentage',
        value: '15',
        maxDiscount: '1500',
        minPurchase: '25000',
        maxUsage: '50',
        startDate: '2026-09-12',
        endDate: '2026-10-12',
    };
    const modal = page.locator('.discounts-form-modal');
    const discountRow = page.getByRole('row').filter({ hasText: discountData.name });
    const expectedDecimal = (value) => Number(value).toFixed(2);

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Diskon' })).toBeVisible()

    await modal.getByRole('textbox', { name: 'Kode Diskon' }).fill(discountData.code);
    await modal.getByRole('textbox', { name: 'Nama Diskon' }).fill(discountData.name);
    await modal.getByRole('textbox', { name: 'Deskripsi' }).fill(discountData.description);
    await modal.getByRole('combobox', { name: 'Tipe Diskon' }).selectOption(discountData.type);
    await modal.getByRole('spinbutton', { name: 'Nilai Diskon' }).fill(discountData.value);
    await modal.getByRole('spinbutton', { name: 'Diskon Maksimal' }).fill(discountData.maxDiscount);
    await modal.getByRole('spinbutton', { name: 'Pembelian Minimum' }).fill(discountData.minPurchase);
    await modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' }).fill(discountData.maxUsage);
    await modal.locator('#discount_start_date').fill(discountData.startDate);
    await modal.locator('#discount_end_date').fill(discountData.endDate);
    await modal.getByRole('checkbox', { name: 'Aktif' }).check();

    await modal.getByRole('button', { name: 'Tambah Diskon', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon berhasil ditambahkan.');

    await expect(discountRow).toHaveCount(1);
    await discountRow.getByRole('button', { name: 'Edit Diskon' }).click();

    await expect(modal.getByRole('textbox', { name: 'Kode Diskon' })).toHaveValue(discountData.code);
    await expect(modal.getByRole('textbox', { name: 'Nama Diskon' })).toHaveValue(discountData.name);
    await expect(modal.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue(discountData.description);
    await expect(modal.getByRole('combobox', { name: 'Tipe Diskon' })).toHaveValue(discountData.type);
    await expect(modal.getByRole('spinbutton', { name: 'Nilai Diskon' })).toHaveValue(expectedDecimal(discountData.value));
    await expect(modal.getByRole('spinbutton', { name: 'Diskon Maksimal' })).toHaveValue(expectedDecimal(discountData.maxDiscount));
    await expect(modal.getByRole('spinbutton', { name: 'Pembelian Minimum' })).toHaveValue(expectedDecimal(discountData.minPurchase));
    await expect(modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' })).toHaveValue(discountData.maxUsage);
    await expect(modal.locator('#discount_start_date')).toHaveValue(discountData.startDate);
    await expect(modal.locator('#discount_end_date')).toHaveValue(discountData.endDate);
    await expect(modal.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
});

test('Add Discounts - Failed (duplicate entry)', async ({ page }) =>{
    const discountData = {
        code: 'SAVE10',
        name: 'Diskon Test',
        description: 'Ini adalah kode diskon baru',
        type: 'percentage',
        value: '15',
        maxDiscount: '1500',
        minPurchase: '25000',
        maxUsage: '50',
        startDate: '2026-09-12',
        endDate: '2026-10-12',
    };
    const modal = page.locator('.discounts-form-modal');

    await page.getByRole('button', { name: 'Tambah' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Tambah Diskon' })).toBeVisible()

    await modal.getByRole('textbox', { name: 'Kode Diskon' }).fill(discountData.code);
    await modal.getByRole('textbox', { name: 'Nama Diskon' }).fill(discountData.name);
    await modal.getByRole('textbox', { name: 'Deskripsi' }).fill(discountData.description);
    await modal.getByRole('combobox', { name: 'Tipe Diskon' }).selectOption(discountData.type);
    await modal.getByRole('spinbutton', { name: 'Nilai Diskon' }).fill(discountData.value);
    await modal.getByRole('spinbutton', { name: 'Diskon Maksimal' }).fill(discountData.maxDiscount);
    await modal.getByRole('spinbutton', { name: 'Pembelian Minimum' }).fill(discountData.minPurchase);
    await modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' }).fill(discountData.maxUsage);
    await modal.locator('#discount_start_date').fill(discountData.startDate);
    await modal.locator('#discount_end_date').fill(discountData.endDate);
    await modal.getByRole('checkbox', { name: 'Aktif' }).check();

    await modal.getByRole('button', { name: 'Tambah Diskon', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Kode diskon sudah digunakan.');
});

// Empty Field Test
const requiredFields = [
    { name: 'Kode Diskon', role: 'textbox' },
    { name: 'Nama Diskon', role: 'textbox' },
    { name: 'Tipe Diskon', role: 'combobox' },
    { name: 'Nilai Diskon', role: 'spinbutton' },
    { name: 'Pembelian Minimum', role: 'spinbutton' },
    { name: 'Tanggal Mulai', selector: '#discount_start_date' }
];

for (const field of requiredFields) {
  test(`Add Discounts - Failed (${field.name} is empty)`, async ({ page }) => {
    const discountData = {
        code: 'SAVE10',
        name: 'Diskon Test',
        type: 'percentage',
        value: '15',
        minPurchase: '25000',
        startDate: '2026-09-12',
    };
    const modal = page.locator('.discounts-form-modal');
    await page.getByRole('button', { name: 'Tambah' }).click();

    // Isi field wajib lain dengan data valid.
    await modal.getByRole('textbox', { name: 'Kode Diskon' }).fill(discountData.code);
    await modal.getByRole('textbox', { name: 'Nama Diskon' }).fill(discountData.name);
    await modal.getByRole('combobox', { name: 'Tipe Diskon' }).selectOption(discountData.type);
    await modal.getByRole('spinbutton', { name: 'Nilai Diskon' }).fill(discountData.value);
    await modal.getByRole('spinbutton', { name: 'Pembelian Minimum' }).fill(discountData.minPurchase);
    await modal.locator('#discount_start_date').fill(discountData.startDate);

    // Kosongkan field yang sedang diuji.
    const targetField = field.selector
        ? modal.locator(field.selector)
        : modal.getByRole(field.role, { name: field.name, exact: field.exact });

    if (field.role === 'combobox') {
        await targetField.selectOption('');
    } else {
        await targetField.fill('');
    }

    await modal.getByRole('button', {name: 'Tambah Diskon',exact: true}).click();
    expect(await targetField.evaluate((input) => input.validity.valid)).toBe(false);
  });
}

test('Edit Discounts - Success', async ({ page }) =>{
    const discountRow = page.getByRole('row').filter({ hasText: 'HEMAT25' });
    const discountEdited = page.getByRole('row').filter({ hasText: 'TESTEDIT25' });
    const modal = page.locator('.discounts-form-modal');
    const expectedDecimal = (value) => Number(value).toFixed(2);

    const discountData = {
        code: 'HEMAT25',
        name: 'Hemat Belanja',
        description: 'Potongan Rp25.000 untuk pembelian di atas Rp150.000',
        type: 'fixed',
        value: '25000',
        maxDiscount: '',
        minPurchase: '150000',
        maxUsage: '50',
        startDate: '2026-09-13',
        endDate: '2026-10-14',
    };

    const newDiscountData = {
        code: 'TESTEDIT25',
        name: 'Edit test',
        description: 'Ini adalah test edit data untuk diskon',
        type: 'percentage',
        value: '17',
        maxDiscount: '5000',
        minPurchase: '45000',
        maxUsage: '10',
        startDate: '2026-09-15',
        endDate: '2026-10-16',
    };

    await expect(discountRow).toHaveCount(1);

    await discountRow.getByRole('button', { name: 'Edit diskon' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Diskon' })).toBeVisible();

    await expect(modal.getByRole('textbox', { name: 'Kode Diskon' })).toHaveValue(discountData.code);
    await modal.getByRole('textbox', { name: 'Kode Diskon' }).fill(newDiscountData.code);

    await expect(modal.getByRole('textbox', { name: 'Nama Diskon' })).toHaveValue(discountData.name);
    await modal.getByRole('textbox', { name: 'Nama Diskon' }).fill(newDiscountData.name);

    await expect(modal.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue(discountData.description);
    await modal.getByRole('textbox', { name: 'Deskripsi' }).fill(newDiscountData.description);

    await expect(modal.getByRole('combobox', { name: 'Tipe Diskon' })).toHaveValue(discountData.type);
    await modal.getByRole('combobox', { name: 'Tipe Diskon' }).selectOption(newDiscountData.type);

    await expect(modal.getByRole('spinbutton', { name: 'Nilai Diskon' })).toHaveValue(expectedDecimal(discountData.value));
    await modal.getByRole('spinbutton', { name: 'Nilai Diskon' }).fill(newDiscountData.value);

    await expect(modal.getByRole('spinbutton', { name: 'Diskon Maksimal' })).toHaveValue(discountData.maxDiscount);
    await modal.getByRole('spinbutton', { name: 'Diskon Maksimal' }).fill(newDiscountData.maxDiscount);

    await expect(modal.getByRole('spinbutton', { name: 'Pembelian Minimum' })).toHaveValue(expectedDecimal(discountData.minPurchase));
    await modal.getByRole('spinbutton', { name: 'Pembelian Minimum' }).fill(newDiscountData.minPurchase);

    await expect(modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' })).toHaveValue(discountData.maxUsage);
    await modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' }).fill(newDiscountData.maxUsage);

    await expect(modal.locator('#discount_start_date')).toHaveValue(discountData.startDate);
    await modal.locator('#discount_start_date').fill(newDiscountData.startDate);

    await expect(modal.locator('#discount_end_date')).toHaveValue(discountData.endDate);
    await modal.locator('#discount_end_date').fill(newDiscountData.endDate);

    await expect(modal.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
    await modal.getByRole('checkbox', { name: 'Aktif' }).check();

    await modal.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon berhasil diperbarui.');

    await expect(discountEdited).toHaveCount(1);
    await discountEdited.getByRole('button', { name: 'Edit Diskon' }).click();

    await expect(modal.getByRole('textbox', { name: 'Kode Diskon' })).toHaveValue(newDiscountData.code);
    await expect(modal.getByRole('textbox', { name: 'Nama Diskon' })).toHaveValue(newDiscountData.name);
    await expect(modal.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue(newDiscountData.description);
    await expect(modal.getByRole('combobox', { name: 'Tipe Diskon' })).toHaveValue(newDiscountData.type);
    await expect(modal.getByRole('spinbutton', { name: 'Nilai Diskon' })).toHaveValue(expectedDecimal(newDiscountData.value));
    await expect(modal.getByRole('spinbutton', { name: 'Diskon Maksimal' })).toHaveValue(expectedDecimal(newDiscountData.maxDiscount));
    await expect(modal.getByRole('spinbutton', { name: 'Pembelian Minimum' })).toHaveValue(expectedDecimal(newDiscountData.minPurchase));
    await expect(modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' })).toHaveValue(newDiscountData.maxUsage);
    await expect(modal.locator('#discount_start_date')).toHaveValue(newDiscountData.startDate);
    await expect(modal.locator('#discount_end_date')).toHaveValue(newDiscountData.endDate);
    await expect(modal.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
});

test('Edit Discounts - Failed (duplicate entry)', async ({ page }) =>{
    const discountRow = page.getByRole('row').filter({ hasText: 'FLASH75' });
    const modal = page.locator('.discounts-form-modal');
    const expectedDecimal = (value) => Number(value).toFixed(2);

    const discountData = {
        code: 'FLASH75',
        name: 'Flash Sale 75%',
        description: 'Potongan Rp75.000 yang sedang dinonaktifkan',
        type: 'fixed',
        value: '50000',
        maxDiscount: '15000',
        minPurchase: '250000',
        maxUsage: '25',
        startDate: '2026-09-13',
        endDate: '2026-10-14',
    };

    const newDiscountData = {
        code: 'SAVE10',
        name: 'Diskon Lama',
        description: 'Test duplicate entry discounts',
        type: 'percentage',
        value: '15',
        maxDiscount: '30000',
        minPurchase: '75000',
        maxUsage: '100',
        startDate: '2026-09-14',
        endDate: '2026-10-15',
    };

    await expect(discountRow).toHaveCount(1);

    await discountRow.getByRole('button', { name: 'Edit diskon' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Diskon' })).toBeVisible();

    await expect(modal.getByRole('textbox', { name: 'Kode Diskon' })).toHaveValue(discountData.code);
    await modal.getByRole('textbox', { name: 'Kode Diskon' }).fill(newDiscountData.code);

    await expect(modal.getByRole('textbox', { name: 'Nama Diskon' })).toHaveValue(discountData.name);
    await modal.getByRole('textbox', { name: 'Nama Diskon' }).fill(newDiscountData.name);

    await expect(modal.getByRole('textbox', { name: 'Deskripsi' })).toHaveValue(discountData.description);
    await modal.getByRole('textbox', { name: 'Deskripsi' }).fill(newDiscountData.description);

    await expect(modal.getByRole('combobox', { name: 'Tipe Diskon' })).toHaveValue(discountData.type);
    await modal.getByRole('combobox', { name: 'Tipe Diskon' }).selectOption(newDiscountData.type);

    await expect(modal.getByRole('spinbutton', { name: 'Nilai Diskon' })).toHaveValue(expectedDecimal(discountData.value));
    await modal.getByRole('spinbutton', { name: 'Nilai Diskon' }).fill(newDiscountData.value);

    await expect(modal.getByRole('spinbutton', { name: 'Diskon Maksimal' })).toHaveValue(expectedDecimal(discountData.maxDiscount));
    await modal.getByRole('spinbutton', { name: 'Diskon Maksimal' }).fill(newDiscountData.maxDiscount);

    await expect(modal.getByRole('spinbutton', { name: 'Pembelian Minimum' })).toHaveValue(expectedDecimal(discountData.minPurchase));
    await modal.getByRole('spinbutton', { name: 'Pembelian Minimum' }).fill(newDiscountData.minPurchase);

    await expect(modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' })).toHaveValue(discountData.maxUsage);
    await modal.getByRole('spinbutton', { name: 'Maksimal Penggunaan' }).fill(newDiscountData.maxUsage);

    await expect(modal.locator('#discount_start_date')).toHaveValue(discountData.startDate);
    await modal.locator('#discount_start_date').fill(newDiscountData.startDate);

    await expect(modal.locator('#discount_end_date')).toHaveValue(discountData.endDate);
    await modal.locator('#discount_end_date').fill(newDiscountData.endDate);

    await expect(modal.getByRole('checkbox', { name: 'Aktif' })).toBeChecked();
    await modal.getByRole('checkbox', { name: 'Aktif' }).check();

    await modal.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Kode diskon sudah digunakan.');
});

test('Delete Discounts - Success', async ({ page }) =>{
    const discountRow = page.getByRole('row').filter({ hasText: 'FLASH75' })

    await expect(discountRow).toHaveCount(1);
    await discountRow.getByRole('button', { name: 'Hapus Diskon' }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Hapus diskon?' })).toBeVisible();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Hapus diskon', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon berhasil dihapus.');
});

test('Open tab Terhapus', async ({ page }) => {
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Data Diskon' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cari Diskon' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tambah' })).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Kode' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tipe' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Nilai' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Min Pembelian' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible();

    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan diskon' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toHaveText('10');
    await expect(page.getByRole('button', {name: 'Go to previous page',})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Go to next page'})).toBeVisible();
});

test('Restore discounts data', async ({ page }) =>{
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');
    const discountRow = page.getByRole('row').filter({ hasText: 'Diskon Terhapus 1' })

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan diskon' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await discountRow.getByRole('button', { name: 'Pulihkan diskon' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Diskon ini akan kembali muncul di daftar diskon aktif.');

    await dialog.getByRole('button', { name: 'Pulihkan diskon' }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon berhasil dipulihkan.');
});

test('Delete data permanently', async ({ page }) =>{
    const tabTerhapus = page.getByRole('button', { name: 'Terhapus' });
    const rows = page.locator('.MuiDataGrid-row');
    const categoryRow = page.getByRole('row').filter({ hasText: 'Diskon Terhapus 2' })

    await expect(tabTerhapus).toBeVisible();
    await (tabTerhapus).click();

    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i=0; i<rowCount; i++){
        const row = rows.nth(i);
        await expect(row.getByRole('button', { name: 'Pulihkan diskon' })).toBeVisible();
        await expect(row.getByRole('button', { name: 'Hapus permanen' })).toBeVisible();
    }

    await categoryRow.getByRole('button', { name: 'Hapus permanen' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Data diskon akan dihapus selamanya dan tidak dapat dipulihkan.');

    await dialog.getByRole('button', { name: 'Hapus permanen' }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon dihapus permanen.');
});
