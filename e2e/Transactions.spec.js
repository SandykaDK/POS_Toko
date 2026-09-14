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
