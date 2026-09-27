import { test, expect } from '@playwright/test';
import { apiRequest } from './support.js';

async function openLogin(page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 2, name: 'Masuk ke TokoPOS' })).toBeVisible();
}

async function login(page, { email = 'admin@gmail.com', password = '123', remember = false } = {}) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    if (remember) await page.getByLabel('Ingat saya di perangkat ini').check();
    await page.getByRole('button', { name: 'Masuk' }).click();
}

test('Invalid credentials return the same non-disclosing error', async ({ page }) => {
    await openLogin(page);

    const knownEmailResponse = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/auth/login',
    );
    await login(page, { password: 'wrong-password' });
    expect((await knownEmailResponse).status()).toBe(422);
    const error = await page.getByRole('alert').innerText();
    expect(error).toBe('Email atau password yang dimasukkan salah.');
    expect(await page.evaluate(() => localStorage.getItem('tokopos_token'))).toBeNull();

    const unknownEmailResponse = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/auth/login',
    );
    await login(page, { email: 'unknown@example.test', password: 'wrong-password' });
    expect((await unknownEmailResponse).status()).toBe(422);
    await expect(page.getByRole('alert')).toHaveText(error);
});

test('Protected menus and API stay unavailable without authentication', async ({ page }) => {
    for (const path of ['/', '/cashier', '/products', '/categories', '/customers', '/discounts', '/transactions']) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 2, name: 'Masuk ke TokoPOS' })).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('tokopos_token'))).toBeNull();
    }

    const response = await apiRequest(page, '/products?page=1&per_page=1');
    expect(response.status).toBe(401);
});

test('Remembered login survives reload and logout permits immediate relogin', async ({ page }) => {
    await openLogin(page);
    const loginResponsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/auth/login',
    );
    await login(page, { remember: true });

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    expect(loginResponse.request().postDataJSON().remember).toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('tokopos_token'))).toBeTruthy();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

    const logoutResponsePromise = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/auth/logout',
    );
    await page.getByRole('button', { name: 'Keluar' }).click();
    expect((await logoutResponsePromise).status()).toBe(200);
    await expect(page.getByRole('heading', { level: 2, name: 'Masuk ke TokoPOS' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('tokopos_token'))).toBeNull();
    expect((await apiRequest(page, '/products?page=1&per_page=1')).status).toBe(401);

    await login(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
});

test('Login rejects an invalid email format in the browser', async ({ page }) => {
    await openLogin(page);
    const email = page.getByLabel('Email');
    await email.fill('not-an-email');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();

    expect(await email.evaluate((input) => input.validity.typeMismatch)).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('tokopos_token'))).toBeNull();
});

test('Login is rate limited after five failed attempts', async ({ page }) => {
    test.fail(true, 'Requirement requires five attempts per minute; current route config allows fifty.');
    await openLogin(page);

    let lastResponse;
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const responsePromise = page.waitForResponse((response) =>
            new URL(response.url()).pathname === '/api/auth/login',
        );
        await login(page, { password: `wrong-${attempt}` });
        lastResponse = await responsePromise;
    }

    expect(lastResponse.status()).toBe(429);
});
