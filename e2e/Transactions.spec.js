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

    await expect(page.getByRole('link', { name: 'Riwayat Transaksi', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Riwayat Transaksi', exact: true }).click();
    await expect(page).toHaveURL('http://tokopos.test/transactions');

    await expect(page.getByRole('heading', { level: 1, name: 'Riwayat Transaksi' })).toBeVisible();
    await expect(page.locator('#start-date')).toBeVisible();
    await expect(page.locator('#end-date')).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Invoice' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Pelanggan' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tanggal & Jam' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Diskon' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Metode' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi' })).toBeVisible();

    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Rows per page:'})).toHaveText('10');
    await expect(page.getByRole('button', {name: 'Go to previous page',})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Go to next page'})).toBeVisible();
});

test('Check All Filter', async ({ page }) =>{
    const transactionFilter = {
        startDate: '2026-09-12',
        endDate: '2026-09-15'
    }

    await page.locator('#start-date').fill(transactionFilter.startDate);
    await page.locator('#end-date').fill(transactionFilter.endDate);
    const transactionRow = page.locator('.MuiDataGrid-row');

    await expect(page.locator('#start-date')).toHaveValue(transactionFilter.startDate);
    await expect(page.locator('#end-date')).toHaveValue(transactionFilter.endDate);

    await expect.poll(async () => transactionRow.count()).toBeGreaterThan(0);

    const transactionDates = await transactionRow.locator('.transaction-date').evaluateAll((elements) =>
        elements.map((element) => element.dataset.date),
    );

    expect(transactionDates).toEqual(
        expect.arrayContaining([
            expect.any(String),
        ]),
    );

    for (const transactionDate of transactionDates) {
        expect(transactionDate >= transactionFilter.startDate).toBe(true);
        expect(transactionDate <= transactionFilter.endDate).toBe(true);
    }
});

test('Open Header Column', async ({ page }) =>{
    const sortableColumns = ['Invoice', 'Pelanggan', 'Tanggal & Jam', 'Total', 'Diskon', 'Metode', 'Status'];
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

        await page.getByRole('heading', { name: 'Riwayat Transaksi' }).click();
    }

    await aksiHeader.hover();
    await aksiHeader.getByRole('button', { name: 'Aksi column menu' }).click();

    await expect(activeMenu.getByText('Sort by ASC')).not.toBeVisible();
    await expect(activeMenu.getByText('Sort by DESC')).not.toBeVisible();
    await expect(activeMenu.getByText('Filter')).not.toBeVisible();
});

test('Sort ASC/DESC - All sortable columns', async ({ page }) =>{
    await page.locator('#start-date').fill('2026-09-01');
    await page.locator('#end-date').fill('2026-09-15');

    const sortableColumns = [
        { name: 'Invoice', field: 'invoice_number', type: 'text' },
        { name: 'Pelanggan', field: 'customer_name', type: 'text' },
        { name: 'Tanggal & Jam', field: 'transaction_date', type: 'date' },
        { name: 'Total', field: 'total_amount', type: 'number' },
        { name: 'Diskon', field: 'discount_amount', type: 'number' },
        { name: 'Metode', field: 'payment_method', type: 'text' },
        { name: 'Status', field: 'status', type: 'text' },
    ];

    for (const { name, field, type } of sortableColumns) {
        const columnHeader = page.getByRole('columnheader', { name });
        const cells = page.locator(`.MuiDataGrid-row [data-field="${field}"]`);

        for (const direction of ['ASC', 'DESC']) {
            await columnHeader.hover();
            await columnHeader.getByRole('button', { name: `${name} column menu` }).click();
            await page.getByRole('menu').last().getByText(`Sort by ${direction}`, { exact: true }).click();

            const compareValues = (previous, current) => {
                if (type === 'number') {
                    return Number(previous.replace(/[^\d-]/g, '')) - Number(current.replace(/[^\d-]/g, ''));
                }

                return previous.localeCompare(current);
            };
            const sort = direction === 'ASC'
                ? { ariaValue: 'ascending', compare: (previous, current) => compareValues(previous, current) <= 0 }
                : { ariaValue: 'descending', compare: (previous, current) => compareValues(previous, current) >= 0 };

            await expect(columnHeader).toHaveAttribute('aria-sort', sort.ariaValue);
            await expect(columnHeader.locator('.MuiDataGrid-sortIcon')).toBeVisible();

            await expect.poll(async () => {
                const values = type === 'date'
                    ? await cells.locator('.transaction-date').evaluateAll((elements) => elements.map((element) => element.dataset.date))
                    : (await cells.allTextContents()).map((value) => value.trim());

                return values.length > 0 && values.every((value, index) => {
                    return index === 0 || sort.compare(values[index - 1], value);
                });
            }).toBe(true);
        }
    }
});
