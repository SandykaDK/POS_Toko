import { test, expect } from '@playwright/test';

async function login(page) {
    await page.goto('http://tokopos.test/');
    await page.getByLabel('Email').fill('admin@gmail.com');
    await page.getByLabel('Password').fill('123');
    await page.getByRole('button', { name: 'Masuk' }).click();
}

test.beforeEach(async ({ page }) => {
    await login(page);
});

test('Open URL', async ({ page }) =>{
    await expect(page).toHaveURL('http://tokopos.test/')
    await expect(page).toHaveTitle('TokoPOS')
});
