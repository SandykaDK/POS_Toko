export async function apiRequest(page, endpoint, { method = 'GET', body } = {}) {
    return page.evaluate(async ({ endpoint, method, body }) => {
        const headers = {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('tokopos_token')}`,
        };

        if (body !== undefined) headers['Content-Type'] = 'application/json';

        const response = await fetch(`/api${endpoint}`, {
            method,
            headers,
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });

        return {
            ok: response.ok,
            status: response.status,
            body: await response.json().catch(() => null),
        };
    }, { endpoint, method, body });
}
