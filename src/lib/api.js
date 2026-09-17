const TOKEN_KEY = 'airepro_training_admin_token';

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function resolveApiUrl(path = '') {
  if (!path) return API_BASE || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  if (options.auth) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
    credentials: API_BASE ? 'include' : 'same-origin',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function fetchTrainingResources() {
  return request('/api/training/resources');
}

export function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: { password },
  });
}

export function adminLogout() {
  return request('/api/admin/logout', { method: 'POST', auth: true });
}

export function fetchAdminDocuments() {
  return request('/api/admin/documents', { auth: true });
}

export function fetchAdminDocument(slug) {
  return request(`/api/admin/documents/${encodeURIComponent(slug)}`, { auth: true });
}

export function createAdminDocument(payload) {
  return request('/api/admin/documents', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export function updateAdminDocument(slug, payload) {
  return request(`/api/admin/documents/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export function deleteAdminDocument(slug) {
  return request(`/api/admin/documents/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    auth: true,
  });
}
