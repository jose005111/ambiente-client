import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'ambiente:token'

export type ApiError = {
  status: number
  message: string
  errors: Record<string, string[]>
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(undefined, (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
  const status = error.response?.status ?? 0
  if (status === 401) {
    clearToken()
    if (error.config?.url !== '/auth/logout' && !['/entrar', '/registar'].includes(window.location.pathname)) {
      const current = window.location.pathname + window.location.search
      window.location.assign(`/entrar?redirect=${encodeURIComponent(current)}`)
    }
  }
  const normalized: ApiError = {
    status,
    message: error.response?.data?.message || (status === 0 ? 'Sem ligação ao servidor. Verifique a sua internet.' : 'Não foi possível concluir o pedido.'),
    errors: error.response?.data?.errors || {},
  }
  return Promise.reject(normalized)
})

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Ocorreu um erro inesperado.'
}
