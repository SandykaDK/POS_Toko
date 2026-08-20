const API_URL = '/api';

export async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.message || 'Request failed');
    }

    return payload;
}

export async function fetchList(resource, page = 1, perPage = 20) {
    return apiFetch(`/${resource}?page=${page}&per_page=${perPage}`);
}

export async function fetchOne(resource, id) {
    return apiFetch(`/${resource}/${id}`);
}

export async function createItem(resource, data) {
    return apiFetch(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateItem(resource, id, data) {
    return apiFetch(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteItem(resource, id) {
    return apiFetch(`/${resource}/${id}`, {
        method: 'DELETE',
    });
}
