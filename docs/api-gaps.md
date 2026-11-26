# Lacunas entre o guia do frontend e a API

O repositório Laravel está em `../ambiente-api`. As rotas `GET /api/v1/public/home`, `GET /api/v1/admin/site` e `PUT /api/v1/admin/site` estão implementadas no código da API. O utilizador informou que já executou a migration `site_settings` no ambiente de destino. `api-home.patch` é a proposta original usada como base.

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
- Não existe `GET /roles` nem `role_id` na lista de utilizadores. O ecrã de administração pode activar/desactivar contas, mas ainda não pode oferecer uma escolha de papel sem assumir IDs internos da base de dados.
- `GET /contents`, `GET /activities` e `GET /events`, bem como os respectivos detalhes, agora incluem rascunhos para moderadores e administradores autenticados. Visitantes e residentes continuam a ver apenas os estados públicos. A lista de conteúdos aceita `filter[status]`.
- Não há contrato de biblioteca de media para `/admin/media`. `GET /quizzes/{id}` agora devolve explicações e opções correctas apenas a moderadores e administradores, permitindo editar quizzes existentes.
- `GET /residents?search=...`, `GET /residents/{id}` e `GET /residents/{id}/records?type=...` permitem à equipa localizar moradores e consultar quizzes, actividades, eventos e reportes paginados. O detalhe da actividade inclui `my_participation_status`, e o do evento inclui `my_registration_status` para o utilizador autenticado.
- `ReportUpdateResource` omite `note` para o proprietário do reporte; assim a linha temporal do residente ainda não consegue mostrar as notas deixadas pelo moderador.
- O contrato de `GET /public/home` não inclui o texto da chamada final nem uma página «Sobre» editável. O cliente usa texto de interface nessa área enquanto a API não disponibilizar esses blocos.
- O OpenAPI exportado infere tipos excessivamente estreitos para campos editáveis do site (por exemplo, `hero.title` como string vazia e `cover_url` como `null`); a geração automática de tipos precisa de esquemas explícitos no back-end.
