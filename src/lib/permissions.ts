import type { User } from '../features/auth/api'

export type Permission = 'site:edit' | 'reports:moderate' | 'content:manage'

export function can(permission: Permission, user: User | null | undefined): boolean {
  if (!user) return false
  if (user.role.name === 'administrador') return true
  return user.role.name === 'moderador' && permission !== 'site:edit'
}
