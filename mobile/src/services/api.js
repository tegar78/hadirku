import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default to computer's local IP address so physical phones on the same WiFi can reach it
const DEFAULT_HOST = '192.168.77.239';
const DEFAULT_PORT = '5050';

export async function getBaseUrl() {
  const customHost = await AsyncStorage.getItem('custom_server_host');
  const host = customHost || DEFAULT_HOST;
  return `http://${host}:${DEFAULT_PORT}/api`;
}

export async function setServerHost(host) {
  if (host) {
    await AsyncStorage.setItem('custom_server_host', host);
  } else {
    await AsyncStorage.removeItem('custom_server_host');
  }
}

async function getToken() {
  return await AsyncStorage.getItem('user_token');
}

async function request(endpoint, options = {}) {
  const baseUrl = await getBaseUrl();
  const token = await getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: 'Respon server tidak valid.',
  }));

  if (!res.ok) {
    throw new Error(data.message || `Error ${res.status}`);
  }

  return data;
}

export const mobileApi = {
  login: async (identifier, password, deviceId) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { identifier, password, deviceId },
    });
    if (res.data?.token) {
      await AsyncStorage.setItem('user_token', res.data.token);
      await AsyncStorage.setItem('user_profile', JSON.stringify(res.data.user));
    }
    return res;
  },

  getTodayStatus: () => request('/attendance/today'),
  getMyHistory: (month, year) => request(`/attendance/my-history?month=${month}&year=${year}`),

  clockIn: (formData) =>
    request('/attendance/clock-in', {
      method: 'POST',
      body: formData,
    }),

  clockOut: (formData) =>
    request('/attendance/clock-out', {
      method: 'POST',
      body: formData,
    }),

  getMyLeaves: () => request('/leaves/my-leaves'),
  submitLeave: (formData) =>
    request('/leaves', {
      method: 'POST',
      body: formData,
    }),
};
