const TOKEN_KEY = 'airepro_training_token';

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function resolveApiUrl(path = '') {
  if (!path) return API_BASE || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
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

export async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(resolveApiUrl(path), {
    ...options,
    headers,
    credentials: API_BASE ? 'include' : 'same-origin',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    error.code = data?.error;
    throw error;
  }
  return data;
}

export const api = {
  authConfig: () => request('/api/auth/config', { auth: false }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  dashboard: () => request('/api/portal/dashboard'),
  courses: () => request('/api/portal/courses'),
  course: (slug) => request(`/api/portal/courses/${encodeURIComponent(slug)}`),
  completeLesson: (id) =>
    request(`/api/portal/lessons/${encodeURIComponent(id)}/complete`, { method: 'POST' }),
  documents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/portal/documents${qs ? `?${qs}` : ''}`);
  },
  document: (slug) => request(`/api/portal/documents/${encodeURIComponent(slug)}`),
  acknowledgeDocument: (slug) =>
    request(`/api/portal/documents/${encodeURIComponent(slug)}/acknowledge`, { method: 'POST' }),
  sops: (category) =>
    request(`/api/portal/sops${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  trees: () => request('/api/portal/decision-trees'),
  tree: (slug) => request(`/api/portal/decision-trees/${encodeURIComponent(slug)}`),
  search: (q) => request(`/api/portal/knowledge/search?q=${encodeURIComponent(q)}`),
  quizzes: () => request('/api/portal/quizzes'),
  quiz: (slug) => request(`/api/portal/quizzes/${encodeURIComponent(slug)}`),
  submitQuiz: (slug, answers) =>
    request(`/api/portal/quizzes/${encodeURIComponent(slug)}/submit`, {
      method: 'POST',
      body: { answers },
    }),
  certifications: () => request('/api/portal/certifications'),
  announcements: () => request('/api/portal/announcements'),
  ackAnnouncement: (id) =>
    request(`/api/portal/announcements/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' }),
  profile: () => request('/api/portal/profile'),
  adminMeta: () => request('/api/admin/meta'),
  adminDocuments: () => request('/api/admin/documents'),
  adminDocument: (id) => request(`/api/admin/documents/${encodeURIComponent(id)}`),
  adminCreateDocument: (body) =>
    request('/api/admin/documents', { method: 'POST', body }),
  adminUpdateDocument: (id, body) =>
    request(`/api/admin/documents/${encodeURIComponent(id)}`, { method: 'PUT', body }),
  adminDeleteDocument: (id) =>
    request(`/api/admin/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  adminUsers: () => request('/api/admin/users'),
  adminUpdateUser: (id, body) =>
    request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  adminCreateUser: (body) => request('/api/admin/users', { method: 'POST', body }),
  adminCertifications: () => request('/api/admin/certifications'),
  adminRevokeCert: (id, reason) =>
    request(`/api/admin/certifications/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: { reason },
    }),
  adminAnnouncements: () => request('/api/admin/announcements'),
  adminCreateAnnouncement: (body) =>
    request('/api/admin/announcements', { method: 'POST', body }),
};
