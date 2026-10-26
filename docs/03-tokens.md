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
