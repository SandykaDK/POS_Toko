const API_URL = '/api';

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

export async function apiFetch(endpoint, options = {}) {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken() || '',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (payload.csrf_token) {
        document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', payload.csrf_token);
    }

    if (!response.ok) {
        const error = new Error(payload.message || 'Request failed');
        error.status = response.status;
        error.errors = payload.errors || {};
        throw error;
    }

    return payload;
}

export function login(credentials) {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

export function fetchCurrentUser() {
    return apiFetch('/auth/me');
}

export function logout() {
    return apiFetch('/auth/logout', { method: 'POST' });
}

export async function fetchList(resource, page = 1, perPage = 20, params = {}) {
    const query = new URLSearchParams({ page, per_page: perPage, ...params });
    return apiFetch(`/${resource}?${query.toString()}`);
}

export async function fetchOne(resource, id) {
    return apiFetch(`/${resource}/${id}`);
}

export async function createItem(resource, data) {
    return apiFetch(`/${resource}`, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
}

export async function updateItem(resource, id, data) {
    return apiFetch(`/${resource}/${id}`, {
        method: data instanceof FormData ? 'POST' : 'PUT',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
}

export async function deleteItem(resource, id) {
    return apiFetch(`/${resource}/${id}`, {
        method: 'DELETE',
    });
}

export async function fetchTrashed(resource, page = 1, perPage = 20) {
    return apiFetch(`/${resource}/trashed?page=${page}&per_page=${perPage}`);
}

export async function restoreItem(resource, id) {
    return apiFetch(`/${resource}/${id}/restore`, {
        method: 'PATCH',
    });
}

export async function forceDeleteItem(resource, id) {
    return apiFetch(`/${resource}/${id}/force-delete`, {
        method: 'DELETE',
    });
}
