# Cliente da Plataforma de Educação Ambiental

Cliente React e TypeScript para a API Laravel em `../ambiente-api`.

## Arranque

Requer Node.js 22 ou superior e npm. Na pasta `ambiente-cliente`:

```bash
npm install
cp .env.example .env
npm run dev
```

O Vite usa `http://localhost:5173` e encaminha `/api` e `/storage` para `http://127.0.0.1:8000`. Inicie também a API Laravel. Para outro endereço, ajuste `VITE_API_URL` no `.env`; essa variável deve apontar para o prefixo `/api/v1` completo.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm test
npm run preview
```

## Funcionalidades disponíveis

- Página inicial alimentada por `GET /api/v1/public/home`, com secções exibidas quando há dados.
- Listagens e detalhes públicos de conteúdos, actividades e eventos; lista de casos resolvidos.
- Login, registo, sessão Sanctum e guardas por papel.
- Área do residente: quizzes, histórico, reportes com fotos, actividades, inscrições em eventos e perfil.
- Moderação de reportes e provas de actividades; gestão de quizzes, conteúdos, actividades e eventos em modais; lista de inscritos e marcação de presença em eventos.
- Pesquisa de moradores no header e perfil com histórico de quizzes, actividades, eventos e reportes.
- Sidebar agrupado, tabelas com acções Lucide e selects shadcn/ui. A página de actividades mostra “Já inscrito” quando o morador já participa.
- Administração de utilizadores, zonas, categorias e blocos da página inicial.
- Tema claro/escuro e PWA básico para recursos estáticos.

O editor do site fica em `/admin/site`. É preciso iniciar sessão como administrador. A página inicial começa sem texto ou imagens de apresentação até o administrador a configurar.

## Limitações conhecidas

A edição da capa de eventos e conteúdos ainda não está disponível nos formulários. Biblioteca de media, mapa de reportes, 2FA e pré-renderização das páginas públicas também não estão concluídos. Consulte [decisões](docs/decisions.md) e [lacunas da API](docs/api-gaps.md).
