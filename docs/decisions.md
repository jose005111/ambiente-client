# Decisões de implementação

- **npm:** usado por indicação do utilizador. `package-lock.json` é a fonte de versões reproduzíveis.
- **TanStack Router:** as rotas tipadas foram declaradas em `src/app/router.tsx`. O plugin de rotas por ficheiros não estava disponível no cache npm offline; a separação por páginas e o carregamento lazy continuam activos. A geração por ficheiros pode ser adoptada quando o pacote estiver disponível.
- **Testes:** a dependência de Vitest/MSW não pôde ser resolvida com o cache npm local. `npm test` usa o executor nativo de Node para as permissões e para o contrato crítico da página inicial. E2E e testes de componentes continuam pendentes.
- **Outras bibliotecas do guia:** TanStack Form/Table/Virtual, MapLibre, Recharts, Sonner, date-fns, shadcn/ui e Playwright não estavam disponíveis para instalação offline nesta sessão. Os formulários, listas e datas actuais usam componentes React e APIs nativas; os módulos que precisam de mapas ou gráficos continuam pendentes.
- **Sessão:** a API entrega apenas um token Sanctum e não expõe refresh. O cliente guarda-o em `localStorage` para manter a sessão após recarregar a página. Um script injectado na origem poderia ler esse token; por isso o cliente não interpreta HTML da API e evita conteúdo externo sem sanitização.
- **Conteúdo:** texto recebido da API é apresentado como texto simples. Não se usa `dangerouslySetInnerHTML`; HTML rico precisará de sanitização antes de ser mostrado.
- **Imagens:** `cover_image` de eventos pode ser um caminho de armazenamento; o cliente converte esse caminho em `/storage/...`. Outros recursos já devolvem URL pública.
- **PWA:** o service worker guarda apenas a navegação e recursos estáticos visitados. Respostas da API e fotografias enviadas por utilizadores não são armazenadas offline.
