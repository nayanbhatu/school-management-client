const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Core API client with token injection and unified error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem('sms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new Error('Unable to connect to the server. Please check your network connection.');
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // If token expired/unauthorized and not on login endpoint
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.dispatchEvent(new CustomEvent('sms:auth-expired'));
    }

    const message = (data && data.message) || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, queryParams = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
  },
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint, body) => request(endpoint, { method: 'DELETE', body }),
  del: (endpoint, body) => request(endpoint, { method: 'DELETE', body })
};

export default api;
