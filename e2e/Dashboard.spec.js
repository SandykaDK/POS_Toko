import { test, expect } from '@playwright/test';
import { apiRequest } from './support.js';

async function login(page) {
    await page.goto('/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
}

test('Open URL', async ({ page }) =>{
    await login(page);
    await expect(page).toHaveURL(new URL('/', page.url()).href)
    await expect(page).toHaveTitle('TokoPOS')
});

test('Dashboard summaries match persisted data and stay within requirement limits', async ({ page }) => {
    await login(page);

    const categoriesResponse = await apiRequest(page, '/categories?page=1&per_page=100');
    expect(categoriesResponse.status).toBe(200);
    const category = categoriesResponse.body.data.find((item) => item.name === 'Minuman');
    expect(category).toBeDefined();

    const productResponse = await apiRequest(page, '/products', {
        method: 'POST',
        body: {
            category_id: category.id,
            product_code: `E2E-${Date.now()}`,
            name: `E2E Low Stock ${Date.now()}`,
            cost_price: 1000,
            selling_price: 1500,
            stock: 3,
            min_stock: 3,
            unit: 'pcs',
            is_active: true,
        },
    });
    expect(productResponse.status).toBe(201);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

    const dashboardResponse = await apiRequest(page, '/dashboard');
    expect(dashboardResponse.status).toBe(200);
    const dashboard = dashboardResponse.body.data;
    const asNumber = async (locator) => Number((await locator.innerText()).replace(/\D/g, ''));
    const statValue = (label) => page.locator('.dashboard-stat-card').filter({ hasText: label }).locator('.dashboard-stat-value');

    expect(await asNumber(statValue('Omzet hari ini'))).toBe(Number(dashboard.stats.sales_today));
    expect(await asNumber(statValue('Transaksi hari ini'))).toBe(Number(dashboard.stats.transactions_today));
    expect(await asNumber(statValue('Rata-rata transaksi'))).toBe(Number(dashboard.stats.average_transaction));
    expect(await asNumber(statValue('Produk aktif'))).toBe(Number(dashboard.stats.active_products));

    expect(dashboard.sales_by_day.length).toBeLessThanOrEqual(7);
    expect(dashboard.top_products.length).toBeLessThanOrEqual(5);
    expect(dashboard.recent_transactions.length).toBeLessThanOrEqual(6);
    expect(dashboard.recent_transactions.every((transaction) => transaction.status === 'completed')).toBe(true);
    expect(dashboard.low_stock_products.some((product) => product.name.startsWith('E2E Low Stock '))).toBe(true);

    await expect(page.locator('.low-stock-list')).toContainText('E2E Low Stock');
    await expect(page.getByRole('link', { name: 'Kelola produk' })).toHaveAttribute('href', '/products');
    await expect(page.getByRole('link', { name: 'Lihat transaksi' })).toHaveAttribute('href', '/transactions');
});

test('Dashboard refreshes every 30 seconds while visible', async ({ page }) => {
    await page.clock.install({ time: new Date() });
    let dashboardRequests = 0;
    await page.route('**/api/dashboard', async (route) => {
        dashboardRequests += 1;
        await route.continue();
    });

    await login(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect.poll(() => dashboardRequests).toBeGreaterThan(0);
    const requestsBeforeRefresh = dashboardRequests;

    await page.clock.fastForward(30_000);
    await expect.poll(() => dashboardRequests).toBeGreaterThan(requestsBeforeRefresh);
});

test('Dashboard displays a useful error when its API fails', async ({ page }) => {
    await login(page);
    await page.route('**/api/dashboard', (route) => route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Dashboard unavailable' }),
    }));

    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.getByRole('alert')).toHaveText('Dashboard unavailable');
});
