function resolveApiBase(rawUrl) {
  const cleaned = String(rawUrl || '/api').trim().replace(/\/+$/, '');
  if (!cleaned) return '/api';
  if (/^https?:\/\//i.test(cleaned) && !cleaned.endsWith('/api')) {
    return `${cleaned}/api`;
  }
  return cleaned;
}

const API_BASE = resolveApiBase(import.meta.env.VITE_API_BASE_URL);

const TOKEN_STORAGE_KEY = 'cm_kerala_grievance_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAttachmentUrl(idOrObj) {
  const attachmentId =
    typeof idOrObj === 'object' && idOrObj !== null ? idOrObj._id : idOrObj;
  const token = getStoredToken();
  const base = `${API_BASE}/attachments/${attachmentId}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export async function apiRequest(path, { method = 'GET', body = null, isFormData = false } = {}) {
  const token = getStoredToken();
  const headers = {};

  if (!isFormData && body !== null) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const portalApi = {
  health: () => apiRequest('/health'),
  getPublicOverview: () => apiRequest('/public/overview'),
  getDepartments: () => apiRequest('/departments'),
  submitContact: (data) => apiRequest('/contact', { method: 'POST', body: data }),
  getContactEnquiries: () => apiRequest('/contact'),

  registerCitizen: (data) => apiRequest('/auth/register', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
  getDemoAccounts: () => apiRequest('/auth/demo-accounts'),

  optimizeComplaint: (data) => apiRequest('/ai/optimize-complaint', { method: 'POST', body: data }),
  analyzeGrievance: (data) => apiRequest('/ai/analyze-grievance', { method: 'POST', body: data }),
  reanalyzeGrievance: (id) => apiRequest(`/ai/grievances/${id}/analyze`, { method: 'POST' }),

  trackByReferenceId: (refId) =>
    apiRequest(`/grievances/track/${encodeURIComponent(refId.trim())}`),
  getMyGrievances: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiRequest(`/grievances/my${qs ? `?${qs}` : ''}`);
  },
  submitGrievance: (formData) =>
    apiRequest('/grievances', { method: 'POST', body: formData, isFormData: true }),
  getGrievanceById: (id) => apiRequest(`/grievances/${id}`),
  submitFeedback: (id, data) =>
    apiRequest(`/grievances/${id}/feedback`, { method: 'POST', body: data }),
  reopenGrievance: (id, reason) =>
    apiRequest(`/grievances/${id}/reopen`, { method: 'POST', body: { reason } }),

  getCmoStats: () => apiRequest('/cmo/stats'),
  getCmoOfficers: (departmentId = '') =>
    apiRequest(`/cmo/officers${departmentId ? `?departmentId=${departmentId}` : ''}`),
  getCmoGrievances: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiRequest(`/cmo/grievances${qs ? `?${qs}` : ''}`);
  },
  reviewCmoGrievance: (id, data) =>
    apiRequest(`/cmo/grievances/${id}/review`, { method: 'PATCH', body: data }),
  assignCmoGrievance: (id, data) =>
    apiRequest(`/cmo/grievances/${id}/assign`, { method: 'POST', body: data }),
  escalateCmoGrievance: (id, reason) =>
    apiRequest(`/cmo/grievances/${id}/escalate`, { method: 'PATCH', body: { reason } }),
  updateCmoGrievanceStatus: (id, data) =>
    apiRequest(`/cmo/grievances/${id}/status`, { method: 'PATCH', body: data }),

  getOfficerStats: () => apiRequest('/officer/stats'),
  getOfficerGrievances: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiRequest(`/officer/grievances${qs ? `?${qs}` : ''}`);
  },
  updateOfficerProgress: (id, data) =>
    apiRequest(`/officer/grievances/${id}/progress`, { method: 'PATCH', body: data }),
  submitOfficerActionReport: (id, formData) =>
    apiRequest(`/officer/grievances/${id}/action-report`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),
};
