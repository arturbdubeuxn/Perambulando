# US17 - Plano Pro, divulgação e estatísticas

Perambulando | Plano de implementação | 27/10/2026 | Versão 1.2 (fonte Markdown; PDF anterior preservado)

**Natureza do documento:** proposta técnica para implementação futura. Os nomes, entidades, contratos e regras abaixo não representam funcionalidades já entregues. Esta tarefa gera documentação; não implementa a US17 nem executa migrations.

## 1. Objetivo e escopo

A US17 permite ao responsável por uma empresa ativar uma conta Pro para melhorar a divulgação de suas programações e consultar estatísticas. Nesta etapa, a contratação é simulada: clicar no botão chama a API e ativa o benefício, sem cobrança.

O frontend registra interações por meio da API e consulta os resultados por GET. Ele não se conecta diretamente ao PostgreSQL. Os registros de interação são armazenados; os totais são calculados pelo backend na consulta, inicialmente sem tabela de totais ou serviço de processamento em segundo plano.

### Decisões confirmadas na conversa

- Não integrar pagamentos nesta implementação. O botão de ativação é suficiente para conceder Pro pelo backend.
- Programações de contas Pro participam de um carrossel de destaque.
- Contas Pro acessam estatísticas, incluindo quantidade de favoritos.
- Frontend chama a API para registrar ações; backend grava e calcula estatísticas.
- Seguir as camadas, interfaces, mappings, validações e nomenclaturas já existentes. Não criar pastas adicionais na aplicação.
- Manter o protótipo, exemplos HTTP e documentos Markdown coerentes com as funcionalidades entregues. PDFs são atualizados somente mediante solicitação.

### Propostas adotadas como referência, ainda sujeitas à revisão

A assinatura pertence ao usuário e cobre todos os hosts dele; a ativação dura um mês civil; não existe renovação automática; cancelar remove o benefício imediatamente na simulação; métricas são coletadas também para contas gratuitas, mas sua consulta é exclusiva do Pro. Essas escolhas tornam o plano executável e precisam ser ratificadas antes do código.

### Fora do escopo

Cartão, PIX, checkout, webhook financeiro, fatura, reembolso, assinatura recorrente cobrada, biblioteca de previsão estatística e comprovação de vendas/presença. Também não fazem parte do MVP: identificar visitantes anônimos entre dispositivos ou garantir que todo evento foi produzido por uma pessoa.

## 2. Ponto de partida do sistema

Na primeira revisão existiam User.isPro e uma claim isPro no JWT. Por decisão posterior do usuário, ambos foram removidos do código; IsPro permanece no DTO de perfil, calculado pela assinatura vigente. A remoção física da coluna aguarda migration revisada. Há relação de usuário para vários hosts e de host para várias programações. Favorite guarda o vínculo usuário/programação, IsActive e datas de criação/atualização.

O projeto utiliza Controllers, Application/AppServices, Application/DTO, Application/Mapping e interfaces, Domain/Service e interfaces, Data/Repository e Data/Configurations. Integrações externas ficam em Data/Services. A implementação proposta se encaixa nessas pastas.

Esses elementos existentes não oferecem, por si só, validade de assinatura, histórico de cliques ou um painel estatístico. O campo Favorite.UpdatedAt também não reconstrói cada retirada e reativação de favorito.

## 3. Experiência do usuário e fluxo completo

### Ativação simulada

1. Usuário faz login e recebe seu JWT.
2. Frontend consulta MySubscription para conhecer o benefício efetivo.
3. Usuário seleciona Ativar Pro - simulação. A tela informa que não existe cobrança.
4. Frontend faz POST /api/Subscription/Activate, sem enviar UserId, preço ou validade.
5. Backend identifica o usuário pelo JWT, valida a conta e ativa o período no banco.
6. API retorna a assinatura, sua validade e seu status efetivo.
7. Frontend atualiza a sessão visual. Não é necessário repetir o login.
8. Programações elegíveis desse usuário passam a participar da consulta de destaque.

### Uso e término

O painel consulta a API ao abrir e após ativação/cancelamento. A assinatura termina quando a validade é atingida ou quando é cancelada. O sistema mantém hosts, programações, favoritos e interações; somente a liberação dos benefícios muda. Não há promessa de posição fixa ou número mínimo de visualizações no carrossel.

O carrossel é público. Ativação, situação da assinatura, cancelamento e estatísticas exigem autenticação. O usuário que interage com uma programação não precisa possuir Pro nem estar logado.

## 4. Dados da assinatura

Proposta de entidade Subscription, com uma linha corrente por usuário no MVP. Esta escolha reduz complexidade; histórico completo de contratos pode ser acrescentado quando o pagamento real for introduzido.

| Campo | Tipo proposto | Responsabilidade |
|---|---|---|
| Id | int | Chave primária |
| UserId | string | FK para User; respeita o Identity atual |
| Status | enum | Inactive, Active ou Cancelled |
| StartsAt | DateTime UTC | Início da ativação atual |
| ExpiresAt | DateTime UTC | Limite exclusivo do benefício |
| CancelledAt | DateTime UTC anulável | Cancelamento do período atual |
| CreatedAt / UpdatedAt | DateTime UTC | Auditoria |

Criar índice único em UserId para impedir duas assinaturas correntes. Ativação concorrente deve reutilizar a mesma linha ou retornar a situação consolidada, sem duplicidade. Não adicionar identificadores de cobrança ainda sem utilização.

Validade efetiva: usuário ativo, Status Active, StartsAt menor ou igual ao instante UTC atual e instante atual menor que ExpiresAt. Expired é calculado na resposta e persistido sob demanda por GetAsync quando uma assinatura Active já atingiu o prazo. Não existe tarefa agendada: a linha é atualizada na próxima consulta de assinatura/perfil, sem que a validade efetiva dependa dessa gravação.

Ativar por um mês significa utilizar o equivalente a AddMonths(1), com comportamento de fim de mês da plataforma. Não tratar um mês como trinta dias silenciosamente. Guardar os instantes em UTC e apresentar datas no fuso do usuário.

### Pro calculado pela assinatura e JWT

Subscription é a fonte da validade. User.isPro foi removido do model e a claim isPro foi retirada dos novos tokens; um JWT pode continuar válido depois do cancelamento ou vencimento, mas não concede Pro por si só.

SubscriptionService.IsProAsync consulta a assinatura e usa IsEffective com o horário UTC atual. UserAppService preenche IsPro do perfil por essa consulta, passando o resultado ao UserMapping. Não existe gravação de uma flag Pro no usuário. A dependência fica no AppService; UserService não depende de SubscriptionService, evitando ciclo de DI.

Tokens já emitidos não mudam e suas claims Pro antigas devem ser ignoradas. Frontend consulta o perfil ou MySubscription; os futuros endpoints de carrossel/estatísticas devem verificar vigência no banco. Auditoria do banco principal em 27/10/2026 encontrou três usuários e nenhum isPro=true; não há benefício legado para transferir no estado auditado. A coluna antiga permanece no banco até a migration autorizada.

## 5. Regras da ativação e cancelamento

| Situação | Resultado esperado |
|---|---|
| Primeiro clique de conta ativa | Cria assinatura e concede um mês |
| Clique repetido durante vigência | Retorna a assinatura atual; não soma meses |
| Cliques concorrentes | Uma assinatura corrente, sem extensão indevida |
| Usuário sem host | Pode ativar; benefícios de divulgação aparecem após criar hosts/programações |
| Conta inativa ou sem identidade válida | Operação negada |
| Cancelamento | Benefício deixa de valer imediatamente na simulação |
| Cancelamento repetido | Retorna situação cancelada, sem erro de duplicidade |
| Nova ativação após cancelamento/vencimento | Reinicia um período de um mês; não recupera saldo anterior |
| Vencimento durante JWT válido | Estatísticas e destaque deixam de ser liberados |

O frontend não envia um IsPro arbitrário em edição do perfil. A ativação acontece somente pelo caso de uso autenticado. A configuração Pro:SimulationEnabled precisa estar explicitamente habilitada para o endpoint simulado conceder o benefício; em sua ausência, tratar como desabilitada. A chave é uma proposta de configuração, não uma implementação existente.

Com a simulação desabilitada, Activate retorna 403 explicativo. Uma reativação gratuita depois de vencer continua possível enquanto a simulação estiver ligada: isso faz parte do ambiente demonstrativo, sem equivaler a uma cobrança real.

## 6. Endpoints e contratos da assinatura

Rotas propostas; revisar a nomenclatura com os controllers existentes antes de implementar.

As três operações utilizam o usuário do JWT; o cliente não escolhe o titular por parâmetro. Os retornos abaixo são contratos planejados para a nova implementação.

| Verbo e rota | Acesso | Resposta principal |
|---|---|---|
| POST /api/Subscription/Activate | JWT; usuário ativo | 200 com assinatura efetiva |
| GET /api/Subscription/MySubscription | JWT; usuário ativo | 200 com situação e benefícios |
| PATCH /api/Subscription/Cancel | JWT; titular | 200 com situação resultante |

Sem assinatura, MySubscription retorna 200 com status Inactive; esse estado é esperado, não uma falha 404. Cancelar sem assinatura pode retornar esse mesmo estado inativo, mantendo a operação idempotente. Não expor um endpoint genérico para escolher o UserId de outra pessoa.

Exemplo de SubscriptionResponseDTO:

```json
{
  "id": 8,
  "status": "Active",
  "startsAt": "2026-10-27T15:00:00Z",
  "expiresAt": "2026-11-27T15:00:00Z"
}
```

O JSON é ilustrativo. Se o projeto mantiver enums numéricos, preservar essa convenção e documentar os valores, em vez de alterar a serialização global. Activate não exige DTO vazio; o usuário vem do JWT e as datas do servidor.

401 para ausência/autenticação inválida; 403 para benefício/ativação não permitido; 400 para parâmetros inválidos. Usar ProblemDetails e mensagens coerentes com os controllers. Não devolver detalhes internos de exceções imprevistas.

## 7. Carrossel e distribuição dos destaques

Propor GET /api/Programming/GetFeaturedProgrammings?take=10&skip=0, público e sem corpo. A consulta combina programação ativa, host ativo, proprietário ativo e assinatura efetivamente vigente. Inclui eventos futuros e em andamento; exclui encerrados. Não alterar silenciosamente os critérios das outras listagens.

Reutilizar ProgrammingResponseDTO se os campos atuais forem suficientes. Não expor informações privadas do usuário ou assinatura em uma resposta pública. Take entre 1 e 100, Skip não negativo; retorno 200 com [] quando não houver itens.

Para o MVP, ordenar as programações elegíveis e montar rodadas por usuário: no primeiro ciclo, no máximo uma programação por assinante; no próximo ciclo, a segunda programação de cada um, até preencher a lista. Aplicar essa distribuição antes da paginação. A participação é por usuário para que criar vários hosts não contorne a regra.

Se a ordem variar no tempo, utilizar uma janela estável e uma referência de rotação compartilhada entre páginas para evitar repetições/pulos durante a navegação. Não usar aleatoriedade nova em cada requisição. O algoritmo final e sua tradução eficiente em PostgreSQL precisam ser validados com volume antes de fechar a entrega; não carregar todas as programações para ordenar em memória.

O backend seleciona os itens; o frontend desenha o carrossel, controla navegação e registra impressão/clique. Selo de destaque indica divulgação Pro, não avaliação de qualidade.

## 8. Coleta de interações

Entidade proposta ProgrammingInteraction, com eventos imutáveis: uma linha para cada ocorrência aceita. Não criar IsActive sem um caso de uso de desativação. Manter os nomes de datas conforme o padrão adotado no módulo.

| Campo | Tipo proposto | Finalidade |
|---|---|---|
| Id | int ou long | PK; escolher conforme padrão e volume esperado |
| EventId | Guid | Identificador único para deduplicar reenvio |
| ProgrammingId | int | FK; programação relacionada |
| Type | enum | DetailView, CarouselImpression, CarouselClick, TicketClick |
| UserId | string anulável | FK opcional obtida do JWT válido |
| CreatedAt | DateTime UTC | Horário definido pelo servidor |

Índice único em EventId. Índice de consulta em ProgrammingId, Type e CreatedAt; validar planos de execução com as consultas reais. Não usar o ID público do favorito como identificador de visitante. Por padrão, não coletar IP, geolocalização, e-mail ou identificação persistente do navegador para essas métricas.

POST /api/Programming/{programmingId}/Interactions é público. DTO contém EventId e Type; não contém UserId, HostId, total ou horário manipulável pelo cliente. Se houver autenticação válida, o servidor associa o usuário; visitantes ficam com UserId nulo.

```json
{
  "eventId": "77ee8352-bc44-43c9-80b6-9b5dc20d5d42",
  "type": 3
}
```

Exemplo de enum a documentar: 0=DetailView; 1=CarouselImpression; 2=CarouselClick; 3=TicketClick. Resposta 204 para evento aceito ou reenvio idêntico. EventId já utilizado com outra programação/tipo retorna 409. Resolver essa deduplicação no banco também, não somente por consulta prévia.

400 para enum/GUID inválido; 404 para programação inexistente/inativa ou host inativo; 429 para excesso de registros. TicketClick exige link cadastrado; o backend pode negar inconsistências, mas não comprova que o usuário efetivamente abriu o destino. A API não recebe uma URL arbitrária para redirecionamento.

## 9. Momento correto de registrar cada evento

| Evento | Gatilho no frontend | O que não contar |
|---|---|---|
| DetailView | Detalhes carregados e efetivamente exibidos | GET interno para edição ou pré-carregamento |
| CarouselImpression | Card visível por ao menos um segundo, proposta de limiar de 50% | Item apenas retornado pela API ou fora da área visível |
| CarouselClick | Ação do usuário no card de destaque | Abertura automática do primeiro card |
| TicketClick | Acionamento do link de ingresso | Exibição do botão sem interação |

Gerar um novo EventId para cada ação real. Ao reenviar uma ação que falhou, reutilizar o mesmo EventId. Controlar impressão por card/apresentação para o movimento do carrossel não gerar várias impressões pela mesma exibição. DetailView deve ser registrado uma vez por abertura dos detalhes, não a cada renderização da tela.

Abrir o ingresso sem aguardar o sucesso da coleta. A falha do registro não pode bloquear a navegação. Usar envio assíncrono adequado à plataforma; se houver envio ao sair da página, validar seu comportamento no navegador e no futuro aplicativo móvel. Reenvio curto e limitado; sem armazenar JWT ou eventos pessoais em uma fila permanente por iniciativa própria.

Essa coleta é uma medida de interação, não uma garantia antifraude. Deduplicação por EventId não impede um cliente malicioso de gerar IDs novos. Aplicar limitação de frequência e monitorar picos. A identificação anônima não permitirá contar pessoas únicas com precisão nesta etapa.

Coletar eventos de contas gratuitas e Pro, mas liberar o painel somente ao Pro. Na versão inicial, o GET retorna o histórico disponível dentro do período consultado, inclusive anterior à ativação. Informar que não existem dados anteriores ao início da coleta.

## 10. Favoritos, métricas e fórmulas

Favoritos atuais vêm da tabela Favorite, com IsActive true. Não registrar um segundo favorito ao coletar interação. A ação de favoritar continua utilizando seu fluxo existente.

| Indicador | Origem e interpretação |
|---|---|
| Favoritos ativos | Contagem atual dos vínculos ativos da programação |
| Visualizações dos detalhes | DetailView dentro do período |
| Impressões no carrossel | CarouselImpression dentro do período |
| Cliques no carrossel | CarouselClick dentro do período |
| Cliques no ingresso | TicketClick dentro do período |
| Taxa do carrossel | Cliques / impressões x 100 |
| Razão de cliques no ingresso | Cliques no ingresso / visualizações x 100 |
| Ranking | Ordenação das programações pelas métricas escolhidas |

Denominador zero resulta em zero. Usar decimal nas razões e arredondar somente a apresentação, por exemplo a duas casas. Contagens continuam inteiras.

As razões com eventos totais não equivalem a conversões por pessoa: vários cliques podem produzir uma taxa superior a 100%. Não limitar artificialmente para esconder o comportamento. Para uma conversão de fato seria necessário vincular impressão, clique e sessão, com definição e coleta próprias.

Favoritos ativos representam um retrato atual, mesmo quando o GET recebe um intervalo de datas. Nomear a propriedade ActiveFavoritesNow para não sugerir um total histórico do período. Favoritos ganhos/perdidos por dia e retenção exigem eventos próprios de adição/remoção ou snapshots, fora da primeira entrega. Não inferir esse histórico somente de CreatedAt/UpdatedAt.

Não chamar clique de compra, ingresso vendido, presença ou receita. Não mostrar e-mails ou identidades das pessoas que favoritaram. As estatísticas são agregadas.

## 11. Consulta privada de estatísticas

GET /api/Host/{hostId}/Statistics?startDate=...&endDate=...&take=10&skip=0. JWT obrigatório. Service valida usuário ativo, propriedade do host e benefício Pro vigente antes de consultar os dados.

Proposta de período padrão: últimos 30 dias até agora. Validar início menor que fim e limitar a consulta a 366 dias no MVP. Receber instantes UTC em formato ISO 8601; usar início inclusivo e fim exclusivo. Os agrupamentos diários serão UTC inicialmente e isso deve aparecer na interface. Se o produto precisar de dias civis de Recife, acrescentar essa definição explicitamente e testar as fronteiras do fuso.

Proposta de resposta agregada, com lista paginada de programações:

```json
{
  "hostId": 33,
  "startDate": "2026-10-01T00:00:00Z",
  "endDate": "2026-11-01T00:00:00Z",
  "timeZone": "UTC",
  "activeFavoritesNow": 18,
  "detailViews": 200,
  "carouselImpressions": 500,
  "carouselClicks": 40,
  "ticketClicks": 25,
  "carouselClickRate": 8.00,
  "ticketClickRatio": 12.50,
  "programmings": [],
  "dailySeries": []
}
```

Totais e série diária correspondem ao host inteiro; paginação afeta somente a lista de programações. Incluir totalCount e take/skip para a lista na implementação. Definir comportamento de programações desativadas: recomendação é preservar suas métricas históricas no painel do proprietário, identificando o status, embora não participem do carrossel. Host inativo não recebe novas interações; sua gestão histórica deve respeitar a política de acesso acordada.

401 para ausência de autenticação; 403 para titular sem Pro; 404 para host inexistente ou pertencente a outro usuário, sem expor a existência dele; 400 para período/paginação inválidos. Host sem eventos retorna 200 com zeros e listas vazias. Acesso administrativo não será concedido implicitamente: reutilizar somente políticas administrativas explicitamente aprovadas.

## 12. Cálculo no EF e responsabilidade por camada

Não instalar biblioteca estatística para esse MVP. Count, agrupamento por tipo/data e consultas agregadas atendem os indicadores. Projetar as contagens no banco antes de materializar, validar o SQL gerado e evitar consultas por programação em um loop. Utilizar AsNoTracking em leitura e métodos assíncronos.

| Componente | Responsabilidade proposta |
|---|---|
| SubscriptionController | Ativação, situação e cancelamento; tratamento HTTP |
| SubscriptionAppService e mapping | Conversão para respostas e coordenação da Application |
| SubscriptionService | Vigência, idempotência, titular e configuração de simulação |
| SubscriptionRepository | Persistência e consulta da assinatura |
| ProgrammingInteractionService | Elegibilidade da programação e regras de registro |
| ProgrammingInteractionRepository | Inserção, unicidade e persistência do evento |
| HostStatisticsService | Propriedade, Pro, período e cálculos de razões |
| Consulta estatística no repository | Agregações por host, programação, evento e data |
| HostStatisticsAppService e mapping | DTO do painel e transformação de resultados |

As interfaces ficam nos diretórios de interfaces já existentes. Usar construtores e registros Scoped como os módulos atuais. Não adicionar UnitOfWork, AutoMapper, pipeline genérico, Strategy ou repositório base por iniciativa própria. Para estatísticas, aproveitar HostController/HostAppService se isso corresponder à organização final; a separação de métodos deve ter responsabilidade clara.

DTOs validam formato, limites e presença. Service valida titularidade, validade e regras específicas. Extrair para validações via interface apenas regras realmente reutilizadas, seguindo a orientação atual do projeto. Controller não concentra as regras; traduz resultados/exceções conhecidas para HTTP.

Favoritos atuais e eventos do período devem ser agregados separadamente antes da combinação para não multiplicar contagens em joins. Uma programação com cinco favoritos e dez eventos não pode resultar em cinquenta favoritos. Testar esse caso explicitamente.

## 13. Protótipo e frontend

Adicionar operações de ativar/cancelar/consultar Pro no protótipo, exibindo Simulação - nenhuma cobrança. Após resposta de ativação, atualizar permissões visuais pelo retorno da API, sem confiar em um booleano alterado apenas no navegador.

Criar área de carrossel para testar itens públicos e área de painel por host, com escolha de período, cartões de totais, ranking e série diária. Gráficos são responsabilidade visual do frontend; o backend devolve os números e os pontos da série.

O protótipo não deve registrar visualização ao carregar dados para edição nem ao executar automaticamente testes simulados. Dar opções explícitas de teste para registrar eventos e observar o resultado. Nos formulários de busca, filtros opcionais continuam vazios, sem herdar hostId ou preços da sessão.

Atualizar o .http com exemplos completos: login; consulta sem assinatura; ativação; repetição; carrossel; interação anônima e autenticada; estatísticas; cancelamento; estatísticas sem Pro. Preservar reaproveitamento do JWT e IDs, sem publicar credenciais reais.

## 14. Plano de entrega e revisão do banco

| Etapa | Entrega | Condição de conclusão |
|---|---|---|
| 1 | Revisão das regras e contratos deste documento | Decisões pendentes confirmadas |
| 2 | Models/configurações de Subscription e ProgrammingInteraction | Relações, índices e plano de dados revisados |
| 3 | Migration preparada para revisão | Nenhuma aplicação automática antes da aprovação |
| 4 | Ativar, consultar e cancelar simulação | Idempotência, vigência e concorrência testadas |
| 5 | Pro calculado no perfil e removido do JWT | Token antigo não mantém acesso vencido |
| 6 | Consulta e distribuição do carrossel | Regras de elegibilidade/paginação verificadas |
| 7 | Coleta e deduplicação de eventos | Reenvios e validações conferidos |
| 8 | Painel e agregações | Totais corretos, sem multiplicação por join |
| 9 | Protótipo, .http, documentação e revisão final | Fluxo completo reproduzível |

Antes de aplicar a migration: verificar o isPro de usuários existentes, decidir se algum receberá uma assinatura inicial e conferir índices/FKs e política de exclusão. Não ativar todos os usuários nem apagar dados para facilitar a implantação. Gerar script SQL, revisar e fazer backup apropriado.

Aplicação da migration depende de autorização e revisão; atenção ao Program.cs atual, que aplica migrations na inicialização em Development. Não iniciar esse perfil contra o banco principal durante a preparação sem considerar esse comportamento. A documentação deste plano não altera essa configuração.

## 15. Testes e critérios de aceite

### Assinatura e autenticação

- Ativar uma conta válida concede os benefícios; sem JWT retorna 401.
- Repetição e concorrência não criam duplicidade nem estendem o período vigente.
- Cancelar e repetir cancelamento preservam uma situação consistente.
- No instante de ExpiresAt o benefício já não vale; testar virada de mês/fim de mês.
- JWT emitido antes de ativar permite consultar o novo benefício; JWT antigo com isPro true não libera assinatura cancelada/vencida.
- Simulação desabilitada bloqueia Activate. Edição do perfil não concede Pro.

### Carrossel e interações

- Carrossel público seleciona somente usuários/hosts/programações elegíveis, incluindo eventos em andamento.
- Usuários com muitos hosts não ocupam todas as primeiras posições. Paginação não repete itens dentro da mesma referência de rotação.
- Interação válida retorna 204; reenvio idêntico não aumenta a contagem. Mesmo EventId com conteúdo diferente retorna 409.
- Programação/host inativo não aceita eventos; tipo inválido é rejeitado.
- Usuário anônimo pode interagir; usuário logado é associado somente a partir do JWT.
- Repetir renderizações ou usar GET para edição não aumenta DetailView.
- Falha de coleta não impede abertura do ingresso; rajadas atingem a limitação definida.

### Estatísticas e isolamento

- Apenas o dono com Pro consulta o painel do host; outro usuário não recebe dados.
- Host sem interações recebe zeros; nenhuma divisão por zero.
- Datas UTC, fronteiras inclusiva/exclusiva e agrupamento diário produzem resultados esperados.
- Favoritos atuais não são apresentados como evolução histórica. Joins não multiplicam favoritos/eventos.
- Testar listagem paginada, totais do host independentes da página e intervalo máximo.
- Validar HTTP/Service/Repository contra PostgreSQL descartável, sem alterar dados reais. UI usa API simulada em node --test e node --check.

Critério da US17: ao ativar o Pro simulado, as programações elegíveis entram na seleção de divulgação e o titular acessa as estatísticas dos seus hosts. Ao cancelar/vencer, ambas as permissões deixam de ser concedidas pelo backend.

## 16. Evolução para pagamento real

Na fase futura, o botão passará a iniciar contratação e a confirmação confiável do provedor ativará o período. Acrescentar identificadores externos, estados financeiros, tratamento de notificações idempotentes, estorno e cancelamento de renovação. Desabilitar a ativação gratuita em produção.

Preservar SubscriptionService como ponto de consulta de benefícios. Carrossel e estatísticas não precisam conhecer o provedor de pagamento. Esse isolamento permite trocar a origem da ativação sem reescrever as regras de divulgação e autorização.

## 17. Decisões finais a revisar

- Plano por usuário cobrindo todos os hosts ou contratação separada por host? Referência deste documento: por usuário.
- Um mês civil de duração, cancelamento imediato e reativação gratuita sem renovação automática são adequados à demonstração?
- Confirmar a exposição de histórico anterior à ativação e o prazo de retenção de interações; não executar limpeza automática antes dessa definição.
- Confirmar o limite do período estatístico (366 dias), o fuso diário UTC e o comportamento do histórico de hosts desativados.
- Confirmar regra de distribuição/rotação do carrossel e limites de frequência da coleta em teste de carga.

## 18. Referências e status de validação

Base local conferida em 27/10/2026: User, Favorite, JwtTokenService e organização atual das camadas do backend. Este documento é um desenho de implementação, não um relatório de testes da US17. Nenhum endpoint Pro, interação ou estatística foi implementado/testado nesta geração.

Referência técnica: Microsoft Learn, Complex Query Operators, seção GroupBy e agregações: https://learn.microsoft.com/en-us/ef/core/querying/complex-query-operators . EF pode traduzir padrões de agregação para SQL; a tradução e o custo das consultas finais precisam ser verificados no provider Npgsql utilizado pelo projeto.

Biblioteca opcional para cálculos avançados, fora da necessidade atual: Math.NET Numerics, Descriptive Statistics: https://numerics.mathdotnet.com/DescriptiveStatistics . Não instalar dependência adicional somente para contagens e razões do MVP.

Documentação futura afetada: Controllers, Regras de Negócio, Tokens, DTOs, BD e Entidades/Models; Docker apenas se houver nova configuração operacional relevante. As fontes devem diferenciar funcionalidades implementadas de propostas. Atualizar os PDFs somente quando solicitado.

## Resposta de assinatura simplificada - 27/10/2026

Por decisão do usuário, removidos IsSimulation, CanFeatureProgrammings e CanViewStatistics do SubscriptionResponseDTO e do mapping. Resposta contém somente id, status, startsAt e expiresAt. Status continua numérico: 0 Inactive, 1 Active, 2 Cancelled, 3 Expired. Uma linha Active vencida retorna Expired; uma linha Active com início futuro retorna Inactive. O frontend usa o status efetivo e o backend mantém Subscription.IsEffective/SubscriptionService.IsProAsync para autorização; criação de programação continua independente de Pro.

Não houve mudança de entidade, banco, migration ou controller. Protótipo já exibe a resposta genérica sem depender das flags; novo caso simulado confirma o contrato. Build aprovado; 10 verificações locais do mapping/serialização e 62 testes do protótipo aprovados. API do Visual Studio não reiniciada; recompilar/reiniciar para receber o JSON novo. Fontes Markdown atualizadas; PDFs preservados.

## Expiração persistida ao consultar a assinatura - 27/10/2026

SubscriptionService.GetAsync agora verifica Active com ExpiresAt <= UTC atual e solicita ExpireAsync ao repositório. A transição grava Status Expired (3) e UpdatedAt. Consultas de MySubscription e de perfil/IsProAsync passam pelo fluxo; a atualização acontece sob demanda, sem tarefa agendada. Antes da próxima consulta, a linha pode continuar Active, mas IsEffective e o mapping já negam/apresentam corretamente um prazo vencido. Assinaturas Cancelled não são alteradas.

O repositório usa UPDATE condicional por ID, status Active e prazo vencido, evitando sobrescrever um prazo renovado antes da escrita. Retorna a situação atual em leitura sem rastreamento; não altera as datas originais de validade. Consulta repetida não modifica UpdatedAt novamente. Não foram reintroduzidos o controle de SimulationEnabled ou o bloqueio por usuário desfeitos anteriormente.

Build aprovado, 15 verificações reais em PostgreSQL descartável e 62 testes simulados do protótipo aprovados. Verificadas persistência de Expired, expiração pelo perfil, idempotência, preservação de vigentes/canceladas e proteção de prazo vigente no UPDATE condicional. Banco temporário removido; banco principal não alterado nesta tarefa. Sem mudança de DTO/rotas, nova migration, reinicialização da API ou PDF.
