import api from './client'

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ── Users ────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ── Bus Groups ───────────────────────────────────────────
export const groupsApi = {
  list: (params) => api.get('/groups', { params }),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.patch(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
}

// ── Routes & Stops ───────────────────────────────────────
export const routesApi = {
  list: (params) => api.get('/routes', { params }),
  get: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.patch(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),

  // Stops
  addStop: (routeId, data) => api.post(`/routes/${routeId}/stops`, data),
  updateStop: (routeId, stopId, data) => api.patch(`/routes/${routeId}/stops/${stopId}`, data),
  deleteStop: (routeId, stopId) => api.delete(`/routes/${routeId}/stops/${stopId}`),
  reorderStops: (routeId, orderedIds) => api.put(`/routes/${routeId}/stops/reorder`, { orderedIds }),
}

// ── Buses ────────────────────────────────────────────────
export const busesApi = {
  list: (params) => api.get('/buses', { params }),
  get: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.patch(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
  assignRoute: (id, data) => api.post(`/buses/${id}/assign-route`, data),
}
