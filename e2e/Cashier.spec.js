import { test, expect } from '@playwright/test';
import { apiRequest } from './support.js';

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

    await expect(page.getByRole('link', { name: 'Kasir', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Kasir', exact: true }).click();
    await expect(page).toHaveURL(new URL('/cashier', page.url()).href);

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

test('Search product by product name', async ({ page }) =>{
    const searchProduct = 'Racik Bumbu Sayur Asem';
    const productCards = page.locator('.product-card');

    await page.getByPlaceholder('Cari produk...').fill(searchProduct);

    await expect(productCards).toHaveCount(1);
    await expect(productCards.first().locator('h3')).toHaveText(searchProduct);
});

test('Search product by product code', async ({ page }) => {
    const productsResponse = await apiRequest(page, '/products?page=1&per_page=100&active=true');
    const product = productsResponse.body.data.find((item) => item.name === 'Racik Bumbu Sayur Asem');
    expect(product).toBeDefined();

    await page.getByPlaceholder('Cari produk...').fill(product.product_code);

    const productCards = page.locator('.product-card');
    await expect(productCards).toHaveCount(1);
    await expect(productCards.first().locator('h3')).toHaveText(product.name);
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

test('Add to cart (1 product)', async ({ page }) => {
    const productCards = page.locator('.product-card');
    const searchProduct = 'Masako Rasa Sapi';

    await page.getByPlaceholder('Cari produk...').fill(searchProduct);

    await expect(productCards).toHaveCount(1);
    await productCards.first().click();

    await expect(page.locator('.cart-item')).toContainText(searchProduct);
    await expect(page.locator('.qty-value')).toHaveText('1');
});

test('Add to cart (same product)', async ({ page }) =>{
    const productCards = page.locator('.product-card');
    const searchProduct = 'Masako Rasa Sapi';

    await page.getByPlaceholder('Cari produk...').fill(searchProduct);

    await expect(productCards).toHaveCount(1);
    await productCards.first().click();
    await productCards.first().click();

    await expect(page.locator('.cart-item')).toContainText(searchProduct);
    await expect(page.locator('.qty-value')).toHaveText('2');
});

test('Add to cart (2 different products)', async ({ page }) => {
    const productCards = page.locator('.product-card');
    const searchBar = page.getByPlaceholder('Cari produk...');
    const searchProduct1 = 'Masako Rasa Sapi';
    const searchProduct2 = 'Kecap Bango 25g';
    const cartItems = page.locator('.cart-item');

    await searchBar.fill(searchProduct1);
    await expect(productCards).toHaveCount(1);
    await productCards.first().click();

    await searchBar.fill(searchProduct2);
    await expect(productCards).toHaveCount(1);
    await productCards.first().click();
    await productCards.first().click();

    await expect(cartItems).toHaveCount(2);

    const firstCartItem = cartItems.filter({ hasText: searchProduct1 });
    const secondCartItem = cartItems.filter({ hasText: searchProduct2 });

    await expect(firstCartItem).toHaveCount(1);
    await expect(firstCartItem.locator('.qty-value')).toHaveText('1');

    await expect(secondCartItem).toHaveCount(1);
    await expect(secondCartItem.locator('.qty-value')).toHaveText('2');
});

test('Adjust quantity and remove product from cart', async ({ page }) =>{
    const productCards = page.locator('.product-card');
    const searchBar = page.getByPlaceholder('Cari produk...');
    const searchProduct = 'Masako Rasa Sapi';
    const productResponse = await apiRequest(page, '/products?page=1&per_page=100');
    const product = productResponse.body.data.find((item) => item.name === searchProduct);
    expect(product).toBeDefined();

    await searchBar.fill(searchProduct);
    await expect(productCards).toHaveCount(1);
    await productCards.first().click();

    const cartItem = page.locator('.cart-item').filter({ hasText: searchProduct });
    const subtotal = page.locator('.total-row').filter({ hasText: 'Subtotal' }).locator('strong');
    const amount = async () => Number((await subtotal.innerText()).replace(/\D/g, ''));

    await expect(cartItem.locator('.qty-value')).toHaveText('1');
    expect(await amount()).toBe(Number(product.selling_price));

    await cartItem.getByRole('button', { name: '+', exact: true }).click();
    await expect(cartItem.locator('.qty-value')).toHaveText('2');
    expect(await amount()).toBe(Number(product.selling_price) * 2);

    await cartItem.getByRole('button', { name: '-', exact: true }).click();
    await expect(cartItem.locator('.qty-value')).toHaveText('1');
    expect(await amount()).toBe(Number(product.selling_price));

    await cartItem.getByRole('button', { name: '-', exact: true }).click();
    await expect(page.getByText('Keranjang kosong')).toBeVisible();
    expect(await amount()).toBe(0);
});

test('Checkout empty cart is rejected', async ({ page }) => {
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Keranjang masih kosong.');
    await expect(page.getByText('Keranjang kosong')).toBeVisible();
});

test('Checkout without a customer is rejected and keeps cart', async ({ page }) => {
    await page.getByPlaceholder('Cari produk...').fill('Masako Rasa Sapi');
    await page.locator('.product-card').filter({ hasText: 'Masako Rasa Sapi' }).click();
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Silakan pilih pelanggan sebelum checkout.');
    await expect(page.locator('.cart-item')).toContainText('Masako Rasa Sapi');
});

test('Cash payment below total is rejected and cart remains available', async ({ page }) => {
    const productName = 'Masako Rasa Sapi';
    await page.getByPlaceholder('Cari produk...').fill(productName);
    await page.locator('.product-card').filter({ hasText: productName }).click();

    const customerSearch = page.getByPlaceholder('Cari pelanggan...');
    await customerSearch.fill('Pelanggan Umum');
    await page.getByRole('option').filter({ hasText: 'Pelanggan Umum' }).click();
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();

    const paymentDialog = page.getByRole('dialog', { name: 'Pembayaran Cash' });
    const total = Number((await paymentDialog.locator('.cash-payment-total strong').innerText()).replace(/\D/g, ''));
    await paymentDialog.getByLabel('Jumlah uang dibayarkan').fill(String(total - 1));
    await paymentDialog.getByRole('button', { name: 'Simpan Transaksi' }).click();

    await expect(page.getByRole('alert')).toContainText('Jumlah uang dibayarkan harus sama dengan atau lebih dari total.');
    await expect(paymentDialog).toBeVisible();
    await expect(page.locator('.cart-item')).toContainText(productName);
});

test('Inactive products are hidden and rejected by the checkout API', async ({ page }) => {
    const inactiveProducts = await apiRequest(page, '/products?page=1&per_page=100&active=false');
    const product = inactiveProducts.body.data.find((item) => item.name === 'CTM Tablet');
    expect(product).toBeDefined();

    await page.getByPlaceholder('Cari produk...').fill(product.name);
    await expect(page.locator('.product-card')).toHaveCount(0);

    const invoice = `INV-E2E-INACTIVE-${Date.now()}`;
    const createResponse = await apiRequest(page, '/transactions', {
        method: 'POST',
        body: {
            invoice_number: invoice,
            user_id: 1,
            customer_id: null,
            transaction_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            subtotal: 0,
            discount_amount: 0,
            total_amount: 0,
            payment_method: 'cash',
            cash_received: 0,
            status: 'completed',
            items: [{ product_id: product.id, quantity: 1, unit_price: 0, discount_per_item: 0 }],
        },
    });
    expect(createResponse.status).toBe(422);
    expect(createResponse.body.message).toContain('tidak aktif');

    const [updatedProduct, transactions] = await Promise.all([
        apiRequest(page, `/products/${product.id}`),
        apiRequest(page, `/transactions?invoice_number=${invoice}`),
    ]);
    expect(Number(updatedProduct.body.data.stock)).toBe(Number(product.stock));
    expect(transactions.body.data).toHaveLength(0);
});

test('Cash checkout persists transaction and decrements stock', async ({ page }) => {
    const productName = 'Masako Rasa Sapi';
    const productResponse = await apiRequest(page, '/products?page=1&per_page=100');
    const product = productResponse.body.data.find((item) => item.name === productName);
    const customerResponse = await apiRequest(page, '/customers?page=1&per_page=100');
    const customer = customerResponse.body.data.find((item) => item.name === 'Pelanggan Umum');

    expect(product).toBeDefined();
    expect(customer).toBeDefined();
    expect(Number(product.stock)).toBeGreaterThanOrEqual(2);

    const searchBar = page.getByPlaceholder('Cari produk...');
    await searchBar.fill(productName);
    const productCard = page.locator('.product-card').filter({ hasText: productName });
    await expect(productCard).toHaveCount(1);
    await productCard.click();
    await productCard.click();

    const expectedSubtotal = Number(product.selling_price) * 2;
    const total = page.locator('.total-row.total strong');
    await expect.poll(async () => Number((await total.innerText()).replace(/\D/g, ''))).toBe(expectedSubtotal);

    const customerSearch = page.getByPlaceholder('Cari pelanggan...');
    await customerSearch.fill(customer.name);
    await page.getByRole('option').filter({ hasText: customer.name }).click();

    await page.getByRole('button', { name: 'Checkout', exact: true }).click();
    const paymentDialog = page.getByRole('dialog', { name: 'Pembayaran Cash' });
    await expect(paymentDialog).toBeVisible();

    const paidAmount = expectedSubtotal + 1000;
    await paymentDialog.getByLabel('Jumlah uang dibayarkan').fill(String(paidAmount));
    await expect.poll(async () => Number(
        (await paymentDialog.locator('.cash-payment-change strong').innerText()).replace(/\D/g, ''),
    )).toBe(paidAmount - expectedSubtotal);

    const transactionResponsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/transactions'
            && response.request().method() === 'POST',
    );
    await paymentDialog.getByRole('button', { name: 'Simpan Transaksi' }).click();
    const transactionResponse = await transactionResponsePromise;
    expect(transactionResponse.status()).toBe(201);

    const created = (await transactionResponse.json()).data;
    expect(created.invoice_number).toMatch(/^INV-/);
    expect(created.status).toBe('completed');
    expect(Number(created.subtotal)).toBe(expectedSubtotal);
    expect(Number(created.total_amount)).toBe(expectedSubtotal);
    expect(Number(created.cash_received)).toBe(paidAmount);
    expect(Number(created.change_amount)).toBe(1000);
    expect(created.customer_id).toBe(customer.id);
    expect(created.transaction_items).toEqual(expect.arrayContaining([
        expect.objectContaining({ product_id: product.id, quantity: 2 }),
    ]));

    const [persistedTransaction, updatedProduct, updatedCustomer] = await Promise.all([
        apiRequest(page, `/transactions/${created.id}`),
        apiRequest(page, `/products/${product.id}`),
        apiRequest(page, `/customers/${customer.id}`),
    ]);
    expect(persistedTransaction.status).toBe(200);
    expect(persistedTransaction.body.data.invoice_number).toBe(created.invoice_number);
    expect(Number(updatedProduct.body.data.stock)).toBe(Number(product.stock) - 2);
    expect(Number(updatedCustomer.body.data.purchase_count)).toBe(Number(customer.purchase_count) + 1);
    expect(Number(updatedCustomer.body.data.total_purchases)).toBe(Number(customer.total_purchases) + expectedSubtotal);

    await expect(page.getByRole('alert')).toContainText(created.invoice_number);
    await expect(page.getByText('Keranjang kosong')).toBeVisible();
    await expect(page.getByPlaceholder('Kode diskon')).toHaveValue('');
    await expect(customerSearch).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Metode Pembayaran' })).toHaveText('Cash');
    await expect(paymentDialog).not.toBeVisible();
});

test('Percentage discount respects minimum and maximum and clears on cart change', async ({ page }) => {
    const productsResponse = await apiRequest(page, '/products?page=1&per_page=100&active=true');
    const product = productsResponse.body.data.find((item) => item.name === 'Indomie Goreng Jumbo 129g');
    const discountsResponse = await apiRequest(page, '/discounts?page=1&per_page=100');
    const discount = discountsResponse.body.data.find((item) => item.code === 'SAVE10');

    expect(product).toBeDefined();
    expect(discount).toBeDefined();
    const quantity = Math.ceil(Number(discount.min_purchase) / Number(product.selling_price));
    expect(Number(product.stock)).toBeGreaterThanOrEqual(quantity);

    await page.getByPlaceholder('Cari produk...').fill(product.name);
    const card = page.locator('.product-card').filter({ hasText: product.name });
    await expect(card).toHaveCount(1);
    await card.click();

    const cartItem = page.locator('.cart-item').filter({ hasText: product.name });
    for (let index = 1; index < quantity; index += 1) {
        await cartItem.getByRole('button', { name: '+', exact: true }).click();
    }

    const subtotal = Number(product.selling_price) * quantity;
    const uncappedDiscount = subtotal * Number(discount.value) / 100;
    const expectedDiscount = Number(discount.max_discount)
        ? Math.min(uncappedDiscount, Number(discount.max_discount))
        : uncappedDiscount;
    const amount = async (locator) => Number((await locator.innerText()).replace(/\D/g, ''));
    const subtotalValue = page.locator('.total-row').filter({ hasText: 'Subtotal' }).locator('strong');
    const discountValue = page.locator('.total-row').filter({ hasText: 'Diskon' }).locator('strong');
    const totalValue = page.locator('.total-row.total strong');

    expect(await amount(subtotalValue)).toBe(subtotal);
    await page.getByPlaceholder('Kode diskon').fill(discount.code);
    await page.getByRole('button', { name: 'Cek', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Diskon berhasil diterapkan.');
    expect(await amount(discountValue)).toBe(expectedDiscount);
    expect(await amount(totalValue)).toBe(Math.max(subtotal - expectedDiscount, 0));

    await cartItem.getByRole('button', { name: '-', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Subtotal berubah. Silakan cek ulang kode diskon.');
    expect(await amount(discountValue)).toBe(0);
    await expect(page.getByPlaceholder('Kode diskon')).toHaveValue(discount.code);
});

test('QRIS checkout creates a pending payment without reducing stock', async ({ page }) => {
    const productName = 'Masako Rasa Sapi';
    const productsResponse = await apiRequest(page, '/products?page=1&per_page=100&active=true');
    const product = productsResponse.body.data.find((item) => item.name === productName);
    expect(product).toBeDefined();

    await page.getByPlaceholder('Cari produk...').fill(productName);
    const card = page.locator('.product-card').filter({ hasText: productName });
    await expect(card).toHaveCount(1);
    await card.click();

    const customerSearch = page.getByPlaceholder('Cari pelanggan...');
    await customerSearch.fill('Pelanggan Umum');
    await page.getByRole('option').filter({ hasText: 'Pelanggan Umum' }).click();

    const paymentMethod = page.getByRole('combobox', { name: 'Metode Pembayaran' });
    await paymentMethod.click();
    await page.getByRole('option', { name: 'QRIS' }).click();

    const checkoutResponsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/transactions'
            && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.status()).toBe(201);

    const created = (await checkoutResponse.json()).data;
    expect(created.status).toBe('pending');
    expect(created.payment_method).toBe('qris');
    expect(created.payments[0].status).toBe('pending');

    const qrisDialog = page.getByRole('dialog', { name: 'Scan QRIS untuk Membayar' });
    await expect(qrisDialog).toBeVisible();
    await expect(qrisDialog).toContainText(created.invoice_number);
    await expect(qrisDialog.locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/);

    const updatedProduct = await apiRequest(page, `/products/${product.id}`);
    expect(Number(updatedProduct.body.data.stock)).toBe(Number(product.stock));
    await expect(page.getByText('Keranjang kosong')).toBeVisible();

    await qrisDialog.getByRole('button', { name: 'Tutup' }).click();
    await expect(qrisDialog).not.toBeVisible();
});

test('QRIS provider failure rolls back transaction and keeps cart', async ({ page }) => {
    const timestamp = Date.now();
    const categoriesResponse = await apiRequest(page, '/categories?page=1&per_page=100');
    const category = categoriesResponse.body.data.find((item) => item.name === 'Minuman');
    const productName = `E2E QRIS Failure ${timestamp}`;
    const productResponse = await apiRequest(page, '/products', {
        method: 'POST',
        body: {
            category_id: category.id,
            product_code: `E2E-FAIL-${timestamp}`,
            name: productName,
            cost_price: 10,
            selling_price: 13,
            stock: 5,
            min_stock: 1,
            unit: 'pcs',
            is_active: true,
        },
    });
    expect(productResponse.status).toBe(201);
    const product = productResponse.body.data;

    await page.reload();
    await page.getByPlaceholder('Cari produk...').fill(productName);
    await page.locator('.product-card').filter({ hasText: productName }).click();
    const customerSearch = page.getByPlaceholder('Cari pelanggan...');
    await customerSearch.fill('Pelanggan Umum');
    await page.getByRole('option').filter({ hasText: 'Pelanggan Umum' }).click();
    await page.getByRole('combobox', { name: 'Metode Pembayaran' }).click();
    await page.getByRole('option', { name: 'QRIS' }).click();

    const checkoutResponsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/transactions'
            && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();
    const checkoutResponse = await checkoutResponsePromise;
    expect(checkoutResponse.status()).toBe(422);
    expect((await checkoutResponse.json()).message).toContain('Midtrans gagal membuat QRIS');

    const invoice = checkoutResponse.request().postDataJSON().invoice_number;
    const [persistedTransactions, updatedProduct] = await Promise.all([
        apiRequest(page, `/transactions?invoice_number=${invoice}`),
        apiRequest(page, `/products/${product.id}`),
    ]);
    expect(persistedTransactions.body.data).toHaveLength(0);
    expect(Number(updatedProduct.body.data.stock)).toBe(Number(product.stock));
    await expect(page.getByRole('alert')).toContainText('Midtrans gagal membuat QRIS');
    await expect(page.locator('.cart-item')).toContainText(productName);
});
