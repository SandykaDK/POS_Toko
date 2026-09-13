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
        const statuses = await rowProducts.locator('.discount-status').allTextContents();
        return statuses.every((status) => status.trim() === 'Aktif');
    }).toBe(true);

    // Check Status Nonaktif
    await statusFilter.click();
    await page.getByRole('listbox').getByRole('option', { name: 'Nonaktif', exact: true }).click();
    await expect(statusFilter).toHaveText('Nonaktif');
    await expect.poll(async () => {
    const statuses = await rowProducts
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
