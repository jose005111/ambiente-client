import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, createRoute, createRouter, redirect, Outlet, Link, lazyRouteComponent } from '@tanstack/react-router'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AppLayout, Dashboard, ForbiddenPage } from '../components/layout/AppLayout'
import { AuthPage } from '../features/auth/AuthPages'
import { authKeys, meQueryOptions, type User } from '../features/auth/api'
import { homeQueryOptions } from '../features/landing/api'
import type { ListSearch } from '../features/public/PublicPages'
import { getToken } from '../lib/http'
import { can } from '../lib/permissions'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: () => <Outlet />, notFoundComponent: () => <div className="container state-panel"><h1>Página não encontrada</h1><Link to="/" className="button">Voltar ao início</Link></div> })
const HomePage = lazyRouteComponent(() => import('../features/landing/HomePage'), 'HomePage')
const ListingPage = lazyRouteComponent(() => import('../features/public/PublicPages'), 'ListingPage')
const DetailPage = lazyRouteComponent(() => import('../features/public/PublicPages'), 'DetailPage')
const QuizListPage = lazyRouteComponent(() => import('../features/resident/QuizPages'), 'QuizListPage')
const QuizPlayPage = lazyRouteComponent(() => import('../features/resident/QuizPages'), 'QuizPlayPage')
const QuizHistoryPage = lazyRouteComponent(() => import('../features/resident/QuizPages'), 'QuizHistoryPage')
const MyReportsPage = lazyRouteComponent(() => import('../features/resident/ReportPages'), 'MyReportsPage')
const ReportDetailPage = lazyRouteComponent(() => import('../features/resident/ReportPages'), 'ReportDetailPage')
const NewReportPage = lazyRouteComponent(() => import('../features/resident/ReportPages'), 'NewReportPage')
const MyActivitiesPage = lazyRouteComponent(() => import('../features/resident/AccountPages'), 'MyActivitiesPage')
const MyEventsPage = lazyRouteComponent(() => import('../features/resident/AccountPages'), 'MyEventsPage')
const ProfilePage = lazyRouteComponent(() => import('../features/resident/AccountPages'), 'ProfilePage')
const SiteEditor = lazyRouteComponent(() => import('../features/site/SiteEditor'), 'SiteEditor')
const MediaLibraryPage = lazyRouteComponent(() => import('../features/admin/MediaLibrary'), 'MediaLibraryPage')
const ModerationDashboard = lazyRouteComponent(() => import('../features/moderation/ModerationPages'), 'ModerationDashboard')
const ModerateReportsPage = lazyRouteComponent(() => import('../features/moderation/ModerationPages'), 'ModerateReportsPage')
const ModerateReportDetailPage = lazyRouteComponent(() => import('../features/moderation/ModerationPages'), 'ModerateReportDetailPage')
const ProofQueuePage = lazyRouteComponent(() => import('../features/moderation/ModerationPages'), 'ProofQueuePage')
const QuizBuilderPage = lazyRouteComponent(() => import('../features/moderation/QuizBuilder'), 'QuizBuilderPage')
const ManageContentPage = lazyRouteComponent(() => import('../features/moderation/ManageContent'), 'ManageContentPage')
const ManageActivitiesPage = lazyRouteComponent(() => import('../features/moderation/ManageActivitiesEvents'), 'ManageActivitiesPage')
const ManageEventsPage = lazyRouteComponent(() => import('../features/moderation/ManageActivitiesEvents'), 'ManageEventsPage')
const EventRegistrationsPage = lazyRouteComponent(() => import('../features/moderation/ManageActivitiesEvents'), 'EventRegistrationsPage')
const ResidentsDirectoryPage = lazyRouteComponent(() => import('../features/residents/ResidentPages'), 'ResidentsDirectoryPage')
const ResidentDetailPage = lazyRouteComponent(() => import('../features/residents/ResidentPages'), 'ResidentDetailPage')
const UsersPage = lazyRouteComponent(() => import('../features/admin/AdminPages'), 'UsersPage')
const ReferencesPage = lazyRouteComponent(() => import('../features/admin/AdminPages'), 'ReferencesPage')

const publicRoute = createRoute({ getParentRoute: () => rootRoute, id: '_public', component: PublicLayout })
const homeRoute = createRoute({ getParentRoute: () => publicRoute, path: '/', component: HomePage, loader: async ({ context }) => { try { await context.queryClient.ensureQueryData(homeQueryOptions) } catch { /* HomePage shows the retry state. */ } } })

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
const residentGuard = ({ context }: { context: { queryClient: QueryClient } }) => { if (context.queryClient.getQueryData<User>(authKeys.me)?.role.name === 'moderador') throw redirect({ to: '/acesso-negado' }) }
const dashboardRoute = createRoute({ getParentRoute: () => appRoute, path: '/app', component: Dashboard })
const quizzesRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/quizzes', beforeLoad: residentGuard, component: QuizListPage })
const quizPlayRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/quizzes/$id', beforeLoad: residentGuard, component: () => <QuizPlayPage id={quizPlayRoute.useParams().id} /> })
const historyRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/historico', beforeLoad: residentGuard, component: QuizHistoryPage })
const myReportsRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/reportes', beforeLoad: residentGuard, component: MyReportsPage })
const newReportRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/reportes/novo', beforeLoad: residentGuard, component: NewReportPage })
const reportDetailRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/reportes/$id', beforeLoad: residentGuard, component: () => <ReportDetailPage id={reportDetailRoute.useParams().id} /> })
const myActivitiesRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/actividades', beforeLoad: residentGuard, component: MyActivitiesPage })
const myEventsRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/eventos', beforeLoad: residentGuard, component: MyEventsPage })
const profileRoute = createRoute({ getParentRoute: () => appRoute, path: '/app/perfil', component: ProfilePage })
const moderatorGuard = ({ context }: { context: { queryClient: QueryClient } }) => { if (!can('reports:moderate', context.queryClient.getQueryData(authKeys.me))) throw redirect({ to: '/acesso-negado' }) }
const adminGuard = ({ context }: { context: { queryClient: QueryClient } }) => { if (!can('site:edit', context.queryClient.getQueryData(authKeys.me))) throw redirect({ to: '/acesso-negado' }) }
const moderationRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao', beforeLoad: moderatorGuard, component: ModerationDashboard })
const moderateReportsRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/reportes', beforeLoad: moderatorGuard, component: ModerateReportsPage })
const moderateReportDetailRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/reportes/$id', beforeLoad: moderatorGuard, component: () => <ModerateReportDetailPage id={moderateReportDetailRoute.useParams().id} /> })
const proofQueueRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/provas', beforeLoad: moderatorGuard, component: ProofQueuePage })
const moderateQuizzesRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/quizzes', beforeLoad: moderatorGuard, component: QuizBuilderPage })
const moderateContentsRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/conteudos', beforeLoad: moderatorGuard, component: ManageContentPage })
const moderateActivitiesRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/actividades', beforeLoad: moderatorGuard, component: ManageActivitiesPage })
const moderateEventsRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/eventos', beforeLoad: moderatorGuard, component: ManageEventsPage })
const eventRegistrationsRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/eventos/$id/inscritos', beforeLoad: moderatorGuard, component: () => <EventRegistrationsPage id={eventRegistrationsRoute.useParams().id} /> })
const residentsRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/moradores', beforeLoad: moderatorGuard, validateSearch: (search: Record<string, unknown>) => ({ search: typeof search.search === 'string' ? search.search : '' }), component: () => <ResidentsDirectoryPage initialSearch={residentsRoute.useSearch().search} /> })
const residentDetailRoute = createRoute({ getParentRoute: () => appRoute, path: '/moderacao/moradores/$id', beforeLoad: moderatorGuard, component: () => <ResidentDetailPage id={residentDetailRoute.useParams().id} /> })
const adminSiteRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/site', beforeLoad: adminGuard, component: SiteEditor })
const adminMediaRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/media', beforeLoad: adminGuard, component: MediaLibraryPage })
const usersRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/utilizadores', beforeLoad: adminGuard, component: UsersPage })
const zonesRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/zonas', beforeLoad: adminGuard, component: () => <ReferencesPage kind="zones" /> })
const categoriesRoute = createRoute({ getParentRoute: () => appRoute, path: '/admin/categorias', beforeLoad: adminGuard, component: () => <ReferencesPage kind="categories" /> })

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([homeRoute, learnRoute, learnDetailRoute, activitiesRoute, activityDetailRoute, eventsRoute, eventDetailRoute, casesRoute, aboutRoute]),
  loginRoute, registerRoute, forbiddenRoute,
  appRoute.addChildren([dashboardRoute, quizzesRoute, quizPlayRoute, historyRoute, myReportsRoute, newReportRoute, reportDetailRoute, myActivitiesRoute, myEventsRoute, profileRoute, moderationRoute, moderateReportsRoute, moderateReportDetailRoute, proofQueueRoute, moderateQuizzesRoute, moderateContentsRoute, moderateActivitiesRoute, moderateEventsRoute, eventRegistrationsRoute, residentsRoute, residentDetailRoute, adminSiteRoute, adminMediaRoute, usersRoute, zonesRoute, categoriesRoute]),
])

export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
export const router = createRouter({ routeTree, context: { queryClient }, defaultPreload: 'intent' })

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
