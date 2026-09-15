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

    await expect(page.getByRole('link', { name: 'Kasir', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Kasir', exact: true }).click();
    await expect(page).toHaveURL('http://tokopos.test/cashier');

    await expect(page.getByRole('heading', { level: 1, name: 'Kasir' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Katalog Produk' })).toBeVisible();
    await expect(page.getByPlaceholder('Cari produk...')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Semua' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Makanan' })).toBeVisible();
    await expect(page.locator('.product-card').first()).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: 'Keranjang' })).toBeVisible();
    await expect(page.getByText('Keranjang kosong')).toBeVisible();
    await expect(page.getByText('Pilih produk untuk mulai transaksi')).toBeVisible();
    await expect(page.getByPlaceholder('Kode diskon')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cek', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Cari pelanggan...')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Metode Pembayaran' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Metode Pembayaran' })).toHaveText('Cash');

    const totalBox = page.locator('.total-box');
    await expect(totalBox.getByText('Subtotal', { exact: true })).toBeVisible();
    await expect(totalBox.getByText('Diskon', { exact: true })).toBeVisible();
    await expect(totalBox.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout', exact: true })).toBeVisible();
});

test('Search product', async ({ page }) =>{
    const searchProduct = 'Racik Bumbu Sayur Asem';
    const productCards = page.locator('.product-card');

    await page.getByPlaceholder('Cari produk...').fill(searchProduct);

    await expect(productCards).toHaveCount(1);
    await expect(productCards.first().locator('h3')).toHaveText(searchProduct);
});

test('Filter products by every category', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const productNames = page.locator('.product-card h3');

    const products = await page.evaluate(async () => {
        const response = await fetch('/api/products?page=1&per_page=100&active=true', {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.getItem('tokopos_token')}`,
            },
        });
        return (await response.json()).data || [];
    });
    const availableProducts = products.filter((product) => Number(product.stock) > 0);
    const tabNames = (await tabs.allTextContents()).map((name) => name.trim());

    for (const tabName of tabNames) {
        const tab = page.getByRole('tab', { name: tabName, exact: true });

        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');

        const expectedNames = availableProducts
            .filter((product) => tabName === 'Semua' || product.category?.name === tabName)
            .map((product) => product.name);

        await expect(productNames).toHaveCount(expectedNames.length);
        await expect(productNames).toHaveText(expectedNames);
    }
});

