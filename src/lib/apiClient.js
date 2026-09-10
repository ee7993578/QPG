// apiClient — single place that knows how to reach the Spring Boot backend.
// Every service file (authApi, paperApi, schoolApi, templateApi,
// questionBankApi, subscriptionApi) goes through this instead of calling
// fetch/axios directly, so base URL, auth headers, and error/envelope
// handling only need to be right in one place.
//
// Backend response envelope (see ApiResponse.java):
//   { success, message, data, errorCode }
// A few auth endpoints (otp/verify, register/*) return their DTO directly
// (AuthResponse) instead of wrapping it — this client detects both shapes.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const AUTH_STORAGE_KEY = 'papercraft-auth'

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function readToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token || null
  } catch {
    return null
  }
}

// On a 401 the token is no longer valid (expired/rotated) — wipe the local
// session so RequireAuth in App.jsx bounces the user back to /login instead
// of the app looking "logged in" while every call silently fails.
function handleUnauthorized() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) {
        parsed.state.isAuthenticated = false
        parsed.state.token = null
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
      }
    }
  } catch {
    // ignore — worst case the user has to log out manually
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

async function request(path, { method = 'GET', body, auth = true, params } = {}) {
  let url = `${BASE_URL}${path}`
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    throw new ApiError(
      'Cannot reach the server. Is the backend running at ' + BASE_URL + '?',
      0,
      null
    )
  }

  const text = await res.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (res.status === 401) {
    handleUnauthorized()
    throw new ApiError(payload?.message || 'Session expired. Please log in again.', 401, payload)
  }

  if (!res.ok) {
    const message = payload?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, payload)
  }

  // Standard ApiResponse<T> envelope.
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    if (!payload.success) {
      throw new ApiError(payload.message || 'Request failed', res.status, payload)
    }
    return payload.data
  }

  // Raw DTO (AuthResponse from /otp/verify, /register/*) — return as-is.
  return payload
}

export const apiClient = {
  get: (path, params, opts) => request(path, { method: 'GET', params, ...opts }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  delete: (path, opts) => request(path, { method: 'DELETE', ...opts }),
}

export { BASE_URL, AUTH_STORAGE_KEY }
