import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
})

const isAdminPath = (url?: string) => /\/api\/(admin|leads|kakao\/send)/.test(url ?? '')

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(isAdminPath(config.url) ? 'adminToken' : 'userToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (err) => {
  if (err.response?.status === 401) {
    sessionStorage.removeItem(isAdminPath(err.config?.url) ? 'adminToken' : 'userToken')
  }
  return Promise.reject(err)
})
