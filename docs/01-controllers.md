# Perambulando — Documentação dos endpoints

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Conferido em 19/10/2026 a partir dos controllers, DTOs e serviços salvos do projeto. Os campos de endereço foram verificados por testes offline e a migration aplicada ao banco local, sem cadastrar/excluir registros para testar as actions.

## Convenções

- URL local usada no arquivo de testes: `http://localhost:5014`. Depende de como a API foi iniciada.
- Corpos de requisição são JSON: `Content-Type: application/json`.
- Endpoints autenticados exigem `Authorization: Bearer SEU_ACCESS_TOKEN`.
- `ADMIN ou HOST` significa possuir pelo menos uma dessas roles. A role não dispensa a verificação de propriedade nos serviços de edição e desativação.
- Os IDs de rota são inteiros. As actions validam que sejam maiores que zero; valores que não correspondem à restrição `int` não selecionam essas rotas.
- Respostas de erro dos controllers usam ProblemDetails ou ValidationProblemDetails. Falhas de autenticação/autorização do middleware podem não ter o mesmo corpo.
- Requisições protegidas podem retornar `401` por token ausente, inválido ou expirado e `403` quando faltar uma role exigida.
- `204` não possui corpo. Listas vazias podem retornar `200` com `[]`.
- Os exemplos usam a grafia atual da API: `instagranUrl`, `typeofhost`, `typeofUser` e `categoryIds`.

## Inventário

| Controller | Método | Caminho | Acesso |
|---|---|---|---|
| User | POST | `/api/User/auth/Register` | Público |
| User | POST | `/api/User/auth/Login` | Público |
| User | GET | `/api/User/Profile` | Autenticado |
| User | PUT | `/api/User/Edit` | Autenticado |
| User | DELETE | `/api/User` | Autenticado |
| Host | POST | `/api/Host/Create` | Autenticado |
| Host | GET | `/api/Host/GetAllHostsbyUserId` | ADMIN ou HOST |
| Host | GET | `/api/Host/Details/{hostId}` | Autenticado |
| Host | PUT | `/api/Host/{hostId}/Edit` | ADMIN ou HOST e dono |
| Host | PATCH | `/api/Host/{hostId}/Delete` | ADMIN ou HOST e dono |
| Programming | POST | `/api/Programming/{HostId}/Create` | ADMIN ou HOST e dono do host |
| Programming | GET | `/api/Programming/Details/{programmingId}` | Público |
| Programming | PUT | `/api/Programming/{hostId}/Edit/{Programmingid}` | ADMIN ou HOST e dono do host |
| Programming | PATCH | `/api/Programming/{hostId}/Delete/{programmingId}` | ADMIN ou HOST e dono do host |
| Category | GET | `/api/Category/GetallCategories` | Público |
| Category | PUT | `/api/Category/EditCategoryToUser` | Autenticado |
| Address | GET | `/api/Address/GetAllAddress?search=...&limit=10` | Autenticado; código aguardando migration |

## UserController

### POST /api/User/auth/Register — Cadastrar usuário

Cria uma conta pelo ASP.NET Identity. Não exige login e não devolve JWT; após cadastrar, use o login.

Corpo (`UserDTO`):

```json
{
  "name": "UsuarioTeste",
  "email": "usuario@example.com",
  "password": "SenhaForte123@!",
  "typeofUser": 0
}
```

- `typeofUser`: `0` = Local; `1` = Turist.
- Nome, e-mail e senha são encaminhados ao Identity. O DTO não possui validações explícitas por atributos.
- O e-mail deve ser único. Atualmente 
ame` é salvo em `UserName`, sujeito à unicidade e às restrições de nome do Identity.
- A senha é validada pelo Identity; não há personalização de suas regras no bloco de configuração atual.

Retornos: `201` com `{"message":"Usuário cadastrado com sucesso."}`; `400` para dados inválidos ou erros do Identity, como e-mail duplicado e senha rejeitada.

### POST /api/User/auth/Login — Autenticar

Corpo (`UserLoginDTO`):

```json
{
  "email": "usuario@example.com",
  "password": "SenhaForte123@!"
}
```

Ambos os campos são obrigatórios e o e-mail deve ter formato válido. O usuário precisa existir, estar ativo e passar na verificação de senha e nas condições de acesso do Identity.

Retornos: `200` com o objeto de autenticação abaixo; `400` para falha na validação do DTO; `401` para falha no login.

```json
{
  "accessToken": "JWT",
  "tokenType": "Bearer",
  "expiresAt": "2026-10-18T20:00:00Z"
}
```

`expiresAt` é ilustrativo: a expiração real depende de `Jwt:ExpirationHours`.

### GET /api/User/Profile — Consultar o próprio perfil

Exige JWT, sem corpo ou ID na URL. O usuário é identificado pelo token.

Retorna `200` com `id`, 
ame`, `email`, `typeofUser`, `isPro` e `createdAt`. Retorna `404` se o usuário não existir ou estiver inativo.

### PUT /api/User/Edit — Editar o próprio usuário

Exige JWT e identifica o usuário pelo token. Substitui nome, e-mail e tipo; não altera senha nem roles.

```json
{
  "name": "UsuarioAtualizado",
  "email": "usuario@example.com",
  "typeofUser": 1
}
```

Requisitos (`UserEditDTO`): 
ame` obrigatório, até 256 caracteres; `email` obrigatório, formato válido, até 256 caracteres; `typeofUser` obrigatório e pertencente ao enum. O nome e o e-mail são aparados no mapeamento e a alteração passa pelo Identity.

Retornos: `200` com `{"user": {"...": "perfil atualizado"}, "auth": {"...": "novo JWT"}}`; `400` para validação ou rejeição pelo Identity; `404` para usuário inexistente/inativo.

O frontend deve aplicar o token de `auth.accessToken` para refletir as claims atualizadas.

### DELETE /api/User — Excluir a própria conta

Exige JWT. A action recebe `UserRegisterDTO`, mas usa o e-mail para localizar a conta e compara seu ID com o usuário do JWT.

Exemplo de corpo compatível com o DTO atual:

```json
{
  "name": "UsuarioTeste",
  "email": "usuario@example.com",
  "password": "SenhaForte123@!",
  "typeofUser": 0
}
```

A action não verifica a senha enviada: a autorização é feita pelo JWT e pela comparação de propriedade. Os demais campos não são utilizados na exclusão.

Retornos: `204` após `UserManager.DeleteAsync`; `403` se o e-mail pertencer a outra conta; `404` se a conta não existir; `400` se o Identity rejeitar a exclusão. É exclusão pelo Identity, não desativação via `IsActive`.

## HostController

### POST /api/Host/Create — Cadastrar estabelecimento

Exige usuário autenticado e ativo. O `UserId` do dono é obtido do JWT; não é recebido no JSON. Uma conta pode cadastrar vários hosts.

Corpo (`HostDTO`):

```json
{
  "typeofhost": 0,
  "cnpj": "12.345.678/0001-90",
  "logoUrl": "https://example.com/logo.png",
  "instagranUrl": "https://www.instagram.com/empresa",
  "address": "Rua de Teste",
  "addressNumber": "100",
  "addressComplement": "Entrada principal",
  "neighborhood": "Centro",
  "cep": "50000-000",
  "phone": "81999999999",
  "name": "Minha empresa",
  "description": "Descrição da empresa."
}
```

Tipos: `0` = Productor (Produtor); `1` = Gastronomy (Gastronomia); `2` = Business (Comércio).

O DTO de cadastro ainda não possui atributos que exijam os campos ou validem o enum. AddressNumber é opcional, string de até 20 caracteres, e AddressComplement é opcional, string de até 200 caracteres. Não há validação formal de CNPJ/CEP no DTO; a geocodificação exige logradouro e CEP e pode rejeitar endereços não localizados. O host é salvo sem exigir programações.

O serviço atribui a role `HOST` ao usuário, caso necessário. A resposta contém um JWT atualizado, evitando repetir o login.

Retornos: `201` com `{"result":{"id":10,"addressId":7,"name":"Minha empresa"},"auth":{"accessToken":"JWT","tokenType":"Bearer","expiresAt":"..."}}`; `401` para usuário ausente/inativo; `500` para as falhas tratadas de cadastro ou atribuição de role. Se a atribuição da role falhar, a transação desfaz o cadastro do host e do endereço novo.

### GET /api/Host/GetAllHostsbyUserId — Listar meus hosts

Exige JWT com role `ADMIN` ou `HOST`. Sem corpo ou parâmetros. Retorna apenas hosts ativos cujo `UserId` corresponde ao usuário do token.

Retorno: `200` com lista de HostResponseDTO, inclusive `[]`. Contém os campos permitidos do estabelecimento e AddressDetailsDTO; não inclui User, UserId nem autoria interna do endereço. Consulte a seção de 22/10/2026 para a lista completa.

### GET /api/Host/Details/{hostId} — Consultar perfil da empresa

Exige JWT e `hostId` positivo. Sem corpo. Qualquer usuário autenticado pode consultar um host ativo; esta consulta não exige ser o dono.

Retornos: `200` com `HostDetailsDTO`; `400` para ID não positivo; `404` para host inexistente/inativo.

Campos: `id`, 
ame`, `description`, `typeofhost`, `cnpj`, `logoUrl`, `instagranUrl`, `address`, `addressNumber`, `addressComplement`, 
eighborhood`, `cep`, `phone` e `programmings`.

`programmings` contém programações ativas ordenadas por início. Pode ser `[]`. O mapeamento atual usa `ProgrammingDetailsDTO`, mas não preenche suas categorias; também não inclui IDs das programações. A consulta não concede permissão para editar.

### PUT /api/Host/{hostId}/Edit — Editar estabelecimento

Exige JWT com role `ADMIN` ou `HOST`, `hostId` positivo e ser responsável pelo host ativo ou administrador autorizado. Recebe os mesmos nomes de campos do exemplo de cadastro, usando `HostDTO`. É edição completa dos campos editáveis.

| Campo | Requisito no edit |
|---|---|
| `typeofhost` | Obrigatório; enum válido |
| 
ame` | Obrigatório; máximo 150 caracteres |
| `description` | Obrigatório; máximo 2000 |
| `address` | Obrigatório; máximo 300 |
| `addressNumber` | Opcional; texto de até 20 caracteres, inclusive 175A ou s/n |
| `addressComplement` | Opcional; máximo 200 caracteres |
| 
eighborhood` | Opcional; máximo 150 |
| `cep` | Obrigatório; máximo 9 |
| `cnpj` | Máximo 18 |
| `phone` | Máximo 30 |
| `logoUrl`, `instagranUrl` | Máximo 2048 cada |

Retornos: `200` com HostResponseDTO atualizado; `400` para validação; `404` se o host estiver indisponível para o usuário. Atualiza `UpdatedAt` em UTC.

### PATCH /api/Host/{hostId}/Delete — Desativar estabelecimento

Exige JWT com role `ADMIN` ou `HOST`, `hostId` positivo e ser responsável pelo host ativo ou administrador autorizado. Não recebe corpo.

Altera `IsActive` para `false` e atualiza `UpdatedAt`. Não remove o registro nem altera individualmente as programações; as consultas de programação deixam de apresentá-las por exigirem host ativo.

Retornos: `204`; `400` para ID não positivo; `404` para host inexistente, inativo ou de outro usuário. Uma repetição após desativar retorna `404`.

## ProgrammingController

### POST /api/Programming/{HostId}/Create — Cadastrar programação

Exige JWT com role `ADMIN` ou `HOST` e `HostId` positivo de um host ativo pertencente ao usuário do token.

Corpo (`ProgrammingDTO`):

```json
{
  "name": "Festival de música",
  "description": "Apresentações ao vivo.",
  "startDate": "2027-12-10T18:00:00Z",
  "endDate": "2027-12-10T22:00:00Z",
  "isFree": false,
  "address": "Rua do Evento",
  "addressNumber": "200",
  "addressComplement": "Pavilhão B",
  "neighborhood": "Centro",
  "cep": "50000-000",
  "imageUrl": "https://example.com/evento.png",
  "ticketUrl": "https://example.com/ingressos",
  "instagranUrl": "https://www.instagram.com/evento",
  "minPrice": 30,
  "maxPrice": 60,
  "categoryIds": [1, 2]
}
```

Requisitos e comportamento:

- 
ame`, `description`, `address` e `cep` são obrigatórios pelo DTO.
- `addressNumber` é opcional, texto de até 20 caracteres; `addressComplement` é opcional, até 200 caracteres. Address representa o logradouro; registros antigos podem ainda conter número embutido, pois não foram reescritos automaticamente.
- O início deve estar no futuro e ser anterior ao término. Use datas ISO 8601 em UTC com `Z`, compatíveis com a persistência das datas.
- Preços devem ser não negativos e o mínimo não pode superar o máximo. Para gratuita, ambos devem ser zero.
- `categoryIds` deve conter pelo menos um ID positivo. Categorias inexistentes geram erro tratado de chave estrangeira.
- `imageUrl`, `ticketUrl` e `instagranUrl` são opcionais no DTO. Não há validação de formato de URL por atributo.
- O endereço pode ser diferente do host. Não há limite de quantidade de programações implementado.
- Programação e vínculos de categorias são persistidos no mesmo `SaveChangesAsync`.
- Limitações atuais: IDs repetidos não são rejeitados no create; não há verificação de categoria ativa ao gravar. `IsFree` e preços são tipos não anuláveis: `[Required]` não detecta sua omissão e eles assumem `false`/`0`.

Retornos: `201` com entidade `Programming` e cabeçalho `Location` apontando para Details; `400` para as validações e categorias inexistentes; `404` para host inexistente, inativo ou de outro usuário.

### GET /api/Programming/Details/{programmingId} — Consultar detalhes públicos

Público, inclusive para visitantes. Exige apenas `programmingId` positivo na URL. Sem corpo. A programação e seu host precisam estar ativos.

Retornos: `200` com `ProgrammingDetailsDTO`; `400` para ID não positivo; `404` para programação inexistente, inativa ou de host inativo.

Campos do retorno: 
ame`, `description`, `startDate`, `endDate`, `isFree`, `address`, `addressNumber`, `addressComplement`, 
eighborhood`, `cep`, `imageUrl`, `ticketUrl`, `instagranUrl`, `hostName`, `hostLogoUrl`, `createdDate`, `updateDate`, `minPrice`, `maxPrice` e `categories`.

`categories` é uma lista das categorias vinculadas, com `id`, 
ame` e `isActive`. A consulta de vínculos não filtra categorias inativas. O DTO atual não inclui `id` da programação nem `hostId`.

### PUT /api/Programming/{hostId}/Edit/{Programmingid} — Editar programação e categorias

Exige JWT com role `ADMIN` ou `HOST`, IDs positivos, host ativo do usuário e programação ativa pertencente ao host.

Recebe os mesmos campos do exemplo de create, usando `ProgrammingDTO`. É uma substituição completa dos campos editáveis, inclusive da seleção de categorias.

Número e complemento também são substituídos no PUT. Se omitidos, assumem string vazia e limpam o valor anterior; reenviar os valores atuais quando quiser preservá-los. Ambos continuam opcionais, com limites de 20 e 200 caracteres. O mesmo comportamento vale para o PUT de host.

- Obrigatórios: 
ame`, `description`, `startDate`, `endDate`, `isFree`, `address`, `cep`, `minPrice`, `maxPrice` e `categoryIds`.
- Datas devem estar em UTC, e o início deve ser anterior ao término. O edit não possui a checagem de início futuro que existe no create.
- Preços devem ser finitos, não negativos e ordenados. Se gratuita, ambos devem ser zero.
- Categorias: ao menos uma, IDs positivos e sem repetição. IDs inexistentes geram `400`; não há validação de status ativo.
- A lista enviada é a seleção final: os vínculos retirados são removidos e os novos são adicionados. Os já existentes permanecem.
- A edição preserva a propriedade e a data de criação; atualiza `UpdateDate` em UTC. Campos e vínculos são salvos juntos.

Retornos: `200` com entidade `Programming` atualizada; `400` para validação ou categorias inexistentes; `404` quando host/programação estiver indisponível para o usuário.

### PATCH /api/Programming/{hostId}/Delete/{programmingId} — Desativar programação

Exige JWT com role `ADMIN` ou `HOST`, IDs positivos, host ativo do usuário e programação ativa pertencente ao host. Sem corpo.

Altera `IsActive` para `false` e atualiza `UpdateDate`. Não remove o registro nem os vínculos de categorias.

Retornos: `204`; `400` para IDs não positivos; `404` para registro inexistente, inativo ou indisponível para o usuário/host. Uma repetição após desativar retorna `404`.

## CategoryController

### GET /api/Category/GetallCategories — Listar categorias ativas

Público, sem corpo ou parâmetros. Consulta apenas categorias com `IsActive = true`, ordenadas por ID.

Retorno: `200` com lista de objetos contendo `id`, 
ame` e `isActive`, inclusive `[]`. Use os IDs retornados em `categoryIds` ao criar ou editar programações.

## Fluxo de uso

1. Cadastrar usuário e fazer login.
2. Enviar o JWT para criar o host.
3. Substituir o token local pelo `auth.accessToken` retornado no cadastro do host, que contempla a role HOST.
4. Consultar categorias e criar uma programação usando o ID do host.
5. Para gestão, listar os próprios hosts, consultar os detalhes do host e usar as rotas de edição/desativação.
6. Visitantes podem consultar os detalhes de programação diretamente, sem JWT.

O frontend pode remover o token ao sair. Não existe endpoint de logout ou refresh token nos controllers atuais. As respostas não incluem `canEdit`/`canDelete`.

## Diferença encontrada no arquivo de testes

O arquivo `Projetos - 4.http` ainda contém `GET /api/Programming/{hostId}/GetAllProgrammingsbyHostId`, mas essa action não está no `ProgrammingController` salvo atualmente. Portanto, ela não integra os 18 endpoints atuais. A função existe nas camadas internas e é usada para listar programações dentro do perfil do host. Esta documentação não altera nem recria a action.

## Fontes consultadas

No projeto `C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4`: `Presentation/Controllers`, `Application/DTO`, os app services de User/Host/Programming, seus serviços e repositórios, `CategoryRepository`, `JwtTokenService` e a configuração de autenticação em `Presentation/Program.cs`.

Os retornos descritos são os fluxos previstos no código. Exceções não tratadas de banco/configuração podem produzir erros adicionais. Cadastro/edição de host e programação retornam entidades em alguns pontos; não devem ser interpretados como o mesmo contrato dos DTOs de detalhes.

Bairro (
eighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

As actions Create/Edit de Host e Programming agora calculam Location antes da persistência. Não há rota nova nem mudança nos corpos de entrada. Falhas de endereço retornam ProblemDetails 422; chave ausente, timeout de 10 s, erros do provedor/rede ou resposta inválida retornam ProblemDetails 503. A consulta só ocorre após validar usuário/propriedade. A edição preserva coordenadas sem consultar se o endereço não mudou e Location está preenchida. Exemplos fictícios no .http devem ser substituídos por endereços reais. A autenticação e os retornos de sucesso permanecem iguais.

Veja a [configuração e os critérios da integração](README.md). Validação: build sem erros (três avisos CS8618 preexistentes), 63 verificações com HTTP/repositórios simulados e 17 testes do protótipo. Consulta HTTPS real ao Geoapify validada em 19/10/2026, com resultado building no Brasil e confiança 1. A chave foi configurada em Geoapify__ApiKey no ambiente do usuário Windows, sem inclusão nos arquivos. O fluxo completo via API/banco ainda precisa ser exercitado após reiniciar o processo que inicia a aplicação. PDFs não regenerados.

### Tolerância ampliada do MVP — 19/10/2026

A busca continua somente com Geoapify e aceita localização aproximada. Mantém coordenadas finitas, país brasileiro, tipo building/street/amenity, cidade/estado presentes e correspondência do nome da via. O prefixo exigido do CEP passa de cinco para três dígitos, ampliando a região possível. São priorizados o CEP completo, depois os cinco primeiros dígitos, o número do imóvel, o tipo building e a confiança. Isso não comprova cidade/UF do usuário nem garante erro máximo em metros.

Na regra geral, a confiança mínima é 0,25; abaixo de 0,7 exige também confiança de rua e de cidade >= 0,5. Com confiança geral >= 0,7, indicadores específicos ausentes não impedem aceitação. Exceção de aproximação: se o CEP completo coincide e a confiança da rua é >= 0,8, aceita pontuação geral baixa ou zero, desde que ela seja válida e todos os demais critérios de país, tipo, nome da via, cidade/estado e coordenadas passem. Isso atende resultados do provedor que reconhecem fortemente a rua mas não confirmam o imóvel. Não há conversão dessas pontuações em porcentagem garantida de acerto.

Na comparação, ignora acentos, pontuação, caixa, artigos/preposições de/da/do/das/dos e o tipo inicial da via (rua, avenida, praça, largo etc.). Reconhece abreviações Mal/Gen/Dr/Prof/Pres. Praças e largos podem ser identificados por name/address_line1 se street não vier preenchido. Não usa comparação difusa livre de nomes.

São feitas até duas consultas sequenciais, somente se a anterior não tiver candidato aceitável: primeiro com número; depois sem número. Se já não há número (vazio/s/n), a segunda usa texto com rua, bairro opcional e CEP. O modo estruturado nunca é misturado com text. Preserva número e demais dados originais no banco. Resultados somente de bairro/CEP/cidade continuam rejeitados. Falhas do provedor não provocam novas tentativas.

Limites: HttpClient de 10 s por requisição e prazo de 15 s para as duas consultas juntas, inferior ao timeout de 20 s do protótipo. Erro de endereço permanece 422 e indisponibilidade permanece 503. Não muda autenticação, rotas, DTOs, entidades ou schema. Não adiciona ViaCEP, geocodificação em lote ou mapa. O protótipo mantém o aviso de localização aproximada. PDFs não foram regenerados.

Validação da tolerância ampliada: compilação sem erros (três avisos CS8618 preexistentes), 53 verificações simuladas aprovadas e 17 testes do protótipo aprovados, com node --check em app.js e catalog.mjs. Os testes simulados cobrem os dois modos de fallback, limite de duas consultas, aceitação aproximada, rejeição de bairro/CEP/cidade, erros do provedor, coordenadas inválidas e cancelamento. Não houve gravação de registros nem alteração de schema nesta etapa.

Comparação real no Geoapify em 19/10/2026: antes 6/10 endereços de teste aceitos; depois 10/10. Conjunto: MASP, Sesc Pompeia, Pinacoteca Luz, Pinacoteca Estação, Pinacoteca Contemporânea, Museu do Amanhã, CCBB Rio, Paço do Frevo, CESAR School e Museu Oscar Niemeyer. Consultas realizadas pelo adapter .NET, sem passar pelo CRUD nem gravar no banco; aceitação do resultado não comprova precisão do imóvel. Reinicie a API para carregar a implementação nova.

### Abrangência atual — 19/10/2026

A pedido do usuário, foi retirada a restrição temporária por estado: as consultas não enviam state=Pernambuco nem incluem um estado fixo no texto. A validação por sigla/nome de Pernambuco foi removida. A busca volta a considerar todo o Brasil, mantendo o filtro countrycode:br, o prefixo de três dígitos do CEP, o nome da via, a exigência de cidade/estado identificáveis no retorno e as demais regras de aproximação e fallback. Portanto não aceita indiscriminadamente ruas homônimas distantes.

Protótipo e comentários do .http foram ajustados. Os exemplos podem continuar usando endereços de Pernambuco, mas não representam limite de cobertura. Sem alterações em DTOs, endpoints, autorização, entidades ou banco. PDFs preservados.

Validação da retirada da restrição: compilação sem erros (três avisos CS8618 preexistentes), 10 verificações simuladas aprovadas (PE/CE/SP, ausência de estado fixo nas duas modalidades de consulta e manutenção de país/CEP/estado identificável), 17 testes do protótipo aprovados e sintaxe JavaScript verificada. Nenhuma nova consulta real ao Geoapify nem gravação no banco nesta retirada.


## Categorias de interesse do usuário — 20/10/2026

| Método e rota | Autorização | Corpo | Retorno de sucesso |
|---|---|---|---|
| POST /api/Category/AddCategoryToUser | JWT de qualquer usuário autenticado | Array JSON direto, por exemplo [1, 2] | 200 com {"userId":"...","categoryIds":[1,2]} |
| GET /api/Programming/GetUserProgrammingPreferences | JWT de qualquer usuário autenticado | Sem corpo | 200 com lista de Programming; [] é válido |

O usuário é identificado por sub do JWT. Não enviar userId nem objeto {categoryIds:[...]}. O controller monta UserXCategoryDTO internamente. O POST adiciona vínculos e não substitui os anteriores. O GET devolve programações ativas de hosts ativos com ao menos uma categoria ativa de interesse, sem repetição e ordenadas por StartDate. Não é uma consulta da lista de categorias do usuário.

A falta de autenticação é tratada pelo middleware (401). No POST, a implementação atual lança exceções para lista vazia, categoria inexistente etc. sem tratamento específico no controller: pode retornar 500. Repetições dentro do mesmo envio são removidas, mas vínculos já existentes não são deduplicados. Os exemplos usam IDs ativos e indicam essa limitação. O protótipo mostra sugestões com acesso aos detalhes públicos.

Foram adicionadas addCategoryToUser, userPreferences e userPreferencesAfterProgramming no .http. As duas primeiras usam login.accessToken; a última reaproveita createHost.auth.accessToken após criar/editar uma programação. Não exige novo login só para consultar sugestões.

Validação desta etapa: build concluído sem erros (sete avisos CS8618 na compilação completa); node --check em public/app.js e catalog.mjs; 22 testes aprovados com API simulada, incluindo array JSON na raiz, JWT, seleção de categorias, lista vazia e detalhes das sugestões. Corpos JSON do .http validados com variáveis substituídas. Não houve teste CRUD no banco real, aplicação de migration ou regeneração de PDFs.


## Reorganização das preferências — 20/10/2026

| Controller | Método/rota atual | Entrada | Saída |
|---|---|---|---|
| Category | POST /api/Category/AddCategoryToUser | JWT; array [1,2] | 200 com mensagem |
| Category | GET /api/Category/GetUserCategoriesPreferences | JWT; sem corpo | 200 com array de Category, inclusive [] |
| Programming | GET /api/Programming/GetUserProgrammingPreferences | JWT; sem corpo | 200 com array de Programming, inclusive [] |

As três operações exigem login sem restrição de role. O usuário continua vindo do JWT. As antigas rotas de interesses do UserController foram removidas. O novo GET de categorias percorre CategoryAppService -> CategoryService -> CategoryRepository e retorna categorias vinculadas, distintas e ordenadas por ID; a consulta atual não filtra IsActive. O GET público GetallCategories continua retornando somente categorias ativas. Portanto, a listagem das preferências não deve substituir o catálogo de categorias ativas do formulário.

O protótipo separa as operações por controller: área Categorias para salvar/consultar interesses e área Programações para sugestões. Categorias salvas são mostradas como categorias; sugestões continuam abrindo detalhes públicos. Mantidos JWT, seleção por checkbox e IDs da sessão. A antiga requisição inexistente de listagem por host foi substituída por uma consulta do perfil do host e seu campo programmings. Nenhuma action nova foi criada nesta etapa.

Correções necessárias para execução: reposicionado GetUserProgrammingPreferences para fora de Create (CS0106); acrescentado await no GET de categorias antes de Ok(); alinhados os contratos e implementações de GetAllCategoriesPrefereces para Task<IEnumerable<Category>> não anulável, acompanhando o repositório (CS0738). Foram preservadas as demais mudanças do usuário. Sem alterações em Program.cs, entidades, migrações ou banco. PDFs preservados.

Validação da reorganização: build sem erros (sete avisos CS8618 preexistentes); 24 testes do protótipo com API simulada aprovados; oito verificações temporárias de controllers com serviços simulados aprovadas (espera da Task, retorno de listas, lista vazia, JWT sem usuário e GET de sugestões). Verificados métodos, URLs, autenticação e JSON das 21 requisições .http, cobrindo as 18 actions atuais. Nenhuma migration aplicada nem dado real alterado nos testes.


## Endpoint de edição de interesses — 20/10/2026

PUT /api/Category/EditCategoryToUser exige JWT, sem role HOST. O usuário vem exclusivamente do JWT. Corpo JSON: array de IDs, por exemplo [2,3]; é a seleção completa desejada. Mantém vínculos em comum, remove ausentes e inclui novos. Retorna 200 com todos os UserXCategory do usuário após salvar, ordenados por CategoryId/Id, incluindo IDs, UserId, CategoryId e datas. O retorno representa vínculos, não Category nem Programming.

Seleção vazia/nula ou ID <= 0 retorna 400; JSON inválido é tratado pelo ApiController. Token ausente/inválido/expirado ou usuário não identificado retorna 401. Categorias positivas inexistentes ainda falham pela FK sem resposta controlada específica; não foi implementada validação de status ativo ou saneamento de duplicidades anteriores. O repositório mantém a gravação conjunta das diferenças.

O .http inclui edição e conferência das categorias após editar. O protótipo oferece Editar categorias de interesse, botão Carregar interesses atuais, seleção de categorias ativas, envio do array completo e apresentação dos vínculos retornados com seus IDs. Preserva JWT e IDs de host/programação. A action foi adicionada para tornar o fluxo acessível; o inventário atual contém 19 actions.

Validação: build GeoLocation sem erros (sete avisos CS8618 preexistentes); node --check em app.js e catalog.mjs; 27 testes do protótipo com API simulada aprovados; 13 verificações temporárias de service/controller com repositórios simulados aprovadas. API iniciou em Staging com a conexão de desenvolvimento carregada no ambiente do processo, evitando MigrateAsync automático. PUT sem JWT retornou 401; GET público de categorias retornou 200 com 12 categorias. Catálogo e app.js servidos em 127.0.0.1:5173 conferidos com a nova rota. Nenhum PDF foi regenerado.


Validação adicional no PostgreSQL — 20/10/2026: oito verificações com Context, CategoryRepository e UserXCategoryRepository reais aprovadas dentro de transação revertida. Cobriram retorno completo com IDs gerados, preservação de vínculo/data, exclusão pelo ID real, deduplicação da entrada, isolamento entre usuários, seleção idêntica, rollback automático da gravação em falha de FK e remoção de todos os registros temporários pelo rollback final. Verificadas zero migrations pendentes; nenhuma migration aplicada. Não foram alterados registros existentes.


## Address — código preparado para revisão em 21/10/2026

**Estado atual do código:** endereço normalizado na entidade Address (tabela planejada Addresses), com Street, Number, Complement, Neighborhood, CEP e Location. Hosts/Programming usam AddressId e navegação. **O banco ainda usa o modelo anterior: nenhuma migration ou transferência de dados foi executada.** As seções anteriores desta documentação registram o funcionamento anterior e não substituem o novo contrato descrito nesta seção.

GET /api/Address/GetAllAddress?search=Cais&limit=10 exige JWT, sem role específica; retorna somente endereços próprios ou publicados por programações/hosts ativos. Abaixo de três letras/dígitos retorna []; limite 1–20. Host/programação recebem exatamente AddressId ou objeto AddressCreateDTO (Street/Number obrigatórios, bairro/complemento opcionais, CEP válido). Detalhes retornam endereço aninhado; os campos antigos na raiz foram retirados. IDs inacessíveis retornam 404; seleção inválida retorna 400; mantidos 422/503 da geocodificação.

O serviço de endereços resolve seleção/equivalência e coordena a geocodificação; não salva isoladamente. Inclusão de endereço e host/programação ocorre no mesmo SaveChanges. Trocar o endereço muda o vínculo e preserva o registro anterior. Location/índice GiST passam a Address. Autoria usa FK opcional SetNull na exclusão de usuário, preservando o endereço; os vínculos de host/programação usam Restrict. NormalizedKey tem índice não único; duplicidade simultânea continua possível.

Protótipo e .http adaptados: autocomplete vazio até três caracteres, espera de 300 ms, escolha de endereço existente ou cadastro novo, JWT e IDs preservados. A interface avisa que a migration está pendente. Program.cs bloqueia migrations automáticas em Development enquanto modelo e snapshot diferem.

Validação: build sem erros (sete avisos CS8618 preexistentes), 48 verificações .NET sem banco/provedor externo e 38 testes do protótipo com API simulada aprovados. Nenhum PDF regenerado. O teste integrado com o schema novo depende da revisão e migration.

Veja o [resumo completo para revisão, contratos e plano de transferência dos dados](validacoes/refatoracao-address-revisao-2026-10-21.md). **Aguardando revisão do usuário antes de gerar a migration.**


## Retorno do cadastro de host — 21/10/2026

HostController.Create passa a retornar 201 com somente as propriedades result (retorno de _hostAppService.Create) e auth (JWT). O result foi declarado antes do try para poder ser usado no retorno. O .http usa createHost.response.body.$.result.id, e o protótipo lê result para reaproveitar o host; auth.accessToken permanece igual. Nenhuma migration gerada ou aplicada nesta alteração. Registro histórico: naquela etapa result representava a entidade Hosts. Desde 22/10/2026, result contém somente HostCreatedDTO (id, addressId e name).


## AddressDetailsDTO nos detalhes — 21/10/2026

HostAppService.GetByIdAsync e ProgrammingAppService.GetByIdAsync montam AddressDetailsDTO diretamente no AppService, com Id, Street, Number, Complement, Neighborhood e CEP. HostDetailsDTO também preenche AddressId e Address nas programações da sua lista. O endereço vem da navegação Address, carregada pelos Includes já existentes nos repositórios, sem consulta adicional por item e sem helpers/pastas novos. Esta mudança trata das consultas de detalhes; os demais contratos de retorno não foram alterados nesta etapa.

O protótipo já lê address aninhado e apresenta os dados de AddressDetailsDTO. Nenhuma migration gerada/aplicada. Tentativa de build nesta revisão bloqueada por cinco erros encontrados fora dos dois mapeamentos: referência Application.Mappings inexistente em AddressAppService; GetAllAddressAsync/GetDetailsbyIdAsync faltantes ou incompatíveis em AddressAppService; GetAllAddressAsync incompatível em AddressRepository; GetByIdAsync faltante em AddressService. Esses pontos da refatoração em andamento não foram modificados nesta alteração restrita aos detalhes. PDFs preservados.


## Persistência de novos endereços com host/programação — 21/10/2026

Concluído o encaminhamento de dto.Address no create e no edit de HostAppService e ProgrammingAppService. O mapeamento é feito inline, com new Address, preenchendo Street, Number, Complement, Neighborhood e CEP; opcionais nulos viram strings vazias. Quando somente AddressId é informado, não se cria um objeto de endereço novo. Os serviços existentes chamam AddAddress, que reutiliza o registro equivalente/existente ou prepara um novo com autoria e geocodificação.

HostRepository.Create/EditAsync e ProgrammingRepository.CreateWithCategoriesAsync/EditWithCategoriesAsync/EditAsync incluem explicitamente Db.Addresses.Add quando Address.Id == 0. O endereço é salvo pelo mesmo SaveChangesAsync do host/programação, junto com as categorias quando aplicável. O EF atribui o ID gerado ao vínculo AddressId pela navegação. Um endereço já existente não é incluído novamente; na edição, o endereço anterior é mantido. Não foi acrescentado SaveChanges isolado no AddressService ou no AddressRepository.

AddressAppService foi alinhado à interface atual GetAllAddressAsync(string)/GetDetailsbyIdAsync(int), com construtor explícito e mapeamentos inline para AddressDetailsDTO; removida a dependência de Mappings inexistente. A compilação voltou a passar. O autocomplete e o .http usam apenas search, acompanhando a assinatura atual, com até dez resultados. Nenhuma pasta foi criada.

Validação: build GeoLocation com zero erros e sete avisos CS8618 preexistentes; 21 verificações temporárias com AppServices/repositórios reais e EF, incluindo os quatro mapeamentos, navegações/FKs, estados Added/Modified/Unchanged e ausência de duplicação ao selecionar endereço existente. Um interceptor bloqueou as seis tentativas de abertura de conexão antes de acessar qualquer banco. Também passaram os 39 testes do protótipo com API simulada e node --check em app.js. Os arquivos temporários de teste foram removidos.

**Nenhuma migration foi gerada ou aplicada e não houve gravação real no banco.** A validação de INSERTs/IDs efetivamente gravados no PostgreSQL permanece para depois da revisão e da migration de Address. As pendências de mapeamento e os três erros de AddressAppService registrados nas seções anteriores foram resolvidos nesta etapa. PDFs preservados.

## Arquivo HTTP e ambiente de testes — 21/10/2026

Atualizado Projetos - 4/Projetos - 4.http após AddAddress: 29 requisições nomeadas. A busca de endereços ficou antes do cadastro de host, com exemplos por logradouro, CEP, consulta curta e vazia. Create de host demonstra endereço novo; create de programação reutiliza result.addressId do host; edições reutilizam address.id dos detalhes. Há alternativas opcionais de criação com endereço existente (host) e novo (programação), identificadas como cadastros adicionais. Enviar exatamente addressId ou address. Mantidos os caminhos result.id/auth.accessToken do host e o JWT encadeado, categorias, consultas públicas e limpeza manual ao final.

Validação: 29 combinações de rota/verbo conferidas contra o OpenAPI da API local; 12 corpos JSON analisados após substituir as variáveis; nomes únicos e referências de respostas conferidos. Nenhuma requisição de criação/edição/exclusão foi executada. O banco e a API já estavam ativos; foram reutilizados o backend na porta 5014 e o protótipo na 5173. Conferidos GET de categorias (200), busca de endereços sem JWT (401), OpenAPI (200), saúde, catálogo e página atualizada do protótipo (200). Não houve mudança de controller, DTO ou migration nesta etapa, nem exportação de PDFs.

## Respostas de host com DTOs — 22/10/2026

Esta seção substitui as descrições anteriores de retorno de entidades Hosts.

- Cadastro: HTTP 201 com `{ result, auth }`; `result` é HostCreatedDTO e contém somente `id`, `addressId` e 
ame`. `auth` mantém `accessToken`, `tokenType` e `expiresAt`.
- Edição: HTTP 200 com HostResponseDTO. Listagem: HTTP 200 com uma lista desse DTO, inclusive `[]`.
- HostResponseDTO permite `id`, `typeofhost`, `cnpj`, `logoUrl`, `instagranUrl`, `phone`, 
ame`, `description`, `addressId`, `address`, `isActive`, `createdAt` e `updatedAt`.
- `address` usa AddressDetailsDTO: `id`, `street`, 
umber`, `complement`, 
eighborhood` e `cep`.
- Detalhes continuam usando HostDetailsDTO. Exclusão continua sem corpo (204).
- Os mapeamentos explícitos ficam em HostAppService e as assinaturas em IHostAppService. User, UserId e Address.AddWho não entram nos DTOs. Entidades continuam internas aos serviços/repositórios.

Validação: reprodução confirmou que o EF preenche User automaticamente e que serializar Hosts diretamente expõe PasswordHash. Após a correção, passaram 56 verificações com controllers/AppService reais, serviços simulados e opções padrão MVC usadas pela API. A compilação passou com sete avisos CS8618 preexistentes. Nenhuma conexão com banco, migration ou chamada a provedor externo foi feita.

Teste reproduzível, executado a partir da raiz do repositório:

```powershell
dotnet run --project docs/validacoes/HostSerialization.Tests.csproj
```

O argumento `-- --baseline` executa somente a demonstração da exposição na entidade. Os dados são fictícios. Os testes exercitam as actions diretamente e a serialização; não substituem um teste HTTP integrado com banco.

Compatibilidade: consumidores que liam User/UserId ou metadados internos do endereço devem usar os campos permitidos. O arquivo .http mantém result.id, result.addressId e auth.accessToken. O protótipo não foi encontrado nem no caminho de Artur indicado em AGENTS.md nem no caminho equivalente de Rafael; sua validação permanece pendente. PDFs não foram regenerados.

## Categorias do usuário: validação e gravação atômica — 22/10/2026

Esta atualização substitui os registros anteriores de gravação separada por vínculo e de ausência de validação de categorias ativas.

O usuário seleciona categorias da listagem; o frontend envia seus IDs em um array. GET /api/Category/GetallCategories já filtra IsActive. POST /api/Category/AddCategoryToUser mantém o corpo e o retorno HTTP 200 com mensagem de sucesso. IDs repetidos no mesmo envio continuam sendo reduzidos por Distinct.

UserXCategoryAppService prepara os vínculos no foreach e envia a coleção para UserXCategoryService.AddAsync. O serviço confirma que todos os IDs são positivos e pertencem ao conjunto de categorias existentes e ativas antes de chamar o repositório. UserXCategoryRepository.AddAsync adiciona cada vínculo no foreach e executa somente um SaveChangesAsync ao final. A transação automática do EF no provedor relacional torna essa gravação de todos ou nenhum; não foi criada UnitOfWork nem transação manual.

PUT /api/Category/EditCategoryToUser também valida a seleção completa antes de alterar os vínculos. IDs inválidos, inexistentes ou inativos resultam em HTTP 400 (ProblemDetails). Seleção vazia é aceita conforme a seção de escolha opcional abaixo. Uma seleção inválida preserva as preferências anteriores. O usuário continua sendo obtido do JWT.

Validação: 27 verificações aprovadas com controllers, AppService, serviços e repositórios reais, usando SQLite em memória com chaves estrangeiras habilitadas. Cobertura: categoria válida seguida de inexistente/inativa, lista vazia, IDs zero/negativo, deduplicação, IDs gerados, gravação única, edição válida/inválida e rollback após falha de FK no segundo vínculo. Build passou com sete avisos CS8618 preexistentes. O teste usa o modelo real, ignorando apenas Address.Location por ser específico do provedor geoespacial; não foi realizado teste integrado em PostgreSQL.

Executar na raiz do repositório:

```powershell
dotnet run --project docs/validacoes/UserCategoriesAtomic.Tests.csproj
```

A dependência SQLite pertence somente ao projeto de teste. Não houve acesso ao banco da aplicação, migration nem alteração de modelos. A validação de IsActive reflete o momento da consulta, sem bloqueio contra desativação concorrente. Duplicidades de vínculos entre requisições e controle de edições concorrentes continuam fora desta alteração.

O protótipo permanece indisponível nos caminhos conhecidos deste computador; não foi possível validar sua interface. O contrato de entrada continua um array de IDs selecionados. PDFs não foram regenerados.

## Seleção de categorias opcional — 22/10/2026

A escolha de categorias é facultativa. O frontend pode permitir pular essa etapa sem chamar o cadastro de preferências. POST /api/Category/AddCategoryToUser com [] retorna 200 sem gravar nem alterar preferências existentes. PUT /api/Category/EditCategoryToUser com [] representa a seleção completa vazia: remove as preferências atuais atomicamente e retorna 200 com []; repetir a operação sem vínculos não executa SaveChangesAsync.

Quando há IDs, permanecem a validação de existência/atividade e a gravação única. Corpo null ou malformado não representa uma seleção vazia e continua inválido. Esta seção substitui qualquer exigência anterior de selecionar ao menos uma categoria.

Validação atualizada: 33 verificações aprovadas em SQLite em memória, incluindo seleção vazia, preservação de vínculos no POST vazio, limpeza pelo PUT vazio, repetição da limpeza e rollback. Compilação aprovada com sete avisos preexistentes. Nenhum banco da aplicação foi acessado. O protótipo continua indisponível neste computador; a interface deve permitir pular a seleção. PDFs preservados.

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

## Validações de edição de programação — 22/10/2026

PUT /api/Programming/{hostId}/Edit/{Programmingid} segue a distribuição definida para as validações:

- Controller: autenticação, dto nulo, 404 e tradução de ArgumentException para HTTP 400; preservados os tratamentos de geocodificação e FK.
- ProgrammingEditDTO: Required dos campos, preços finitos e não negativos, IDs de categorias positivos, AddressId positivo quando informado e datas em UTC. A validação por item da lista e as verificações de formato usam as anotações PositiveIds, UtcDateTime e FinitePrice, implementadas fora do DTO.
- ProgrammingEditRouteDTO: Range para HostId e ProgrammingId, vinculados aos parâmetros da rota existente. Não foram adicionados IDs ao corpo JSON.
- ProgrammingValidation.ValidateProgrammingEditDTO(dto, now): pelo menos uma categoria, ausência de repetição, StartDate > now, EndDate > StartDate, preços zero para gratuidade, MinPrice <= MaxPrice e endereço informado (Address ou AddressId).
- ProgrammingAppService.EditProgrammingAsync chama o validador antes de mapear os dados e acessar o serviço de domínio. Propriedade do host e disponibilidade da programação continuam verificadas pelo domínio.

A edição agora rejeita também início no passado ou igual ao instante de validação, conforme o critério solicitado. A obrigatoriedade de categorias da programação não altera a escolha facultativa das preferências do usuário. A interface IProgrammingValidation e a implementação existentes foram ampliadas; a dependência foi registrada como scoped em Program.cs. As regras do cadastro que o usuário já havia implementado foram preservadas.

Validação: build aprovado com sete avisos CS8618 preexistentes; 42 verificações de DTOs, regras, limites e execução do AppService aprovadas, sem banco ou provedor externo. Não foi executado teste HTTP integrado. Teste reproduzível:

```powershell
dotnet run --project docs/validacoes/ProgrammingEditValidation.Tests.csproj
```

URL e corpo JSON da edição permanecem iguais. Erros básicos do DTO usam a validação automática do ApiController; regras de negócio retornam ProblemDetails. Protótipo indisponível nos caminhos conhecidos, portanto não validado nesta etapa. PDFs preservados.

## Distribuição de validações nas actions — 22/10/2026

Padronizada a validação das actions de host, programação, usuário e preferências de categorias. Controllers verificam autenticação, corpo nulo e resultados/erros HTTP. DTOs contêm somente propriedades e anotações, sem Validate e sem IValidatableObject. Regras entre campos ficam em Application/Validations e são chamadas pelo AppService antes do mapeamento.

| Entrada/fluxo | Validação |
|---|---|
| IDs da rota | HostRouteDTO, ProgrammingRouteDTO e ProgrammingEditRouteDTO com Range; rotas preservadas |
| Programação: criar/editar | Required, Range, PositiveIds, UtcDateTime e FinitePrice nos DTOs; ProgrammingValidation verifica categorias obrigatórias sem repetição, início futuro, término posterior, gratuidade, faixa de preços e escolha exclusiva do endereço |
| Host: criar/editar | Anotações de identificação, enum e limites nos DTOs; HostValidation verifica exatamente AddressId ou Address |
| Usuário: cadastrar/editar/login | Anotações de campos obrigatórios, e-mail, limites e enum; política de senha e unicidade continuam no Identity |
| Usuário: excluir | UserDeleteDTO exige somente e-mail válido; autenticação e propriedade da conta continuam no controller |
| Preferências de categorias | CategorySelectionDTO herda List<int> e usa PositiveIds; JSON permanece array direto. Null é rejeitado no controller, [] continua permitido. UserXCategoryDTO também tem anotações |
| Busca de endereço | Mantido search opcional e autorização; AddressCreateDTO continua com anotações de logradouro, número, comprimentos e CEP |

PositiveIdsAttribute, UtcDateTimeAttribute e FinitePriceAttribute ficam na pasta de validações existente, fora dos DTOs. São anotações reutilizáveis para critérios que Range/Required não cobrem sozinhos. Não foram criadas pastas adicionais. IHostValidation/HostValidation foram registrados na DI; removida a dependência não utilizada de IProgrammingValidation no serviço de domínio.

Regras dependentes de persistência (propriedade/disponibilidade, categorias existentes/ativas, normalização e resolução do endereço) permanecem nos serviços; as garantias transacionais anteriores não foram alteradas. A seleção de categorias do usuário segue facultativa. As categorias de uma programação continuam obrigatórias.

Validação: 166 verificações aprovadas, incluindo HTTP real em servidor temporário localhost, controllers/AppServices/validadores reais, model binding de rotas e corpo, anotações automáticas, bloqueio antes do domínio, contratos de sucesso e erros 400/401, lista vazia de preferências e inspeção de todos os DTOs para ausência de métodos declarados. Domínio e autenticação de teste simulados; nenhum banco ou provedor externo foi acessado. Build aprovado com sete avisos CS8618 preexistentes.

```powershell
dotnet run --project docs/validacoes/ActionsValidation.Tests.csproj
```

Campos/rotas HTTP preservados. A exclusão de usuário não exige campos de cadastro; corpos antigos com campos adicionais continuam aceitos. Campos inválidos podem produzir ValidationProblemDetails automaticamente pelo ApiController. Protótipo indisponível nos caminhos conhecidos deste computador, portanto validação visual pendente. PDFs preservados.

## Simplificação das validações — 22/10/2026

Por orientação do usuário, foram removidos FinitePriceAttribute, PositiveIdsAttribute e UtcDateTimeAttribute. DTOs usam somente anotações nativas e não contêm métodos. ProgrammingValidation verifica UTC, preços finitos e IDs positivos dentro das listas; UserXCategoryValidation verifica a lista das preferências antes do mapeamento, mantendo [] válido. IUserXCategoryValidation é registrado na injeção de dependências.

Também foram removidos HostRouteDTO, ProgrammingRouteDTO e ProgrammingEditRouteDTO. As actions recebem int hostId e int programmingId diretamente com [FromRoute, Range(1, int.MaxValue)]. Não é necessário um DTO apenas para esses parâmetros. CategorySelectionDTO foi removido: as actions de preferências recebem List<int>, preservando o array JSON.

Esta seção substitui as descrições anteriores sobre atributos personalizados e DTOs de rota. Rotas, corpos JSON e regras foram preservados; erros desses três critérios agora são tratados pelos validadores da aplicação. Testes HTTP atualizados: 163 verificações aprovadas, com controllers/AppServices reais e domínio simulado. Build sem erros, sete avisos preexistentes. Nenhum banco acessado. Protótipo permanece indisponível e PDFs preservados.

## Regras compartilhadas também no domínio — 22/10/2026

ProgrammingService.CreateProgrammingAsync e EditProgrammingAsync agora chamam IProgrammingRules.ValidateProgramming antes de acessar dependências, resolver endereço ou persistir. Uma rotina interna que chama o serviço diretamente passa pelas regras de categorias, UTC, início futuro, intervalo de datas, preços finitos/não negativos, gratuidade, faixa de preços e seleção de endereço. A autorização sobre o host permanece no serviço.

IProgrammingRules foi definida em Domain/Interfaces/Service e recebe Programming e vínculos, sem DTOs. IProgrammingValidation estende esse contrato; ProgrammingValidation continua sendo a única implementação. Os métodos que recebem DTOs e o método que recebe entidades delegam à mesma rotina de regras. A injeção de dependências fornece a mesma instância scoped pelas duas interfaces. O domínio depende apenas da interface de domínio.

Chamadas internas podem trazer Address carregado com seu ID. Se a navegação corresponde ao endereço selecionado, o serviço encaminha somente o ID ao AddressService; um endereço novo é encaminhado como objeto. Combinações conflitantes são rejeitadas. Não foram alterados os tipos dos DTOs nem criados atributos personalizados.

Validação: 54 verificações de chamadas diretas ao serviço, com dependências simuladas, cobrindo criação/edição inválidas sem consultas ou mutações, caminhos válidos, endereços carregados e autorização. As 163 verificações HTTP anteriores também passaram. Build aprovado com sete avisos CS8618 preexistentes. Nenhum banco ou provedor externo acessado; teste de integração com persistência real não realizado nesta etapa.

```powershell
dotnet run --project docs/validacoes/ProgrammingDomainValidation.Tests.csproj
dotnet run --project docs/validacoes/ActionsValidation.Tests.csproj
```

O ponto do item 6 relativo a chamadas diretas ao serviço foi corrigido. A pendência do item 7 sobre tipos anuláveis nos DTOs de cadastro permanece fora desta alteração. Rotas e corpos HTTP preservados; protótipo indisponível neste computador. PDFs preservados.

## Programação paga com preço zero — 23/10/2026

ProgrammingCreateValidation e ProgrammingEditValidation agora rejeitam IsFree=false com MinPrice=0 e MaxPrice=0. A mensagem é: "Programações pagas devem ter pelo menos um preço maior que zero." A faixa MinPrice=0 e MaxPrice>0 permanece permitida. IsFree=true continua exigindo os dois preços zerados.

Validação isolada: 20 cenários aprovados usando os arquivos reais dos dois validadores e DTOs, incluindo paga zerada, gratuita zerada, faixa começando em zero, preços positivos, negativa, invertida e NaN. Nenhum banco foi utilizado.

```powershell
dotnet run --project docs/validacoes/PaidProgrammingValidation.Tests.csproj
```

A compilação completa continua bloqueada pelas referências antigas a IHostValidation, IProgrammingValidation e IUserXCategoryValidation nos AppServices, durante a migração em andamento para IValidation<T>. A regra foi aplicada aos novos validadores; sua execução no fluxo HTTP e no domínio depende de concluir essa integração. Não foi registrada compilação geral como aprovada. Protótipo indisponível neste computador; PDFs preservados.

## Validadores genéricos de host — 23/10/2026

Criados HostCreateValidation : IValidation<HostRegisterDTO> e HostEditValidation : IValidation<HostEditDTO> na pasta de validações existente. HostAppService recebe os dois contratos no construtor e chama Validate(dto, DateTime.UtcNow) antes de mapear cada operação. Program.cs registra as implementações como scoped. Não há mais referência a IHostValidation nesse fluxo.

Ambos exigem exatamente uma alternativa de endereço: AddressId positivo ou objeto Address. São rejeitados endereço ausente, as duas alternativas simultâneas e AddressId explicitamente zero/negativo. Os DTOs permanecem somente com propriedades e anotações; obrigatoriedade, enum e limites continuam nas anotações existentes. Não foram criadas regras novas de CNPJ, URLs ou telefone. Propriedade do host, disponibilidade, resolução/geocodificação do endereço e persistência transacional da role permanecem nos serviços existentes. O parâmetro now é mantido pelo contrato genérico e não é usado nestas regras.

Validação isolada: 25 verificações aprovadas com HostAppService, DTOs e validadores reais e domínio simulado, cobrindo resolução genérica pela DI, endereço existente/novo, alternativas inválidas, execução antes do domínio, mapeamentos de retorno e anotações. Nenhum banco ou geocodificador foi utilizado.

```powershell
dotnet run --project docs/validacoes/HostGenericValidation.Tests.csproj
```

A compilação geral ainda está bloqueada pela referência preexistente a IUserXCategoryValidation em UserXCategoryAppService, cuja migração genérica não faz parte desta etapa. Não foi declarado build completo aprovado. Protótipo indisponível nos caminhos conhecidos; formatos HTTP de host preservados e PDFs não regenerados.

## Validações genéricas de User e UserXCategory — 23/10/2026

Criados UserCreateValidation : IValidation<UserRegisterDTO>, UserEditValidation : IValidation<UserEditDTO> e UserXCategoryValidation : IValidation<UserXCategoryDTO>, na pasta de validações existente. Os AppServices recebem as interfaces genéricas e chamam Validate(dto, DateTime.UtcNow) antes do mapeamento. Program.cs registra os três contratos como scoped. A referência antiga a IUserXCategoryValidation foi substituída.

UserCreateValidation e UserEditValidation executam as anotações existentes usando Validator.TryValidateObject, sem repetir critérios de nome, e-mail, enum ou tamanhos no código. Falhas são traduzidas para ArgumentException, tratada pelo controller como HTTP 400. Isso permite verificar também chamadas internas ao AppService antes de Trim e conversões. Os DTOs continuam sem métodos e sem atributos personalizados. Política de senha, unicidade de nome/e-mail e persistência continuam delegadas ao Identity; não foram acrescentadas regras de complexidade de senha nem novos campos obrigatórios.

UserXCategoryValidation é compartilhada pela inclusão e edição. Rejeita CategoryIds nulo ou IDs menores/iguais a zero e aceita []. O AppService mantém Distinct; existência/atividade e alterações atômicas permanecem no serviço/repositório. Cadastro vazio não altera preferências; edição vazia remove as existentes.

Validação: build completo aprovado com zero erros e sete avisos CS8618 preexistentes. Passaram 32 verificações de resolução genérica pela DI, regras de entrada antes do domínio, propagação de resultados de senha/duplicidade do Identity, ação de cadastro retornando 400, seleção de categorias válida/inválida/inativa/inexistente, deduplicação e operações vazias. AppServices, validadores e serviço de categorias reais; Identity/domain de usuário e repositórios simulados, sem banco.

```powershell
dotnet run --project docs/validacoes/UserGenericValidation.Tests.csproj
```

Esta atualização substitui o bloqueio de compilação anteriormente registrado por falta de IUserXCategoryValidation. Não foi realizado teste HTTP integrado nem iniciado o sistema com banco nesta etapa. Protótipo indisponível nos caminhos conhecidos; rotas e corpos preservados, PDFs não regenerados.

## Retornos de HostAppService integralmente em DTO — 23/10/2026

Conferidos os contratos: Create retorna HostCreatedDTO; GetByIdAsync retorna HostDetailsDTO; EditHostAsync retorna HostResponseDTO; GetAllHostsbyUserId retorna coleção de HostResponseDTO. Essas quatro operações já mapeavam os dados do serviço para DTOs.

DeleteHostAsync era o único método do AppService que ainda retornava Hosts. Agora retorna HostResponseDTO ou null, com o mesmo mapeamento explícito de campos permitidos e AddressDetailsDTO. IHostAppService foi atualizado e não referencia entidades do domínio nos retornos. Não foi criado um DTO adicional. Os serviços e repositórios continuam trabalhando com entidades internamente.

O controller de exclusão continua retornando HTTP 204 sem corpo no sucesso, 404 para host indisponível e 401 para usuário não autenticado. O DTO da exclusão é o retorno interno do AppService, não um novo corpo HTTP. Cadastro mantém result/auth; contratos dos demais endpoints preservados.

Validação: build completo aprovado com sete avisos CS8618 preexistentes; 19 verificações aprovadas com AppService/controller reais e domínio simulado, cobrindo todos os contratos da interface, estado/IDs/endereço mapeados, campos permitidos, ausência de dados internos de usuário e status de exclusão. Nenhum banco ou provedor externo acessado.

```powershell
dotnet run --project docs/validacoes/HostDtoReturns.Tests.csproj
```

Protótipo indisponível nos caminhos conhecidos deste computador; não houve mudança nos corpos HTTP. PDFs preservados.

## Retornos de ProgrammingAppService em DTO — 23/10/2026

Todos os métodos de IProgrammingAppService agora retornam DTOs. CreateProgrammingAsync, EditProgrammingAsync, DeleteProgrammingAsync, GetAllProgrammingsbyHostId e GetAllProgrammingsByUserCategoriesAsync usam ProgrammingResponseDTO (individual/coleção, preservando nulidade e listas vazias). GetByIdAsync mantém ProgrammingDetailsDTO. Os mapeamentos explícitos seguem o padrão existente do AppService, usando as entidades retornadas pelo domínio sem novas consultas.

ProgrammingResponseDTO permite id, name, isActive, description, startDate, endDate, isFree, imageUrl, ticketUrl, instagranUrl, hostId, addressId, createdDate, updateDate, minPrice, maxPrice e address (AddressDetailsDTO). Não inclui a navegação Host, seus dados de usuário, nem Address.AddWho/CreatedAt/Location. Consumidores que acessavam host ou metadados internos do endereço devem usar hostId ou os endpoints de detalhes apropriados.

ProgrammingDetailsDTO.Categories foi alterado de List<Category> para List<CategoryResponseDTO>. O JSON mantém id, name e isActive de cada categoria, mas não retorna entidades. Metadados públicos hostName/hostLogoUrl permanecem nos detalhes. HostDetailsDTO continua usando ProgrammingDetailsDTO para sua lista de programações.

Controllers não precisaram mudar assinaturas porque os consumidores usam var. O cadastro mantém HTTP 201 e Location apontando para Details com o ID persistido do DTO; edição mantém 200; exclusão continua 204 sem corpo, usando o DTO apenas internamente. Rotas, entrada, autenticação, validações e serviços/repositórios permanecem com seus contratos anteriores. As preferências continuam retornando [] quando não há resultados.

Validação: build completo aprovado, zero erros e sete avisos CS8618 preexistentes. 81 verificações aprovadas com HTTP real em servidor temporário localhost, controllers e AppService reais e domínio/autenticação de teste simulados. Cobertura: contratos da interface, respostas e mapeamentos, campos permitidos, host carregado com dados fictícios de Identity, categorias em DTO, criação com Location, detalhes, edição, exclusão, listagem por host, sugestões, resultados vazios e status 201/200/204/404/401. Nenhum banco ou geocodificador acessado.

```powershell
dotnet run --project docs/validacoes/ProgrammingDtoReturns.Tests.csproj
```

Esta seção substitui as descrições antigas de retorno de entidades Programming/Category nesse AppService. Protótipo indisponível nos caminhos conhecidos; validação visual não realizada. Nenhuma migration ou PDF gerado.

## Retornos restantes de categorias em DTO — 23/10/2026

CategoryAppService.GetallCategories/GetAllCategoriesPrefereces agora retornam IEnumerable<CategoryResponseDTO>; GetbyId retorna CategoryResponseDTO. Os mapeamentos permitem somente id, name e isActive, preservando valores, ordenação do serviço e listas vazias. ICategoryAppService foi atualizado. Os endpoints de catálogo e preferências continuam retornando arrays JSON com os mesmos campos.

ProgrammingXCategoryAppService.CreateProgrammingXCategoryAsync agora retorna ProgrammingXCategoryResponseDTO, com id, programmingId e categoryId obtidos do resultado do serviço. Não são retornadas as navegações Programming ou Category. IProgrammingXCategoryAppService foi atualizado; não foi criado endpoint novo para esse método.

POST /api/Category/AddCategoryToUser mantém HTTP 200 e passa a devolver diretamente UserXCategoryDTO: {"userId":"...","categoryIds":[1,2]}. O retorno anterior {"message":"Categorias adicionadas com sucesso."} foi substituído. O frontend deve consumir o DTO, sem depender da propriedade message. O cadastro retorna os IDs adicionados naquela chamada; PUT continua retornando o DTO das preferências após edição. [] continua válido e a origem de userId permanece no JWT.

Também foi removido de Program.cs um using para Application.Validations.Validations.Host que não correspondia aos namespaces declarados. O namespace correto já estava importado. Nenhuma mudança de autenticação ou registro de validadores foi necessária para os retornos.

Validação: build completo aprovado, zero erros e sete avisos CS8618 preexistentes. 34 verificações aprovadas com HTTP real em localhost, controllers/AppServices reais e domínio/autenticação simulados. Conferidos contratos da interface, valores e campos de categorias, exclusão de propriedade adicional de uma entidade derivada, vínculo com navegações preenchidas e dados fictícios de Identity, POST/PUT em DTO, seleção vazia, rejeição de IDs inválidos, catálogo público e preferências autenticadas. Nenhum banco ou provedor externo acessado.

```powershell
dotnet run --project docs/validacoes/CategoryDtoReturns.Tests.csproj
```

Estas descrições substituem os registros anteriores de retorno de entidades nesses AppServices. Protótipo indisponível nos caminhos conhecidos deste computador: sua compatibilidade com a mudança do POST deve ser conferida quando disponível. PDFs preservados.


## Validação no domínio de programação — 23/10/2026

Cadastro e edição mantêm as rotas, autorização e respostas existentes. Os controllers continuam convertendo ArgumentException em ProblemDetails 400; a origem das regras compartilhadas passa a ser `ProgrammingValidations`, chamado pelo serviço de domínio. Assim, chamadas internas ao serviço recebem as mesmas restrições de datas, categorias, preços, gratuidade e seleção de endereço.

Os atributos de rota, os DTOs e os tratamentos HTTP foram conferidos no código. Build aprovado e 77 verificações isoladas de domínio/AppService/DI aprovadas. Não houve teste HTTP nesta etapa. O protótipo não foi encontrado nos caminhos de Artur ou Rafael e não pôde ser revisado. PDFs preservados.


## Consulta ViaCEP — 24/10/2026
Implementado GET /api/Address/GetByCEP?cep=50030-220, com JWT obrigatório. Fluxo: AddressController -> AddressAppService -> AddressService -> IPostalCodeService/ViaCepService. Formato validado no serviço; aceita oito dígitos ou hífen após o quinto dígito. Retorno PostalAddressDTO: cep, street, neighborhood, city, state. Sem número ou complemento do imóvel.
Respostas: 200 encontrado, 400 formato inválido, 401 sem autenticação, 404 quando o ViaCEP confirma ausência e 503 por timeout, HTTP malsucedido ou resposta inválida. Timeout de oito segundos; cancelamento da requisição propagado. Consulta não grava no banco nem aciona a Geoapify. O formulário permite preencher manualmente se a consulta falhar e mantém número/complemento.
Escopo desta etapa: preenchimento assistido nos quatro formulários de criar/editar host/programação. Cidade e UF são exibidos na consulta, ainda não persistidos em Address nem enviados à geocodificação. A inclusão dessas colunas e seu uso pela Geoapify continuam pendentes de etapa própria, com revisão da migration. PostalAddress é um resultado de consulta, não uma entidade mapeada no EF. Não há migration nesta entrega.
Validações executadas: build sem erros (sete avisos CS8618 existentes), node --check, 44 testes do protótipo com API simulada e dez verificações do adaptador C# com HttpMessageHandler simulado (sucesso, ausência, resposta inválida, HTTP 429/500, falha de rede e timeout). Nenhum cadastro real foi criado nos testes. PDFs não regenerados.

Verificação local adicional: API iniciada; GET GetByCEP sem JWT retornou 401. Consulta direta ao ViaCEP para 01001000 retornou Praça da Sé, São Paulo/SP. Painel respondeu HTTP 200. O cadastro real com JWT não foi executado nesta validação.

## Endereço no protótipo — 25/10/2026
A consulta ViaCEP ocorre automaticamente 400 ms após preencher um CEP válido, sem botão. Número e complemento são preservados; preenchimento manual continua disponível. Criar/editar programação oferece “Usar endereço do host”: consulta GET /api/Host/Details/{hostId} com JWT e reutiliza addressId, sem criar endereço duplicado. Respostas são descartadas se host, CEP ou seleção mudarem durante a consulta. Nenhuma alteração de contrato da API ou banco. Validação: node --check e 47 testes com API simulada aprovados. PDFs não regenerados.


## Consulta e validação de CNPJ — 25/10/2026
Integração Minha Receita nas camadas existentes: HostController -> HostAppService -> HostService -> ICompanyRegistrationService/MinhaReceitaService. ICnpjValidations/CnpjValidations normalizam e validam formato e dígitos verificadores numéricos e alfanuméricos, sem converter o identificador em número. Os DTOs de cadastro/edição exigem CNPJ e formato compatível. Nenhuma pasta nova de produção foi criada.
GET /api/Host/GetByCNPJ?cnpj=33683111000280 exige JWT e retorna CompanyRegistrationDTO: cnpj, legalName, tradeName, registrationStatus, statusDescription, checkedAt (UTC da consulta), street, number, complement, neighborhood, cep, city e state. Nenhum dado de sócios é devolvido. Consulta bem-sucedida retorna 200 inclusive para situação não ativa; o formulário informa a situação. Falhas: 400 formato/DV inválido, 404 não localizado na base consultada, 503 indisponibilidade, limite, timeout ou resposta inválida. CheckedAt não representa atualização da base oficial nem é persistido.
Criar host e alterar CNPJ exigem consulta com situacao_cadastral=2 antes de geocodificar ou salvar. Cadastro duplicado retorna 409; empresa não ativa retorna 422. Edição sem mudança do CNPJ normalizado dispensa nova consulta externa, mas valida formato/DV e duplicidade. O próprio host é excluído da busca de duplicados. Hosts inativos continuam reservando o CNPJ. Não há validação externa na desativação. Falhas da consulta não salvam o host. Registros legados não foram corrigidos ou excluídos automaticamente.
O repositório repete a verificação de duplicidade dentro da transação, sob pg_advisory_xact_lock(721904, 1), utilizado no cadastro e alteração do CNPJ. Isso serializa essas gravações entre instâncias desta API. Não existe índice único novo: gravações externas que ignorem o lock não são protegidas. Uma restrição única no banco exige auditoria/normalização dos registros legados e revisão de migration; permanece melhoria pendente. A transação existente de cadastro com role HOST foi preservada.
Protótipo: consulta automática após 500 ms ao completar o CNPJ. Resultados de consultas antigas são ignorados. Nome e endereço são sugestões aplicadas somente por botões de confirmação; não sobrescrevem o formulário automaticamente. Cidade/UF são exibidas mas seguem fora da persistência de Address. A consulta não comprova representação da empresa pelo usuário. Minha Receita é uma base secundária e pode estar desatualizada; ausência não comprova inexistência definitiva.
Validação: build sem erros (sete avisos CS8618 preexistentes), node --check, 50 testes do protótipo com API simulada e 30 verificações C# com dependências simuladas (DV, normalização, respostas inválidas, ausência, timeout, cancelamento, regras de criação/edição, situação ativa, duplicidade e propriedade). Consulta real somente de leitura pelo adaptador C# confirmou resposta válida e ativa para o exemplo público do provedor. A suíte não executou cadastros reais nem teste concorrente contra PostgreSQL. NuGet não conseguiu consultar a base de vulnerabilidades (NU1900) na execução do harness; isso não impediu a compilação/testes. PDFs não regenerados. Nenhuma migration criada por esta integração.
Fontes: https://docs.minhareceita.org/como-usar/ ; https://docs.minhareceita.org/sobre-os-dados/ ; https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf

### Organização do tratamento de CNPJ — 25/10/2026
O método CnpjProblem foi movido de HostController para Domain/Exceptions/CnpjExceptionExtensions.cs. Os três catches chamam ex.CnpjProblem(this), preservando o ProblemDetails gerado por ControllerBase. Status, rotas e corpos permanecem iguais; o protótipo não exige alteração. Build CnpjCheck validado: zero erros e sete avisos CS8618 preexistentes.


## Favorite — 26/10/2026 (código preparado; migration pendente)

Todas as actions exigem JWT via `[Authorize]`, sem restrição de role. O usuário vem de UserManager.GetUserId(User); não é recebido na URL nem no corpo. As validações ficam no serviço, e a controller converte as falhas esperadas em ProblemDetails.

| Método | Rota | Entrada | Retorno |
|---|---|---|---|
| POST | `/api/Favorite/{programmingId}/Create` | ID da programação na rota, sem corpo | 200 FavoriteResponseDTO; cria, mantém ou reativa o vínculo |
| GET | `/api/Favorite/GetAllByUserId` | Sem corpo | 200 lista de FavoriteResponseDTO, inclusive `[]` |
| PATCH | `/api/Favorite/{programmingId}/Delete` | ID da programação na rota, sem corpo | 200 FavoriteResponseDTO com IsActive=false |

401: JWT ausente/inválido ou usuário ausente/inativo. 400: ID numérico menor ou igual a zero. No POST, 404: programação ausente/inativa ou host inativo. No PATCH, 404: não existe vínculo do próprio usuário com aquela programação. Um vínculo já desativado retorna 200 novamente. O POST exige programação e host ativos; o PATCH permite remover o favorito mesmo após a desativação desses registros. A listagem mostra apenas favoritos ativos de programações e hosts ativos.

O ID da rota é ProgrammingId, nunca o ID do favorito. Os exemplos estão em Projetos - 4.http, seção FAVORITE; o painel tem a seção Favoritos e utiliza o JWT atual. Nenhuma migration foi gerada/aplicada, nem a API reiniciada nesta etapa. Testes reais desses endpoints dependem da migration revisada posteriormente.


## Revisão de DTOs de criação/edição — 26/10/2026

- Programação: ProgrammingCreateDTO e ProgrammingEditDTO foram unificados em ProgrammingDTO. Os tipos, anotações e padrões eram equivalentes. Controller, IProgrammingAppService e ProgrammingAppService agora usam o tipo único; o AppService recebe somente IValidation<ProgrammingDTO>. As duas validações idênticas da Application foram substituídas por ProgrammingValidation, registrada uma única vez na DI.
- Host: HostRegisterDTO e HostEditDTO permanecem separados. Typeofhost é TypeofHost no cadastro e TypeofHost? com Required na edição; a omissão assume o valor inicial no cadastro e falha na edição. Unificar exigiria mudar essa regra, o que não foi feito.
- Usuário: UserRegisterDTO e UserEditDTO permanecem separados. Somente cadastro possui Password; o tipo de usuário também difere em enum/anulabilidade/Required.
- Endereço: existe AddressCreateDTO, sem um par AddressEditDTO equivalente para unificar. O DTO de detalhes é de saída e permanece próprio.

Rotas, verbos, autorização, propriedades JSON e respostas preservados. O catálogo do protótipo lê ProgrammingDTO nos dois endpoints e reconhece os mesmos campos de entrada. Exemplos HTTP mantêm os mesmos corpos. Validado: build DtoCheck sem erros, com sete avisos CS8618 preexistentes; catálogo create/edit conferido com ProgrammingDTO; node --check e 51 testes do protótipo aprovados com API simulada. Nenhuma gravação em banco, geração/aplicação de migration, reinicialização da API ou atualização de PDFs nesta etapa.


## HostDTO unificado e tipo obrigatório — 26/10/2026

HostRegisterDTO e HostEditDTO foram substituídos por HostDTO. Typeofhost agora é TypeofHost? com Required e EnumDataType nas duas operações. Ausência/null/valor fora do enum são rejeitados; zero continua sendo o tipo Productor válido. Os demais nomes e propriedades JSON foram preservados.

HostCreateValidation e HostEditValidation foram substituídos por HostValidation : IValidation<HostDTO>. Ele verifica as anotações do DTO também em chamadas diretas ao AppService e preserva a exclusividade entre endereço existente/novo. Controller, interfaces, mapeamentos e DI foram adaptados; há um único validador e registro. Esta atualização substitui a decisão anterior, registrada na revisão de DTOs, de manter os DTOs de host separados.

Catálogo do protótipo conferido: Create/Edit usam HostDTO e exibem typeofhost obrigatório como seleção. node --check e 51 testes com API simulada aprovados. Build DtoCheck aprovado, zero erros e sete avisos CS8618 preexistentes. Não houve reinício da API, alteração de banco, migration ou exportação de PDFs.


## HostValidation com verificações explícitas — 26/10/2026

HostValidation foi adaptado ao padrão atual de ProgrammingValidation: ArgumentNullException.ThrowIfNull(dto), verificações com if/chaves e ArgumentException com mensagem específica. Não usa mais Validator.TryValidateObject. Continua implementando IValidation<HostDTO> e sendo chamado no HostAppService antes do mapeamento de cadastro/edição.

Valida tipo do host obrigatório e pertencente ao enum (incluindo zero válido); nome obrigatório/até 150; descrição obrigatória/até 2000; CNPJ obrigatório e formato numérico/alfanumérico com ou sem máscara/até 18; logo e Instagram até 2048; telefone até 30; AddressId positivo quando enviado; exatamente um entre AddressId e Address. Quando há endereço novo, verifica logradouro obrigatório/até 300, número obrigatório/até 20, complemento opcional/até 200, bairro opcional/até 150 e CEP de oito dígitos com hífen opcional. O próprio validador passa a verificar também esses campos do objeto Address, além da validação aninhada que já existe na entrada HTTP.

A validação do formato do CNPJ não garante dígitos verificadores, situação ativa, existência ou unicidade: essas regras continuam no domínio e no provedor já integrados. Não foram adicionadas restrições de formato para telefone/URLs, além dos limites existentes no DTO.

Rotas, DTOs, DI, autorização e formatos de sucesso preservados. As falhas do AppService continuam sendo ArgumentException, convertidas em HTTP 400 pelos catches existentes; anotações dos DTOs continuam atuando no model binding HTTP. O parâmetro now permanece na assinatura para seguir IValidation<T>, sem regra temporal para host. ProgrammingValidation foi preservado conforme alterado pelo usuário.

Validação realizada: build DtoCheck com zero erros e sete avisos CS8618 preexistentes; 64 verificações de HostDTO/HostAppService com serviço simulado (cadastro/edição, null, obrigatórios, enum, formatos, limites e alternativas de endereço); node --check e 51 testes do protótipo aprovados com API simulada. Sem consulta externa, reinício da API, gravação em banco, migration ou atualização de PDFs.


## Regras de negócio de host — revisão de 26/10/2026

HostValidation foi reduzido à regra de escolher exatamente um endereço existente (AddressId) ou um endereço novo (Address), além da proteção contra argumento nulo. Foram retiradas as verificações que repetiam Required, EnumDataType, MaxLength, Range e RegularExpression de HostDTO/AddressCreateDTO. As anotações permanecem nos DTOs e são verificadas pelo model binding da API, inclusive no objeto aninhado. Chamadas diretas ao AppService não devem ser tratadas como substitutas dessa validação de entrada; HostValidation não revalida o formato dos campos.

As regras que dependem de dados permanecem nas camadas responsáveis:

- CNPJ único por host: HostService e HostRepository verificam o CNPJ normalizado, excluindo o próprio host na edição; inclui hosts inativos. O fluxo existente de transação/advisory lock continua na gravação. A verificação de dígitos, situação ativa e consulta Minha Receita já existente foi preservada.
- Host inativo não cria programações: ProgrammingService usa UserOwnsActiveHostAsync antes de resolver endereço e gravar a programação. A consulta exige host ativo e pertencente ao usuário. Não há cadastro/modelo de produtos no código atual; a regra para produtos permanece pendente de um módulo de produtos, sem criar funcionalidades adicionais nesta etapa.
- Alteração e desativação de host ativo: HostService.GetHostForModificationAsync verifica usuário existente/ativo e consulta UserManager.IsInRoleAsync(user, "ADMIN"). HostRepository.VerificationbyId recebe esse resultado interno e aceita o responsável ou administrador. O cliente não envia isAdmin nem escolhe a autoria. Terceiros e usuários inativos não alteram o host; a autoria original não é transferida quando um administrador edita. Hosts inativos continuam indisponíveis para edição/desativação pelos endpoints atuais.
- Endereço válido: a exigência de endereço já existente para todos os tipos de host foi mantida, cobrindo Gastronomy e Business (estabelecimentos físicos). Seleção de ID inexistente é recusada por AddressService; endereço novo passa pelo DTO e pelo fluxo de resolução/geocodificação existente. Não se tornou opcional o endereço de Productor, pois isso exigiria revisar o contrato/relacionamento obrigatório atual.

Os endpoints de host mantêm seus verbos, rotas e roles. Edição permitida retorna 200; desativação permitida retorna 204. Acesso negado/host indisponível retorna 404 como antes; JWT/role continuam sendo verificados na entrada. O acesso de ADMIN agora funciona também no serviço/repositório, não somente na anotação da controller.

Validação realizada: build HostRulesCheck com zero erros e sete avisos CS8618 preexistentes; 30 verificações com dependências simuladas (dono, terceiro, administrador, usuário ausente/inativo, autoria preservada, CNPJ duplicado, endereço inválido, programação em host ativo/inativo e escolhas de endereço); node --check e 51 testes do protótipo com API simulada aprovados. Persistência, concorrência real, HTTP autenticado e provedores externos não foram exercitados. Não houve migration, reinício de API ou exportação de PDFs.


## UserDTO e validação unificados — 26/10/2026

UserRegisterDTO e UserEditDTO foram substituídos por UserDTO. UserCreateValidation e UserEditValidation foram substituídos por UserValidation : IValidation<UserDTO>, com único registro Scoped e uma dependência no UserAppService. Controller, IUserAppService e mapeamentos foram atualizados. O enum usa User.TypeofUser? com Required nas duas operações; cadastro agora também rejeita ausência do tipo.

Password é string? no contrato compartilhado para permitir editar o perfil sem enviar senha. UserService.Create mantém a regra de senha obrigatória no cadastro, retornando erro Identity PasswordRequired para null/vazio/espaços antes de chamar o Identity. Regras de força/unicidade continuam no Identity. A edição ignora Password e não muda senha nem permissões. Não houve novo endpoint ou alteração do fluxo de autenticação. Isso substitui a decisão anterior de manter DTOs de usuário separados.

No protótipo, a sincronização do catálogo marca a senha obrigatória no cadastro e oculta/remove esse campo da edição; o teste simulado verifica também a troca automática do JWT retornado pela edição. Os exemplos HTTP conservam senha somente no cadastro/login. Rotas, verbos e formatos de sucesso preservados; ausência de senha no cadastro continua retornando 400, agora pelo erro PasswordRequired. DTOs de login/exclusão/perfil permanecem próprios.

Validação: build UserDtoCheck com zero erros e sete avisos CS8618 preexistentes; 28 verificações de DTO, validador, AppService e serviço com Identity/repositório simulados, incluindo senha obrigatória apenas no cadastro, enum, campos inválidos, preservação do hash/permissões e mapeamentos; catálogo dos dois endpoints conferido; node --check e 52 testes do protótipo com API simulada aprovados. Sem HTTP autenticado, acesso ao banco, reinício da API, migration ou atualização de PDFs.


## Conversão de Programming para resposta encapsulada — 26/10/2026

ProgrammingMapping, na pasta Application/Mapping/Programming organizada pelo usuário (namespace Application.Mapping), agora contém ToDTO(Programming programming), retornando ProgrammingResponseDTO com os mesmos campos e AddressDetailsDTO que antes eram montados no AppService. ToModel foi preservado como método de instância. O mapper é registrado como Scoped e recebido pelo construtor de ProgrammingAppService; o using foi ajustado ao namespace existente.

Cadastro, edição e retorno interno de desativação chamam _programmingMapping.ToDTO(result). As listagens por host e por interesses usam Select(_programmingMapping.ToDTO).ToList(). A consulta que retorna ProgrammingDetailsDTO mantém seu mapeamento próprio, incluindo host e categorias. Os retornos null existentes foram preservados antes da conversão.

Address deve estar carregado no modelo, como já era exigido pelos blocos anteriores; as consultas do repositório incluem a navegação usada nas listagens. O mapper não consulta banco nem resolve geocodificação. Sem mudança de campos, autorização, rotas ou verbos; o PATCH de desativação continua respondendo HTTP 204 na controller.

Validação: build MappingCheck aprovado, zero erros e sete avisos CS8618 preexistentes; revisão dos cinco usos do mapper e dos campos de resposta; node --check e 52 testes existentes do protótipo com API simulada aprovados. Não houve CRUD real ou teste de persistência nesta refatoração. Nenhuma migration, pasta nova, reinício da API ou exportação de PDFs.


## Mapeamentos dos AppServices por interface — 26/10/2026

O padrão de IProgrammingMapping foi aplicado aos demais AppServices. Os novos arquivos foram adicionados à pasta Application/Mapping existente e suas interfaces a Application/Mapping/Interfaces, sem novas pastas. Todos os contratos são registrados como Scoped e recebidos por construtor. ProgrammingMapping permanece no local organizado pelo usuário, Mapping/Programming, com namespace Application.Mapping.

| Implementação / interface | Conversões |
|---|---|
| HostMapping / IHostMapping | HostDTO → Hosts; Hosts → HostResponseDTO, HostCreatedDTO e HostDetailsDTO; CompanyRegistration → CompanyRegistrationDTO |
| UserMapping / IUserMapping | UserDTO → User no cadastro; ToEditModel preserva o Trim de nome/e-mail da edição; User → UserProfileDTO |
| AddressMapping / IAddressMapping | AddressCreateDTO → Address; Address → AddressDetailsDTO; PostalAddress → PostalAddressDTO |
| CategoryMapping / ICategoryMapping | Category → CategoryResponseDTO |
| FavoriteMapping / IFavoriteMapping | Favorite → FavoriteResponseDTO com os três campos atuais: UserId, ProgrammingId e HostId |
| UserXCategoryMapping / IUserXCategoryMapping | Montagem do DTO de seleção para validação, conversão em lista de vínculos distintos e conversão dos vínculos retornados em UserXCategoryDTO |
| ProgrammingXCategoryMapping / IProgrammingXCategoryMapping | IDs → vínculo; categoria/entidade Programming → vínculo com referência à mesma entidade; vínculo → ProgrammingXCategoryResponseDTO |

IProgrammingMapping também declara ToDetailsDTO(Programming, Hosts, IEnumerable<Category>? categories = null). ProgrammingMapping reutiliza IAddressMapping e ICategoryMapping. HostMapping utiliza IAddressMapping/IProgrammingMapping para o perfil e suas programações, sem depender de consultas dentro do mapper. Perfil do host mantém Categories=null nas programações quando não recebe categorias; consulta pública da programação continua consultando as categorias pelo serviço e devolvendo a lista. Não houve mudança desses formatos.

Os AppServices mantêm validação, chamadas aos serviços, retornos null/erros existentes e atribuição dos IDs recebidos por rota. O foreach dos vínculos de programação continua no AppService, chamando o mapper para cada vínculo, sem gravar durante a conversão. A seleção de interesses continua removendo IDs repetidos e preservando a ordem dos vínculos retornados pelo serviço. Os mappers não consultam repositórios ou APIs, não fazem autorização e não mapeiam senha/hash/roles a partir dos DTOs. Nome/e-mail do cadastro de usuário permanecem como enviados, e o Trim continua específico da edição.

Durante a revisão foi encontrada uma linha incompleta `var links = await _` em EditProgrammingAsync, impedindo compilar. A linha foi retirada no ajuste desse trecho; o fluxo de vínculos foi preservado. A dependência IProgrammingXCategoryAppService adicionada pelo usuário foi mantida.

Validação: build MappingCheck aprovado, zero erros e sete avisos CS8618 preexistentes; 41 cenários de entradas/saídas dos oito AppServices comparados com uma baseline anterior à extração, com os mesmos resultados JSON. A verificação resolve os AppServices e dependências por DI (ValidateOnBuild/ValidateScopes), usando serviços/Identity simulados. Cobre endereços novos/existentes, detalhes e listagens, categorias e vínculos, dados reduzidos de favorito, normalização de usuário e consultas sem resultado. As validações são simuladas nessa comparação, pois o foco é preservar o mapeamento; não representa nova execução dos testes de regras de negócio ou dos provedores.

node --check em app.js/catalog.mjs e 52 testes do protótipo com API simulada aprovados. Contratos HTTP, autorização, IDs, formatos de resposta e JWT preservados; formulários e exemplos .http permanecem compatíveis. Nenhum teste CRUD contra API/banco real, reinício de API, alteração de schema, migration ou atualização de PDFs nesta etapa.


## R03 — unicidade dos vínculos de categorias (26/10/2026)

POST /api/Category/AddCategoryToUser reaproveita vínculos existentes e mantém 200 para repetição válida. Edições de interesses/programação retornam ProblemDetails 409 se as categorias mudarem durante o processamento ou houver conflito nos índices de vínculo. O frontend deve recarregar a seleção antes de reenviar; sem retry automático. Rotas, autorização e corpos permanecem iguais. A criação individual de vínculo agora verifica existência e salva na própria transação; CreateProgrammingLinks continua apenas montando objetos.

Validação: build sem erros; 13 verificações locais de modelo/snapshots/409, 41 cenários de mapeamento e 52 testes do protótipo com dependências simuladas aprovados. Sem teste de persistência no PostgreSQL, alteração de dados, migration ou PDF. [Registro completo e pendências](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## R03 — Docker disponível, auditoria e testes reais (26/10/2026)

Os repositórios de interesses e categorias de programação foram exercitados no PostgreSQL real em banco isolado. Conflitos de seleção foram confirmados no repositório; a tradução para ProblemDetails 409 já está no código, mas endpoints HTTP/JWT não foram executados nesta continuação. Contratos HTTP preservados.

As 13 verificações de integração passaram. O banco descartável foi removido; o banco principal manteve as contagens e não foi alterado. Nenhuma migration, limpeza de dados ou PDF executado. [Relatório e comando de teste](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## Bloqueio de login e stamps do Identity — 26/10/2026

Login mantém POST /api/User/auth/Login, UserLoginDTO e retorno JWT no sucesso. Com o schema atualizado, cinco senhas incorretas bloqueiam a conta por 15 minutos. Senha errada ou conta bloqueada mantêm ProblemDetails 401 genérico. Nenhuma nova action ou status foi criado.

Implementação, roteiro da migration e teste reproduzível: [revisão R01](validacoes/identity-bloqueio-login-2026-10-26.md).

## Verificação após AddFavorite — 26/10/2026

A migration 20261026163834_AddFavorite foi aplicada pelo usuário e confirmada no PostgreSQL. Há pendência funcional no login de contas antigas: SecurityStamp nulo provoca InvalidOperationException ao registrar senha incorreta e pode resultar em 500. O contrato esperado continua 401. A auditoria não modificou usuários reais.

Evidências e teste reproduzível: [auditoria da migration](validacoes/validacao-migration-addfavorite-2026-10-26.md).

## Limpeza autorizada das contas antigas — 26/10/2026

Limpeza autorizada do banco de testes: 23 usuários antigos removidos, com exclusão em cascata dos 29 hosts e 13 programações vinculados e respectivos interesses/vínculos/favoritos. Para testar os endpoints, cadastre nova conta e obtenha novo JWT; IDs e respostas de cadastros anteriores não devem ser reutilizados. Nenhuma rota ou contrato mudou.

## Edição de datas e preços decimais — 26/10/2026

POST de programação continua exigindo início futuro. PUT aceita programações iniciadas ou encerradas, mantendo UTC e término posterior ao início. Ambos continuam com ProgrammingDTO e retornos existentes; preços são números JSON decimais, de 0 a 9999999999.99 e até duas casas. Infrações retornam 400 pelos mecanismos atuais. Nenhuma nova action foi criada.

Detalhes e teste reproduzível: [revisão de datas/preços](validacoes/programming-datas-precos-2026-10-26.md).

## Endpoint público de paginação — 26/10/2026

Novo endpoint público: GET /api/Programming/GetAllProgrammings?take=10&skip=0. Parâmetros opcionais na query: take int (padrão 10, maior que zero) e skip int (padrão 0, não negativo). Sem JWT e sem corpo. Retorna 200 com array de ProgrammingResponseDTO, inclusive [] quando vazio; argumentos inválidos retornam ProblemDetails 400. Valores não inteiros são recusados pelo binding do ApiController com 400. Exemplo da segunda página: take=10&skip=10.

## Remoção de bairro dos filtros de host — 27/10/2026

Neighborhood removido de HostFilterDTO, HostFilter, HostFilterMapping e da consulta HostRepository.FilterAsync. Bairro continua opcional no endereço e nos formulários de cadastro/edição, para exibição; não participa da seleção de hosts. Proximidade permanece uma implementação futura. Nenhuma alteração no schema ou migration. O catálogo do protótipo lê o DTO atualizado; ajustada descoberta da pasta da API para aceitar a estrutura atual e a estrutura backend/Projetos - 4. PDFs preservados.

## Filtro de hosts: fluxo verificado — 27/10/2026

Esta verificação substitui as pendências anteriores de binding e validação do filtro. GET /api/Host/HostFilter permanece autenticado (qualquer usuário logado), recebe HostFilterDTO por FromQuery e retorna List<HostResponseDTO> com 200, inclusive []. ArgumentException do service vira ProblemDetails 400. Sem autenticação/token inválido: 401. Name, Types, HasProgrammings, Take e Skip são aplicados; City preenchido retorna 400 por indisponibilidade, pois Address não possui cidade. Bairro permanece opcional e visual no endereço, fora do filtro. Paginação inválida e valores fora do enum são rejeitados no service.

Protótipo reconhece o DTO de query e envia tipos em parâmetros repetidos, booleano opcional com Todos e GET sem corpo. Exemplos adicionados ao arquivo Projetos - 4.http. Resultado: build aprovado; 62 verificações HTTP/EF/PostgreSQL reais em banco descartável e 58 testes simulados do protótipo aprovados. Banco temporário removido, banco principal preservado. Sem migration, commit ou PDFs. Detalhes: [relatório de verificação](validacoes/host-filter-fluxo-2026-10-27.md).
