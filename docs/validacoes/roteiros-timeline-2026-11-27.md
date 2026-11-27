# Roteiros com timeline e inclusão pelo catálogo

Atualização: 27/11/2026.

## Implementação

- A opção Buscar/lupa da navegação do visitante foi substituída por **Roteiro**, direcionando a `/roteiro`. A navegação de gestão do host permanece própria.
- `RoadmapScreen.tsx` mostra seleção dos roteiros da conta, nome, descrição e timeline de paradas de programação e estabelecimento. Permite criar roteiro, consultar a versão salva, editar e excluir com confirmação, além de iniciar outro roteiro com confirmação para descartar alterações pendentes.
- Cada parada abre os detalhes do local/evento, permite retirar a parada e editar início/fim em `DD/MM/AAAA HH:mm`, no fuso de Recife. A ordem acompanha os horários; sobreposições, datas inválidas e visita fora do período conhecido do evento impedem o envio. O backend mantém a validação final de funcionamento dos estabelecimentos e disponibilidade dos destinos.
- O botão **+ Adicionar uma parada** abre uma seleção com estabelecimentos e eventos combináveis, cidade, busca, tipos de estabelecimento e categorias de eventos. Tipos e categorias usam listas somadas no contrato existente; sem seleção específica, a consulta abrange todos. Os resultados têm paginação e ações separadas para consultar e incluir/retirar.
- `RoadmapButton.tsx` compartilha o estado do roteiro por `roadmap.ts`. O botão + fica verde, exibe **Incluído no roteiro**, faz uma animação curta de escala e remove ao clicar novamente. Respeita a preferência de redução de movimento. Uma inclusão busca os detalhes para obter os horários; a retirada não depende da API.
- A ação está nos cards de eventos, estabelecimentos, favoritos e proximidade de Explorar, na busca de comércio, na página de favoritos, no card selecionado e na lista do mapa, nos detalhes e listas públicas de eventos de estabelecimentos, nos locais próximos dos detalhes e nos resultados do chat.
- O chat existente foi preservado em `/roteiro_ia`. A chamada de Explorar e a nova página de roteiro abrem esse endereço. Os resultados do chat também usam o botão compartilhado.
- O rascunho selecionado é compartilhado entre as telas e salvo no armazenamento local do navegador, separado entre visitante e sessão autenticada, sem gravar o JWT nessa coleção. Se o armazenamento não estiver disponível, o estado permanece somente em memória da sessão. Trocar de sessão não mistura os rascunhos.
- Inclusões assíncronas não sobrescrevem uma troca/edição de roteiro ocorrida durante a consulta. Falhas de envio preservam o rascunho; erros de autorização são apresentados ao usuário.

Nenhuma pasta, dependência, backend, contrato, banco, migration ou PDF foi alterado/criado por esta implementação. Foram adicionados arquivos nas pastas existentes do frontend e atualizados os Markdown afetados.

## Contratos consumidos

| Operação da interface | Endpoint existente | Autorização |
|---|---|---|
| Salvar roteiro novo | `POST /api/Roadmap/Create` | Público; usa JWT quando disponível |
| Selecionar/consultar versão salva | `GET /api/Roadmap/Details/{roadmapId}` | Público |
| Listar Meus roteiros | `GET /api/Roadmap/GetAllRoadmapsByUserId` | Conta autenticada |
| Salvar alterações de roteiro próprio | `PUT /api/Roadmap/{roadmapId}/Edit` | Conta proprietária |
| Excluir roteiro próprio | `PATCH /api/Roadmap/{roadmapId}/Delete` | Conta proprietária |

Entrada de criação/edição: `{ name, description, roadmapProgrammingDTO }`. Cada parada envia somente `programmingId` **ou** `hostId`, `order` e datas UTC com sufixo Z. Não envia objetos de cadastro de local/evento nem altera os destinos. A leitura usa `roadmapProgrammingResponseDTO`, `programming` e `hostDTO` do contrato atual. Exclusão trata resposta 204 sem tentar interpretar JSON.

Visitantes podem criar e consultar a versão pública. Como o backend exige proprietário autenticado para PUT/PATCH, um roteiro salvo anonimamente permanece editável como rascunho e é enviado como **nova versão**, sem tentar editar/excluir o registro público anterior. Listagem remota e exclusão não são apresentadas como disponíveis ao visitante.

## Validações realizadas

- `tsc --noEmit` e `npm run lint`: aprovados.
- `node --test src/*.test.mjs`: **41 testes aprovados**, incluindo 11 novos testes de roteiros com fetch/armazenamento simulados. Cobrem os cinco contratos, JWT, 204, erro sem perda de dados, ordenação, UTC, intervalo do evento, conflitos, abertura com pausa e após meia-noite, filtros por união, estado compartilhado e resposta atrasada.
- Exportação Web Expo concluída, incluindo `/roteiro` e `/roteiro_ia`, para pasta temporária fora do repositório.
- Edge headless com API simulada: inclusão desde Explorar e retorno à timeline, duas categorias selecionadas juntas, roteiro misto, ajuste de horários, erro de funcionamento seguido de nova tentativa, POST/GET anônimos, persistência após reload, chat preservado e remoção compartilhada, GET da conta, PUT com JWT e PATCH 204 com confirmação/cancelamento.
- Conferência adicional no navegador: seleção de pin por mensagem do iframe real inclui no roteiro; busca de comércio remove a mesma parada e favoritos reflete/inclui novamente. Não foi validado o carregamento real dos tiles nesse teste.
- Viewports de 390 e 320 px conferidos, incluindo o seletor em modal; sem rolagem horizontal da página ou erros JavaScript no fluxo simulado. Capturas temporárias de timeline, seletor e card do mapa revisadas visualmente.

## Limites e pendências

- Não houve chamadas de escrita na API/banco reais. Integração com conta, JWT e dados reais permanece pendente de validação pelo usuário com seus serviços iniciados.
- O serviço de IA não foi acionado em produção. A timeline manual não depende dele.
- Não foram validados dispositivo nativo, teclado físico/virtual em aparelho ou persistência nativa. O projeto atual usa o armazenamento do navegador; em ambiente sem ele, mantém memória da sessão.
- Categorias gerais pertencem às programações no contrato atual. O HostFilter aceita tipos de estabelecimento, não IDs de categorias de evento. A interface distingue esses dois filtros e não promete filtrar hosts por uma categoria não oferecida pela API.
- O cálculo da timeline ordena por horário; não calcula tempo de deslocamento nem otimiza uma rota geográfica. O usuário pode ajustar horários, e o backend valida as regras de visitas existentes.
- O rascunho mantém uma inclusão por destino nos botões de alternância; alterar o roteiro selecionado altera o significado dos botões verdes nas demais telas. Alterações feitas pelos cards são rascunho até o usuário salvar na página Roteiro.
- Visitantes não possuem listagem de todas as versões públicas anteriores nem exclusão remota, conforme as permissões atuais. O botão Consultar versão salva recupera o ID associado ao rascunho atual.
- O inventário de chamadas passa de 34 para **39 dos 51 endpoints** de negócio; restam **12** sem consumo identificado. A auditoria anterior continua registrada como o estado antes desta integração.

Referências técnicas consultadas: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Expo Router 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/) e [Animated do React Native](https://reactnative.dev/docs/animated). Protótipo externo não alterado porque não houve mudança de API.
