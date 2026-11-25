import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, createRoute, createRouter, redirect, Outlet, Link } from '@tanstack/react-router'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AppLayout, Dashboard, ForbiddenPage } from '../components/layout/AppLayout'
import { AuthPage } from '../features/auth/AuthPages'
import { authKeys, meQueryOptions } from '../features/auth/api'
import { homeQueryOptions } from '../features/landing/api'
import { HomePage } from '../features/landing/HomePage'
import { ListingPage, DetailPage, type ListSearch } from '../features/public/PublicPages'
import { SiteEditor } from '../features/site/SiteEditor'
import { getToken } from '../lib/http'
import { can } from '../lib/permissions'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: () => <Outlet />, notFoundComponent: () => <div className="container state-panel"><h1>Página não encontrada</h1><Link to="/" className="button">Voltar ao início</Link></div> })

const publicRoute = createRoute({ getParentRoute: () => rootRoute, id: '_public', component: PublicLayout })
const homeRoute = createRoute({ getParentRoute: () => publicRoute, path: '/', component: HomePage, loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions) })

const listSearch = (search: Record<string, unknown>): ListSearch => ({
  page: Math.max(1, Number(search.page) || 1),
  search: typeof search.search === 'string' ? search.search : '',
  category: typeof search.category === 'string' ? search.category : '',
})

const learnRoute = createRoute({ getParentRoute: () => publicRoute, path: '/aprender', validateSearch: listSearch, component: () => <ListingPage kind="contents" filters={learnRoute.useSearch()} routePath="/aprender" /> })
const activitiesRoute = createRoute({ getParentRoute: () => publicRoute, path: '/actividades', validateSearch: listSearch, component: () => <ListingPage kind="activities" filters={activitiesRoute.useSearch()} routePath="/actividades" /> })
const eventsRoute = createRoute({ getParentRoute: () => publicRoute, path: '/eventos', validateSearch: listSearch, component: () => <ListingPage kind="events" filters={eventsRoute.useSearch()} routePath="/eventos" /> })
const casesRoute = createRoute({ getParentRoute: () => publicRoute, path: '/casos', validateSearch: listSearch, component: () => <ListingPage kind="reports/public" filters={casesRoute.useSearch()} routePath="/casos" /> })
const learnDetailRoute = createRoute({ getParentRoute: () => publicRoute, path: '/aprender/$slug', component: () => <DetailPage kind="contents" slug={learnDetailRoute.useParams().slug} /> })
const activityDetailRoute = createRoute({ getParentRoute: () => publicRoute, path: '/actividades/$slug', component: () => <DetailPage kind="activities" slug={activityDetailRoute.useParams().slug} /> })
const eventDetailRoute = createRoute({ getParentRoute: () => publicRoute, path: '/eventos/$slug', component: () => <DetailPage kind="events" slug={eventDetailRoute.useParams().slug} /> })
const aboutRoute = createRoute({ getParentRoute: () => publicRoute, path: '/sobre', component: () => <div className="container inner-page"><p className="eyebrow">Sobre</p><h1>Sobre a plataforma</h1><p>Informações sobre a comunidade serão disponibilizadas em breve.</p></div> })

const authSearch = (search: Record<string, unknown>) => ({ redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') && !search.redirect.startsWith('//') ? search.redirect : '/app' })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/entrar', validateSearch: authSearch, component: () => <AuthPage mode="login" redirect={loginRoute.useSearch().redirect} /> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/registar', validateSearch: authSearch, component: () => <AuthPage mode="register" redirect={registerRoute.useSearch().redirect} /> })
const forbiddenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/acesso-negado', component: ForbiddenPage })

const appRoute = createRoute({ getParentRoute: () => rootRoute, id: '_app', component: AppLayout, beforeLoad: async ({ context, location }) => {
  if (!getToken()) throw redirect({ to: '/entrar', search: { redirect: location.href } })
  try { await context.queryClient.ensureQueryData(meQueryOptions) } catch { context.queryClient.removeQueries({ queryKey: authKeys.me }); throw redirect({ to: '/entrar', search: { redirect: location.href } }) }
} })
const dashboardRoute = createRoute({ getParentRoute: () => appRoute, path: '/app', component: Dashboard })
const moderationRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao', beforeLoad: ({ context }) => { if (!can('reports:moderate', context.queryClient.getQueryData(authKeys.me))) throw redirect({ to: '/acesso-negado' }) }, component: () => <div className="dashboard"><p className="eyebrow">Moderação</p><h1>Área de moderação</h1><p>As ferramentas de gestão serão adicionadas nas próximas fases.</p></div> })
const adminSiteRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/site', beforeLoad: ({ context }) => { if (!can('site:edit', context.queryClient.getQueryData(authKeys.me))) throw redirect({ to: '/acesso-negado' }) }, component: SiteEditor })

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([homeRoute, learnRoute, learnDetailRoute, activitiesRoute, activityDetailRoute, eventsRoute, eventDetailRoute, casesRoute, aboutRoute]),
  loginRoute, registerRoute, forbiddenRoute,
  appRoute.addChildren([dashboardRoute, moderationRoute, adminSiteRoute]),
])

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
export const router = createRouter({ routeTree, context: { queryClient }, defaultPreload: 'intent' })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
