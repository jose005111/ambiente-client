import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { clearToken, getToken, http, setToken } from '../../lib/http'

const userSchema = z.object({
  id: z.number(), name: z.string(), email: z.string(), email_verified_at: z.string().nullable(),
  role: z.object({ name: z.enum(['residente', 'moderador', 'administrador']), label: z.string() }),
  zone: z.object({ id: z.number(), name: z.string() }).nullable(),
})

export type User = z.infer<typeof userSchema>
export const authKeys = { me: ['auth', 'me'] as const }

export const meQueryOptions = queryOptions({
  queryKey: authKeys.me,
  queryFn: async ({ signal }) => userSchema.parse((await http.get('/me', { signal })).data.data),
  enabled: !!getToken(),
  retry: false,
  staleTime: 60_000,
})

export async function login(email: string, password: string): Promise<User> {
  const response = await http.post('/auth/login', { email, password, device_name: 'web' })
  setToken(z.object({ token: z.string() }).parse(response.data).token)
  return userSchema.parse(response.data.data)
}

export async function register(input: { name: string; email: string; password: string; password_confirmation: string; zone_id?: number }): Promise<User> {
  const response = await http.post('/auth/register', input)
  setToken(z.object({ token: z.string() }).parse(response.data).token)
  return userSchema.parse(response.data.data)
}

export async function logout(): Promise<void> {
  try { await http.post('/auth/logout') } finally { clearToken() }
}
