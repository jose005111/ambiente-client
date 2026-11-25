import { queryOptions } from '@tanstack/react-query'
import { http } from '../../lib/http'
import { homeSchema } from './schema'

export const homeKeys = { all: ['home'] as const }

export const homeQueryOptions = queryOptions({
  queryKey: homeKeys.all,
  queryFn: async ({ signal }) => homeSchema.parse((await http.get('/public/home', { signal })).data),
  staleTime: 60_000,
})
