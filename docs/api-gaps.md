# Lacunas entre o guia do frontend e a API

O repositório Laravel está em `../ambiente-api`. As rotas `GET /api/v1/public/home`, `GET /api/v1/admin/site` e `PUT /api/v1/admin/site` estão implementadas no código da API; a migration `site_settings` ainda precisa de ser executada no ambiente de destino. `api-home.patch` é a proposta original usada como base.

## Página inicial

- A API cria uma configuração única para `hero`, `how_it_works`, `settings` e IDs de conteúdos em destaque. Sem configuração, devolve campos vazios e listas vazias; o administrador precisa de preencher a página antes da publicação.
- Estatísticas são calculadas a partir de reportes públicos resolvidos, participações validadas, eventos concluídos e contas de residentes ativas. O guia não define outra regra de contagem.
- `upcoming_events`, `open_activities`, `resolved_reports` e `tips` usam dados existentes. Actividades não têm imagem no MER. Reportes públicos não têm imagens marcadas como “antes” e “depois”; o recurso existente fornece apenas fotos sem essa distinção.
- `hero.image_url` aceita URL HTTPS ou HTTP fornecida pelo administrador. O guia pede biblioteca de media, texto alternativo e variantes WebP/AVIF; ainda não há tabela nem endpoints para isso.
- A API aceita `hero.video_url`, mas o cliente deve aplicar a lista de domínios permitidos antes de incorporar vídeos.

## Outros fluxos ainda sem contrato fechado

- O guia prevê 2FA com Fortify, mas a API atual usa tokens Sanctum e não expõe endpoints de 2FA.
- Pré-renderização, metadados e dados estruturados das páginas públicas dependem de implementação no cliente ou de uma camada de renderização.
- Os formatos de `cover_image` e `cover_url` variam entre recursos da API. É preciso unificar o contrato antes de gerar os tipos OpenAPI do cliente.
