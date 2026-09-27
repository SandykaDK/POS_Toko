import { test, expect } from '@playwright/test';
import { apiRequest } from './support.js';

function dateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function getTodayTransactions(page) {
    const today = dateOffset(0);
    const response = await apiRequest(page, `/transactions?start_date=${today}&end_date=${today}`);
    expect(response.status).toBe(200);
    return response.body.data;
}

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    await expect(page).toHaveURL(new URL('/', page.url()).href)
    await expect(page).toHaveTitle('TokoPOS')
};

test.beforeEach(async ({ page }) => {
    await login(page);

    await expect(page.getByRole('link', { name: 'Riwayat Transaksi', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Riwayat Transaksi', exact: true }).click();
    await expect(page).toHaveURL(new URL('/transactions', page.url()).href);

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
        startDate: dateOffset(-5),
        endDate: dateOffset(-1)
    }

    const filteredResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === '/api/transactions'
            && url.searchParams.get('start_date') === transactionFilter.startDate
            && url.searchParams.get('end_date') === transactionFilter.endDate;
    });
    await page.locator('#start-date').fill(transactionFilter.startDate);
    await page.locator('#end-date').fill(transactionFilter.endDate);
    expect((await filteredResponse).ok()).toBe(true);
    const transactionRow = page.locator('.MuiDataGrid-row');

    await expect(page.locator('#start-date')).toHaveValue(transactionFilter.startDate);
    await expect(page.locator('#end-date')).toHaveValue(transactionFilter.endDate);

    await expect.poll(async () => {
        const transactionDates = await transactionRow.locator('.transaction-date').evaluateAll((elements) =>
            elements.map((element) => element.dataset.date),
        );

        return transactionDates.length > 0 && transactionDates.every((transactionDate) =>
            transactionDate >= transactionFilter.startDate && transactionDate <= transactionFilter.endDate,
        );
    }).toBe(true);
});

test('Transaction details match stored items and close with Escape, outside click, and button', async ({ page }) => {
    const transactions = await getTodayTransactions(page);
    expect(transactions.length).toBeGreaterThan(0);
    const transaction = transactions[0];
    const row = page.getByRole('row').filter({ hasText: transaction.invoice_number });
    await expect(row).toHaveCount(1);

    const openDetails = () => row.getByRole('button', { name: 'Lihat detail transaksi' }).click();
    const dialog = page.getByRole('dialog');

    await openDetails();
    await expect(dialog.getByRole('heading', { name: transaction.invoice_number })).toBeVisible();
    await expect(dialog).toContainText(transaction.customer_name);
    await expect(dialog).toContainText(transaction.payment_method);
    for (const item of transaction.transaction_items) {
        await expect(dialog).toContainText(item.product_name);
        await expect(dialog).toContainText(`${item.quantity} x`);
    }
    expect(Number((await dialog.locator('.transaction-detail-total strong').innerText()).replace(/\D/g, '')))
        .toBe(Number(transaction.total_amount));

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    await openDetails();
    await page.locator('.transaction-detail-overlay').click({ position: { x: 2, y: 2 } });
    await expect(dialog).not.toBeVisible();

    await openDetails();
    await dialog.getByRole('button', { name: 'Tutup detail transaksi' }).click();
    await expect(dialog).not.toBeVisible();
});

test('Receipt popup contains transaction data and uses 80 mm paper', async ({ page }) => {
    const transactions = await getTodayTransactions(page);
    expect(transactions.length).toBeGreaterThan(0);
    const transaction = transactions[0];
    const row = page.getByRole('row').filter({ hasText: transaction.invoice_number });

    const popupPromise = page.waitForEvent('popup');
    await row.getByRole('button', { name: 'Cetak transaksi' }).click();
    const popup = await popupPromise;

    await expect(popup.locator('body')).toContainText('TokoPOS');
    await expect(popup.locator('body')).toContainText(transaction.invoice_number);
    await expect(popup.locator('body')).toContainText('Terima kasih telah berbelanja');
    for (const item of transaction.transaction_items) {
        await expect(popup.locator('body')).toContainText(item.product_name);
    }
    expect(await popup.locator('style').innerText()).toContain('size: 80mm auto');
});

test('Receipt reports when the browser blocks its popup', async ({ page }) => {
    const transactions = await getTodayTransactions(page);
    const row = page.getByRole('row').filter({ hasText: transactions[0].invoice_number });
    await page.evaluate(() => { window.open = () => null; });

    await row.getByRole('button', { name: 'Cetak transaksi' }).click();
    await expect(page.getByRole('alert')).toContainText('Jendela cetak tidak dapat dibuka');
});

test('Confirming a pending QRIS payment completes transaction and decrements stock', async ({ page }) => {
    const [productsResponse, customersResponse] = await Promise.all([
        apiRequest(page, '/products?page=1&per_page=100&active=true'),
        apiRequest(page, '/customers?page=1&per_page=100&status=active'),
    ]);
    const product = productsResponse.body.data.find((item) => item.name === 'Masako Rasa Sapi');
    const customer = customersResponse.body.data.find((item) => item.name === 'Pelanggan Umum');
    expect(product).toBeDefined();
    expect(customer).toBeDefined();
    expect(Number(product.stock)).toBeGreaterThan(0);

    const quantity = 1;
    const subtotal = Number(product.selling_price) * quantity;
    const createResponse = await apiRequest(page, '/transactions', {
        method: 'POST',
        body: {
            invoice_number: `INV-E2E-QRIS-${Date.now()}`,
            user_id: 1,
            customer_id: customer.id,
            transaction_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            subtotal,
            discount_amount: 0,
            total_amount: subtotal,
            payment_method: 'qris',
            cash_received: null,
            status: 'pending',
            items: [{ product_id: product.id, quantity, unit_price: product.selling_price, discount_per_item: 0 }],
        },
    });
    expect(createResponse.status).toBe(201);
    const pendingTransaction = createResponse.body.data;
    expect(pendingTransaction.status).toBe('pending');

    await page.reload();
    const row = page.getByRole('row').filter({ hasText: pendingTransaction.invoice_number });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Pending');
    await row.getByRole('button', { name: 'Konfirmasi pembayaran QRIS' }).click();
    await expect(page.getByRole('alert')).toContainText('Pembayaran QRIS berhasil dikonfirmasi.');

    const [transactionResponse, updatedProduct, updatedCustomer] = await Promise.all([
        apiRequest(page, `/transactions/${pendingTransaction.id}`),
        apiRequest(page, `/products/${product.id}`),
        apiRequest(page, `/customers/${customer.id}`),
    ]);
    expect(transactionResponse.body.data.status).toBe('completed');
    expect(transactionResponse.body.data.payments[0].status).toBe('success');
    expect(Number(updatedProduct.body.data.stock)).toBe(Number(product.stock) - quantity);
    expect(Number(updatedCustomer.body.data.purchase_count)).toBe(Number(customer.purchase_count) + 1);
    expect(Number(updatedCustomer.body.data.total_purchases)).toBe(Number(customer.total_purchases) + subtotal);
    await expect(row).toContainText('Selesai');
});

test('Date filters reject reversed ranges and show empty results', async ({ page }) => {
    const startDate = page.locator('#start-date');
    const endDate = page.locator('#end-date');
    const today = dateOffset(0);
    const yesterday = dateOffset(-1);

    await endDate.fill(yesterday);
    await startDate.fill(today);
    expect(await startDate.evaluate((input) => input.validity.rangeOverflow)).toBe(true);

    const emptyStart = dateOffset(-365);
    const emptyEnd = dateOffset(-364);
    const emptyResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === '/api/transactions'
            && url.searchParams.get('start_date') === emptyStart
            && url.searchParams.get('end_date') === emptyEnd;
    });
    await startDate.fill(emptyStart);
    await endDate.fill(emptyEnd);
    expect((await emptyResponse).ok()).toBe(true);
    await expect(page.locator('.MuiDataGrid-overlay')).toBeVisible();
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
    const startDate = dateOffset(-12);
    const endDate = dateOffset(0);
    const filteredResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === '/api/transactions'
            && url.searchParams.get('start_date') === startDate
            && url.searchParams.get('end_date') === endDate;
    });
    await page.locator('#start-date').fill(startDate);
    await page.locator('#end-date').fill(endDate);
    expect((await filteredResponse).ok()).toBe(true);

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
