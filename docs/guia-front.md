# Prompt para construir o front-end React — Plataforma de Educação Ambiental

Nov 25, 2026 · @Compware

## 1. Contexto e objectivo

Copia o texto deste documento, das secções 1 a 8, para o agente de código (Claude Code, Cursor ou equivalente). Está escrito como instruções directas para ele.

> **Papel.** És um engenheiro front-end sénior. Vais construir, de raiz, o cliente web da **Plataforma de Educação Ambiental do Bairro dos Navegantes**, em React + TypeScript, a consumir a API Laravel 13 que já existe (`/api/v1`, MySQL 8, tokens Sanctum).

**O produto.** Uma plataforma comunitária para ensinar e mobilizar os residentes de um bairro em torno de temas ambientais (lixo, saneamento, água, erosão, reciclagem). Tem seis módulos: conteúdos (artigos, dicas, vídeos, infográficos), quizzes de autoavaliação, actividades práticas, reportes de problemas, eventos e campanhas, e a gestão de utilizadores.

**Quem usa.** Visitante sem conta, residente, moderador e administrador. Os três últimos têm áreas próprias; o visitante só vê o site público.

**Regras de produto que não podes quebrar**

- **Sem gamificação**: nada de pontos, distintivos, níveis, rankings ou streaks. O resultado de um quiz é só daquela tentativa.
- **Idioma**: toda a interface em português (PT), com `lang="pt"`; código, nomes de ficheiros e variáveis em inglês.
- **Telemóvel primeiro**: a maioria dos residentes usa o telemóvel, muitas vezes com ligação fraca. Desenha a partir dos 360 px e optimiza o peso das páginas.
- **Conteúdo vem da API**: textos, imagens e destaques são geridos pelo administrador. Nunca escrevas notícias ou imagens fixas no código (só textos de interface).

**Como trabalhar.** Antes de escrever código, lê o MER e a documentação OpenAPI da API. Constrói por fases (secção 8), com um commit por fase, e pergunta só quando uma decisão não puder ser tomada a partir deste documento. Onde o contrato da API for omisso, usa o contrato assumido na secção 5.4 e regista a divergência num ficheiro `docs/api-gaps.md`.

## 2. Stack tecnológica

Usa estas ferramentas, nas versões estáveis mais recentes quando começares (confirma-as no npm e fixa-as no `package.json`). Não acrescentes bibliotecas fora desta lista sem justificar em `docs/decisions.md`.

| Área              | Escolha                                                         | Para quê                                                                                          |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Base              | React 19 + TypeScript (modo `strict`) + Vite                    | SPA rápida; o React Compiler fica activo                                                          |
| Rotas             | TanStack Router (rotas por ficheiros, tipadas)                  | Rotas, `loader`, `beforeLoad` para guardas por papel, parâmetros de pesquisa tipados              |
| Dados do servidor | TanStack Query                                                  | Cache, paginação, mutações, actualizações optimistas, prefetch                                    |
| Formulários       | TanStack Form + Zod                                             | Validação igual à da API, erros 422 mapeados aos campos                                           |
| Tabelas           | TanStack Table (+ TanStack Virtual nas listas longas)           | Listas de gestão com ordenação, filtros e paginação no servidor                                   |
| Estilos           | Tailwind CSS v4 + shadcn/ui (Radix)                             | Componentes acessíveis e personalizáveis, tokens de design em CSS                                 |
| Movimento         | Motion (`motion/react`)                                         | Animações de entrada, layout, gestos, transições de rota                                          |
| Ícones            | `lucide-react`                                                  | Conjunto único de ícones, importados um a um                                                      |
| Mapas             | MapLibre GL (`react-map-gl`)                                    | Localização de reportes (latitude e longitude)                                                    |
| Gráficos          | Recharts                                                        | Painéis do moderador e do administrador                                                           |
| Notificações      | Sonner                                                          | Avisos de sucesso e erro no topo e no centro cores variadas para sucesso, erro, aviso, informacão |
| Datas             | `date-fns` com locale `pt`                                      | Formatos como «ter, 3 de Dezembro, 18h»                                                           |
| HTTP              | `axios`                                                         | Cliente com token, erros normalizados, cancelamento                                               |
| Testes            | Vitest + Testing Library + MSW; Playwright (E2E)                | Componentes, API simulada, fluxos completos                                                       |
| Qualidade         | Biome (lint + formato) ou ESLint + Prettier, Husky, lint-staged | Mesmo estilo em todo o código                                                                     |
| Gestor de pacotes | pnpm                                                            | Instalações rápidas e reprodutíveis                                                               |

**Decisão de renderização.** Começa como SPA em Vite. A página de boas-vindas precisa de aparecer bem em motores de pesquisa e em redes sociais: pré-renderiza (ou serve com meta tags dinâmicas) as páginas públicas. Se isso não chegar, migra para TanStack Start e avisa antes de o fazer.

## 3. Arquitectura e estrutura de pastas

Organiza por funcionalidade (feature), não por tipo de ficheiro: cada módulo do produto é uma pasta autocontida, e só o que é realmente partilhado sobe para `components` ou `lib`.

```text
src/
  app/                 # arranque: providers, router, query client, tema
  routes/              # rotas por ficheiros do TanStack Router
    _public/           # site público (welcome, conteúdos, eventos, casos)
    _auth/             # login, registo, recuperação
    _app/              # área autenticada (residente)
      moderacao/       # moderador
      admin/           # administrador
  features/
    auth/  contents/  quizzes/  activities/  reports/  events/  users/  landing/
      api/             # funções HTTP e query options (queryOptions) da feature
      components/      # componentes só desta feature
      schemas/         # Zod: formulários e respostas
      hooks/
  components/
    ui/                # shadcn/ui
    layout/            # shell público, shell da app, navegação, rodapé
    motion/            # Reveal, Stagger, PageTransition, AnimatedNumber
  lib/                 # http client, formatadores, permissões, utilitários
  styles/              # tokens CSS e Tailwind
  test/                # setup, MSW handlers, factories
```

**Princípios**

1. **Estado do servidor só no TanStack Query**; nunca copies dados da API para um store global. Estado de interface (menu aberto, modal) fica local ou na URL.
2. **A URL é estado**: filtros, página, ordenação e separador activo vivem nos _search params_ tipados do router, para links partilháveis e botão Voltar correcto.
3. **Query keys** geradas por fábricas por feature (`reportKeys.list(filters)`), nunca _strings_ soltas.
4. **Tipos vindos de uma só fonte**: gera os tipos da API a partir da especificação OpenAPI (`openapi-typescript`) e valida as respostas críticas com Zod.
5. **Componentes pequenos e sem lógica de dados**: páginas ligam hooks a componentes de apresentação.
6. **Code splitting por rota** e carregamento _lazy_ das áreas de moderador e administrador, que a maioria dos utilizadores nunca abre.
7. **Permissões** centralizadas em `lib/permissions.ts` (`can('report:assign', user)`); as guardas de rota (`beforeLoad`) e os botões usam a mesma função. O servidor continua a ser a autoridade.

## 4. Design, movimento e interactividade

### 4.1 Identidade visual

- **Tom**: natural, acolhedor e comunitário, sem cara de aplicação corporativa. Fotografia real do bairro sempre que existir.
- **Cor**: paleta ancorada em verdes e azuis de água, com um acento quente (terra ou âmbar) para chamadas à acção. Define-a como _tokens_ CSS (`--color-primary`, `--color-surface`, …) no Tailwind v4 (`@theme`), com **modo claro e escuro** (`prefers-color-scheme` mais um interruptor).
- **Tipografia**: uma família de títulos com carácter e uma de texto muito legível (fontes variáveis, _self-hosted_, `font-display: swap`). Escala fluida com `clamp()`.
- **Forma**: cantos arredondados generosos, sombras suaves, muito espaço em branco; cartões com imagem grande para conteúdos, eventos e actividades.
- **Estados completos em todo o lado**: _loading_ (esqueletos com a forma final), vazio (ilustração e uma acção), erro (mensagem humana e «Tentar de novo»), e offline.

### 4.2 Movimento com Motion

O movimento serve para orientar, não para decorar. Cria primitivas reutilizáveis em `components/motion` e usa-as em vez de repetir _props_.

| Padrão                                            | Onde                                                   | Detalhe                                                    |
| ------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Revelação ao fazer scroll (`whileInView`, `once`) | Secções da página de boas-vindas                       | Subir 16 px com _fade_, 0,4–0,6 s, escalonado entre filhos |
| Parallax subtil (`useScroll`, `useTransform`)     | Imagem do _hero_                                       | Deslocamento máximo de 8%                                  |
| Números animados (`animate`, `useInView`)         | Estatísticas do bairro                                 | Contagem até ao valor, uma só vez                          |
| Transições de página (`AnimatePresence`)          | Mudança de rota                                        | _Fade_ curto, sem bloquear a navegação                     |
| Animação de _layout_ (`layout`, `layoutId`)       | Filtros por categoria, separadores, lista que reordena | Indicador deslizante entre separadores                     |
| Gestos (`whileHover`, `whileTap`, `drag`)         | Cartões, botões, carrossel                             | Resposta táctil imediata                                   |
| Molas (`type: 'spring'`)                          | Menus, modais, _toasts_                                | Natural, sem ressaltos exagerados                          |
| Saída de elementos (`AnimatePresence`)            | Remover foto, fechar painel                            | Não saltam do ecrã                                         |

**Regras obrigatórias**

- Respeita `prefers-reduced-motion`: usa `MotionConfig reducedMotion="user"` na raiz e desliga parallax e contagens.
- Anima só `transform` e `opacity`; nunca largura, altura ou posição. Importa `LazyMotion` com `domAnimation` para reduzir o peso.
- Durações entre 150 e 500 ms; nada de animações em ciclo infinito, excepto indicadores de carregamento.

### 4.3 Ícones com Lucide

- Importa ícones nomeados (`import { Droplets } from 'lucide-react'`), nunca o pacote inteiro.
- Um mapa central `lib/icons.ts` liga conceitos a ícones, para ficarem consistentes: lixo `Trash2`, saneamento `Waves`, água `Droplets`, erosão `Mountain`, reciclagem `Recycle`, reporte `MapPinned`, quiz `CircleHelp`, actividade `Leaf`, evento `CalendarDays`.
- Tamanho e espessura vindos do tema (`size-5`, `strokeWidth={1.75}`); ícones decorativos com `aria-hidden`, e ícones sozinhos em botões com `aria-label`.

### 4.4 Interactividade que se espera

- **Pesquisa e filtros** com resultados em tempo real (_debounce_ de 300 ms) e filtros guardados na URL.
- **Quiz passo a passo**: uma pergunta por ecrã, barra de progresso, resposta com feedback imediato e explicação após submeter, navegação por teclado.
- **Reportar um problema** em assistente de passos: tema, localização no mapa (ou GPS), fotos com pré-visualização e compressão no cliente, revisão e envio; rascunho guardado localmente se a ligação falhar.
- **Seguimento de reporte** como linha temporal vertical com os estados e as notas do moderador.
- **Inscrições** (eventos e actividades) com actualização optimista e vagas restantes visíveis.
- **Carrosséis e galerias** com arrastar, teclado e _lightbox_ para imagens e infográficos.
- **Paleta de comandos** (`Ctrl/⌘ K`) na área autenticada para saltar entre secções.
- **PWA** básico (manifesto e cache dos recursos estáticos), para instalar no telemóvel.

### 4.5 Acessibilidade (não negociável)

Alvo WCAG 2.2 AA: contraste, foco visível, navegação completa por teclado, _skip link_, rótulos em todos os campos, erros ligados ao campo com `aria-describedby`, texto alternativo vindo da API (campo opcional) e _fallback_ descritivo, alvos tácteis de 44 px, e nenhuma informação dada apenas pela cor.

## 5. Ecrã de boas-vindas (site público)

A rota `/` é uma página de apresentação completa, como um site institucional, para quem ainda não tem conta. Tem de convencer um visitante em segundos a ler, participar e criar conta. **Todo o conteúdo e todas as imagens vêm da API**, geridos pelo administrador; o código só define a estrutura.

### 5.1 Secções, por ordem

| #   | Secção              | Conteúdo                                                                                                     | Fonte                                        |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1   | Barra de navegação  | Logo, ligações (Aprender, Actividades, Eventos, Casos resolvidos), Entrar e Criar conta, interruptor de tema | Fixa; muda para fundo sólido ao fazer scroll |
| 2   | _Hero_              | Título, subtítulo, imagem ou vídeo de fundo, duas chamadas à acção (Criar conta, Explorar conteúdos)         | `hero` do admin                              |
| 3   | Números do bairro   | Reportes resolvidos, actividades concluídas, eventos realizados, residentes inscritos, com contagem animada  | `stats` calculadas pela API                  |
| 4   | Temas ambientais    | Cartões das categorias com ícone, descrição e ligação ao filtro                                              | `GET /categories`                            |
| 5   | Em destaque         | Carrossel de conteúdos escolhidos pelo admin (artigos, dicas, vídeos, infográficos) com capa grande          | `featured_contents`                          |
| 6   | Como funciona       | Quatro passos: Aprende, Pratica, Reporta, Participa                                                          | Texto do admin ou fixo de interface          |
| 7   | Próximos eventos    | Três a seis cartões com data, local e vagas, e «Ver todos»                                                   | `upcoming_events`                            |
| 8   | Actividades abertas | Desafios em curso com imagem e prazo                                                                         | `open_activities`                            |
| 9   | Casos resolvidos    | Antes e depois dos reportes públicos, com mapa e zona                                                        | `GET /reports/public`                        |
| 10  | Dicas rápidas       | Faixa com dicas curtas que rodam em _loop_ manual (não automático)                                           | Conteúdos do tipo `dica`                     |
| 11  | Chamada final       | «Junta-te ao bairro» com botão de registo                                                                    | Texto do admin                               |
| 12  | Rodapé              | Contactos, ligações, redes sociais, política de privacidade                                                  | `settings` do admin                          |

### 5.2 Comportamento e movimento

- Cada secção entra com revelação escalonada; o _hero_ tem _parallax_ subtil; os números contam uma vez ao entrar no ecrã.
- Imagens com `loading="lazy"` (excepto a do _hero_, com `fetchpriority="high"`), `srcset` e dimensões declaradas para evitar saltos de layout, e _placeholder_ desfocado enquanto carregam.
- Se uma secção não tiver dados (por exemplo, sem eventos próximos), **não a mostres** ou mostra um estado vazio convidativo; nunca uma secção em branco.
- Esqueletos na primeira carga e dados da página inicial em **uma só chamada** (`GET /public/home`), pré-carregada no `loader` da rota.
- Utilizador já autenticado que abre `/` vê a mesma página, mas a barra mostra «Entrar na minha área» em vez de Entrar e Criar conta.
- Meta tags (`title`, `description`, Open Graph) e dados estruturados vindos do conteúdo.

### 5.3 Páginas públicas ligadas à de boas-vindas

`/aprender` (lista de conteúdos com filtros) e `/aprender/$slug`; `/actividades` e `/actividades/$slug`; `/eventos` e `/eventos/$slug`; `/casos` (reportes públicos com mapa); `/sobre`. O que exigir sessão (resolver quizzes, inscrever-se, reportar) mostra o conteúdo e, no momento da acção, leva ao login e **volta ao mesmo sítio** depois (`redirect` nos _search params_).

### 5.4 Contrato assumido com a API (lacuna a fechar)

O MER actual não tem tabelas para o _hero_, as estatísticas, os destaques nem as definições do site. Assume o contrato abaixo, desenvolve contra um _mock_ MSW e regista a diferença em `docs/api-gaps.md`; o back-end passa a ter de o fornecer.

```json
GET /api/v1/public/home
{
  "hero": { "title": "", "subtitle": "", "image_url": "", "image_alt": "", "video_url": null,
            "primary_cta": { "label": "", "href": "" }, "secondary_cta": { "label": "", "href": "" } },
  "stats": { "reports_resolved": 0, "activities_completed": 0, "events_held": 0, "residents": 0 },
  "categories": [ { "id": 0, "name": "", "slug": "", "description": "" } ],
  "featured_contents": [ { "slug": "", "title": "", "summary": "", "type": "artigo", "cover_url": "", "category": {} } ],
  "upcoming_events": [], "open_activities": [], "resolved_reports": [],
  "tips": [], "how_it_works": [ { "title": "", "text": "", "icon": "" } ],
  "settings": { "site_name": "", "contact_email": "", "social": [], "footer_text": "" }
}
```

O administrador edita estes blocos num ecrã «Site» (secção 6) e escolhe os conteúdos em destaque a partir da lista de conteúdos.

## 6. Áreas por papel

A área autenticada usa um _shell_ com barra lateral no ecrã grande e barra inferior no telemóvel. O menu mostra só o que o papel pode usar. As guardas ficam em `beforeLoad`: sem sessão vai para `/entrar?redirect=…`; papel insuficiente mostra uma página 403 clara.

### 6.1 Residente (`/app`)

| Rota                                                       | Ecrã                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/app`                                                     | Início pessoal: próximas inscrições, reportes em curso, quizzes sugeridos por tema |
| `/app/quizzes`, `/app/quizzes/$id`                         | Lista e resolução passo a passo; resultado e explicações no fim                    |
| `/app/historico`                                           | Tentativas anteriores (só resultado de cada uma, sem pontos acumulados)            |
| `/app/actividades`                                         | As minhas actividades; submeter relato e foto de prova                             |
| `/app/reportes`, `/app/reportes/novo`, `/app/reportes/$id` | Os meus reportes, criar (assistente) e seguimento em linha temporal                |
| `/app/eventos`                                             | As minhas inscrições, cancelar                                                     |
| `/app/perfil`                                              | Nome, telefone, zona, palavra-passe, 2FA (Fortify)                                 |

### 6.2 Moderador (`/moderacao`)

| Rota                                                     | Ecrã                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/moderacao`                                             | Painel: reportes por estado e zona, provas por validar, próximos eventos (gráficos Recharts)     |
| `/moderacao/reportes`, `/moderacao/reportes/$id`         | Tabela com filtros, mapa, atribuir responsável, mudar estado com nota, fotos                     |
| `/moderacao/provas`                                      | Fila de provas de actividades; validar ou rejeitar com nota                                      |
| `/moderacao/conteudos`                                   | CRUD de conteúdos: editor de texto rico, capa, vídeo, estado e publicação                        |
| `/moderacao/quizzes`                                     | Construtor de quizzes: perguntas e opções com ordenação por arrastar e uma correcta por pergunta |
| `/moderacao/actividades`                                 | CRUD de actividades                                                                              |
| `/moderacao/eventos`, `/moderacao/eventos/$id/inscritos` | CRUD de eventos, lista de inscritos e marcar presença                                            |

### 6.3 Administrador (`/admin`)

| Rota                                | Ecrã                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/admin/utilizadores`               | Tabela de utilizadores; mudar papel, activar ou desactivar                                                                               |
| `/admin/zonas`, `/admin/categorias` | Gestão das listas                                                                                                                        |
| `/admin/site`                       | **Editor da página de boas-vindas**: _hero_ (imagem e texto), destaques, passos de «Como funciona», rodapé, com pré-visualização ao vivo |
| `/admin/media`                      | Biblioteca de imagens carregadas, com texto alternativo                                                                                  |

O administrador tem também acesso a tudo o que o moderador faz.

### 6.4 Padrões de ecrãs de gestão

- Tabelas com TanStack Table: ordenação, filtros, paginação e selecção de colunas feitos no servidor, estado na URL.
- Formulários em _drawer_ ou página; confirmação antes de apagar; _toast_ com «Desfazer» quando for possível.
- Carregamento de imagens com arrastar e largar, pré-visualização, barra de progresso, recorte opcional e validação de tipo e tamanho (JPEG, PNG, WebP, até 5 MB).
- Estados com _badges_ de cor **e** texto, nunca só cor.

## 7. Integração com a API

1. **Cliente HTTP único** em `lib/http.ts`: `baseUrl` de `VITE_API_URL`, cabeçalho `Authorization: Bearer`, `Accept: application/json`, cancelamento com `AbortSignal` e normalização de erros num tipo `ApiError` (`status`, `message`, `errors` por campo).
2. **Autenticação**: login e registo devolvem token; guarda-o de forma segura (prefere memória mais _refresh_ do servidor se existir; se a API só dá um token, usa `localStorage` e documenta o risco em `docs/decisions.md`). `GET /me` carrega o utilizador numa _query_ (`meQueryOptions`) usada pelo router em `beforeLoad`. Um 401 limpa a sessão e leva ao login com `redirect`.
3. **Query options por recurso**: cada feature exporta `queryOptions` e _hooks_ de mutação (`useCreateReport`), com _query keys_ em fábrica. Usa `staleTime` de 5 minutos para listas quase estáticas (categorias, zonas) e 30 segundos para listas vivas (reportes, inscrições).
4. **Paginação**: `keepPreviousData` nas tabelas; nos _feeds_ públicos usa `useInfiniteQuery` com o botão «Ver mais».
5. **Mutações**: invalida só as chaves afectadas; usa actualizações optimistas nas inscrições, com _rollback_ em erro.
6. **Erros**: 422 → erros no campo certo do TanStack Form; 401 → login; 403 → página de acesso negado; 404 → página não encontrada; 409 → _toast_ com a mensagem da API; 5xx e rede → _error boundary_ da rota com «Tentar de novo».
7. **Uploads**: `multipart/form-data` com progresso (`XMLHttpRequest` ou `ky` com _stream_), compressão no cliente para até 1600 px de lado maior, e URLs de pré-visualização libertados com `URL.revokeObjectURL`.
8. **Tipos**: gera `api-types.ts` a partir do OpenAPI da API e deriva os tipos dos _schemas_ Zod com `z.infer`. Nunca uses `any`.
9. **Prefetch**: ao passar o rato ou tocar numa ligação de lista, `prefetchQuery` do detalhe; nas rotas públicas, `loader` com `ensureQueryData`.
10. **Ambiente**: `.env.example` com `VITE_API_URL`, `VITE_MAP_STYLE_URL`, `VITE_SITE_URL`; nada de segredos no cliente.
11. **Segurança**: nunca uses `dangerouslySetInnerHTML` com conteúdo da API sem o passar por _sanitização_ (DOMPurify); ligações externas com `rel="noopener noreferrer"`; vídeos incorporados apenas de domínios permitidos.

## 8. Qualidade, ordem de entrega e aceitação

### 8.1 Ordem de entrega

Um commit por fase, com a aplicação a arrancar e os testes a passar no fim de cada uma.

| Fase | Entrega                                                                                             | Critério de conclusão                                             |
| ---- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1    | Projecto Vite, TypeScript estrito, Tailwind, shadcn/ui, tema claro/escuro, Biome, Vitest, MSW, CI   | `pnpm build` e `pnpm test` passam                                 |
| 2    | Cliente HTTP, `ApiError`, TanStack Query, TanStack Router, autenticação, guardas por papel          | Login, logout, 401 e 403 funcionam contra a API                   |
| 3    | Primitivas de Motion, mapa de ícones Lucide, _shells_ público e da app, esqueletos e estados vazios | Catálogo de componentes em `/dev/ui` (só em desenvolvimento)      |
| 4    | **Página de boas-vindas** completa com `GET /public/home` (ou mock)                                 | Lighthouse móvel: desempenho ≥ 90, acessibilidade ≥ 95            |
| 5    | Páginas públicas: conteúdos, actividades, eventos, casos                                            | Filtros na URL, partilha de ligações e meta tags                  |
| 6    | Área do residente: quizzes, reportes (assistente e seguimento), actividades, eventos, perfil        | Fluxos E2E do residente passam                                    |
| 7    | Área do moderador: reportes, provas, conteúdos, quizzes, actividades, eventos                       | Mudar estado de um reporte aparece na linha temporal do residente |
| 8    | Área do administrador: utilizadores, zonas, categorias, **editor do site**, biblioteca de media     | Alterar o _hero_ no admin reflecte-se na página `/`               |
| 9    | Polimento: PWA, desempenho, acessibilidade, SEO, documentação                                       | Checklist abaixo completa                                         |

### 8.2 Testes

- **Unidade e componentes** (Vitest + Testing Library): formulários, permissões, formatadores, componentes de movimento com `reducedMotion`.
- **API simulada** com MSW partilhada entre testes e desenvolvimento, com os mesmos _handlers_.
- **E2E** (Playwright, Chromium e um perfil móvel): visitante → registo → quiz; residente → reporte com foto; moderador → muda estado; administrador → edita o _hero_.
- **Acessibilidade** automatizada (`axe`) nas páginas principais, mais navegação completa por teclado verificada à mão.

### 8.3 Orçamentos de desempenho

- JavaScript inicial da página `/` abaixo de 180 kB comprimidos; áreas de moderador e administrador em _chunks_ separados.
- LCP abaixo de 2,5 s numa ligação 4G simulada; CLS abaixo de 0,1.
- Imagens em WebP ou AVIF com `srcset`; nenhuma imagem acima de 200 kB no primeiro ecrã.

### 8.4 Checklist de aceitação

- [ ] Todo o conteúdo e imagens da página `/` vêm da API e são editáveis pelo administrador
- [ ] Cada papel vê apenas o seu menu e as suas rotas; o servidor continua a ser a autoridade
- [ ] Nenhum elemento de gamificação em lado nenhum
- [ ] Movimento respeita `prefers-reduced-motion`; ícones só de `lucide-react`
- [ ] Estados de carregamento, vazio, erro e offline em todas as listas e formulários
- [ ] Erros 422 aparecem junto do campo certo
- [ ] Telemóvel a 360 px sem scroll horizontal; modo claro e escuro
- [ ] WCAG 2.2 AA verificada; `axe` sem erros graves
- [ ] `docs/api-gaps.md` lista tudo o que foi assumido, para o back-end fechar
- [ ] README com arranque, variáveis, scripts e como correr os testes

### 8.5 O que entregas no fim

O repositório a correr com `pnpm install && pnpm dev`, os testes verdes, o README, `docs/decisions.md` e `docs/api-gaps.md`, e um resumo curto do que ficou por fazer.
