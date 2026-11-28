# Cobertura dos endpoints pelo frontend

> Atualização de 28/11/2026: os cinco endpoints de Roadmap, as três rotas da galeria, as duas agendas e as duas consultas específicas de proximidade foram integrados. A cobertura atual é **46 consumidos e 5 sem consumo**, de 51 endpoints. Consulte [a timeline de roteiros](roteiros-timeline-2026-11-27.md), [a galeria de fotos](../08-arquitetura-frontend-backend.md#galeria-de-fotos-dos-estabelecimentos--28112026) e [as agendas e a proximidade](../08-arquitetura-frontend-backend.md#agendas-e-consultas-de-proximidade-complementares--28112026). Os números e a lista abaixo preservam o inventário original.

Data da análise: 27/11/2026. Escopo: código atual do repositório, comparando os controllers do backend com as chamadas HTTP do aplicativo em `frontend/src/`.

## Resultado

**51 endpoints de negócio: 34 consumidos no código do frontend e 17 sem consumo identificado.** Cobertura de chamadas: 66,7%.

| Controller | Disponíveis | Consumidos | Sem consumo |
|---|---:|---:|---:|
| Address | 2 | 2 | 0 |
| Category | 4 | 4 | 0 |
| Favorite | 3 | 3 | 0 |
| Host | 15 | 11 | 4 |
| Nearby | 3 | 1 | 2 |
| Programming | 10 | 6 | 4 |
| Roadmap | 5 | 0 | 5 |
| Subscription | 3 | 3 | 0 |
| TravelChat | 1 | 1 | 0 |
| User | 5 | 3 | 2 |
| **Total** | **51** | **34** | **17** |

## Os 17 endpoints sem consumo

Os parâmetros abaixo omitem somente a restrição de rota `:int` para facilitar a leitura.

| Área | Método e rota | Funcionalidade disponível no backend |
|---|---|---|
| Host | `PATCH /api/Host/{hostId}/Delete` | Desativar estabelecimento |
| Host | `GET /api/Host/{hostId}/GetAllHostsPhotos` | Consultar galeria de fotos |
| Host | `POST /api/Host/CreateHostPhoto` | Adicionar foto à galeria |
| Host | `DELETE /api/Host/DeleteHostPhoto/{photoId}` | Remover foto da galeria |
| Nearby | `GET /api/Nearby/GetNearProgramming/{programmingId}` | Proximidade tomando a programação como referência |
| Nearby | `GET /api/Nearby/GetNearHost/{hostId}` | Proximidade tomando o estabelecimento como referência |
| Programming | `GET /api/Programming/GetAllProgrammings` | Listagem geral de programações |
| Programming | `GET /api/Programming/GetUserProgrammingPreferences` | Programações conforme preferências do usuário |
| Programming | `GET /api/Programming/GetAllProgrammingsWithProHost` | Programações de hosts com assinatura Pro |
| Programming | `GET /api/Programming/GetAllTuristProgrammings` | Consulta específica de programações para turistas |
| Roadmap | `POST /api/Roadmap/Create` | Criar roteiro |
| Roadmap | `GET /api/Roadmap/Details/{roadmapId}` | Consultar detalhes de roteiro |
| Roadmap | `GET /api/Roadmap/GetAllRoadmapsByUserId` | Consultar roteiros do usuário |
| Roadmap | `PUT /api/Roadmap/{roadmapId}/Edit` | Editar roteiro |
| Roadmap | `PATCH /api/Roadmap/{roadmapId}/Delete` | Desativar roteiro |
| User | `PUT /api/User/Edit` | Editar conta |
| User | `DELETE /api/User` | Excluir conta |

Referências dos contratos: [HostController](../../backend/Projetos%20-%204/Presentation/Controllers/HostController.cs), [NearbyController](../../backend/Projetos%20-%204/Presentation/Controllers/NearbyController.cs), [ProgrammingController](../../backend/Projetos%20-%204/Presentation/Controllers/ProgrammingController.cs), [RoadmapController](../../backend/Projetos%20-%204/Presentation/Controllers/RoadmapController.cs) e [UserController](../../backend/Projetos%20-%204/Presentation/Controllers/UserController.cs).

## Evidências dos 34 endpoints consumidos

Cada combinação de método e rota é contada uma vez, mesmo se utilizada em várias telas. As linhas indicam evidências no código na data desta análise.

| Área | Métodos e rotas consumidos, relativos a `/api/{Controller}` | Evidências no frontend |
|---|---|---|
| Address (2) | `GET GetByCEP`; `GET GetAllAddress` | `CreateEventScreen.tsx:725,848` |
| Category (4) | `GET GetallCategories`; `GET GetUserCategoriesPreferences`; `POST AddCategoryToUser`; `PUT EditCategoryToUser` | `app/explorar.tsx:439,468,677-678` |
| Favorite (3) | `GET GetAllByUserId`; `POST {programmingId}/Create`; `PATCH {programmingId}/Delete` | `useFavorite.ts:36,66` |
| Host (11) | `GET {hostId}/OpeningHours`; `PUT {hostId}/OpeningHours`; `GET {hostId}/Statistics/Summary`; `GET {hostId}/Statistics/Ranking`; `GET {hostId}/Statistics/Daily`; `GET GetByCNPJ`; `GET Details/{hostId}`; `POST Create`; `PUT {hostId}/Edit`; `GET GetAllHostsbyUserId`; `GET HostFilter` | `app/cadastro_host.tsx:456,550,912,999,1029`; `DashboardScreen.tsx:81,112-114`; `HostDetailsScreen.tsx:79`; `app/comercio.tsx:24` |
| Nearby (1) | `GET GetNearMe` | `nearbyPins.ts:26`; `app/perto_de_voce.tsx:127` |
| Programming (6) | `POST {programmingId}/Interactions`; `GET Filter`; `GET Details/{programmingId}`; `PATCH {hostId}/Delete/{programmingId}`; `PUT {hostId}/Edit/{programmingId}`; `POST {hostId}/Create` | `app/explorar.tsx:259,582`; `CreateEventScreen.tsx:661,1032-1036`; `app/meus_eventos.tsx:327` |
| Subscription (3) | `POST Activate`; `GET MySubscription`; `PATCH Cancel` | `DashboardScreen.tsx:83,136-140` |
| TravelChat (1) | `POST Messages` | `travelChat.ts:24-25` |
| User (3) | `POST auth/Register`; `POST auth/Login`; `GET Profile` | `app/cadastro_host.tsx:968,985`; `app/perfil.tsx:65` |

## Interpretação e integrações parciais

- O chat **Montar roteiro com IA** consome `TravelChat/Messages`. Isso não integra os cinco endpoints de persistência/gestão de `Roadmap`.
- As seções de locais próximos já funcionam pelo endpoint genérico `Nearby/GetNearMe`, com coordenadas de origem. Os dois endpoints específicos continuam sem chamadas; sua ausência não significa que as seções de proximidade estejam ausentes.
- Fotos de capa já aparecem no aplicativo. Isso não equivale ao uso dos três endpoints de galeria de fotos do host.
- O frontend usa `Programming/Filter` e os detalhes do host para obter programações. A ausência de chamada a `GetAllProgrammings` não significa ausência de listagem de eventos. Nem todo endpoint disponível precisa de uma integração adicional se o fluxo já usa outra consulta adequada.
- Categorias preferidas já são consultadas e editadas, mas a consulta específica `GetUserProgrammingPreferences` não é usada.
- Cadastro e login têm chamadas no fluxo de cadastro de host. A contagem não comprova a existência de um fluxo independente e completo de autenticação para cada tipo de usuário.
- A assinatura tem consulta, ativação e cancelamento conectados no código. Isso não comprova checkout com provedor de pagamento; não foram identificados endpoints de checkout nos controllers inventariados.
- Favoritos de estabelecimentos e favoritos de visitantes permanecem locais. Não foram inventados endpoints para essas funcionalidades na contagem.

## Validações realizadas

- Inventário dos atributos HTTP nos dez controllers e conferência do prefixo `api/[controller]`.
- Contagem automatizada das combinações únicas de método e rota: 51, sem duplicatas; conferência de que as 17 rotas apontadas existem nos controllers.
- Busca nas fontes TypeScript/TSX de chamadas HTTP e revisão das rotas/métodos montados dinamicamente, incluindo favoritos, categorias, assinatura, criação e edição de eventos.
- Conferência de `Presentation/Program.cs`: `MapControllers` e `MapOpenApi`, sem endpoints adicionais de negócio por `MapGet/MapPost/MapPut/MapPatch/MapDelete`. O documento OpenAPI de infraestrutura não entra no total.
- Testes, documentação, código do backend e protótipo externo não foram considerados consumidores do aplicativo.

## Implementação e pendências

Esta entrega é uma análise estática e documentação. Nenhum código de frontend/backend, banco, configuração, contrato ou PDF foi alterado.

Não foram executados testes HTTP, build ou fluxos no navegador nesta auditoria. “Consumido” significa que há uma chamada no código da aplicação, não que todas as permissões, respostas, cenários de erro e configurações tenham sido validados em execução. Também não mede cobertura de campos dos DTOs, filtros, paginação ou regras de negócio. A decisão de integrar as 17 rotas depende dos fluxos desejados; esta análise não implementa as integrações.
