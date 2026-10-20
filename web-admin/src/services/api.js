const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('hadirku_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Respon dari server tidak valid.',
  }));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('hadirku_token');
      localStorage.removeItem('hadirku_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error(data.message || `HTTP Error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (identifier, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    }),

  // Dashboard & Attendance
  getDashboardStats: () => request('/attendance/admin/stats'),
  getTodayMonitoring: () => request('/attendance/admin/today'),
  getAttendanceRecap: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/admin/recap?${query}`);
  },

  // Employees
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees?${query}`);
  },
  createEmployee: (data) =>
    request('/employees', {
      method: 'POST',
      body: data,
    }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, {
      method: 'PUT',
      body: data,
    }),
  deleteEmployee: (id) =>
    request(`/employees/${id}`, {
      method: 'DELETE',
    }),
  resetDevice: (id) =>
    request(`/employees/${id}/reset-device`, {
      method: 'PUT',
    }),

  // Office & Geofence Settings
  getOffice: () => request('/office'),
  updateOffice: (data) =>
    request('/office', {
      method: 'PUT',
      body: data,
    }),

  // Shifts & Schedules
  getShifts: () => request('/shifts'),
  createShift: (data) =>
    request('/shifts', {
      method: 'POST',
      body: data,
    }),
  updateShift: (id, data) =>
    request(`/shifts/${id}`, {
      method: 'PUT',
      body: data,
    }),
  deleteShift: (id) =>
    request(`/shifts/${id}`, {
      method: 'DELETE',
    }),
  assignShift: (data) =>
    request('/shifts/assign', {
      method: 'POST',
      body: data,
    }),

  // Leaves & Permissions
  getLeaves: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves/admin?${query}`);
  },
  updateLeaveStatus: (id, status, rejectionReason = '') =>
    request(`/leaves/${id}/status`, {
      method: 'PUT',
      body: { status, rejectionReason },
    }),
};
