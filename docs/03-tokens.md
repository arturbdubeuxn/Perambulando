# Funcionamento dos tokens

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 18/10/2026

Base: `Domain/Service/JwtTokenService.cs`, `Presentation/Program.cs`, controllers de User/Host e fluxo de sessão do protótipo.

## 1. Fluxo atual

```text
Login com e-mail/senha
  -> Identity verifica usuário e senha
  -> JwtTokenService consulta roles e emite JWT
  -> frontend guarda accessToken
  -> Authorization: Bearer TOKEN nas chamadas protegidas
  -> middleware valida o token
  -> controller lê o usuário e serviço verifica propriedade
```

O endpoint de login retorna `accessToken`, `tokenType` (Bearer) e `expiresAt`. O cadastro de host e a edição de usuário também emitem tokens, dentro de `auth` na resposta.

## 2. O que existe no JWT

| Claim | Significado |
|---|---|
| `sub` | ID do usuário; usado pelo UserManager para identificar o solicitante |
| `jti` | Identificador novo e aleatório para cada token emitido |
| `name` | `UserName` no momento da emissão |
| `isPro` | Valor da propriedade de assinatura/condição Pro do usuário |
| `typeofuser` | Enum numérico do tipo Local/Turist |
| `role` | Uma claim por role cadastrada no Identity |
| `iss`, `aud` | Emissor e público-alvo configurados |
| `nbf`, `exp` | Instante inicial de validade e expiração |

O token é assinado com HMAC SHA-256. A assinatura permite verificar integridade; o conteúdo não é criptografado. Nenhuma senha é colocada no JWT. O token não leva a lista de hosts nem concede propriedade de um host por si só.

## 3. Configuração exigida

| Configuração | Variável de ambiente equivalente | Regra |
|---|---|---|
| `Jwt:Key` | `Jwt__Key` | Mínimo de 32 bytes UTF-8; chave privada da aplicação |
| `Jwt:Issuer` | `Jwt__Issuer` | Não vazio |
| `Jwt:Audience` | `Jwt__Audience` | Não vazio |
| `Jwt:ExpirationHours` | `Jwt__ExpirationHours` | Inteiro positivo |

O startup rejeita chave ausente/curta, emissor vazio, audiência vazia ou expiração não positiva. Não são reproduzidos valores de credenciais neste documento.

## 4. Validação de cada chamada

O JwtBearer valida assinatura, emissor, audiência e tempo de validade. A tolerância de relógio configurada é de 30 segundos. `MapInboundClaims = false` preserva os nomes das claims; as configurações do Identity usam `sub`, `name` e `role`.

```csharp
var userId = _userManager.GetUserId(User);
```

O controller obtém o ID do token validado. Não deve usar um userId escolhido pelo frontend como prova de identidade. `[Authorize]` exige autenticação; `[Authorize(Roles = "ADMIN,HOST")]` exige pelo menos uma dessas roles; `[AllowAnonymous]` permite consulta sem login.

Autenticação responde quem é a pessoa. A autorização por role permite acessar determinada funcionalidade. A verificação `Hosts.UserId == userId` nos serviços determina a propriedade efetiva.

## 5. Atualização após criar host

A conta pode iniciar sem role HOST. O cadastro de host recebe o JWT existente, associa o host ao usuário e atribui HOST se necessário. Depois gera um novo token que já contém as roles atuais.

O frontend deve substituir o token local por `createHost.auth.accessToken`. O token anterior não passa a ganhar novas claims automaticamente. Não é necessário repetir o login se o novo token já foi aplicado.

O mesmo princípio vale para `PUT /api/User/Edit`: aplicar `auth.accessToken` para refletir nome e demais claims atualizadas.

## 6. Expiração e logout

Quando o JWT expira, chamadas protegidas deixam de ser autenticadas e normalmente recebem 401, considerando a tolerância de relógio. No fluxo atual, o usuário faz login novamente para obter outro token. Não há refresh token nem endpoint de renovação.

Logout é local: o frontend remove o token e limpa os dados de sessão. O protótipo tem o botão Limpar sessão para isso. Não há endpoint de logout, lista de revogação nem consulta de revogação por `jti`.

Uma cópia do token permanece tecnicamente válida até expirar. Emitir outro token não invalida os anteriores. Um token removido do armazenamento local não foi revogado no servidor.

## 7. Limites atuais

- O middleware não consulta a situação do usuário e suas roles no banco a cada token validado. Alguns fluxos verificam usuário ativo explicitamente; as verificações não são universais para todas as actions.
- Alterar/remover uma role no banco não retira a claim de um token já emitido.
- `jti` existe, mas não é persistido ou usado como mecanismo de revogação.
- A existência de `AspNetUserTokens` no Identity não significa que os access tokens da aplicação estejam sendo gravados ali.
- A atribuição de HOST e a criação do host não estão em uma transação única no fluxo atual.

## 8. Contrato para o frontend

Enviar o Bearer apenas para a API apropriada, aplicar os novos tokens retornados por create de host e edit de usuário, tratar 401 como necessidade de autenticação e distinguir 403 (role insuficiente) de 404 (registro indisponível para o solicitante).

`canEdit` e `canDelete` não são retornados atualmente. A interface pode usar a listagem dos próprios hosts para gestão; o backend deve continuar verificando o dono em toda mutação.


## Refatoração de Address — 21/10/2026

GET /api/Address/GetAllAddress exige autenticação, sem role HOST. A autoria do endereço vem do usuário identificado pelo JWT; não é recebida no DTO. As claims e a emissão/renovação de JWT permanecem iguais; CreateHost continua devolvendo auth e agora inclui host.addressId.

Nenhuma migration ou PDF gerado nesta etapa. [Revisão pendente](validacoes/refatoracao-address-revisao-2026-10-21.md).


## Retorno do cadastro de host — 21/10/2026

HostController.Create passa a retornar 201 com somente as propriedades result (retorno de _hostAppService.Create) e auth (JWT). O result foi declarado antes do try para poder ser usado no retorno. O .http usa createHost.response.body.$.result.id, e o protótipo lê result para reaproveitar o host; auth.accessToken permanece igual. Nenhuma migration gerada ou aplicada nesta alteração. O retorno de result representa a entidade Hosts completa, inclusive suas navegações serializáveis.

## Cadastro de host e role na mesma transação — 22/10/2026

HostService prepara o endereço (incluindo eventual geocodificação) antes de abrir a transação. A atribuição da role continua sendo decidida no serviço, que passa a operação assíncrona para HostRepository.Create(host, assignRole). O repositório abre a transação, grava host/endereço, executa a atribuição e confirma somente após o sucesso de todas as operações.

O Identity usa AddEntityFrameworkStores<Context>() e o repositório recebe o mesmo Context scoped. Assim, os SaveChangesAsync do repositório e do Identity participam da mesma transação/conexão. Uma falha provoca rollback e limpeza do ChangeTracker do contexto da requisição, evitando reaproveitar estados de registros desfeitos. Não há UnitOfWork nem nova pasta/camada.

Se AddToRoleAsync retornar falha, o controller responde 500 informando que o cadastro foi desfeito. A mensagem antiga de que o host permaneceu salvo foi substituída. Usuários que já possuem HOST não recebem outro vínculo. Endereços preexistentes são preservados; endereços novos da operação são revertidos junto com o host. A emissão do JWT continua após a conclusão do cadastro; result/auth e os DTOs permanecem iguais. A geração/entrega HTTP do token não faz parte da transação de persistência.

Validação: 79 verificações aprovadas em SQLite em memória, com UserManager/RoleManager e stores EF reais, repositórios reais e preparação de endereço simulada. Conferidos compartilhamento de contexto/conexão, mesma transação nos dois SaveChanges, sucesso, role preexistente, falha do Identity, endereço reutilizado, falha após o Identity gravar, falha de FK ao gravar host e role HOST não cadastrada. O modelo de teste ignora apenas Address.Location, específica do provedor geoespacial.

Executar na raiz:

```powershell
dotnet run --project docs/validacoes/HostTransaction.Tests.csproj
```

Build aprovado com sete avisos CS8618 preexistentes. Nenhum acesso ao banco da aplicação, migration ou chamada ao geocodificador. Não foi realizado teste integrado em PostgreSQL. Protótipo indisponível neste computador; documentação atualizada sem regenerar PDFs.


## Autorização de alteração de host — 26/10/2026

O JWT continua identificando o usuário e habilitando a entrada nas rotas com roles ADMIN/HOST. No serviço de host, edição/desativação também verifica usuário ativo e a associação atual à role ADMIN pelo UserManager. O repositório aceita acesso ao host ativo pelo dono ou pelo administrador confirmado internamente; não recebe isAdmin do cliente. Nenhuma claim, expiração ou emissão de token mudou. Revogar ADMIN no Identity retira o acesso administrativo a hosts de terceiros mesmo com token antigo ainda portando a claim. Validado com dependências simuladas; sem teste HTTP autenticado ou gravação real.


## DTO de usuário compartilhado — 26/10/2026

Cadastro/edição agora recebem UserDTO. A edição continua atualizando nome/e-mail/tipo e retornando auth com JWT atualizado; Password, mesmo se enviado, não é usado para alterar senha nem claims. A senha permanece obrigatória somente na criação da conta. Login continua com UserLoginDTO. Protótipo preserva atualização automática do JWT e não envia senha na edição; esse comportamento foi exercitado por teste com API simulada. Nenhuma mudança de chave, emissão, roles, duração ou renovação de token.


## Bloqueio de login e stamps do Identity — 26/10/2026

AccessFailedCount, LockoutEnabled, LockoutEnd, SecurityStamp e ConcurrencyStamp voltam ao modelo persistido. Política explícita: cinco falhas, bloqueio de 15 minutos, habilitado para contas novas. O bloqueio impede novos logins; não revoga JWTs existentes. Armazenar SecurityStamp não adiciona validação de stamp aos JWTs. Contratos, claims, roles e expiração permanecem iguais. É necessária migration revisada no banco principal antes de usar o código.

Implementação, roteiro da migration e teste reproduzível: [revisão R01](validacoes/identity-bloqueio-login-2026-10-26.md).

## Verificação após AddFavorite — 26/10/2026

Confirmada aplicação de AddFavorite. Campos Identity existem e as 23 contas antigas têm bloqueio habilitado, mas SecurityStamp/ConcurrencyStamp continuam nulos nessas contas; as duas roles também têm ConcurrencyStamp nulo. O erro User security stamp cannot be null foi reproduzido em conta isolada ao informar senha incorreta. Preencher stamps antigos é necessário para completar a correção. Isso não cria revogação automática de JWTs.

Evidências e teste reproduzível: [auditoria da migration](validacoes/validacao-migration-addfavorite-2026-10-26.md).

## Limpeza autorizada das contas antigas — 26/10/2026

As 23 contas antigas com stamps ausentes foram removidas com autorização explícita. Roles ADMIN/HOST preservadas e ConcurrencyStamp inicializado nas duas. Para novos testes, limpar a sessão do protótipo, cadastrar nova conta e fazer login. Esta limpeza não adiciona revogação criptográfica aos JWTs antigos; a tarefa de validação de usuário ativo/JWT permanece separada.

## Endpoint público de paginação — 26/10/2026

GET /api/Programming/GetAllProgrammings é AllowAnonymous. Não exige login, roles nem token e não emite/renova JWT. O protótipo omite o token mesmo quando a aba tem sessão autenticada.

## Restauração após reorganização do backend — 26/10/2026

O appsettings.json local não foi levado na mudança para backend/Projetos - 4, provocando a exceção Configure Jwt:Key with at least 32 bytes. Restaurada a seção JWT de uma cópia local anterior em backend/Projetos - 4/appsettings.json, ignorado pelo Git, sem troca da chave ou exposição de segredo. A conexão local também foi recuperada (PostgreSQL 5432); appsettings.Development.json compartilhado do merge aponta para 5434 e foi preservado. Em Development, o Program.cs existente recarrega appsettings.json local após os arquivos padrão, portanto essa configuração local prevalece. Parar e reiniciar a depuração para recarregar.

## Conexão HTTPS do protótipo — 26/10/2026

Proxy do protótipo usa certificados confiáveis padrão e do sistema para HTTPS local, mantendo validação TLS e hostname. Não foi usado rejectUnauthorized=false nem desabilitada a verificação de certificados. O proxy continua sem seguir redirecionamentos de requisições: informa o destino HTTPS somente para promoção HTTP→HTTPS no mesmo host e caminho. A verificação de conexão pode repetir somente GET nesse endereço; chamadas de cadastro/edição não são repetidas automaticamente. JWT e configuração da API permanecem iguais.


## US17 — primeira etapa preparada em 27/10/2026

Implementados no código: Subscription e configuração EF, repository, service, app service, mapping, interfaces, DTO e controller. Rotas autenticadas: POST /api/Subscription/Activate, GET /api/Subscription/MySubscription e PATCH /api/Subscription/Cancel. Titular vem do JWT; não há corpo de entrada. Retorno 200 com Id, Status, StartsAt e ExpiresAt (camelCase no JSON). Status numérico: 0 Inactive, 1 Active, 2 Cancelled, 3 Expired (calculado). Sem assinatura, datas/Id nulos e Status Inactive. Identidade ausente/inativa: 401. Simulação desabilitada: Activate retorna 403.

Regras confirmadas: assinatura por usuário cobrindo todos os hosts, um mês via AddMonths(1), sem renovação automática, repetição não estende vigência, cancelamento imediato e reativação inicia novo período. Datas UTC; limite final exclusivo. Pro:SimulationEnabled precisa ser explicitamente true (variável Pro__SimulationEnabled); configuração ausente desabilita ativação. Nenhuma cobrança. Cancelamento continua disponível com simulação desligada.

Persistência proposta: tabela Subscriptions, índice único UserId, FK para AspNetUsers com Restrict. Escritas bloqueiam a linha do usuário dentro de transação PostgreSQL e atualizam User.isPro na mesma transação. Nenhum usuário existente recebe assinatura automaticamente. MySubscription calcula vigência; perfil/JWT ainda usam o booleano legado e precisam ser ajustados na próxima etapa. As permissões retornadas indicam elegibilidade; carrossel e estatísticas ainda não foram implementados.

Validação: dotnet build aprovado, zero erros e dez avisos em arquivos existentes. 14 testes isolados com repositório/usuário simulados passaram: ausência de assinatura, identidade, simulação, duração, repetição, fronteiras de validade, cancelamento, reativação e expiração. Testes locais: C:/Users/rafae/Documents/ChatGPT/Perambulando/SubscriptionRules.Tests.csproj. Concorrência, SQL e HTTP ainda não foram testados em PostgreSQL.

Migration não gerada nem aplicada; banco inalterado. O guard existente HasPendingModelChanges em Development deve impedir inicialização até revisão e preparação da migration. Depois de gerar a migration, a inicialização em Development a aplica automaticamente: revisar esse fluxo antes de iniciar contra banco real. Próxima etapa: revisar migration/SQL, estratégia para usuários legados e validar em banco descartável; depois integrar benefício efetivo ao perfil/JWT.

Protótipo externo indicado no AGENTS.md (C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api) não existe neste computador e não foi atualizado. Exemplos .http adicionados. PDFs preservados.

## Revisão US17 do checkout atual - 27/10/2026

A [revisão atual da US17](validacoes/us17-revisao-codigo-2026-10-27.md) substitui as alegações anteriores de configuração de simulação aplicada, bloqueio de linha e concorrência resolvida. O código atual ignora SimulationEnabled, o EF gera uma FK shadow userId adicional e perfil/JWT continuam usando isPro sem conferir validade. A base das camadas/endpoints existe; carrossel, interações e estatísticas permanecem pendentes. Build aprovado; onze verificações locais e inspeção de modelo EF executadas. Banco/HTTP não verificados porque Docker está indisponível. Sem correções funcionais, migration ou PDF nesta revisão.

## Pro calculado pela assinatura - 27/10/2026

User.isPro removido do model e das escritas de ativação/cancelamento; claim isPro removida dos novos JWTs. UserProfileDTO mantém IsPro, calculado por SubscriptionService.IsProAsync e mapeado no UserAppService, sem ciclo de DI. Claim Pro de tokens antigos não determina o benefício. Navegação Subscription.user ligada explicitamente a UserId, eliminando a FK shadow extra. Essas correções substituem os achados correspondentes da revisão anterior; configuração de simulação e concorrência continuam pendentes.

Auditoria em leitura: três usuários reais, zero marcados Pro e nenhuma tabela Subscriptions. Migration de criação de Subscriptions/remoção da coluna Users.isPro não foi gerada/aplicada; precisa de revisão antes de usar o novo código contra o banco principal. Build aprovado, 30 verificações HTTP/EF/PostgreSQL reais em banco descartável e 61 testes simulados do protótipo aprovados. Dados reais preservados; sem PDF novo. [Alterações, testes e plano de migration](validacoes/us17-remocao-ispro-2026-10-27.md).

## Listagem exclusiva para turistas — 28/10/2026

`GET /api/Programming/GetAllTuristProgrammings?take=10&skip=0` exige autenticação e a claim numérica `typeofuser=1`, já emitida pelo JwtTokenService para User.TypeofUser.Turist. Não exige role HOST/ADMIN nem assinatura Pro. O controller bloqueia claim ausente/Local com 403 e utiliza o ID do usuário autenticado, sem aceitar ID ou tipo do usuário pela query.

ProgrammingAppService chama ProgrammingService.GetAllTuristProgrammings, que valida take de 1 a 100 e skip não negativo e consulta IUserRepository.GetbyId. O usuário deve existir, estar ativo e ainda ter Typeofuser Turist no banco; divergência do JWT, usuário inexistente ou inativo resulta em 403. JWT inválido, vencido ou ausente resulta em 401 pelo middleware. O formato do JWT não mudou; contas cujo tipo foi alterado de Local para Turist precisam de token atualizado.

A consulta reutiliza GetAllProgrammingsAsync do repositório: programações e hosts ativos, ordenados por StartDate e Id, com Skip/Take no banco. Retorna ProgrammingResponseDTO com endereço e categories (id, name, isActive); página vazia retorna 200 com []. Não há campo que classifique uma programação como turística: esta funcionalidade restringe quem acessa a listagem, não seleciona eventos por uma categoria turística. Preserva o comportamento da listagem geral quanto às datas, inclusive eventos iniciados ou encerrados. A listagem geral pública permanece disponível.

O frontend pode exibir a seção somente quando a claim typeofuser for 1; o backend continua aplicando a autorização. No protótipo de testes, a operação aparece como “Programações para turistas”, com instrução de acesso e paginação padrão, permitindo testar também as recusas. Exemplos adicionados ao arquivo Projetos - 4.http.

Validação executada: compilação aprovada com zero erros e 10 avisos preexistentes; 45 verificações HTTP/EF/PostgreSQL em banco descartável (28 de regressão e 17 da listagem turística), incluindo 401, 403 por tipo/claim/conta, paginação inválida, resposta vazia, endereço/categorias e exclusão de hosts inativos. Banco descartável removido; banco principal preservado. Node --check aprovado em public/app.js e catalog.mjs e 65 testes simulados do protótipo aprovados. Sem nova pasta de aplicação, migration, reinicialização da API do Visual Studio ou exportação de PDF.


## Estatísticas implementadas em 29/10/2026

Coleta permite visitante anônimo sem Authorization. Cabeçalho fornecido exige JWT válido; sub vem do UserManager e nunca do DTO. Estatísticas exigem identidade e vigência atual da assinatura, não a claim isPro.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

## US17 — Ranking implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Ranking retorna ProgrammingStatisticsDTO[] com posição global, identificação/estado da programação e cinco indicadores. Aceita startDate/endDate, sortBy (detailViews padrão; carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow), take=10 (1–100) e skip=0 (>=0). Ordem decrescente e desempate pelo ID; página vazia retorna []. Inclui histórico desativado e programações sem dados. Interações respeitam o período UTC; favoritos ativos de contas ativas representam o total atual.

Roles ADMIN,HOST acrescentadas pelo usuário foram preservadas em Summary/Daily e aplicadas ao Ranking. Nas três actions, essas roles são necessárias, mas não substituem propriedade do host ativo, usuário ativo e Pro vigente. ADMIN não tem exceção. Esta descrição substitui referências anteriores à dispensa de role. Retornos 200, 400, 401, 403 e 404 conforme filtro/autenticação/role/Pro/propriedade.

RankingStatisticsValidations reaproveita ISumarryStatitcsValidations e valida paginação/indicador. Service usa o filtro validado, consulta e atribui posições; repository agrega interações e favoritos separadamente e usa left joins, ordenação e paginação no banco, evitando multiplicação das contagens. AppService usa mappings com interfaces; controller só coordena retornos e exceções. Filtro específico e classes/DTOs existentes seguem as pastas atuais. Não há tabela/índice/migration nova.

Versão final aprovada em 129 verificações HTTP/EF/PostgreSQL de Ranking/Summary/Daily, com build sem erros e 10 avisos preexistentes. Protótipo/.http atualizados; sintaxe JS e 70 testes simulados aprovados, incluindo roles formatadas com espaços. Bancos descartáveis removidos, principal preservado, API principal não reiniciada e PDFs não exportados. Próximas etapas: coleta automática no frontend, painel Pro definitivo e validação integrada. [Contrato, regras e testes](validacoes/us17-host-ranking-2026-10-30.md).

## US17 — Coleta somente no ambiente de testes — 30/10/2026

Por decisão explícita do usuário, esta etapa foi feita em prototipo-api e não no frontend Expo. O painel oferece opt-in para registrar aberturas de detalhes, cliques no carrossel, ingresso e simulação identificada de origem Perto de mim. Sem opt-in, consultas continuam sem coleta. Histórico, renderização, estatísticas e prefill de edição não geram eventos. Não foi criada busca real por proximidade.

UUID novo por ação; falhas transitórias oferecem reenvio manual com o mesmo UUID, tipo, programação, API e JWT originais. Fila limitada a 50 em memória, limpa no logout/exclusão de conta e perdida ao recarregar. Coleta não bloqueia navegação e não substitui a resposta principal. Services/repositories/contratos/backend permanecem inalterados; o envio utiliza a idempotência já implementada.

Sintaxe JS e 83 testes com API simulada aprovados. Nenhum dado real alterado ou teste contra API principal nesta etapa; frontend/ confirmado sem alterações, nenhuma migration/PDF ou reinicialização de backend/Expo. Recarregar o protótipo para receber a interface. Coleta e painel do frontend definitivo continuam pendentes. [Fluxos, regras, limites e testes](validacoes/us17-coleta-prototipo-2026-10-30.md).


## Interações do próprio dono — 31/10/2026

Novas interações autenticadas cujo UserId coincide com Programming.Host.UserId são ignoradas pelo ProgrammingInteractionService, após as validações existentes. Vale para DetailView, CarouselClick, TicketClick e NearbyClick. A consulta usa IProgrammingRepository.GetByIdAsync, que inclui Host. O service retorna null (Task<ProgrammingInteraction?> na interface), sem chamar AddAsync do repository; o AppService não usa o retorno e o controller mantém 204 sem corpo. Não há mudança de DTO, rota ou schema.

Eventos de outros usuários e visitantes anônimos continuam sendo salvos. Sem autenticação não é possível reconhecer o dono. Validações de programação/conta/tipo/ingresso e conflitos de EventId continuam aplicáveis; eventos previamente armazenados mantêm a idempotência. Registros históricos não foram apagados e não foram adicionados filtros retroativos às estatísticas. Eventos ignorados não reservam EventId no banco.

O protótipo descreve 204 como ação aceita, pois não permite distinguir persistência de descarte intencional. Service concentra a decisão; repository mantém persistência, unicidade e recuperação de concorrência existentes.

Validação: build sem erros (10 avisos preexistentes na compilação do backend); 14 verificações do service com dependências simuladas aprovadas, cobrindo quatro tipos, reenvio, visitante, usuário diferente, data UTC, conflito e validação. Sintaxe JS aprovada e 83 testes do protótipo com API simulada aprovados. Teste HTTP/PostgreSQL preparado, mas bloqueado por conexão recusada em 5432 e Docker Desktop desligado. Banco principal preservado, nenhuma migration e nenhum PDF exportado.


## Conta ativa na autenticação JWT — 01/11/2026

A configuração JwtBearer agora utiliza OnTokenValidated em Presentation/Program.cs para, após validar assinatura, emissor, audiência e prazo, exigir sub não vazio e consultar IUserService.GetProfileAsync. Esse service reutiliza IUserRepository.GetbyId e retorna null para conta ausente ou inativa. Nesses casos, context.Fail encerra a autenticação. Nenhuma regra de propriedade/role/Pro foi removida ou substituída.

Rotas protegidas retornam 401 antes de executar a action, mesmo com JWT ainda dentro da validade. O POST público de interações já valida explicitamente um Authorization enviado e também retorna 401, sem transformar a tentativa em evento anônimo. Requisições realmente anônimas e leituras AllowAnonymous permanecem públicas; AllowAnonymous não passa a exigir login. Não foi alterada nesta etapa a seleção de programações publicadas por donos inativos.

A consulta é feita a cada autenticação JWT, sem cache, refletindo desativação/exclusão na próxima requisição. Não há cancelamento retroativo de uma requisição que já passou pela autenticação. Se a conta for reativada, um JWT ainda válido volta a funcionar: isto não implementa revogação permanente por token, SecurityStamp, alteração de senha ou mudança imediata de roles. Falhas de banco não são convertidas em autenticação bem-sucedida.

O callback foi colocado na configuração de autenticação existente; controllers, services, repositories, models, DTOs e migrations não receberam novas estruturas. O protótipo mantém JWT/IDs e mostra orientação sobre token/conta ativa em 401 sem corpo, sem reenviar chamadas automaticamente nem apagar a sessão indiscriminadamente. Nenhuma alteração no frontend Expo.

Validação desta etapa: compilação isolada sem erros, com 10 avisos preexistentes; 37 verificações HTTP/Identity/PostgreSQL aprovadas, incluindo login real, mesmo JWT antes/depois da desativação, exclusão, sub ausente/vazio, assinatura inválida, expiração, ausência de gravações, acesso anônimo e propriedade. Mais 129 verificações de Summary/Daily/Ranking e 85 testes simulados do protótipo aprovados; sintaxe JS e git diff --check aprovados. Docker Desktop local iniciado para os testes; bancos e APIs temporários encerrados/removidos. Banco principal e seus dados fictícios preservados, sem migrations ou exportação de PDFs. A API principal precisa ser reiniciada normalmente pelo usuário para carregar a alteração.


## Exclusão lógica de usuário — 01/11/2026

Ao concluir DELETE /api/User com 204, a conta fica inativa. A verificação existente em OnTokenValidated consulta IUserService.GetProfileAsync e recusa novas requisições protegidas, mesmo com JWT ainda dentro da validade. Login também recusa contas inativas. O protótipo limpa JWT/perfil/fila de interações somente no sucesso; uma exclusão recusada preserva a sessão.

Não foram adicionados blacklist, refresh token ou comparação de SecurityStamp ao JWT. A exclusão é feita via UserManager.UpdateAsync, que mantém o controle de ConcurrencyStamp do Identity. Em teste, uma edição carregada antes da exclusão falhou com ConcurrencyFailure e não reativou a conta. Se um procedimento futuro reativar manualmente a conta, o JWT ainda válido pode voltar a autenticar, conforme regra existente; isso não reativa automaticamente assinatura ou publicações. Nenhuma rota de recuperação foi implementada.


## Emissor JWT por interface — 01/11/2026

A implementação JwtTokenService foi movida de Domain/Service para Data/Services. O contrato IJwtTokenService está em Domain/Interfaces/Service e retorna Task<AuthenticationToken>, modelo de resultado em Domain/Model. UserController e HostController recebem a interface; Program.cs registra AddScoped<IJwtTokenService, JwtTokenService>. A configuração e os detalhes de emissão/assinatura permanecem na implementação de infraestrutura.

AuthenticationToken possui AccessToken, TokenType (Bearer) e ExpiresAt. Com a serialização web existente, o JSON mantém exatamente accessToken, tokenType e expiresAt; o cadastro de host continua usando auth.accessToken. Sem alterações de chave, algoritmo, issuer/audience, duração, claims sub/jti/name/typeofuser/role, atualização de roles ou validação de conta ativa. Não foi criada entidade persistida de token nem nova tabela.

Validação: contrato tipado e DI conferidos entre as 46 verificações da refatoração. Login real e uso do JWT conferidos nas 37 regressões HTTP/Identity/PostgreSQL; protótipo aprovado em 91 testes simulados. Banco/API principais preservados. Reinicie a API normalmente para carregar o novo registro de DI. Sem migration ou exportação de PDF.


## Retirada do endpoint de roteiros — 04/11/2026

A primeira implementação de IA/n8n e POST /api/Itinerary/Generate foram retirados da master a pedido do usuário. Emissão, validação, claims e proteção de conta ativa dos JWTs existentes preservadas. Não houve mudança de token ou permissões de outras actions. Build com zero erros/nove avisos anteriores e 91 testes simulados do protótipo aprovados. Sem banco, API reiniciada ou PDF.


## Autenticação das rotas de funcionamento — 04/11/2026

GET e PUT /api/Host/{hostId:int}/OpeningHours usam [Authorize]. O usuário vem de UserManager.GetUserId(User), não do corpo ou query. Não há emissão, renovação ou alteração de JWT nestas actions. A conta ativa e o papel ADMIN/propriedade são conferidos no OpeningHoursService; um token válido, isoladamente, não concede edição sobre qualquer host.

O protótipo reutiliza o JWT da sessão, inclusive o retornado pelo cadastro de host. Exemplos .http usam createHost.response.body.$.auth.accessToken. Token ausente, inválido ou vencido retorna 401 pela autenticação; usuário indisponível retorna ProblemDetails 401 pelo fluxo. Host inacessível retorna 404. Realizadas 31 verificações HTTP com tokens assinados e domínio/persistência simulados; a autorização de negócio real foi coberta nos testes de service da etapa anterior. Nenhuma mudança de claims, duração ou chave.


## TravelChat: identidade na action — 05/11/2026

TravelChatController.SendMessage exige [Authorize], obtém userId via UserManager<User>.GetUserId(User) e o passa separado do DTO à Application. ID ausente gera 401. Nenhuma emissão/claim/renovação de token foi alterada. AppService concreto e DI ainda pendentes: rota não está funcional em execução. Verificação de conta ativa e propriedade ainda não implementadas. Build aprovado; sem teste HTTP desta action.

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


## Chat: propriedade preparada no domínio — 05/11/2026

O service passa userId autenticado ao GetByIdAsync e rejeita retorno nulo, inativo ou pertencente a outro usuário com 404 uniforme via action. Nova conversa recebe UserId do servidor. Repository/DI continuam pendentes: comportamento validável apenas com dependências simuladas, sem teste HTTP ou banco.


## IA simplificada: identidade preservada — 05/11/2026

POST /api/TravelChat/Messages mantém JWT, userId da action e conta ativa por GetProfileAsync. Removida dependência de conversa/propriedade no prompt independente. Sem UserId no DTO; integração/DI pendentes.

## IA: token do usuário não é enviado ao n8n — 06/11/2026

Cliente N8nTravelChatInterpretationService recebe somente HttpClient e TravelChatMessage, sem HttpContext ou JWT. Envia prompt, referência temporal e categorias; identidade permanece na API por JWT/GetProfileAsync. Credencial Gemini permanece no n8n. Autenticação entre API/n8n e registro do cliente serão definidos no próximo passo; não há segredo fixo no novo código. Emissão, claims, renovação e middleware JWT preservados. Verificações simuladas conferiram ausência de Authorization no request do cliente não configurado; nenhum token real foi utilizado nesta etapa.

## IA: configuração de transporte sem encaminhar JWT — 06/11/2026

DI do cliente n8n agora configurada, sem Authorization de usuário nos DefaultRequestHeaders. JWT continua somente na API. URL vem de N8n:TravelChatWebhookUrl; endereços com usuário/senha embutidos são rejeitados como configuração inválida. Não foram alteradas credenciais Gemini, autenticação do Webhook, claims, login ou middleware JWT. O teste da DI confirmou ausência de JWT no transporte simulado; não foi usado token real. Webhook de teste deve estar ouvindo para teste manual da API.

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
