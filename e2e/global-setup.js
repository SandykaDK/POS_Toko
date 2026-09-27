import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const databasePath = resolve('storage/framework/testing/e2e.sqlite');

export const e2eEnvironment = {
    ...process.env,
    APP_ENV: 'testing',
    APP_URL: 'http://127.0.0.1:9324',
    APP_CONFIG_CACHE: resolve('storage/framework/testing/e2e-config.php'),
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: databasePath,
    DB_URL: '',
    SESSION_DRIVER: 'array',
    CACHE_STORE: 'array',
    QUEUE_CONNECTION: 'sync',
    MIDTRANS_SERVER_KEY: 'playwright-test-server-key',
    MIDTRANS_BASE_URL: 'http://127.0.0.1:9325',
};

export default async function globalSetup() {
    mkdirSync(dirname(databasePath), { recursive: true });
    writeFileSync(databasePath, '');

    const result = spawnSync('php', ['artisan', 'migrate:fresh', '--seed', '--force'], {
        cwd: process.cwd(),
        env: e2eEnvironment,
        encoding: 'utf8',
    });

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    if (result.error || result.status !== 0) {
        throw result.error || new Error(`E2E database setup failed with exit code ${result.status}.`);
    }
}
