> **Escopo vigente em 05/11/2026:** prompt único e retorno de programações/hosts, sem localização, perguntas, conversa ou histórico. Consulte a seção final deste documento. As seções anteriores registram propostas ampliadas e etapas históricas. Integração n8n, filtros e DI ainda pendentes.

# Feature: assistente conversacional para roteiros

Data: 05/11/2026.
Estado: proposta completa de implementação; nenhum endpoint, DTO, model, migration ou workflow desta feature está implementado. Nomes e contratos abaixo são propostos. Não houve alteração funcional da API nesta etapa.

## 1. Objetivo e escopo

Permitir que um usuário autenticado descreva um passeio em linguagem natural, esclareça preferências pelo chat, receba opções existentes no Perambulando e selecione/ordene as paradas de um roteiro. Cada roteiro pode combinar programações e hosts de gastronomia/comércio. Um host produtor não é uma parada independente nesta feature; suas programações podem ser selecionadas.

Exemplo: “Quero sair de casa no sábado, passear por pontos turísticos do Recife e tomar um café perto de mim”. O assistente identifica intenções e pergunta sobre data, período, orçamento, participantes e origem quando essas informações forem necessárias. Não deve interpretar “casa” como endereço conhecido sem confirmação.

Incluído: conversas persistidas, extração estruturada pelo n8n, esclarecimentos, filtros determinísticos na API, proximidade, resultados agrupados por intenção, seleção e edição de roteiro. Não inclui reservas, compra de ingressos, garantia de vagas, rotas viárias ou cálculo exato de deslocamento. Distâncias iniciais serão em linha reta e identificadas dessa forma. Nenhum local externo será apresentado como cadastro existente.

## 2. Estado atual verificado

- ProgrammingFilterDTO já contém cidade, texto, categorias, início/fim, gratuidade, preços, host e paginação.
- ProgrammingRepository.FilterAsync considera programação/host ativos, evento ainda não encerrado, interseção de datas e interseção de faixas de preço. Isso não garante permanência durante toda a visita, vaga ou respeito a um teto de gasto.
- HostFilterDTO permite nome, tipo, cidade, existência de programações e paginação. Ainda não filtra preço, funcionamento, proximidade nem intenção como “café”.
- Hosts possuem tipos Productor, Gastronomy e Business, faixa de gasto por pessoa e agenda semanal com períodos e virada de dia. A faixa admite valores ausentes em dados legados.
- Address possui Location opcional, Point ignorado no JSON. AddressDetailsDTO não expõe coordenadas. A infraestrutura espacial existente pode ser reaproveitada após conferir a configuração e o schema do ambiente.
- Não foram encontrados models de conversa ou roteiro. Workflow do n8n ainda não existe, conforme informado pelo usuário.
- A identificação de “cafeteria” dentro de Gastronomy exige estratégia própria; tipo do host sozinho não resolve a intenção. A taxonomia deve ser definida antes de prometer essa precisão.

## 3. Responsabilidades e fluxo

1. Aplicativo abre uma conversa autenticada e envia a mensagem com identificador único.
2. API valida usuário, propriedade, tamanho, versão da conversa e eventual localização fornecida.
3. API recupera mensagens e preferências confirmadas. Prepara contexto limitado para o n8n.
4. n8n interpreta a mensagem e retorna proposta estruturada de preferências, dúvidas e texto de resposta.
5. API valida o retorno, aplica correções/remoções explicitamente solicitadas e verifica lacunas ou conflitos. Estado estruturado validado na API é a fonte do contexto.
6. Se houver dúvida que bloqueie a busca, API salva a pergunta e responde awaitingAnswers. A próxima resposta continua a mesma conversa.
7. Com informações suficientes, API consulta repositories de programações e hosts. Retorna opções reais por intenção, com restrições e incertezas.
8. Usuário seleciona itens e define ordem/horários. API valida novamente os registros e salva o roteiro.
9. Alterações pelo chat podem produzir novas sugestões. Nunca removem nem substituem paradas já escolhidas sem ação explícita do usuário.

O aplicativo não chama o webhook diretamente. O n8n interpreta preferências; não recebe acesso direto ao banco nem autoridade para criar/alterar reservas, usuários ou roteiros. IDs e informações dos resultados são obtidos pela API. Não haverá callback público do n8n na primeira versão: a chamada será API → webhook → resposta JSON.

## 4. Estado da conversa e esclarecimentos

Estados propostos: awaitingAnswers, readyToSearch, suggestionsAvailable e closed. Falhas técnicas não apagam contexto nem viram preferências do usuário. A resposta inclui versão e status; o frontend não deduz estado pelo texto.

Preferências a manter: cidade, data/período, fuso, quantidade de pessoas, orçamento e sua unidade, gratuidade, intenções de paradas, categorias, origem, raio de proximidade e ordenação. Campo ausente significa desconhecido; não significa zero, uma pessoa, grátis ou ausência de restrição. Diferenciar unknown, specified e unrestricted nos campos que admitem indiferença. Localização pode estar unavailable.

Perguntas têm id, campo, texto, opções quando aplicáveis e motivo. Fazer perguntas curtas, agrupando apenas as relacionadas. Não perguntar novamente o que já foi respondido, salvo conflito ou mudança de contexto.

Regras:

- “Sábado”: usar data de referência/fuso fornecidos pela API; se o sábado pretendido for ambíguo, perguntar. Sempre mostrar a data absoluta interpretada para o usuário.
- “Até R$ 100”: perguntar se é por pessoa ou pelo grupo e se cobre todo o passeio; não converter automaticamente em teto por parada.
- Quantidade de pessoas é necessária para calcular orçamento do grupo. Não implica disponibilidade de ingressos ou mesas.
- “De manhã”: resolver para intervalo explicitamente exibido e editável; caso o intervalo seja determinante e ambíguo, perguntar.
- “Perto”: solicitar localização/origem e raio desejado ou oferecer um raio para confirmação. Nunca aplicar raio silenciosamente.
- “Saindo de casa”: perguntar se deseja usar localização atual, endereço cadastrado escolhido por ele ou outra origem.
- Sem permissão de geolocalização: permitir informar bairro/endereço ou buscar por cidade; não insistir na permissão.
- “Qualquer horário” e “sem limite de valor” são respostas válidas. Não manter o usuário em ciclo de perguntas.
- Preferências incompatíveis devem gerar esclarecimento. Resultado vazio permite oferecer relaxamentos específicos, sem aplicá-los automaticamente.

## 5. Contratos HTTP propostos

Todas as rotas abaixo exigem JWT, usuário ativo e propriedade da conversa/roteiro. O userId vem do token. Recursos de outro usuário retornam 404. Identificadores de conversa e roteiro podem ser UUID; manter o padrão final escolhido no projeto.

| Verbo e rota proposta | Uso |
|---|---|
| POST /api/TravelChat | Criar conversa |
| GET /api/TravelChat?take=10&skip=0 | Listar conversas do usuário |
| GET /api/TravelChat/{conversationId} | Consultar estado e preferências |
| GET /api/TravelChat/{conversationId}/Messages?take=20&skip=0 | Consultar mensagens paginadas |
| POST /api/TravelChat/{conversationId}/Messages | Enviar mensagem/resposta e obter esclarecimentos ou sugestões |
| POST /api/Itinerary | Salvar seleção inicial de paradas da conversa |
| GET /api/Itinerary?take=10&skip=0 | Listar roteiros próprios |
| GET /api/Itinerary/{itineraryId} | Consultar roteiro |
| PUT /api/Itinerary/{itineraryId} | Editar título, ordem e horários das paradas |

Entrada de mensagem, exemplo ilustrativo:

```json
{
  "clientMessageId": "ad407f58-6fe0-4bad-8945-f468bdaf3f94",
  "expectedVersion": 0,
  "text": "Quero passear no Recife no sábado e tomar um café perto de mim",
  "answers": [],
  "location": null
}
```

location, quando enviada por ação do usuário: latitude, longitude, capturedAt e accuracyMeters. Coordenadas devem ser finitas, latitude entre -90/90 e longitude entre -180/180. Precisão baixa e localização antiga exigem confirmação ou nova captura conforme limites configuráveis. Não usar 0/0 como ausência. answers contém questionId e valor estruturado; texto livre continua permitido e passa pelo mesmo processamento.

Resposta de mensagem:

```json
{
  "conversationId": "exemplo",
  "version": 1,
  "status": "awaitingAnswers",
  "message": "Qual sábado você pretende sair? Qual o período do passeio?",
  "questions": [
    { "id": "visit-date", "field": "visitDate", "text": "Qual a data do passeio?", "options": [] }
  ],
  "preferences": {},
  "suggestionGroups": [],
  "warnings": []
}
```

Exemplo reduzido: questions e preferences devem corresponder ao contrato completo validado; não retornar identificadores artificiais em produção. suggestionGroups conterá intentId, descrição da intenção, itens e paginação. Cada item terá kind (programming/host), entityId, dados públicos obtidos da API, distância quando calculável, faixa de preço e situação da compatibilidade. Texto explicativo não substitui os campos tipados.

Entrada de roteiro: conversationId, título, expectedVersion quando editar e items com kind, entityId, ordem, plannedStart e plannedEnd opcionais. O servidor valida os dados novamente; não confia em preço, nome, funcionamento ou elegibilidade enviados pelo cliente.

Retornos previstos: 201 em criações, 200 em consultas/mensagens/edições, 400 para contrato inválido, 401 sem autenticação válida, 404 para recurso inexistente/alheio, 409 para versão concorrente ou reaproveitamento conflitante de clientMessageId, 429 por limite, 502 para resposta inválida do workflow e 503 para indisponibilidade/timeout. Usar ProblemDetails conforme os controllers existentes. Sem resultados e necessidade de perguntas são respostas 200.

## 6. Contrato API ↔ n8n, versão 1

Entrada: contractVersion, requestId, conversationId pseudônimo, mensagem atual, data/hora de referência UTC, timeZone, preferências validadas, perguntas pendentes, respostas, histórico recente limitado e catálogo de categorias/tipos permitido. Limites iniciais propostos: mensagem de até 4.000 caracteres, 20 mensagens recentes e resposta de até 64 KB; confirmar na implementação.

Saída: contractVersion, requestId correspondente, assistantMessage, preferenceChanges, questions e readyToSearch. preferenceChanges deve distinguir set, clear e unrestricted; cada alteração identifica um campo permitido e seu valor tipado. A API não permite edição de caminhos arbitrários. Atualização com validação atômica: retorno inválido não altera preferências parcialmente.

Esquema das preferências:

| Campo | Significado |
|---|---|
| city | Cidade informada/confirmada |
| visitDate, startTime, endTime, endsNextDay, timeZone | Janela do passeio |
| participants | Inteiro positivo ou desconhecido |
| budget.amount, currency, scope, basis | BRL, total do roteiro/por parada, por pessoa/grupo |
| intents[] | id, descrição, tipos de resultado, categorias permitidas e termos de interesse |
| proximity.enabled, radiusMeters | Restrição espacial confirmada |
| originMode | currentLocation, selectedAddress, enteredAddress ou unknown |
| isFree | Preferência opcional por gratuidade |

Coordenadas exatas e endereço residencial não precisam ser enviados ao modelo para extrair preferências; ficam na API para cálculo. O n8n recebe apenas disponibilidade da origem e contexto geográfico mínimo necessário. Não enviar JWT, credenciais, CNPJ, telefone ou perfil completo.

O workflow recebe instruções fixas para não inventar categorias, locais, preços, horários, IDs ou respostas do usuário. Retorna somente JSON conforme schema. Texto do usuário é conteúdo para interpretação. Mesmo que readyToSearch seja true, a API impede busca com restrições ainda inconsistentes ou obrigatórias ausentes. A marcação do modelo não é autorização.

## 7. Regras da busca e proximidade

- Executar filtros no banco antes da paginação. Nunca buscar uma página genérica e descartar localmente os itens distantes, caros ou fechados.
- Programações: reutilizar regras existentes, adicionar validação da janela de visita e não confundir interseção de preço com custo garantido. Preservar categorias ativas e excluir registros indisponíveis.
- Hosts: somente Gastronomy/Business ativos, com novos filtros de faixa monetária, agenda e localização. Tratar dias fechados, múltiplos períodos e virada de dia. Agenda ausente significa horário desconhecido, não aberto.
- Busca espacial usa Address.Location e distância em metros na configuração espacial compatível com PostGIS. Conferir tradução SQL, SRID e índice espacial em teste de integração antes de concluir.
- Com proximidade obrigatória, endereço sem coordenadas não pode ser afirmado como próximo. Excluir do conjunto garantido e informar limitação quando relevante.
- Origem é a posição confirmada pelo usuário, não o centro da cidade. Se cidade e origem entrarem em conflito, esclarecer qual restrição prevalece.
- Resultados organizados por intenção: por exemplo turismo e café. Não aplicar todas as categorias como uma única exigência que elimine alternativas.
- Resolver categorias usando catálogo real. Para café/comércio especializado, a primeira entrega precisa definir classificação verificável ou apresentar correspondência textual como aproximada; não afirmar que todo host de gastronomia é cafeteria.
- Preços ausentes não são zero. Faixa que cruza o orçamento representa incerteza. Gastos de hosts são estimativas por pessoa; confirmar a semântica de preços de programações antes de somar.
- Disponibilidade aqui significa compatibilidade de cadastro, data e funcionamento, sem controle de lotação/reservas.
- A busca usa horários locais da visita convertidos corretamente para instantes UTC quando aplicável; horários semanais dos hosts permanecem locais. O modelo não escolhe conversões de fuso.
- Paginação e ordenação são estáveis, com desempate por ID. Por proximidade, ordenar pela distância; sem origem, usar critério determinístico por tipo. O usuário pode ajustar os filtros.

## 8. Montagem e persistência

Models propostos nas pastas existentes: TravelConversation, TravelMessage, Itinerary e ItineraryItem. Estado tipado de preferências pode ser armazenado como documento versionado associado à conversa, sem criar uma coluna para cada hipótese do modelo. Escolher mapeamento conforme padrões EF existentes.

Conversa: usuário, status, versão, preferências e datas. Mensagem: conversa, papel, conteúdo, clientMessageId, status de processamento, requestId e datas. Roteiro: usuário, conversa de origem, título, data, versão e datas. Item: roteiro, ordem, ProgrammingId ou HostId e horários planejados. Exatamente uma FK de destino por item; kind deriva da referência, evitando divergência. Índice único de mensagem por conversa/clientMessageId e de ordem por roteiro. Não persistir coordenadas precisas em logs ou mensagens; se a origem precisar ser guardada, limitar ao contexto da conversa com política de retenção e exclusão explícita.

Salvar roteiro não altera dados dos hosts/programações. Ao consultar, indicar item removido/desativado, sem apagá-lo silenciosamente. Ao editar/adicionar, revalidar elegibilidade, sobreposição de horários e funcionamento. Sem dados de deslocamento, não afirmar viabilidade entre paradas. Usar concorrência otimista e transação curta para salvar o estado; nunca manter transação de banco aberta durante a chamada ao n8n.

## 9. Camadas e entregas técnicas

Manter pastas, construtores, interfaces, nomenclatura, mappings, validações e DI conforme implementações equivalentes atuais. Nenhuma pasta nova é necessária.

- Presentation/Controllers: TravelChatController e ItineraryController propostos, com autenticação e tradução de erros.
- Application/DTO, Interfaces, AppServices, mappings e validações: contratos, validação de entrada e coordenação no padrão já utilizado.
- Domain/Model, interfaces e serviços: propriedade, contexto, regras de roteiro, restrições e contratos independentes do provedor.
- Data: repositories de conversa/roteiro, cliente HTTP do n8n e mapeamentos EF nas pastas existentes equivalentes.
- Program.cs: apenas registros/configuração necessários à feature, sem mudanças para contornar o protótipo.
- Frontend: chat, perguntas, ação explícita de localização, cartões de resultados e editor de paradas. Confirmar instruções próprias de frontend/AGENTS.md antes de editar.
- Protótipo externo: fluxo especial de chat, perguntas, reuso de conversationId/itineraryId, JWT e localização opcional. Atualizar catálogo e exemplos .http ao implementar as rotas.

## 10. Operação, falhas e proteção de dados

Webhook e segredo ficam em configuração do servidor. URL fixa configurada, sem URL controlada pelo usuário. Validar política de rede e autenticação entre API/n8n conforme ambiente de implantação. Não versionar segredos.

Definir timeout, limite de concorrência e frequência por usuário. Proposta inicial: 30 segundos por interpretação, sem repetição automática de POST sem deduplicação por requestId no workflow. Cancelamento/timeout mantém a mensagem recuperável. Mesmo clientMessageId com o mesmo corpo recupera resultado ou informa processamento; com corpo diferente retorna 409. Mensagens simultâneas da mesma conversa são serializadas ou rejeitadas por versão, sem respostas fora de ordem aplicadas ao contexto.

Logs técnicos limitados a requestId, duração, status e métricas; não registrar conversa, endereço, coordenadas ou segredo. Configurar também retenção e registro de execuções do n8n. Erros de provedor não expõem corpo bruto ao usuário. Definir política de retenção/exclusão de conversas antes de disponibilizar em produção; não inventar prazo nesta proposta.

## 11. Fases de implementação

1. Contrato: fechar nomes, schema JSON, semântica de orçamento, taxonomia dos hosts e regras de esclarecimento. Criar DTOs e exemplos válidos/ inválidos, ainda sem integração externa.
2. Conversas: models, configurações, repositories, services, AppServices, propriedade, idempotência e controle de versão. Preparar migration para revisão conforme fluxo do projeto.
3. n8n: cliente HTTP, webhook autenticado, prompt e schema de saída; validar com workflow simulado antes da execução real.
4. Busca: filtros compostos, hosts por funcionamento/preço, proximidade e grupos de intenção. Validar SQL espacial e casos de agenda no PostgreSQL descartável.
5. Roteiro: persistência de seleção, ordem, horários, revalidação e itens indisponíveis.
6. Interfaces: protótipo, exemplos HTTP e frontend com chat, geolocalização e montagem do roteiro.
7. Validação integrada e operação: ensaio do fluxo real com dados de teste autorizados, configuração de segredos/limites, documentação e tratamento de indisponibilidade.

Cada fase entrega código revisável e documentação atualizada. Não marcar integração concluída com base apenas em um JSON de exemplo ou teste simulado.

## 12. Critérios de aceite e testes planejados

- Frase inicial abre conversa; resposta posterior completa preferências sem perder o histórico.
- Correção de cidade, data, valor ou quantidade substitui apenas os campos indicados; remover uma restrição funciona.
- Falta/ambiguidade de dados relevantes gera perguntas; indiferença explícita permite continuar.
- Roteiro aceita programação, host gastronômico e comércio juntos; rejeita host produtor como parada independente.
- Sem localização e com pedido de proximidade, assistente solicita origem; recusa de permissão permite alternativa manual.
- Distância usa origem/raio confirmados, exclui coordenadas ausentes do resultado garantido e filtra antes de paginar.
- Agenda cobre fechamento, madrugada, intervalos, dia da semana e horários desconhecidos; preço ausente não vira gratuidade.
- Categorias/IDs inventados, JSON inválido ou instruções fora do contrato são rejeitados sem corromper estado.
- Usuário não acessa conversas/roteiros alheios; duplicação e concorrência não duplicam mensagens nem sobrescrevem contexto.
- Zero resultados é comunicado e relaxamentos exigem escolha do usuário.
- Salvar/editar roteiro revalida itens, ordem e horários, sem prometer vagas ou deslocamentos exatos.
- Testes de domínio/contrato com n8n simulado; testes de integração de repositories com PostgreSQL/PostGIS descartável; testes HTTP com autenticação e dependências simuladas.
- No protótipo: node --check e node --test, usando API simulada; nenhum teste exclui/modifica dados reais. Frontend recebe as verificações previstas no projeto.

Validação desta entrega: leitura estática dos DTOs, models e filtros existentes; revisão do escopo informado pelo usuário. Nenhum build, teste automatizado, chamada ao n8n, teste espacial, alteração de banco ou exportação de PDF foi executado nesta etapa exclusivamente documental.

## 13. Documentação a atualizar durante a execução

Controllers: rotas/status/autorização. Regras: esclarecimentos, elegibilidade e montagem. Tokens: proteção e identidade do usuário, sem enviar JWT ao n8n. DTOs: schemas e validações. Docker: variáveis/rede do workflow quando houver implantação. BD e entidades: persistência/índices/migrations. Arquitetura: fluxo aplicativo → API → n8n → API → banco. PDFs somente por solicitação explícita.

## 14. Baby step 1 — contrato da primeira action (Presentation)

Atualização: 05/11/2026. Ordem solicitada: Presentation → Application → Domain → Data; uma action por vez. Este passo define somente a primeira action. Não foram criados arquivos C# nem publicados endpoints: os contratos Application referidos abaixo ainda não existem. A implementação posterior deve seguir esta ordem, sem antecipar a implementação das camadas inferiores.

### Primeira action: SendMessage

- Controller proposto: TravelChatController, na pasta Presentation/Controllers existente.
- Verbo/rota: POST /api/TravelChat/Messages.
- A primeira mensagem cria a conversa quando ConversationId for nulo; mensagens seguintes informam o ID recebido. Isso permite trabalhar o chat inteiro inicialmente com uma única action, sem depender de uma action separada de criação. Esta decisão substitui, para a primeira entrega, a criação de conversa por POST /api/TravelChat prevista na seção 5.
- Atributos: [Authorize], [ApiController], [Route("api/[controller]")] e [HttpPost("Messages")].
- Identidade: UserManager<User>.GetUserId(User), conforme os controllers existentes; nunca receber UserId do cliente. Usuário ativo e propriedade serão verificados na camada de negócio.
- Entrada [FromBody]: TravelChatMessageDTO (a definir no próximo passo, Application).
- Saída: TravelChatResponseDTO, em 200, tanto para perguntas quanto para sugestões. A primeira mensagem também retorna o ConversationId.
- Dependência: ITravelChatAppService.SendMessageAsync(dto, userId, cancellationToken), a definir na Application; usar HttpContext.RequestAborted para cancelamento.
- Exceções: UnauthorizedAccessException → ProblemDetails 401; ArgumentException → 400; KeyNotFoundException → 404. Erros específicos de concorrência, limite e workflow serão acrescentados quando seus contratos existirem, sem capturar Exception genericamente.
- O controller somente recebe os dados, identifica o usuário, delega e traduz o resultado HTTP. Não chama n8n, EF, filtros ou geolocalização diretamente.

Formato mínimo planejado para a entrada:

```json
{
  "conversationId": null,
  "clientMessageId": "ad407f58-6fe0-4bad-8945-f468bdaf3f94",
  "expectedVersion": 0,
  "text": "Quero passear no Recife no sábado e tomar um café perto de mim",
  "answers": [],
  "location": null
}
```

ConversationId nulo e ExpectedVersion zero representam conversa nova. Identificador de mensagem precisa ser preservado pelo cliente em repetição da mesma requisição, inclusive antes de receber ConversationId; a implementação deverá deduplicar o primeiro envio por usuário/ClientMessageId, não somente por conversa. Contratos e persistência devem incorporar essa regra.

Próximo baby step: definir apenas TravelChatMessageDTO e os tipos mínimos de entrada necessários à mesma action; depois a interface Application, sem implementar outra action. O método só deve ser incorporado ao controller compilável quando suas referências existirem, sem publicar respostas fictícias de sucesso ou um endpoint provisório 501.

Validação deste passo: comparação estática com AddressController e FavoriteController e conferência do estado Git. Sem mudança funcional, build, teste, protótipo, banco ou PDF.

## TravelChatController: estrutura inicial — 05/11/2026

Criada Presentation/Controllers/TravelChatController.cs, herdando de ControllerBase, com [Authorize], [ApiController] e [Route("api/[controller]")], conforme o padrão existente. A classe ainda não possui actions, dependências ou construtor explícito. O prefixo planejado é /api/TravelChat, mas não existe endpoint acessível desta controller enquanto não houver action. Application, Domain, Data, Program.cs e banco não foram alterados.

Validação: dotnet build do projeto com --no-restore e saída isolada aprovado com zero erros e nove avisos de nulabilidade em arquivos existentes. Sem testes HTTP, execução da API, n8n ou banco. Protótipo preservado porque não houve mudança funcional nem contrato HTTP disponível; PDFs não exportados.

## Chat de roteiros: DTO de entrada — 05/11/2026

Criados na Application/DTO os contratos TravelChatMessageDTO e TravelChatLocationDTO, ainda sem action ou interface de AppService consumidora.

| Campo | Tipo e validação atual |
|---|---|
| ConversationId | Guid? opcional; nulo indica intenção de iniciar conversa |
| ClientMessageId | Guid? obrigatório, mantido pelo cliente em tentativas da mesma mensagem |
| ExpectedVersion | int? obrigatório, de 0 a int.MaxValue |
| Text | string obrigatória, até 4.000 caracteres |
| Location | TravelChatLocationDTO opcional |
| Location.Latitude | double? obrigatório quando Location for enviado; -90 a 90 |
| Location.Longitude | double? obrigatório quando Location for enviado; -180 a 180 |
| Location.CapturedAt | DateTimeOffset? obrigatório quando Location for enviado |
| Location.AccuracyMeters | double? opcional e não negativo |

Tipos numéricos obrigatórios são anuláveis para diferenciar omissão de zero, conforme DTOs existentes. Não há UserId na entrada. Nesta primeira versão, respostas às perguntas serão enviadas em Text; o campo answers do plano não foi implementado. A confirmação de raio/origem continua sendo parte futura do contexto, não é inferida pela simples presença de Location.

DataAnnotations definem apenas restrições estruturais. Rejeição de Guid.Empty, versão inicial incompatível, localização antiga/futura, valores não finitos em chamadas internas, propriedade e idempotência continuam pendentes das validações e serviços. Não há captura automática de localização nem chamada ao n8n. Nenhuma regra de negócio foi marcada como implementada por causa destes DTOs.

Validação: dotnet build --no-restore com saída isolada aprovado com zero erros e nove avisos de nulabilidade em arquivos existentes. Não executados testes automatizados de validação, HTTP, n8n ou banco. Sem mudança no protótipo, porque nenhum endpoint foi acrescentado; sem migração ou PDF. Próximo passo proposto: contrato de resposta da mesma action, antes da interface de AppService.

## Chat: simplificação do contrato de entrada — 05/11/2026

Estado atual, substituindo a versão anterior com GUID/ExpectedVersion: TravelChatMessageDTO contém somente ConversationId (int? opcional, entre 1 e int.MaxValue quando informado), Text (obrigatório, até 4.000 caracteres) e Location (TravelChatLocationDTO opcional, sem alterações). ConversationId nulo representa início de conversa; um ID informado representa continuidade. Removidos ClientMessageId e ExpectedVersion. Controle de repetição e concorrência fica para uma etapa futura, sem garantia implementada nesta versão.

UserId não é recebido no DTO: a futura action deverá obtê-lo do JWT por UserManager<User>.GetUserId(User) e passá-lo à Application. Associação da conversa ao usuário e verificação de propriedade ainda não estão implementadas. Controller continua sem actions; nenhum contrato HTTP foi publicado, e o protótipo permanece inalterado. As seções anteriores documentam a evolução; exemplos do plano com GUID/versão são propostas anteriores, substituídas por esta decisão para a primeira entrega.

Exemplo atual de corpo planejado:

```json
{
  "conversationId": null,
  "text": "Quero passear no Recife e tomar um café",
  "location": null
}
```

Sem alteração de banco, workflow ou PDFs. Validação de compilação registrada abaixo após conclusão; não foram executados testes funcionais.

Validação da simplificação: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade em arquivos existentes. Sem testes automatizados ou HTTP nesta etapa.

## Chat: contrato de resposta inicial — 05/11/2026

Criado Application/DTO/TravelChatResponseDTO.cs, seguindo as classes de resposta existentes, com strings e listas inicializadas:

| Campo | Tipo | Finalidade |
|---|---|---|
| ConversationId | int | Identificador da conversa iniciada ou continuada |
| Message | string | Texto de resposta do assistente |
| Questions | List<string> | Perguntas de esclarecimento; vazia quando não houver perguntas |
| Programmings | List<ProgrammingResponseDTO> | Sugestões de programações reais, reaproveitando contrato existente |
| Hosts | List<HostResponseDTO> | Sugestões de gastronomia/comércio, reaproveitando contrato existente |

Exemplo planejado de esclarecimento (ID meramente ilustrativo):

```json
{
  "conversationId": 1,
  "message": "Preciso de algumas informações para buscar opções.",
  "questions": [
    "Qual a data e o período do passeio?",
    "Qual o orçamento e para quantas pessoas?"
  ],
  "programmings": [],
  "hosts": []
}
```

Na primeira versão, Questions contém textos e as respostas do usuário virão em Text da mensagem seguinte. Não foram implementados IDs/opções estruturadas por pergunta. As listas de resultados são separadas por tipo; agrupamento por intenção, distância calculada, avisos e estado estruturado continuam pendentes de seus próximos passos. O DTO não implementa filtro nem validação de elegibilidade: restringir Hosts a gastronomia/comércio e obter resultados reais são responsabilidades futuras dos serviços. Não há montagem ou persistência de roteiro neste contrato.

Este DTO ainda não é retornado por nenhuma action: TravelChatController permanece vazio, e não há chamada ao n8n ou contrato de AppService. A definição inicial simplificada prevalece sobre exemplos mais abrangentes de resposta do plano; aquelas capacidades continuam planejadas para evolução. Nenhuma mudança funcional ou HTTP publicada, portanto protótipo e .http preservados. Sem alterações no banco, Program.cs ou PDFs. Próximo passo: definir somente ITravelChatAppService para SendMessageAsync, usando os contratos de entrada e saída existentes.

Validação do DTO de resposta: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade em arquivos existentes; git diff --check sem erros. Sem testes automatizados, HTTP, banco ou n8n nesta etapa.

## Chat: interface Application — 05/11/2026

Criada Application/Interfaces/ITravelChatAppService.cs com somente o contrato:

```csharp
Task<TravelChatResponseDTO> SendMessageAsync(TravelChatMessageDTO dto, string userId, CancellationToken cancellationToken = default);
```

dto transporta a mensagem, ConversationId e localização opcional. userId será obtido do JWT pela futura action, separado do corpo enviado pelo aplicativo. cancellationToken permitirá propagar HttpContext.RequestAborted, conforme contrato equivalente de endereço. Retorno usa TravelChatResponseDTO já existente.

Este passo não implementa AppService, validações, propriedade, chamadas ao n8n ou persistência. Nenhum registro de DI foi acrescentado; TravelChatController continua sem actions e não depende desta interface ainda. Próximo passo: definir a action SendMessage na Presentation utilizando este contrato; implementação concreta e registro serão tratados posteriormente, sem apresentar integração como concluída.

Validação: build --no-restore com saída isolada aprovado com zero erros e nove avisos de nulabilidade em arquivos existentes. Sem testes automatizados ou HTTP; sem API/banco/n8n executados, protótipo alterado ou PDF exportado. Não houve mudança de contrato HTTP publicado.

## Chat: action SendMessage preparada — 05/11/2026

Implementada na Presentation a única action POST /api/TravelChat/Messages, em TravelChatController. Recebe TravelChatMessageDTO por [FromBody], exige [Authorize], obtém userId com UserManager<User>.GetUserId(User), rejeita ID ausente com ProblemDetails 401 e delega à ITravelChatAppService.SendMessageAsync(dto, userId, HttpContext.RequestAborted). O UserId não é aceito no corpo. Retorno previsto 200 com TravelChatResponseDTO; UnauthorizedAccessException, ArgumentException e KeyNotFoundException são traduzidas para 401, 400 e 404. DataAnnotations/[ApiController] validam a estrutura de entrada.

Limitação atual: não existe TravelChatAppService concreto nem registro de ITravelChatAppService na DI. A rota está declarada, mas requisições autenticadas válidas ainda falham na ativação da controller por dependência não resolvida. Os retornos acima descrevem o código da action, não um fluxo funcional já disponível. Não há n8n, persistência, verificação de propriedade ou conta ativa implementados. Program.cs e banco preservados. Próximo passo: estrutura do AppService da mesma action, sem outra action.

Protótipo: catálogo real reconhece POST /api/TravelChat/Messages como autenticado, com conversationId opcional numérico, text obrigatório até 4.000 caracteres e location JSON opcional. Acrescentado aviso de implementação pendente no formulário automático; sem captura de geolocalização ou editor de chat nesta etapa. Reaproveitamento automático do ID da conversa fica pendente até o fluxo funcional; o campo pode ser informado manualmente. Exemplo .http identificado como ainda indisponível.

Validações executadas: build --no-restore com saída isolada, zero erros e nove avisos de nulabilidade em arquivos existentes; node --check em public/app.js e catalog.mjs; catálogo real lido; 101 testes do protótipo aprovados com API simulada. Primeira execução dos testes bloqueada por EACCES de localhost no sandbox; repetição autorizada fora dele aprovada. Sem teste HTTP da nova action, API reiniciada, banco real alterado, workflow ou PDF exportado.

## Chat: estrutura do AppService — 05/11/2026

Criada Application/AppServices/TravelChatAppService.cs implementando ITravelChatAppService, com somente SendMessageAsync e a assinatura já definida. O corpo lança NotImplementedException: trata-se de estrutura incremental, sem resposta fictícia nem lógica de negócio. Não foram adicionadas dependências/construtor por ainda não existirem os contratos necessários do domínio, mappings e validação. Não houve registro na DI ou alteração em Program.cs.

Estado atual: o arquivo concreto agora existe, mas sua implementação funcional continua pendente. A action SendMessage permanece indisponível em execução pela ausência de registro da interface; registrar o esqueleto agora apenas deslocaria a falha para NotImplementedException. Não há integração com n8n, persistência, filtros ou verificação de propriedade. A ordem e o escopo de uma única action foram preservados.

Validação executada: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade em arquivos existentes. Sem testes automatizados do esqueleto, HTTP, banco, API reiniciada, n8n ou PDF. Protótipo preservado: não houve alteração de rota, DTO ou comportamento funcional, e o aviso de implementação/registro pendentes continua válido.

Próximo baby step proposto: validação de entrada da mensagem na Application seguindo IValidation<T> existente, antes de definir a delegação ao domínio.

## Chat: validação da entrada na Application — 05/11/2026

Criada TravelChatMessageValidation em Application/Validations/Validations (pasta existente), implementando IValidation<TravelChatMessageDTO>. Segue o padrão de OpeningWeekValidation: DTO nulo é rejeitado; DataAnnotations são executadas no DTO da mensagem e, quando presente, no DTO de localização. Falhas geram ArgumentException, compatível com o tratamento 400 da action.

Cobertura: Text obrigatório/não composto somente por espaços e até 4.000 caracteres; ConversationId opcional e positivo; localização opcional, mas com latitude/longitude/data obrigatórias quando enviada; faixas de coordenadas; precisão opcional não negativa; rejeição explícita de valores numéricos não finitos (incluindo precisão infinita em chamadas internas). Coordenadas 0/0 não são tratadas como ausência. Nenhum dado é alterado ou normalizado pela validação.

TravelChatAppService agora recebe IValidation<TravelChatMessageDTO> no construtor e chama Validate(dto, DateTime.UtcNow) antes do ponto ainda pendente de implementação. Entradas inválidas são rejeitadas ao chamar o AppService diretamente com a validação real; entradas válidas ainda chegam a NotImplementedException. Interface e DTOs preservados. Sem registro de AppService/validação na DI; action ainda não funcional.

O parâmetro now mantém o contrato existente, mas não introduz limites arbitrários de idade/precisão da localização. Validação de localização antiga/futura, confirmação de origem/raio, propriedade, conta ativa, persistência e n8n continuam pendentes. O próximo passo proposto é definir o contrato do domínio para esta mesma action, sem implementar outra rota.

Validações executadas: build --no-restore com saída isolada aprovado com zero erros e nove avisos anteriores de nulabilidade. Executadas 32 verificações locais da validação real, todas aprovadas, em TravelChatValidationCheck.cs/.csproj no tmp do workspace do protótipo: nulo, texto e limites, ID, localização completa/incompleta, coordenadas extremas/fora de faixa, NaN/infinito e precisão. Harness isolado reportou aviso MSB3539 de configuração de saída intermediária; não houve falha. Sem testes HTTP, n8n, banco, API reiniciada ou PDFs. Protótipo preservado: rotas/DTOs continuam iguais e o aviso de indisponibilidade continua aplicável.

## Chat: mapping e delegação do AppService — 05/11/2026

Criados ITravelChatMapping e TravelChatMapping, com ToModel(TravelChatMessageDTO) e ToDTO(TravelChatResponse). Entrada preserva ConversationId, Text e localização opcional (latitude, longitude, captura e precisão). ToModel pressupõe validação prévia dos campos obrigatórios, conforme padrão de OpeningHoursMapping. Não consulta endereço, geocodifica, infere origem ou normaliza texto. Saída preserva conversa/mensagem/perguntas, copia a lista de perguntas e reaproveita IProgrammingMapping.ToDTO/IHostMapping.ToDTO nas listas de sugestões.

Criados somente os tipos necessários no domínio: TravelChatMessage, TravelChatLocation e TravelChatResponse, sem dependência de DTO/Application. São objetos de transferência entre Application e Domain, não entidades persistidas. Criada ITravelChatService com SendMessageAsync(message, userId, cancellationToken), ainda sem implementação concreta.

TravelChatAppService recebe validação, mapping e interface do service no construtor. SendMessageAsync agora executa: Validate(dto, DateTime.UtcNow) → ToModel(dto) → await service.SendMessageAsync(message, userId, cancellationToken) → ToDTO(response). Removido o NotImplementedException do AppService. UserId continua separado da mensagem, vindo da identidade da action; cancelamento é encaminhado sem substituição. A implementação concreta do service, regras de propriedade e registro de todas as novas dependências na DI continuam pendentes. Portanto a action ainda não funciona em execução. Próximo baby step: estruturar o service de domínio da mesma action.

Sem alteração de contratos HTTP/DTO, Program.cs, DbSets, configuração EF, migration, banco, n8n ou PDFs. Protótipo preservado: aviso de implementação/registro pendentes continua aplicável.

Validações do mapping: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade. TravelChatMappingCheck.cs/.csproj no tmp do workspace do protótipo executou 17 verificações aprovadas com mapping/validação/AppService reais e ITravelChatService simulado: localização opcional/completa, dados de resposta, cópia das perguntas, mapeamento de sugestões, encaminhamento de usuário/token de cancelamento e rejeição de entrada inválida antes do service. Sem teste HTTP, banco ou n8n. git diff --check sem erros.

## Chat: coordenadas como Point no domínio — 05/11/2026

TravelChatLocation agora contém Point? Location (NetTopologySuite), substituindo os doubles Latitude/Longitude do objeto de domínio. CapturedAt e AccuracyMeters foram preservados. TravelChatMessage mantém o objeto opcional TravelChatLocation para agrupar posição e metadados; acesso espacial no domínio será message.Location?.Location. Não se trata de uma coluna ou entidade EF.

DTOs HTTP permanecem iguais: TravelChatLocationDTO recebe latitude, longitude, capturedAt e accuracyMeters. TravelChatMapping.ToModel, chamado após a validação no AppService, cria Point(longitude, latitude) com SRID 4326. Longitude corresponde a X e latitude a Y. Ausência do DTO de localização mantém o objeto de domínio nulo, sem inventar posição. O mapping de resposta não expõe Point.

Esta alteração prepara a representação espacial; não implementa busca por distância nem cálculo em metros, que dependerão da consulta espacial na Data. Nenhuma alteração em Address, DbSets, configurações EF, migrations, DI, n8n ou banco. A action permanece indisponível até a implementação concreta do service e os registros necessários. Como os contratos HTTP foram preservados, protótipo e exemplos não exigem mudanças. PDFs preservados.

Validação do Point: dotnet run --no-restore do harness TravelChatMappingCheck compilou o backend e aprovou 18 verificações, incluindo X=longitude, Y=latitude, SRID=4326, preservação de metadados, localização ausente, resposta e fluxo do AppService com service simulado. Compilação sem erros, nove avisos anteriores de nulabilidade. git diff --check sem erros. Sem HTTP, consulta espacial, banco ou n8n.

## Chat: estrutura do service de domínio — 05/11/2026

Criada Domain/Service/TravelChatService.cs implementando ITravelChatService, somente com SendMessageAsync(TravelChatMessage message, string userId, CancellationToken cancellationToken = default). O corpo lança NotImplementedException, deixando explícita a implementação pendente. Ainda não há dependências nem construtor explícito, regras, persistência ou integração com n8n.

O fluxo da Application permanece Validate → ToModel → interface do service → ToDTO, sem alterações no mapping com Point ou DTOs. A classe concreta do service agora existe, mas é apenas estrutura; DI continua sem registro e a action permanece indisponível em execução. Não registrar o esqueleto como se o fluxo estivesse pronto. Próximo baby step: verificar identificação e conta ativa do usuário no service, seguindo IUserRepository e os serviços equivalentes, antes de tratar contexto da conversa.

Validação executada: build --no-restore com saída isolada aprovado com zero erros e nove avisos existentes de nulabilidade; git diff --check sem erros. Não foram criados testes para o corpo provisório que apenas lança exceção. Sem teste HTTP, API reiniciada, n8n, banco, migration ou PDF. Protótipo preservado: nenhum contrato/comportamento funcional foi acrescentado; seu aviso de implementação/registro pendentes continua válido.

## Chat: identificação e conta ativa no service — 05/11/2026

TravelChatService agora recebe IUserRepository no construtor, seguindo FavoriteService. SendMessageAsync rejeita mensagem nula e executa ValidateUserAsync antes do trecho ainda pendente. ID nulo/vazio/somente espaços gera UnauthorizedAccessException("Usuário não autenticado.") sem consultar o repository. GetbyId(userId) é usado para verificar existência e IsActive; conta inexistente/inativa gera UnauthorizedAccessException("Usuário indisponível."). A action já traduz essa exceção para ProblemDetails 401. Falhas do repository não são mascaradas como falhas de autenticação.

A verificação usa o ID fornecido pela action a partir do JWT, não um UserId no DTO. Não verifica propriedade da conversa ainda: não existe persistência de conversa. Para usuário ativo e entrada válida, o método continua lançando NotImplementedException no trecho não implementado. DI permanece sem registros da feature, e a rota continua indisponível em execução.

Não houve alteração de DTOs, mappings, emissão/validação de JWT, contratos HTTP, Program.cs, models, EF, migration ou banco. IUserRepository.GetbyId não recebe CancellationToken no contrato existente; esse contrato foi preservado. A implementação futura deverá tratar o cancelamento das etapas seguintes. Sem protótipo alterado ou PDF exportado.

Próximo baby step proposto: definir o objeto de conversa no domínio, com seu UserId, para depois estabelecer a consulta e verificação de propriedade antes de enviar contexto ao n8n.

Validações deste passo: dotnet run --no-restore do harness TravelChatUserCheck.cs/.csproj compilou o backend sem erros (nove avisos de nulabilidade existentes) e aprovou 13 verificações com IUserRepository simulado: IDs ausentes, conta inexistente/inativa, conta ativa chegando ao trecho pendente, mensagem nula e propagação de falha do repository. git diff --check sem erros. Sem teste HTTP, banco real ou n8n.

## Chat: reutilização da verificação de usuário — 05/11/2026

Correção da etapa anterior: TravelChatService agora injeta IUserService e chama GetProfileAsync(userId), função existente que retorna null para identificação ausente, usuário inexistente ou inativo. Removidos IUserRepository e o auxiliar duplicado ValidateUserAsync deste service. Retorno nulo gera UnauthorizedAccessException("Usuário indisponível."), traduzida pela action para 401. A verificação inicial da identidade na controller permanece. GetProfileAsync não foi alterado, nem foram refatorados outros services.

Mantidos mapping, validação de DTO, assinatura e trecho ainda pendente (NotImplementedException após usuário válido). DI e restante da feature continuam pendentes; endpoint indisponível em execução. Sem alteração de banco, contrato HTTP, protótipo, workflow ou PDF. Orientação permanente registrada nos AGENTS.md dos dois workspaces: pesquisar e reutilizar funções equivalentes antes de criar novas, usando GetProfileAsync para conta existente/ativa.

Validação da correção: compilação do backend pelo harness --no-restore aprovada sem erros, com nove avisos existentes; 13 verificações de delegação/retorno nulo/conta disponível/mensagem nula/propagação de erro aprovadas com IUserService simulado. GetProfileAsync real revisado estaticamente; não executado teste de integração dele nesta etapa. Sem HTTP ou banco. git diff --check sem erros.

## Chat: model da conversa — 05/11/2026

Criado Domain/Model/TravelChatConversation.cs após conferir ausência de model equivalente e comparar Favorite/Subscription. Contém Id (int), User (navegação), UserId (string), IsActive (true inicialmente), CreatedAt e UpdatedAt (inicializados com DateTime.UtcNow), seguindo o padrão existente de Favorite. UserId permitirá associar a conversa ao usuário autenticado; o model não verifica propriedade por si só.

Não foram adicionadas coleção de mensagens, preferências extraídas ou estado do workflow neste passo. TravelChatMessage continua sendo o objeto de entrada do service, não uma mensagem persistida de histórico. Model User e DTOs preservados. Sem DbSet, configuração EF, migration, tabela, repository ou utilização do novo model pelo service; criação/consulta de conversas e verificação de propriedade continuam pendentes. O UserId da conversa deverá ser preenchido pelo fluxo servidor, nunca pelo DTO do aplicativo.

Próximo baby step: definir a interface do repository para criar/consultar uma conversa pertencente ao usuário, antes de implementar acesso a dados. Action SendMessage permanece sem funcionamento completo e sem registros de DI da feature. Sem alterações no protótipo, n8n, banco ou PDFs.

Validação do model: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Não foram criados testes para propriedades sem lógica. Sem teste HTTP, persistência, banco ou n8n.

## Chat: interface do repository de conversa — 05/11/2026

Criada Domain/Interfaces/Repository/ITravelChatConversationRepository.cs após conferir contratos existentes de Address, Favorite e OpeningHours e ausência de repository equivalente. Contém somente:

```csharp
Task<TravelChatConversation> AddAsync(TravelChatConversation conversation, CancellationToken cancellationToken = default);
Task<TravelChatConversation?> GetByIdAsync(int conversationId, string userId, CancellationToken cancellationToken = default);
```

AddAsync representa salvar a conversa cujo UserId deverá ser preenchido no service a partir da identidade autenticada. GetByIdAsync recebe ID da conversa e do usuário: o contrato da futura implementação exige restringir a consulta à conversa ativa pertencente ao usuário e retornar null para inexistente, inativa ou alheia, permitindo resposta 404 uniforme pelo service. Esse filtro ainda não foi implementado nem testado em banco. CancellationToken permitirá propagar cancelamento à persistência, sem modificar os repositories existentes.

Este passo define apenas a interface no domínio. Sem repository concreto, DbSet, configuração EF, migration, tabela, DI ou chamada desta interface no service. Não foram acrescentadas operações de listagem/edição, actions ou contratos HTTP. IUserService.GetProfileAsync permanece como função reutilizada para validar a conta. Próximo baby step: conectar o contrato ao TravelChatService para iniciar uma conversa ou consultar a conversa do usuário, com repository simulado na validação.

Sem mudança no protótipo, workflow, banco ou PDFs; action continua indisponível em execução por implementação/DI pendentes.

Validação da interface: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para interface sem implementação, HTTP, persistência, banco ou n8n.

## Chat: seleção/início da conversa no service — 05/11/2026

TravelChatService agora recebe ITravelChatConversationRepository pelo construtor. Após rejeitar mensagem nula e reutilizar IUserService.GetProfileAsync para validar a conta, resolve a conversa: sem ConversationId, chama AddAsync com novo TravelChatConversation cujo UserId vem do parâmetro autenticado do service; com ID, exige valor positivo e chama GetByIdAsync(id, userId). Conversa ausente, inativa ou de outro usuário gera a mesma KeyNotFoundException, já traduzida para 404 pela action. Não cria outra conversa silenciosamente quando um ID existente não pode ser usado.

CancellationToken é verificado antes de consultar o usuário e antes de iniciar a etapa de conversa, e encaminhado aos dois métodos do repository. GetProfileAsync mantém contrato existente sem token. Erros de persistência não são mascarados. O objeto de conversa resolvido foi preparado para as próximas etapas de histórico/contexto; ainda não produz resposta.

Limite incremental: após resolver a conversa, o fluxo continua lançando NotImplementedException. Se fosse ligado a um repository real neste estágio, AddAsync poderia salvar uma conversa antes da falha final; por isso a feature permanece sem DI e não deve ser apresentada como funcional. Não há repository concreto, EF, migration ou chamadas reais ao banco. Atomicidade de histórico e resposta, falhas do workflow e novas tentativas deverão ser resolvidas antes de habilitar o fluxo completo.

Sem alteração de DTO, mapping, rota, protótipo, n8n ou PDF. Próximo baby step proposto: definir o model de mensagem persistida do histórico, separado de TravelChatMessage (entrada do service), antes de criar os respectivos contratos de persistência.

Validação desta etapa: dotnet run --no-restore de TravelChatConversationCheck.cs/.csproj compilou o backend sem erros, com nove avisos existentes, e aprovou 22 verificações com IUserService/repository simulados: início/continuidade, identidade enviada, conversa inexistente/inativa/alheia, IDs inválidos, usuário indisponível, cancelamento, mensagem nula e falhas de persistência propagadas. O fluxo válido foi verificado somente até a exceção do trecho pendente. git diff --check sem erros; sem HTTP, banco real ou n8n.

## Chat: model da mensagem do histórico — 05/11/2026

Criado Domain/Model/TravelChatHistoryMessage.cs após conferir os models existentes e ausência de equivalente. Segue o padrão de navegação/chave de HostOpeningPeriod e enum no mesmo arquivo de ProgrammingInteraction.

Campos: Id (int), Conversation (TravelChatConversation), ConversationId (int), Role (TravelChatMessageRole), Text (string inicializada vazia) e CreatedAt (DateTime.UtcNow). TravelChatMessageRole define User=0 e Assistant=1. O papel deverá ser atribuído pelo servidor conforme a origem da mensagem, não recebido do aplicativo para autorizar mensagens de assistente. O usuário proprietário será obtido pela conversa, sem duplicar UserId em cada mensagem.

TravelChatMessage continua como entrada do service, com localização opcional; não foi transformado na entidade do histórico. O novo model não contém coordenadas, precisão, JWT ou instrução de sistema. Text permite armazenar perguntas do assistente e respostas do usuário; persistência estruturada de perguntas, sugestões e preferências será tratada em passos posteriores, não está implementada por este model.

Estado: somente estrutura de domínio, sem coleção acrescentada à conversa, repository de mensagens, DbSet, configuração EF, limites de coluna, índice, migration ou tabela. Nenhum histórico está sendo salvo ou consultado; service e DI permanecem incompletos. Próximo baby step: definir a interface do repository de mensagens do histórico, para adicionar mensagem e recuperar contexto da conversa, preservando a verificação de propriedade no fluxo.

Sem alteração de DTO, mapping, rota, protótipo, banco, workflow ou PDFs. Nenhum teste funcional ou de persistência foi realizado nesta etapa de propriedades sem lógica.

Validação do model de histórico: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.

## Chat: interface do repository de histórico — 05/11/2026

Criada Domain/Interfaces/Repository/ITravelChatHistoryMessageRepository.cs após conferir os repositories existentes e ausência de equivalente. Contém somente AddAsync(TravelChatHistoryMessage message, CancellationToken cancellationToken = default) e GetRecentByConversationIdAsync(int conversationId, string userId, int take = 20, CancellationToken cancellationToken = default), retornando respectivamente a mensagem salva e List<TravelChatHistoryMessage>.

Contrato para a futura implementação: AddAsync salva a mensagem vinculada à conversa previamente validada pelo service; Role será atribuído pelo servidor. Consulta deve restringir a conversa ativa pertencente ao userId, selecionar as últimas take mensagens por CreatedAt/Id e devolvê-las em ordem cronológica crescente (CreatedAt e Id como desempate), para contexto do n8n. take padrão 20 não significa carregar todo o histórico; limitar a faixa de 1 a 100 na implementação/fluxo, conforme padrão de paginação do sistema. Consulta sem registros elegíveis retorna lista vazia; a inexistência/propriedade da conversa deve ser verificada antes pelo contrato já existente de conversa, evitando interpretar lista vazia como autorização.

Este passo define apenas a interface. Não implementa ordenação, filtros, validações, acesso a dados, histórico no service, DI, EF ou persistência. Essas garantias ainda dependem de código e testes futuros. Não foi criada action de consulta de histórico nem alterado DTO/rota. Próximo baby step: conectar o repository de histórico ao TravelChatService para recuperar contexto e registrar a mensagem do usuário, com dependências simuladas e decisão explícita sobre falhas/reenvio antes de habilitar persistência real.

Sem alteração de protótipo, banco, workflow ou PDF; a feature permanece incompleta e indisponível em execução.

Validação da interface de histórico: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Sem testes automatizados para interface sem implementação, HTTP, persistência, banco ou n8n.

## Chat: histórico conectado ao service — 05/11/2026

TravelChatService agora recebe ITravelChatHistoryMessageRepository no construtor. Após reutilizar GetProfileAsync e resolver/validar a conversa, chama GetRecentByConversationIdAsync(conversation.Id, userId, take: 20, cancellationToken) e, em seguida, AddAsync com ConversationId validado, Role=User e Text da mensagem atual. CreatedAt segue a inicialização UTC do model. Nenhuma coordenada ou metadado de localização é copiado para o histórico.

A leitura ocorre antes da gravação para que o contexto recente não contenha novamente a mensagem atual, que será enviada separadamente ao workflow em passo futuro. O contexto é recuperado, mas ainda não utilizado: a integração com o workflow não foi criada. Não são geradas nem salvas respostas fictícias de assistente. Falha na leitura impede a gravação da mensagem; falha na gravação é propagada, sem repetição automática. Cancelamento é verificado antes da leitura e entre leitura/gravação, além de ser encaminhado ao repository.

Limite incremental: o método ainda termina em NotImplementedException depois dessas operações. Se conectado ao banco nesta etapa, poderia salvar conversa/mensagem sem completar a resposta. Portanto não foram registrados DI ou repositories concretos e a feature continua indisponível em execução. A primeira versão não tem ClientMessageId/idempotência: reenvio não poderá ser tratado como exatamente uma gravação; não haverá retry automático. Recuperação de falhas, política de mensagens pendentes e concorrência deverão ser resolvidas antes de habilitar o fluxo real, sem prometer atomicidade que ainda não existe.

DTOs, mappings, rota e verificação de propriedade preservados. Sem DbSet, configuração EF, migrations, banco, workflow, protótipo alterado ou PDF. Próximo baby step: definir o contrato do serviço de interpretação do n8n no domínio, incluindo mensagem atual e contexto recente, antes de implementar transporte HTTP na Data.

Validação do histórico no service: dotnet run --no-restore do harness TravelChatConversationCheck compilou o backend sem erros (nove avisos anteriores) e aprovou 33 verificações com dependências simuladas. Cobrem início/continuidade/propriedade, ordem leitura→gravação, ConversationId/UserId/Role/Text, limite 20, encaminhamento de cancelamento, nenhuma gravação em erro de leitura/acesso, cancelamento durante leitura e propagação de falhas de gravação. Fluxo válido termina no ponto ainda pendente. git diff --check sem erros; sem HTTP, banco real ou n8n.

## Chat: entrada da interpretação no domínio — 05/11/2026

Criado Domain/Model/TravelChatInterpretationRequest.cs após pesquisar contratos equivalentes, sem encontrar um objeto de interpretação existente. Contém Text (mensagem atual), History (List<TravelChatHistoryMessage>, reutilizando o model existente), ReferenceTime (DateTimeOffset), TimeZone (string) e HasLocation (bool). Strings/lista inicializadas conforme o padrão do projeto. Não possui coordenadas, JWT ou UserId como campos próprios.

ReferenceTime e TimeZone deverão ser preenchidos pelo servidor para interpretar expressões relativas como “sábado”; ainda não há preenchimento, fuso escolhido ou validação implementados. HasLocation informa apenas disponibilidade de uma origem, não autorização para aplicar um raio silenciosamente nem garantia de captura atual/precisa. Point e metadados da localização continuam disponíveis ao fluxo interno de busca, sem necessidade de enviá-los ao modelo.

Este é um contrato interno do domínio, ainda não um payload HTTP serializável para envio direto. History reaproveita uma entidade com navegação Conversation/User; a futura implementação na Data deverá projetar explicitamente somente papel/texto necessários ao contexto, sem serializar a entidade/navegações, perfil ou credenciais. Configuração de histórico/retensão do n8n será tratada ao montar o workflow. A mensagem atual deve aparecer em Text e não duplicada em History.

Preferências confirmadas persistidas, catálogo permitido e resposta estruturada da interpretação continuam pendentes; não considerar que apenas as 20 mensagens recentes cobrem todo o estado da conversa. O próximo baby step é definir o objeto de saída da interpretação, incluindo perguntas e preferências extraídas; depois será definida a interface do serviço, sem implementar HTTP nesta fase.

Sem alteração de TravelChatService, DTOs da API, mapping, rota, DI, EF, banco, protótipo ou PDF. Nenhuma chamada ao n8n foi criada. Este objeto ainda não é construído/consumido pelo fluxo.

Validação da entrada de interpretação: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.

## Chat: saída da interpretação e preferências — 05/11/2026

Criados somente objetos de domínio, após conferir ProgrammingFilter/HostFilter e ausência de tipos de preferências equivalentes:

- TravelChatInterpretationResponse: Message, Questions (List<string>) e Preferences (TravelChatPreferences). A interpretação não retorna registros de hosts/programações; sugestões reais continuam responsabilidade da API.
- TravelChatPreferences: City, VisitDate (DateOnly?), HasTimeRestriction, StartTime/EndTime (TimeOnly?), EndsNextDay, Participants, HasBudgetLimit, Budget (decimal?), BudgetBasis, BudgetScope, IsFree, SearchNearby, RadiusMeters e Intents.
- TravelChatIntent: Description, IncludeProgrammings, CategoriesId e HostTypes, reutilizando Hosts.TypeofHost e IDs de categorias existentes. Intenções separam por exemplo turismo e café, sem forçar ambas em um único filtro.

Semântica inicial do contrato (não são validações implementadas): null representa informação desconhecida. HasTimeRestriction=false representa indiferença explícita de horário; true exige período coerente. HasBudgetLimit=false representa ausência explícita de teto; true exige valor, base e escopo coerentes. Enum TravelChatBudgetBasis distingue PerPerson/Group; TravelChatBudgetScope distingue Itinerary/Stop. Valores monetários desta primeira versão são BRL. Não interpretar Budget automaticamente como teto de cada evento. SearchNearby=null significa preferência desconhecida, false ausência de exigência de proximidade e true exige origem e raio confirmados. Ausência de origem exige pergunta, não uso silencioso da localização cadastral. HasLocation da entrada indica disponibilidade, não confirmação de um raio.

DateOnly/TimeOnly representam data e horários locais da visita; o fuso vem do contrato de entrada e conversões serão responsabilidade da API. EndsNextDay permite representar madrugada sem inferir virada automaticamente. Participants ausente não significa uma pessoa. IsFree permanece preferência opcional, não deriva de preço ausente. Intents vazia não implica autorização para sugerir qualquer atividade. IncludeProgrammings=false e HostTypes vazio representam intenção ainda sem destino de busca definido, exigindo validação/esclarecimento.

Restrições pendentes: apenas gastronomia/comércio como HostTypes de paradas, categorias existentes/ativas do catálogo permitido, limites numéricos, conflitos, datas/horários, semântica de orçamento e resposta inválida do workflow. A API deverá validar tudo antes de buscar. Questions não vazia representa esclarecimentos, mas nem Questions vazia nem a presença de Preferences garantem informações suficientes. Não foi adicionado ReadyToSearch como decisão soberana do modelo.

Ainda não há persistência/mesclagem de preferências confirmadas, sinalização de alterações/remoções, contrato de snapshot validado entre turnos ou inclusão de preferências na entrada. Isso precisa ser implementado antes de depender somente do histórico recente: campo ausente da saída não poderá apagar preferência anterior silenciosamente. Nenhum desses objetos está mapeado no EF, serializado para n8n ou conectado ao TravelChatService. JSON externo e validações serão definidos em passos próprios ao montar o workflow com o usuário.

DTOs públicos e TravelChatMapping preservados: TravelChatResponse continua representando a resposta final da API, distinta da interpretação. Sem endpoint novo, DI, banco, protótipo alterado ou PDF. Próximo baby step: definir ITravelChatInterpretationService com entrada e saída já preparadas, antes do transporte na Data.

Validação dos contratos de saída: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, teste HTTP, banco ou n8n.

## Escopo vigente da IA: prompt único — 05/11/2026

Por solicitação do usuário, esta primeira versão passa a ser: prompt único → n8n interpreta preferências → API filtra cadastros reais → listas de programações e hosts de gastronomia/comércio para o usuário montar roteiro. Sem localização, proximidade, perguntas/respostas, conversa ou histórico. Esta seção substitui as propostas anteriores para a entrega inicial.

Implementado neste baby step:

- TravelChatMessageDTO e TravelChatMessage contêm somente Text, obrigatório e até 4.000 caracteres na validação Application.
- TravelChatResponseDTO e TravelChatResponse contêm somente Programmings e Hosts; removidos ConversationId, Message e Questions.
- TravelChatMapping converte apenas texto e listas com mappings existentes. AppService mantém Validate → ToModel → service → ToDTO, userId separado e cancelamento.
- TravelChatService mantém IUserService.GetProfileAsync e cancelamento; removidos repositories e chamadas de conversa/histórico. Ainda termina em NotImplementedException, aguardando interpretação e filtros.
- TravelChatInterpretationRequest contém Text, ReferenceTime e TimeZone, sem History ou HasLocation. TravelChatInterpretationResponse contém apenas Preferences. Removidos SearchNearby e RadiusMeters das preferências.
- A mesma action POST /api/TravelChat/Messages mantém autenticação e identificação pelo JWT. Retirado catch específico de conversa indisponível; preservados 400/401. Sem outra action.

Entrada atual planejada:

```json
{ "text": "Quero passear no Recife no sábado e tomar um café" }
```

Saída planejada (listas vazias ilustrativas, não resposta funcional implementada):

```json
{ "programmings": [], "hosts": [] }
```

Dados ausentes não gerarão perguntas: filtros devem usar somente restrições claras/suportadas, sem inventar pessoas, horário, orçamento ou origem. Cidade escrita no prompt pode ser um filtro, sem geolocalização. A política exata para ambiguidades e limites de busca será definida na interpretação/validação, ainda pendentes. Não há cálculo de rota, persistência ou montagem automática de roteiro nesta fase.

Preservados como preparação inativa de evolução: models de conversa/histórico/localização e interfaces de repositories. Não são consumidos pelo fluxo atual e não possuem EF/DI. As verificações temporárias anteriores que dependem dos campos removidos documentam a versão anterior; o harness TravelChatMappingCheck foi atualizado ao escopo vigente.

Protótipo: catálogo real conferido com somente Text obrigatório até 4.000 caracteres e JWT; aviso de implementação pendente atualizado. Exemplo .http também simplificado. Sem formulário de localização, ConversationId ou chat neste fluxo.

Estado: contratos simplificados, sem integração funcional com n8n, filtros coordenados ou DI. Nenhuma alteração em Program.cs, banco, migrations ou PDFs. Próximo baby step: ITravelChatInterpretationService com entrada e saída já preparadas. A montagem do workflow terá assistência quando chegar à integração, em passos pequenos.

Validações executadas: backend compilado sem erros/nove avisos existentes por dotnet run --no-restore de TravelChatMappingCheck; 15 verificações aprovadas de contrato público/domínio, mapping, serialização, validação e AppService com service simulado. node --check em app.js/catalog.mjs, catálogo real e 101 testes do protótipo aprovados com API simulada. Sem teste HTTP da nova action, banco real ou chamada n8n.


## Limpeza da IA simplificada — 05/11/2026

Removidos do código os seis arquivos fora do escopo vigente: TravelChatLocationDTO, TravelChatLocation, TravelChatConversation, TravelChatHistoryMessage (incluindo TravelChatMessageRole), ITravelChatConversationRepository e ITravelChatHistoryMessageRepository. A conferência de referências mostrou apenas dependências entre os próprios arquivos removidos; o fluxo do prompt já estava desacoplado deles.

As menções anteriores a esses tipos como preparação inativa são históricas e estão substituídas por esta remoção. Não há mais models/interfaces de conversa, histórico ou localização específicos da IA. Address.Location e o restante da localização já existente do sistema foram preservados. Mantidos os contratos de interpretação/preferências/intenções necessários à próxima etapa do prompt único, além de controller, DTOs, validação, mapping, AppService e service atuais.

Sem mudança de contrato público, lógica de busca ou registros de DI. A integração n8n e os filtros continuam pendentes. Sem migração, banco, protótipo ou PDF alterados.

Validação da limpeza: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores. Busca C# no backend sem referências aos tipos removidos; git diff --check sem erros. Não foram repetidos testes funcionais: remoção apenas de tipos já desacoplados. Sem HTTP, banco ou n8n.

## IA: unificação da mensagem e entrada de interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatMessage e TravelChatInterpretationRequest. Mantido Domain/Model/TravelChatMessage.cs, agora com Text, ReferenceTime (DateTimeOffset) e TimeZone (string), e removido TravelChatInterpretationRequest.cs. Esse único objeto representará tanto a entrada do service quanto a solicitação interna de interpretação do prompt. Conferência de referências antes da remoção: o request anterior não tinha consumidores C#.

TravelChatMessageDTO continua contendo somente Text; data/fuso não passam a ser responsabilidade do aplicativo. TravelChatMapping preserva a conversão do prompt e o AppService continua chamando o mapping normalmente. O preenchimento pelo servidor de ReferenceTime/TimeZone ainda está pendente da integração com a interpretação, como já estava no objeto removido; não foi escolhido fuso fixo nem inserida configuração implícita neste passo.

Os próximos contratos de interpretação devem receber TravelChatMessage, sem recriar outro request com os mesmos campos. Restam cinco classes de model da IA: TravelChatMessage, TravelChatInterpretationResponse, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. Menções anteriores ao objeto de entrada separado são históricas e substituídas por esta unificação.

Sem alteração de DTO público, rota, autenticação, DI, banco, protótipo ou PDF. A interpretação, filtros e integração n8n continuam pendentes; action ainda não funcional em execução.

Validação da unificação: dotnet run --no-restore de TravelChatMappingCheck compilou o backend sem erros (nove avisos anteriores) e aprovou 15 verificações do fluxo simplificado com service simulado, ajustadas ao model unificado. Busca sem referências C# ao request removido; git diff --check sem erros. Sem HTTP, banco ou n8n.

## IA: preferências como retorno direto da interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatInterpretationResponse e TravelChatPreferences. Mantido TravelChatPreferences com todos os campos existentes e removido TravelChatInterpretationResponse, que possuía somente a propriedade Preferences. O contrato futuro de interpretação deverá retornar Task<TravelChatPreferences> diretamente; não será necessário acessar response.Preferences.

Antes da remoção, a busca C# confirmou ausência de consumidores do wrapper. Nenhum campo de preferência foi removido/renomeado, nem foram alterados enums, TravelChatIntent ou mapping da resposta final. Restam quatro classes de model da IA: TravelChatMessage, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. O fluxo planejado passa a ser TravelChatMessage → interpretação → TravelChatPreferences → filtros da API → TravelChatResponse.

TravelChatResponse permanece separado: contém os registros reais encontrados pela API; TravelChatPreferences contém apenas atributos extraídos do prompt. A futura resposta JSON do n8n deverá corresponder diretamente às preferências, sem envelope preferences. Como ainda não existe workflow/cliente HTTP/contrato externo implementado, não houve mudança de integração publicada.

Sem alteração de DTO público, rota, autenticação, AppService, DI, banco, protótipo ou PDF. As menções anteriores ao wrapper são históricas e substituídas por esta decisão. Interpretação n8n/filtros continuam pendentes.

Validação da unificação do retorno: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; busca C# sem referências ao wrapper removido; git diff --check sem erros. Sem testes adicionais para remoção de wrapper não consumido, HTTP, banco ou n8n.

## IA: interface de interpretação do prompt — 05/11/2026

Criada Domain/Interfaces/Service/ITravelChatInterpretationService.cs após pesquisar serviços equivalentes e comparar IGeocodingService/ICompanyRegistrationService. Contém somente:

```csharp
Task<TravelChatPreferences> InterpretAsync(TravelChatMessage message, CancellationToken cancellationToken = default);
```

Recebe diretamente o model unificado da mensagem, com Text, ReferenceTime e TimeZone, e retorna diretamente as preferências. Não recria envelopes de entrada/saída removidos anteriormente. Não recebe userId ou JWT: o service coordenador mantém a verificação de conta por IUserService.GetProfileAsync. Não retorna registros de programação/host, pois esses virão de filtros da API. A interface não depende de n8n/HTTP/configuração na assinatura; implementação do provedor ficará na Data.

Somente contrato neste passo: não criado cliente HTTP, registro DI, prompt de workflow, validação das preferências, preenchimento de data/fuso ou chamada no TravelChatService. A rota continua incompleta. Próximo baby step proposto: injetar e chamar esta interface no TravelChatService, preenchendo a referência temporal pelo servidor e definindo explicitamente a origem do fuso, com interpretação simulada para validação. Filtros e transporte externo continuarão em passos posteriores.

Sem alteração de DTO, mapping, rota, models, banco, protótipo ou PDF.

Validação da interface de interpretação: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes para interface sem implementação, HTTP, banco ou n8n.

## IA: chamada da interpretação no service — 05/11/2026

TravelChatService agora injeta ITravelChatInterpretationService e IConfiguration, usando o padrão de configuração por construtor já presente em SubscriptionService. Após mensagem não nula, cancelamento e conta disponível por IUserService.GetProfileAsync, chama InterpretAsync com um novo TravelChatMessage: Text preservado, ReferenceTime=DateTimeOffset.UtcNow e TimeZone definido pelo servidor. Datas/fuso recebidos em chamadas internas não são confiados nem alterados no objeto original. CancellationToken é encaminhado e verificado também após a interpretação; erros do intérprete não são mascarados.

Fuso: configuração TravelChat:TimeZone, equivalente à variável TravelChat__TimeZone. Ausência da chave usa America/Recife como padrão inicial explícito do projeto; valor informado é conferido por TimeZoneInfo.FindSystemTimeZoneById no construtor. Não há inferência pelo fuso da máquina ou pela cidade do prompt. O fuso representa a referência temporal usada pelo assistente nesta primeira versão; cenários de outros fusos exigem configuração/definição futura, não localização automática. Nenhum appsettings ou Program.cs foi alterado.

O retorno TravelChatPreferences é recebido, mas sua validação e uso nos filtros continuam pendentes. O fluxo ainda termina em NotImplementedException após a interpretação; não retorna lista vazia como sucesso provisório. Sem implementação n8n na Data/DI, a action permanece indisponível em execução. Nenhuma chamada externa ocorreu.

DTO público continua somente Text, resposta pública continua Programmings/Hosts, e AppService mantém as chamadas de validação/mapping. Sem perguntas, localização ou histórico. Próximo baby step proposto: validar as preferências retornadas antes de convertê-las em filtros, respeitando ausência/ambiguidade de dados sem inventar valores. Transporte HTTP e montagem do workflow serão tratados após as regras de domínio.

Sem alteração de banco, migrations, protótipo ou PDF.

Validação da chamada de interpretação: dotnet run --no-restore de TravelChatInterpretationCheck.cs/.csproj compilou o backend sem erros (nove avisos anteriores) e aprovou 16 verificações com IUserService/intérprete simulados: prompt, UTC gerado no servidor, padrão/configuração de fuso, entrada original preservada, cancelamento, usuário indisponível, mensagem nula, erro do intérprete e fuso inválido. Fluxo válido conferido até o trecho de filtros ainda pendente. git diff --check sem erros. Sem HTTP real, banco ou n8n.

## IA: validação das preferências no domínio — 05/11/2026

Criadas ITravelChatPreferencesValidations e TravelChatPreferencesValidations nas pastas existentes, seguindo as validações de domínio de OpeningHours e UserXCategory. TravelChatService recebe a interface e chama await Validate(preferences) após InterpretAsync e antes do trecho de filtros ainda pendente, com cancelamento verificado antes/depois.

Regras implementadas: cidade opcional, mas quando informada deve conter texto e no máximo 150 caracteres; participantes informados devem ser positivos; orçamento informado deve ser não negativo e até duas casas decimais; base/escopo devem ser enums válidos. HasBudgetLimit=false não pode coexistir com valor/base/escopo de limite. HasTimeRestriction=false não admite horários restritos nem EndsNextDay=true. Quando início/fim/virada estão todos informados, o intervalo deve durar mais de zero e até 24h; madrugada exige indicação coerente de virada.

Intents e suas listas não podem ser nulas nem conter intenção nula. Cada intenção deve indicar programação e/ou host de gastronomia/comércio; produtor e enum inexistente são rejeitados. Categorias por intenção: até 100 IDs positivos, reaproveitando limite do filtro existente. Para conferir existência/atividade, reutiliza ICategoryService.GetallCategories, como UserXCategoryValidations; consulta uma vez por validação que contenha IDs e confere todos contra o catálogo ativo. Não consulta o catálogo quando não há IDs. Não foram criadas novas funções de verificação de usuário ou acesso a dados.

Campos ausentes/parciais permanecem válidos: não impõe preenchimento de cidade, data, horário, participantes, orçamento ou intenções, não gera perguntas, não normaliza nem inventa dados. Em especial orçamento sem base/escopo ou período incompleto não deve ser usado posteriormente como restrição garantida. Intents vazia não autoriza busca irrestrita silenciosa; política de resultado/filtros será implementada no próximo passo. A validação estrutural/coerência não comprova que o modelo extraiu a intenção correta do texto original.

Categorias do sistema correspondem às programações; quando a intenção envolver hosts, não presumir vínculo de categoria inexistente em Hosts. Semântica de termos como café depende do filtro/classificação que será implementado, não da validação de enum.

Falhas seguem o padrão existente de ArgumentException/ArgumentNullException. A diferenciação HTTP de erro do provedor (502/503) ainda deverá ser integrada na Data/controller antes de habilitar o fluxo real; atualmente a action traduz ArgumentException em 400. Não foi apresentada validação de saída como conclusão da integração externa.

Fluxo permanece incompleto, terminando em NotImplementedException após preferências válidas; DI/transporte n8n/filtros ainda pendentes. Interface da validação mantém Task Validate sem CancellationToken conforme UserXCategoryValidations e contrato GetallCategories existentes; não houve mudança nesses contratos. Sem alteração de DTO/model, mapping, API pública, Program.cs, banco, protótipo ou PDFs. Próximo baby step: definir a conversão de preferências validadas para os filtros existentes da API, começando pelas programações, sem outra action.

Validações desta etapa: backend compilado sem erros/nove avisos anteriores pelos harnesses --no-restore; TravelChatPreferencesCheck aprovou 42 verificações com catálogo simulado (ausências, limites, enums, orçamento, períodos, virada, listas e categorias existentes/ativas, consulta única e dados preservados); TravelChatInterpretationCheck aprovou 18 verificações com usuário/intérprete/validação simulados, incluindo chamada da validação após interpretação e propagação de rejeição. git diff --check sem erros. Sem HTTP, banco real ou n8n; o trecho de filtros ainda termina em NotImplementedException.

## IA: remoção do fuso nomeado e configuração — 05/11/2026

Por solicitação do usuário, removidos TimeZone de TravelChatMessage, o campo _timeZone, a leitura TravelChat:TimeZone com padrão America/Recife e a chamada TimeZoneInfo.FindSystemTimeZoneById. TravelChatService não recebe mais IConfiguration no construtor. Dependências atuais: IUserService, ITravelChatInterpretationService e ITravelChatPreferencesValidations.

TravelChatMessage contém somente Text e ReferenceTime (DateTimeOffset). O service continua preenchendo ReferenceTime com DateTimeOffset.UtcNow no servidor, portanto o instante enviado usa deslocamento +00:00, sem configuração adicional. DateTimeOffset representa instante/deslocamento; não representa um fuso nomeado nem regras regionais. Não inferir automaticamente o horário local de Recife a partir deste valor UTC. Interpretação de datas relativas deve usar a referência explícita e o contrato que será montado no workflow, sem prometer conversão regional não implementada.

O DTO público permanece somente Text. Mapping, AppService, verificação de usuário por GetProfileAsync e validação de preferências preservados. Não foram modificados appsettings, Program.cs ou configuração de outros serviços. A variável TravelChat__TimeZone não é mais lida nem necessária; instruções anteriores sobre ela são históricas, substituídas por esta remoção.

Sem alteração de rota, resposta pública, banco, protótipo ou PDF. Interpretação concreta, filtros e DI ainda pendentes; o service continua terminando em NotImplementedException após validar preferências. Harnesses temporários de interpretação e mapping foram ajustados ao contrato sem TimeZone.

## Compatibilidade com o model atual de intenção — 05/11/2026

Durante a validação da remoção de TimeZone, a compilação detectou referência a IncludeProgrammings que já não existe no TravelChatIntent atual. Preservada a edição do model; removida somente a regra da validação que dependia desse campo, sem recriá-lo. Intenção agora contém Description, CategoriesId e HostTypes. Conferência de categorias/tipos e demais regras continuam preservadas; decisão de como a intenção seleciona programações deverá ser definida na conversão para filtros. Não marcar como implementada a antiga exigência de IncludeProgrammings ou destino explícito de cada intenção. A primeira tentativa de compilação falhou por essa referência e foi corrigida antes de repetir a validação.

Validação final da simplificação temporal: backend compilado sem erros (nove avisos anteriores) pelos harnesses --no-restore. TravelChatInterpretationCheck aprovou 15 verificações com dependências simuladas, cobrindo referência UTC do servidor sem alterar entrada, cancelamento, identidade e validação; TravelChatPreferencesCheck aprovou 42 verificações com catálogo simulado após compatibilização do model sem IncludeProgrammings. Busca confirmou ausência de TimeZone/IConfiguration nos tipos alterados; git diff --check sem erros. Primeira compilação falhou pela referência ao campo já ausente, corrigida antes destes resultados. Sem HTTP, banco ou n8n.

## IA: busca de programações conectada ao filtro existente — 05/11/2026

TravelChatService injeta IProgrammingService e, após interpretação/validação, chama FilterProgrammingsAsync, que reutiliza FilterAsync(ProgrammingFilter) existente. Não foi criado novo repository, query ou endpoint.

Conversão por intenção:

- Havendo CategoriesId, busca programações por IDs distintos; não exige também correspondência literal da descrição.
- Sem categorias, não consulta programações, independentemente de Description/HostTypes. A versão salva do filtro não usa Description como busca textual; essa edição foi preservada. Assim, ausência de categoria não provoca uma consulta irrestrita.
- Sem intenções, ou intenção sem descrição/categorias/tipos, não faz consulta irrestrita.
- Transfere City e IsFree informados, com paginação existente Take=10/Skip=0 por intenção. Description permanece informativa, sem impor novo limite para um filtro textual que não é usado neste fluxo.
- VisitDate gera janela do dia UTC (00:00 até o último tick). Período mais estreito só é aplicado quando HasTimeRestriction=true e StartTime/EndTime/EndsNextDay estão todos informados. Virada de dia soma um dia ao término; DateOnly.MaxValue com virada é rejeitada para evitar overflow. Período incompleto usa apenas a data, sem inventar horários; horário sem data não vira filtro absoluto.
- MaxPrice só recebe Budget quando HasBudgetLimit=true, BudgetBasis=PerPerson e BudgetScope=Stop. Orçamento de grupo, de roteiro inteiro ou incompleto não é convertido em teto por evento nesta etapa. Participants não implica disponibilidade/vagas.

Após as consultas, o helper remove duplicados por Id, ordena por StartDate/Id e limita o conjunto a dez programações. São candidatos obtidos pelo filtro existente: datas usam interseção de períodos (não garantem permanência durante toda a visita) e MaxPrice compara o preço mínimo anunciado, portanto não garante que toda opção/faixa de ingresso custe abaixo do teto. O fluxo de IA não usa busca textual de programações; a opção textual do filtro público existente permanece preservada fora desta feature. Nenhuma dessas limitações foi alterada silenciosamente no repository existente.

Referência temporal permanece UTC, sem fuso nomeado: as janelas desta etapa são explicitamente UTC, não conversões automáticas de horários locais de Recife. Conversão regional e semântica de datas do workflow deverão ser fechadas antes da integração real. Não foram implementados filtros de gasto total/grupo, vagas, proximidade, perguntas ou histórico.

Cancelamento é verificado antes/depois de cada consulta. FilterAsync existente não recebe CancellationToken; não foi alterado seu contrato. Erros não são mascarados. O resultado do helper está preparado para compor TravelChatResponse na etapa dos hosts; SendMessageAsync ainda termina em NotImplementedException para não apresentar a entrega combinada como pronta. Transporte n8n e DI continuam pendentes.

Sem alteração de DTO público, rota, mapping Application, Program.cs, banco, migrations, protótipo ou PDF. Próximo baby step: conectar o filtro de hosts existente e compor a resposta final com as duas listas, documentando limites reais do filtro de hosts.


Validação do passo de programações: TravelChatProgrammingCheck.cs/.csproj compilou o backend sem erros (nove avisos existentes) e aprovou 43 verificações com usuário, intérprete, catálogo e IProgrammingService simulados. Cobrem escolha de intenções por categorias, ausência de busca genérica/textual, cidade/gratuidade, UTC/dia/período completo/madrugada/período incompleto, orçamento por pessoa/parada e não conversão de grupo/roteiro, validação antes da consulta, erro de consulta e cancelamento entre intenções. Não foi testado retorno final da action: o fluxo válido ainda termina em NotImplementedException após a etapa de programações. Primeira execução do harness apontou expectativa textual incompatível com a versão salva; ajustados o critério sem categorias e a verificação para preservar essa edição. Sem HTTP real, banco ou n8n.

## IA: busca de hosts e resposta combinada — 05/11/2026

TravelChatService agora injeta IHostService e chama FilterHostsAsync após o filtro de programações. Reutiliza IHostService.FilterAsync(HostFilter) existente: consulta somente intenções com HostTypes informados, transfere City e tipos distintos, mantendo Take=10/Skip=0. Não impõe HasProgrammings: host pode ser sugerido sem evento. Não transforma Description em Name, pois uma intenção como “tomar café” não é nome de estabelecimento. Sem tipos de host extraídos, não faz busca genérica de hosts.

Validação de preferências continua restringindo tipos a Gastronomy/Business. HostFilter existente já consulta hosts ativos. O helper remove duplicados por Id, ordena por Name/Id e limita o conjunto a dez hosts. Programações continuam com categorias, deduplicação, StartDate/Id e limite dez. Não houve mudança de query/repository/filtro público.

Retirado NotImplementedException de SendMessageAsync: após conta ativa, interpretação, validação e ambas as buscas, retorna TravelChatResponse com Programmings e Hosts. AppService usa TravelChatMapping.ToDTO para converter ambas as listas pelos mappings existentes. Nenhuma montagem/persistência automática de roteiro é executada; são opções para seleção posterior.

Limites desta entrega: HostFilter não contém gasto nem agenda, então preço, data/horário de funcionamento e especialidade gastronômica (por exemplo cafeteria) não são garantidos na lista de hosts. Não foi feita filtragem depois da paginação para simular suporte inexistente. Pedido de café mapeado para Gastronomy pode incluir outros estabelecimentos desse tipo. Categorias de programação não são atribuídas a hosts. Nome/cidade/tipo são campos existentes; nesta feature somente cidade/tipo são usados. Orçamento total/grupo e custo combinado continuam sem garantia. Sem localização, perguntas ou histórico.

Cancelamento conferido antes/depois das consultas e entre as etapas; contratos existentes de FilterAsync permanecem sem token, portanto não cancelam o SQL em andamento. Falha de uma busca é propagada, não convertida em resposta parcial de sucesso. As duas listas vazias são resultado válido quando não houver registros ou intenções aplicáveis.

Estado: fluxo de domínio/Application verificado com interpretação/filtros simulados; ainda não há implementação HTTP do n8n nem registros da feature na DI. Por isso a rota real continua indisponível em execução. Não afirmar que a API foi executada ou que houve integração real do workflow.

Protótipo: resposta combinada agora tem duas seções, com cartões existentes de programação/host, preservando seleção/reuso de IDs dos cartões e JSON bruto. Mensagens separadas para listas vazias; aviso do formulário explica integração pendente e limites do filtro de hosts. Exemplo .http atualizado para retirar filtros da lista de etapas ainda ausentes.

Próximo baby step: fechar o JSON de entrada/saída do workflow com os models atuais antes de implementar o cliente n8n na Data. Nenhuma alteração em Program.cs, banco, migrations ou PDFs.

Validações executadas: TravelChatResultsCheck.cs/.csproj compilou backend sem erros/nove avisos anteriores e aprovou 27 verificações com service/AppService/mappings/validações reais e intérprete/filtros/catálogo simulados: listas combinadas, cidade/tipos, intenções sem busca genérica, deduplicação/ordem/limites, retorno via mapping, rejeição de produtor, usuário indisponível, falhas sem resposta parcial e cancelamento. node --check em app.js/catalog.mjs aprovados; 103 testes do protótipo aprovados com API simulada, incluindo duas novas verificações da exibição combinada e listas vazias. Sem HTTP real da action, banco ou n8n.

## Hosts: filtros de preço/funcionamento e validação separada — 05/11/2026

GET /api/Host/HostFilter mantém autenticação, paginação e resposta List<HostResponseDTO>. HostFilterDTO, HostFilter e HostFilterMapping agora incluem:

| Campo | Tipo/uso |
|---|---|
| MinPrice / MaxPrice | decimal?; limites opcionais de faixa estimada de gasto por pessoa |
| DayOfWeek | DayOfWeek?; 0=domingo até 6=sábado |
| StartTime / EndTime | TimeOnly?; intervalo opcional em horário semanal do estabelecimento |
| EndsNextDay | bool, padrão false; término do intervalo solicitado no dia seguinte |

Preço usa interseção inclusiva: host.MaxPrice >= MinPrice solicitado e host.MinPrice <= MaxPrice solicitado. Limite ausente não restringe; faixa desconhecida não é tratada como zero/gratuidade e não satisfaz comparação com limite conhecido. Trata-se de estimativa por pessoa, não garantia de valor exato ou de toda a faixa caber no orçamento.

Funcionamento usa qualquer sobreposição positiva, conforme escolha explícita do usuário. Apenas DayOfWeek busca qualquer abertura no dia, incluindo cauda de intervalo iniciado no dia anterior. Com período, dia/início/término são exigidos; deve durar mais de zero e até 24 horas. Horários iguais exigem EndsNextDay=true (24h). Tocar exatamente na abertura/fechamento sem tempo em comum não conta. A consulta considera dias/períodos ativos da agenda (IsClosed=false), múltiplos intervalos, madrugada e semana cíclica (sábado/domingo e domingo/segunda). Agenda ausente não significa aberto. Dia marcado fechado não elimina a cauda de um intervalo válido iniciado no dia anterior. Sem filtro de agenda, hosts sem agenda continuam elegíveis.

Repository aplica preços e Any de dias/períodos diretamente no IQueryable, antes de OrderBy/Skip/Take. Não há carregamento de toda a tabela ou filtro após paginação. Busca preserva nome, cidade, tipos, HasProgrammings e atividade do host. Não altera entities Hosts/HostOpeningDay/HostOpeningPeriod, schema ou migrações: usa campos já existentes.

Por solicitação do usuário, todas as validações do filtro (nulo, Take/Skip, Types, preços não negativos/duas casas/ordem dos limites, dia da semana, campos necessários e duração) foram extraídas para Domain/Validations/Validations/HostFilterValidations, com IHostFilterValidations. HostService recebe a interface pelo construtor e executa Validate(filter) antes do repository. Mensagens/exceções preservadas. Registro scoped acrescentado em Presentation/Program.cs ao lado das validações existentes; alteração necessária à injeção desta funcionalidade, não para suportar o protótipo. Controller continua traduzindo ArgumentException para ProblemDetails 400; DataAnnotations continuam as restrições estruturais no DTO.

Integração com IA: quando VisitDate existir, TravelChatService passa seu DayOfWeek; com período completo confirmado, passa início/fim/virada. Orçamento confirmado por pessoa/por parada vira MaxPrice; não inventa MinPrice, que não existe nas preferências atuais. Orçamento total/grupo permanece sem conversão. Sem data, não aplica horário semanal isolado. Os horários do filtro são horários da agenda, sem novo fuso nomeado ou conversão automática de localização. Client n8n/DI da IA ainda pendentes; a busca pública de hosts reutiliza os services existentes. Especialidade como cafeteria ainda não é distinguida por tipo de host.

Protótipo: catálogo reconhece preços numéricos, horários e seleção de dia da semana com domingo=0; formulários/query mantêm JWT e filtros opcionais, sem herdar preços de um host selecionado. Ajuda explica sobreposição e preços estimados. Exemplo .http atualizado com período normal, madrugada, dia inteiro e entrada inválida. Mudanças de catálogo também tipam DayOfWeek em DTOs já existentes; testes de regressão preservados.

Sem alteração de banco principal, entidades persistidas, configurações EF, migrations, CORS, emissão JWT ou PDF. A API não foi reiniciada.

Validação concluída dos filtros e extração: build do backend aprovado sem erros/nove avisos anteriores; HostFilterHoursCheck executou 197 verificações com EF/PostgreSQL reais em banco local descartável (intervalos/limites, múltiplos períodos, virada de dia/semana, agenda ausente/fechada, faixa monetária, legado nulo, paginação posterior aos filtros, mapping e rejeições de validação). Inclui 147 comparações de intervalos semanais contra um oráculo independente e sete consultas por dia sem período. Banco descartável removido em finally; banco principal preservado. A primeira conexão tentou porta 5434 do Development e foi recusada; teste passou com configuração base da porta 5432 já ativa, sem alteração de config/container/volume. Harness emitiu um aviso CS8602 próprio, separado dos nove avisos do backend.

TravelChatResultsCheck executou 29 verificações simuladas do fluxo combinado, incluindo transferência de dia/período/virada/MaxPrice para HostFilter. node --check de app.js/catalog.mjs e arquivos de teste aprovado; catálogo real conferido; 105 testes do protótipo aprovados com API simulada. Primeira execução da nova fixture de UI falhou por aguardar incorretamente a sincronização inicial; fixture corrigida antes do resultado final. Sem teste HTTP real, API reiniciada, n8n ou PDF. Os exemplos .http foram atualizados, mas não executados contra dados reais. git diff --check sem erros.

## IA: catálogo real de categorias na interpretação — 05/11/2026

TravelChatMessage agora possui Categories (List<Category>) além de Text/ReferenceTime. Reaproveita Category já existente, sem novo model/envelope. TravelChatService injeta ICategoryService e, após verificar conta ativa por GetProfileAsync, chama GetallCategories. Monta o objeto enviado a InterpretAsync com somente categorias IsActive=true, ordenadas por Id, preservando IDs e nomes reais. Não confia em catálogo informado no objeto de entrada; o DTO público continua apenas Text e o catálogo é obtido pelo servidor.

Objetivo: permitir que o workflow associe interesses do prompt a IDs existentes, pois o filtro de programações desta versão depende de CategoriesId e não usa Description como busca textual. Nomes de categoria são contexto de classificação, não instruções. O cliente n8n deverá receber o catálogo no JSON da mensagem sem JWT, UserId, localização ou histórico.

Validação de preferências continua reutilizando GetallCategories para conferir existência/atividade dos IDs retornados, inclusive eventual mudança após a interpretação. Não foi criada função de consulta duplicada ou mecanismo de cache. Como o contrato existente não recebe CancellationToken, cancelamento é verificado antes/depois da consulta; uma falha no catálogo impede interpretação/filtros e é propagada.

Catálogo vazio será enviado como lista vazia; a IA não deverá inventar IDs. Busca de programações sem categorias continuará sem consulta irrestrita; hosts continuam orientados por tipos existentes. Regras exatas do JSON/prompt e classificação do n8n serão definidas no próximo baby step, antes de criar o transporte na Data. Ainda não há cliente n8n nem DI da feature, portanto o endpoint não está funcional em execução.

Sem alteração de DTO público, rota, mapping de prompt/resultados, entidades Category, schema, banco, protótipo ou PDF.

Validação do catálogo: TravelChatResultsCheck --no-restore compilou o backend sem erros/nove avisos anteriores e aprovou 37 verificações com validação/mappings/AppService/service reais e dependências simuladas. Incluem categorias ativas ordenadas com IDs/nomes preservados, exclusão de inativas, nenhuma consulta para usuário indisponível, falha/cancelamento do catálogo impedindo interpretação e filtros, além das regressões de resultados/agenda/preço. git diff --check sem erros. Sem HTTP, banco ou n8n; protótipo não alterado pois contrato público permaneceu igual.

## IA: contrato JSON e prompt do workflow preparados — 05/11/2026

Criados arquivos reutilizáveis, sem alteração de código funcional ou criação de workflow:

| Arquivo em docs/ | Uso |
|---|---|
| n8n-travelchat-entrada.schema.json | JSON Schema da mensagem text/referenceTime/categories enviada pela API |
| n8n-travelchat-saida.schema.json | JSON Schema direto de TravelChatPreferences para o Structured Output Parser |
| n8n-travelchat-exemplos.json | Sete pares de entrada/saída esperada com catálogo fictício e ambiguidades |
| n8n-travelchat-prompt.md | Prompt System para copiar, expressão de entrada, esqueleto futuro e limites |

Contrato externo proposto: camelCase, único objeto JSON, sem envelopes preferences/output/data. Entrada segue TravelChatMessage unificado; saída segue TravelChatPreferences diretamente. Campos desconhecidos são null e listas não são nulas; todas as chaves de saída são exigidas pelo schema. Enums são números: budgetBasis 0=pessoa/1=grupo, budgetScope 0=roteiro/1=parada, hostTypes somente 1=gastronomia/2=comércio. Data AAAA-MM-DD e horário HH:mm:ss. Catálogo limita IDs válidos para aquela chamada; schema não faz sozinho a associação dinâmica ao catálogo ou validação de regra cruzada.

Prompt não permite perguntas, memória, localização ou geração de registros fictícios. Mantém desconhecidos sem inferir pessoas, orçamento por parada, origem ou horários de manhã/tarde. Data relativa usa explicitamente a referência UTC atual. Faixa mínima de gasto ainda não tem campo em TravelChatPreferences, apesar de existir no filtro público de host; não acrescenta campo externo inexistente para simular suporte. Teto só será usado pela API quando base/escopo forem compatíveis. Sem categoria segura, não inventa ID e a busca de programações continua sem consulta irrestrita.

Esqueleto para o próximo passo: Webhook → Basic LLM Chain, com Chat Model e Structured Output Parser → Respond to Webhook. Configuração detalhada, credenciais, segredo do webhook, tratamento de erros, timeout, validação efetiva no workflow e cliente HTTP da Data continuam pendentes. Modelo/provedor ainda não selecionado. Documentação oficial consultada e vinculada no arquivo do prompt; schemas manuais não usam $ref. Nenhum workflow foi importado/criado/ativado e nenhuma IA ou serviço pago foi chamado.

Validação de schemas executada com AJV 8.20.0 e ajv-formats já instalados no container n8n: 50 verificações em memória aprovadas, incluindo sete exemplos, envelopes/propriedades extras/tipos/enums/datas inválidos, catálogo e valores desconhecidos. Usado multipleOfPrecision=8 no harness para comparação decimal numérica. Isso valida JSON Schema, não comprova comportamento do parser/LLM num workflow real. O container foi utilizado somente para executar a biblioteca de validação em memória; sem acessar credenciais ou alterar estado de workflows.

Nenhuma alteração de DTO público, rota, models, service, DI, banco, protótipo ou PDF. Próximo baby step: montar apenas o nó Webhook e conferir sua entrada; não ativar o fluxo completo como se a interpretação já estivesse pronta.

Complemento da validação do contrato: TravelChatContractCheck.cs/.csproj executado com --no-restore aprovou 41 verificações de compatibilidade entre os schemas e propriedades dos models, desserialização dos sete exemplos, referência UTC, serialização camelCase, datas/horários/decimal preservados e validação de preferências com catálogo simulado. Inclui rejeição de ID inventado, orçamento contraditório e envelope inesperado no harness estrito. Não significa que a futura implementação Data já aplica esse modo estrito: cliente ainda não existe. Backend/harness compilados com êxito. Sem banco, workflow, LLM ou PDF. git diff --check sem erros.

## IA: cliente HTTP n8n implementado na Data — 06/11/2026

Criado Data/Services/N8nTravelChatInterpretationService.cs implementando ITravelChatInterpretationService, seguindo os serviços externos ViaCep/MinhaReceita e o tratamento de prazo do Geoapify. Recebe somente HttpClient; BaseAddress deverá ser a URL completa do Webhook, configurada no registro do cliente. Sem URL fixa, credenciais versionadas, novo model ou outro endpoint.

InterpretAsync envia POST application/json com TravelChatMessage em camelCase (text, referenceTime, categories) e Accept application/json. Não recebe HttpContext/JWT/userId nem encaminha o token do usuário. Usa prazo total de 30 segundos por chamada, incluindo leitura do corpo, e limite de 64 KiB de resposta (ContentLength conhecido e buffering limitado quando não houver tamanho). Sem retry automático, inclusive em HTTP 429, evitando repetir chamadas ao modelo.

Resposta esperada é diretamente TravelChatPreferences. JSON inválido, raiz não objeto, envelope output/preferences, resposta inicial Workflow got started, campos ausentes ou repetidos, arrays nulos, objetos de intenção incompletos, propriedades extras e números enviados como string são rejeitados. Todas as chaves do contrato são exigidas; campos escalares desconhecidos permanecem null. Nomes camelCase são conferidos sem correspondência indiferente a maiúsculas. Deserialize usa JsonNumberHandling.Strict e JsonUnmappedMemberHandling.Disallow. Regras cruzadas e catálogo permanecem na ITravelChatPreferencesValidations existente, sem duplicação na Data.

Criada TravelChatInterpretationException no domínio, no padrão de GeocodingException, com ServiceUnavailable. TravelChatController traduz resposta inválida para ProblemDetails 502 e indisponibilidade para 503. Falha HTTP não-2xx/rede/stream, configuração ausente ou timeout viram indisponibilidade; corpo inválido ou acima do limite vira resposta inválida. Mensagens fixas não expõem resposta bruta, URL, prompt ou segredo. Cancelamento solicitado pelo chamador continua OperationCanceledException, sem ser convertido em timeout 503.

TravelChatService agora converte ArgumentException/ArgumentNullException da validação das preferências retornadas em TravelChatInterpretationException de resposta inválida (502). Isso impede atribuir ao usuário um erro de dados produzidos pela interpretação, como ID de categoria inventado. A validação do DTO recebido pelo aplicativo continua 400; autenticação/conta permanecem 401. Falhas não relacionadas do catálogo/banco não foram convertidas em erros do n8n indiscriminadamente. Mapping da Application permanece no fluxo Validate → ToModel → service → ToDTO.

Estado: cliente concluído e testado com HttpMessageHandler simulado, ainda sem registro de DI/URL/configuração do cliente. A action real permanece indisponível enquanto não forem registrados AppService, service, mappings, validações e cliente da feature. Nenhuma chamada de API para o n8n real foi feita nesta etapa e nenhuma credencial Gemini foi usada. O usuário já demonstrou manualmente que seu Webhook retorna um objeto de preferências sem envelope; esse relato não é um teste automatizado de integração API/n8n.

No próximo baby step, registrar o HttpClient/dependências e configurar URL completa, prazo/headers/autenticação de serviço, bloqueio de redirecionamentos e remoção de logs do cliente conforme os provedores existentes. O handler de redirecionamento ainda não foi configurado: não afirmar que há garantia de bloqueio apenas porque o cliente trata um status 3xx recebido. A URL de teste do n8n depende do listener ativo; produção dependerá do workflow publicado. O proxy do protótipo tem timeout próprio de 20 segundos, menor que o prazo máximo de 30 do cliente: alinhar os limites antes do teste integrado, sem apresentar timeout local como garantia de encerramento da chamada no servidor.

Protótipo: aviso de implementação atualizado para cliente pronto/DI e URL pendentes. Tratamento genérico de ProblemDetails preserva 502/503 como respostas da API, diferenciado de falhas locais do proxy. Dois novos testes de transporte cobrem esses status. Exemplo .http atualizado quanto às pendências; DTOs e caminho POST /api/TravelChat/Messages preservados.

Validações realizadas: build isolado --no-restore aprovado com zero erros e nove avisos de nulabilidade anteriores. N8nClientCheck.cs/.csproj aprovou 198 verificações com HttpMessageHandler, usuário, catálogo e filtros simulados, incluindo sete exemplos, POST/URL/JSON sem JWT, chaves/tipos/datas, corpo com e sem ContentLength, limite de tamanho, falhas sem retry, cancelamento, preferência inválida impedindo filtros e mapeamento de 502/503 pela action com UserManager simulado. Primeira execução do harness falhou numa asserção de privacidade para corpo vazio (toda string contém string vazia); fixture corrigida, sem alterar a regra de produção por essa falha.

node --check em app.js/catalog.mjs/proxy.test.mjs aprovado; 107 testes do protótipo aprovados com API simulada. Primeira execução dos dois novos testes usou objeto onde o proxy exige corpo JSON como string; fixture corrigida antes do resultado final. Sem teste de timeout real de 30 segundos, teste HTTP do middleware JWT, banco, LLM ou workflow reais. Sem Program.cs/DI, migrations ou PDF alterados neste passo.

## IA: DI e URL do Webhook configuradas — 06/11/2026

Registradas em Presentation/Program.cs as dependências da única action SendMessage: ITravelChatAppService/TravelChatAppService, ITravelChatService/TravelChatService, ITravelChatMapping/TravelChatMapping, IValidation<TravelChatMessageDTO>/TravelChatMessageValidation e ITravelChatPreferencesValidations/TravelChatPreferencesValidations como scoped. Interfaces de usuários, catálogo, hosts, programações e mappings existentes continuam reutilizadas, sem novos repositories ou estilos de DI.

ITravelChatInterpretationService agora usa AddHttpClient com N8nTravelChatInterpretationService. A URL completa é lida de N8n:TravelChatWebhookUrl, equivalente à variável N8n__TravelChatWebhookUrl. Somente endereço absoluto HTTP/HTTPS sem credenciais embutidas ou fragmento é configurado. Ausência/valor inválido deixa BaseAddress vazio, permitindo ao cliente responder com indisponibilidade 503 em vez de quebrar a inicialização de toda a API. Timeout do HttpClient=30s, AllowAutoRedirect=false e RemoveAllLoggers(), seguindo o padrão do cliente Geoapify. O cliente mantém seu próprio prazo total incluindo leitura do corpo.

Perfis http/https de Properties/launchSettings.json agora definem N8n__TravelChatWebhookUrl=http://localhost:5678/webhook-test/perambulando-travelchat, URL de teste já fornecida/testada manualmente pelo usuário. Essa configuração é local ao lançamento por esses perfis; não estabelece uma URL padrão em outros ambientes e não altera appsettings, banco ou containers. Para API em container, a URL deve ser configurada conforme a rede real; localhost do container não aponta ao Windows/n8n externo. Endpoint de produção requer escolha/configuração própria e workflow publicado; não foi publicado nesta etapa.

Após reiniciar a API, o fluxo passa a poder resolver suas dependências. O Webhook de teste precisa estar em Listen for test event antes de cada chamada de integração. Não usar o ID fictício 101 no corpo da API: o aplicativo envia somente Text, e o catálogo real é preenchido pelo servidor. O usuário já demonstrou uma resposta manual n8n de preferências; não foi feita chamada automática ao modelo/Gemini ou teste API→n8n real neste passo. JWT da API continua necessário; nenhum token é encaminhado ao n8n. O Webhook local permanece com a autenticação configurada manualmente pelo usuário; credencial Gemini fica no n8n. Não foram criadas credenciais/chaves novas.

Protótipo: timeout padrão do proxy alterado de 20s para 40s, mensagem de timeout usa o valor efetivamente configurado, espera principal do navegador alterada de 25s para 45s e ajuda de envio indica 40s. Checagens rápidas/interações/autocompletes mantêm seus prazos próprios. Aviso da action agora informa DI/URL de teste configuradas e necessidade de reiniciar API/ativar listener. Se o servidor do protótipo já estava executando, também precisa ser reiniciado para carregar a mudança de server.mjs; só recarregar a página não altera o timeout do processo existente.

Exemplo .http atualizado, sem mudar DTO, rota, autorização, respostas, classes de domínio ou regras de filtro. Program.cs foi alterado para DI/configuração necessárias à feature, não para contornar o protótipo; CORS, migrations e banco preservados. A API/servidor do protótipo não foram reiniciados automaticamente, evitando executar as migrations de inicialização ou interferir no ambiente aberto pelo usuário.

Validações: build --no-restore com saída isolada aprovado com zero erros e nove avisos anteriores. N8nDiCheck.cs/.csproj executou o bloco efetivo de registros TravelChat extraído do Program.cs (sem iniciar o Program/host) e aprovou 38 verificações com HTTP, usuário, catálogo e filtros simulados: resolução/scopes das dependências, fluxo AppService/mappings/cliente, URL completa, timeout 30s, ausência de JWT, categorias reais, redirecionamento bloqueado, logs HTTP suprimidos, configuração inválida virando 503 sem envio e ambos os perfis locais. Primeira compilação do harness tinha conflito de nome na classe de logger; fixture corrigida, sem alteração de produção por esse erro.

node --check em app.js/server.mjs/catalog.mjs aprovado; 107 testes do protótipo aprovados com API simulada, inclusive timeout sobrescrito nos testes. Sem espera real de 30/40/45 segundos, teste HTTP do middleware JWT, banco, n8n/LLM reais ou PDF. Próximo baby step: reiniciar o ambiente pelo usuário e testar uma única chamada autenticada da API com o Webhook ouvindo, conferindo categoria real e retorno combinado antes de avançar.

## IA: primeiro retorno manual e diagnóstico de listas vazias — 06/11/2026

Usuário informou retorno da API com Programmings=[] e Hosts=[] e trouxe a interpretação do n8n para Recife, 07/11/2026, 09:00–12:00, Turismo (categoria 8), Café (categoria 12) e hostTypes=[1]. Os IDs são do catálogo real; valor monetário/pessoas não informados permaneceram null. Código/status HTTP não foi colado nesta troca; não confundir esse relato com execução automatizada do fluxo completo pelo assistente.

Inspeção do assistente em transação PostgreSQL explicitamente READ ONLY, na configuração base localhost:5432/perambulando: categorias 8=Turismo e 12=Café existem/ativas; zero programações ativas/não encerradas/com host ativo, mesmo antes dos filtros de cidade/data; zero hosts gastronômicos ativos em todas as cidades. Repositories reais retornaram zero para ambas as categorias no período e para host tipo 1/Recife tanto sem agenda quanto com sábado e sábado 09–12. Portanto, nesse banco e nesse momento, o retorno vazio é coerente com os cadastros, não evidência de falha no transporte ou falta de agenda apenas.

Nenhum dado criado/alterado/excluído, nenhuma migration, workflow ou chamada de IA executada pelo assistente. A inspeção consultou apenas contagens e os nomes/atividade das categorias relevantes; não gravou resultados de usuários em arquivos. Próximo teste de presença de sugestões dependerá de cadastros compatíveis, sem alterar silenciosamente filtros ou povoar banco real para teste automatizado de interface. O estado dos dados acima é temporal, não uma regra permanente da API.
> Orientação de alimentação — 06/11/2026: buscas por café, bares e restaurantes devem usar somente Gastronomia (`Gastronomy = 1`), com `hostTypes: [1]`. O usuário reconsiderou a inclusão de Produtores (0). A validação anterior da API foi restaurada; o schema continua aceitando somente Gastronomia (1) e Comércio (2). Workflow e PDFs não foram alterados.


## Validação manual do TravelChat confirmada pelo usuário — 06/11/2026

O usuário executou a integração API → n8n → API e confirmou sucesso nos seguintes cenários: retorno de host com cidade e agenda compatíveis; retorno de programação com categoria/cidade/período compatíveis; orçamento de até R$ 30 por pessoa por parada; programações gratuitas; busca sem data/horário; interesses de Gastronomia e Comércio; cidade sem cadastros retornando listas vazias sem erro. São confirmações manuais do usuário, sem novos corpos/status HTTP anexados para cada cenário, e não testes automatizados executados pelo assistente.

Na investigação do host, consultas somente leitura identificaram inicialmente cidade vazia e depois IsClosed=true, inclusive no sábado apesar do período 08:00–13:00. Após o usuário corrigir o cadastro, confirmou retorno. O filtro real retornava um host sem agenda e zero com sábado enquanto estava fechado. Não houve correção automática dos dados pelo assistente.

Regra vigente: alimentação (café, bares e restaurantes) usa hostTypes=[1], somente Gastronomia. Comércio usa 2 em interesses de compras; Produtores (0) continuam rejeitados no TravelChat. O usuário desistiu da ampliação para produtores.

Escopo validado: prompt único, extração de preferências e listas de cadastros existentes. Continuam fora desta versão localização/proximidade, perguntas/respostas, histórico e persistência de roteiro. A especialidade cafeteria não é garantida pelo tipo Gastronomia. Orçamento só restringe a busca quando confirmado por pessoa e por parada; não comprova custo total do roteiro. Publicação do workflow/URL de produção e autenticação entre API e n8n continuam pendentes de configuração e validação; os testes relatados não comprovam essa etapa.

Atualização apenas documental. Sem nova chamada à IA, alteração funcional, escrita no banco ou exportação de PDFs. Conferência: git diff --check.

## TravelChat: preparação de Header Auth — 06/11/2026

O HttpClient da interpretação lê N8n:TravelChatWebhookKey (variável de ambiente N8n__TravelChatWebhookKey) e, quando preenchida, envia X-Perambulando-Key ao webhook. Sem a configuração, mantém temporariamente o fluxo local sem esse cabeçalho, para permitir configuração em baby steps. Isso não torna o webhook autenticado por si só: a credencial Header Auth do n8n deve usar Name=X-Perambulando-Key e o mesmo Value, e ser vinculada ao Webhook depois da configuração da API.

Chave exclusiva de servidor, independente do JWT do usuário e da credencial Gemini. Não colocar em DTO, frontend/protótipo, launchSettings versionado ou appsettings versionado. Para desenvolvimento, pode ser configurada pelo recurso Manage User Secrets do projeto da API com a propriedade N8n:TravelChatWebhookKey. Em produção, usar o mecanismo de segredos do ambiente e HTTPS quando o tráfego sair do loopback local. A URL de produção e a ativação da autenticação no workflow continuam pendentes. O assistente não recebeu nem gravou a chave.

Rotas, autenticação JWT da API, DTOs e respostas permanecem iguais. Ajuda do protótipo atualizada para deixar explícito que a chave é configurada somente no servidor. Sem migração, alteração de banco, chamada à IA, edição do workflow ou exportação de PDFs.

Validação desta preparação: build --no-restore aprovado com zero erros e nove avisos de nulabilidade preexistentes; node --check public/app.js aprovado; 107 testes do protótipo aprovados com API simulada (reexecução fora da sandbox após bloqueio de loopback EACCES). git diff --check sem erros. O envio autenticado ao n8n real ainda não foi testado.

## Roteiros personalizados — 12/11/2026

Implementação preparada; migration `20261112194651_AddRoadmaps` criada, **não aplicada**. Não reinicie em Development antes de revisar: o Program.cs existente executa MigrateAsync na inicialização. Nenhuma mudança de schema foi executada nesta etapa.

### Contrato e acesso
- `POST /api/Roadmap`: público, JWT opcional; retorna 201 e Location para a consulta compartilhada. UserId vem exclusivamente da identidade autenticada, nunca do corpo. Sem token cria roteiro anônimo, que não pode ser editado ou desativado depois.
- `GET /api/Roadmap/Shared/{shareId}`: público, somente leitura; identificador UUID aleatório. Compartilha nome e paradas, nunca UserId/e-mail. Roteiros inativos ou de contas desativadas retornam 404. SharePath é uma rota relativa da API que retorna JSON; o frontend deve compor sua página pública a partir de ShareId, sem colocar JWT no link.
- `GET /api/Roadmap/GetAllRoadmapbyUserId?take=10&skip=0`: JWT obrigatório; somente roteiros ativos do usuário autenticado. Não recebe userId externo; take de 1 a 100 e skip não negativo. Lista vazia retorna 200 com [].
- `PUT /api/Roadmap/{id}`: JWT do dono, substitui nome e lista completa de paradas; exige Version da última leitura. Anônimo/outro dono não obtêm acesso por ShareId; 404 para roteiro indisponível e 409 para versão desatualizada/concorrência.
- `PATCH /api/Roadmap/{id}/Deactivate?version={uuid}`: dono autenticado e versão atual; soft delete, retorna 204 e torna o compartilhamento indisponível.
- `POST /api/TravelChat/Messages` passou a permitir anônimos. Com JWT válido, continua verificando usuário ativo pelo IUserService.GetProfileAsync. Authorization inválido/expirado não é aceito silenciosamente como anônimo. Sem header, não consulta perfil. Não envia identidade ao n8n.
- Criação de roteiro e TravelChat usam o limitador local por IP já existente, ProgrammingInteractions (120/minuto); excesso retorna 429. Não substitui política de quotas distribuídas de produção.

### DTOs, entidades e regras
RoadmapDTO: Name obrigatório até 150 caracteres, Version opcional na criação/obrigatória na edição e Stops de 1 a 30. Cada RoadmapStopDTO recebe somente ProgrammingId OU HostId, mais StartDate/EndDate UTC. A ordem da lista define Position. IDs positivos, início anterior ao fim, período entre 2000 e 2100, sem sobreposição; intervalos adjacentes são permitidos. Não exige participação integral: a visita deve caber no evento. Não calcula tempo de deslocamento, vagas ou reservas e não exige que os IDs pertençam a uma resposta específica da IA: opções ativas de qualquer página são novamente conferidas no banco.

Hosts elegíveis são Gastronomia/Comércio com grade cadastrada. A visita inteira deve caber em um intervalo aberto, incluindo viradas de dia e períodos do dia anterior; não atravessa intervalo fechado. Grade local interpretada em America/Recife, enquanto entrada e persistência usam UTC. O modelo atual não possui timezone por estabelecimento; ampliação a outros fusos fica pendente. Cada programação/host pode aparecer uma vez por roteiro. Validações ocorrem ao criar/editar; alterações posteriores no catálogo não reservam nem garantem disponibilidade. IsAvailable no retorno indica somente o estado ativo da opção/host.

RoadmapResponseDTO: Id, Name, ShareId, SharePath, Version, CreatedAt, CanEdit e Stops ordenadas com nome, IDs, período e IsAvailable. Consulta compartilhada sempre retorna CanEdit=false; criação autenticada/listagem privada/edição retornam true. Não é possível apropriar-se de um roteiro anônimo depois do login.

Persistência: Roadmaps (UserId nullable, ShareId único, Version como token de concorrência), RoadmapStops (FKs, posição única por roteiro, alvo exclusivo e período positivo com checks), RoadmapProgrammingUsages (histórico, par RoadmapId/ProgrammingId único). FKs de catálogo e usuário restritivas preservam referências; a desativação de usuário já é lógica. Criação usa um SaveChanges atômico. Edição usa transação: troca versão, remove paradas antigas, adiciona as novas e registra somente inclusões inéditas. Conflitos de versão são 409; outras falhas de banco não são mascaradas como conflito.

### Estatísticas
Summary, Daily e Ranking retornam RoadmapInclusions. Ranking aceita sortBy=roadmapInclusions. A métrica conta a primeira inclusão de uma programação em cada roteiro, na data UTC dessa inclusão; retirar/recolocar a mesma programação no mesmo roteiro não conta outra vez. A desativação do roteiro preserva esse histórico. Exclusão de autointeração compara dono do host ao usuário autenticado; não é possível identificar o dono quando navega anonimamente. Conta inclusões, não pessoas únicas, reservas ou comparecimento. Roteiros com somente hosts não aumentam a métrica de programações.

Agregações de favoritos, interações e inclusões são independentes, evitando produto cartesiano. Ranking faz left joins e mantém zeros; Daily reúne os grupos por data e o service mantém dias sem dados com zero. Autorização Pro e propriedade das estatísticas permanecem.

### Testes e operação
Harness em docs/validacoes/RoadmapChecks.csproj valida regras sem conexão ao banco. Exemplos de todas as rotas no arquivo Projetos - 4.http. Painel prototipo-api sincroniza os contratos e permite selecionar hosts/programações entre páginas, informar horários, ordenar e preparar o POST. Dados só são enviados ao clicar Enviar requisição; JWT é opcional nas duas operações públicas. Compartilhamento de rota da API é JSON, sem nova página pública no Expo. PDFs não foram regenerados.

Limites da verificação: não foram aplicadas migrations nem executadas gravações HTTP/integração PostgreSQL. Testes de transação, concorrência real e execução das agregações no PostgreSQL devem ocorrer após a revisão/aplicação autorizada da migration. Não confundir compilação/testes com banco atualizado.
