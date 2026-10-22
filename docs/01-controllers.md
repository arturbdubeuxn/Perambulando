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

Corpo (`UserRegisterDTO`):

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
- O e-mail deve ser único. Atualmente `name` é salvo em `UserName`, sujeito à unicidade e às restrições de nome do Identity.
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

Retorna `200` com `id`, `name`, `email`, `typeofUser`, `isPro` e `createdAt`. Retorna `404` se o usuário não existir ou estiver inativo.

### PUT /api/User/Edit — Editar o próprio usuário

Exige JWT e identifica o usuário pelo token. Substitui nome, e-mail e tipo; não altera senha nem roles.

```json
{
  "name": "UsuarioAtualizado",
  "email": "usuario@example.com",
  "typeofUser": 1
}
```

Requisitos (`UserEditDTO`): `name` obrigatório, até 256 caracteres; `email` obrigatório, formato válido, até 256 caracteres; `typeofUser` obrigatório e pertencente ao enum. O nome e o e-mail são aparados no mapeamento e a alteração passa pelo Identity.

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

Corpo (`HostRegisterDTO`):

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

Retornos: `201` com `{"host":{"id":10,"name":"Minha empresa"},"auth":{"accessToken":"JWT","tokenType":"Bearer","expiresAt":"..."}}`; `401` para usuário ausente/inativo; `500` para as falhas tratadas de cadastro ou atribuição de role. Se a role falhar após a gravação, a resposta informa que o host já foi salvo.

### GET /api/Host/GetAllHostsbyUserId — Listar meus hosts

Exige JWT com role `ADMIN` ou `HOST`. Sem corpo ou parâmetros. Retorna apenas hosts ativos cujo `UserId` corresponde ao usuário do token.

Retorno: `200` com lista de entidades `Hosts`, inclusive `[]`. Contém os campos do host, como `id`, `userId`, `typeofhost`, dados institucionais, endereço, `isActive`, `createdAt` e `updatedAt`. A action retorna entidades, não um DTO específico para a listagem.

### GET /api/Host/Details/{hostId} — Consultar perfil da empresa

Exige JWT e `hostId` positivo. Sem corpo. Qualquer usuário autenticado pode consultar um host ativo; esta consulta não exige ser o dono.

Retornos: `200` com `HostDetailsDTO`; `400` para ID não positivo; `404` para host inexistente/inativo.

Campos: `id`, `name`, `description`, `typeofhost`, `cnpj`, `logoUrl`, `instagranUrl`, `address`, `addressNumber`, `addressComplement`, `neighborhood`, `cep`, `phone` e `programmings`.

`programmings` contém programações ativas ordenadas por início. Pode ser `[]`. O mapeamento atual usa `ProgrammingDetailsDTO`, mas não preenche suas categorias; também não inclui IDs das programações. A consulta não concede permissão para editar.

### PUT /api/Host/{hostId}/Edit — Editar estabelecimento

Exige JWT com role `ADMIN` ou `HOST`, `hostId` positivo e ser dono do host ativo. Recebe os mesmos nomes de campos do exemplo de cadastro, usando `HostEditDTO`. É edição completa dos campos editáveis.

| Campo | Requisito no edit |
|---|---|
| `typeofhost` | Obrigatório; enum válido |
| `name` | Obrigatório; máximo 150 caracteres |
| `description` | Obrigatório; máximo 2000 |
| `address` | Obrigatório; máximo 300 |
| `addressNumber` | Opcional; texto de até 20 caracteres, inclusive 175A ou s/n |
| `addressComplement` | Opcional; máximo 200 caracteres |
| `neighborhood` | Opcional; máximo 150 |
| `cep` | Obrigatório; máximo 9 |
| `cnpj` | Máximo 18 |
| `phone` | Máximo 30 |
| `logoUrl`, `instagranUrl` | Máximo 2048 cada |

Retornos: `200` com a entidade `Hosts` atualizada; `400` para validação; `404` se o host estiver indisponível para o usuário. Atualiza `UpdatedAt` em UTC.

### PATCH /api/Host/{hostId}/Delete — Desativar estabelecimento

Exige JWT com role `ADMIN` ou `HOST`, `hostId` positivo e ser dono do host ativo. Não recebe corpo.

Altera `IsActive` para `false` e atualiza `UpdatedAt`. Não remove o registro nem altera individualmente as programações; as consultas de programação deixam de apresentá-las por exigirem host ativo.

Retornos: `204`; `400` para ID não positivo; `404` para host inexistente, inativo ou de outro usuário. Uma repetição após desativar retorna `404`.

## ProgrammingController

### POST /api/Programming/{HostId}/Create — Cadastrar programação

Exige JWT com role `ADMIN` ou `HOST` e `HostId` positivo de um host ativo pertencente ao usuário do token.

Corpo (`ProgrammingCreateDTO`):

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

- `name`, `description`, `address` e `cep` são obrigatórios pelo DTO.
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

Campos do retorno: `name`, `description`, `startDate`, `endDate`, `isFree`, `address`, `addressNumber`, `addressComplement`, `neighborhood`, `cep`, `imageUrl`, `ticketUrl`, `instagranUrl`, `hostName`, `hostLogoUrl`, `createdDate`, `updateDate`, `minPrice`, `maxPrice` e `categories`.

`categories` é uma lista das categorias vinculadas, com `id`, `name` e `isActive`. A consulta de vínculos não filtra categorias inativas. O DTO atual não inclui `id` da programação nem `hostId`.

### PUT /api/Programming/{hostId}/Edit/{Programmingid} — Editar programação e categorias

Exige JWT com role `ADMIN` ou `HOST`, IDs positivos, host ativo do usuário e programação ativa pertencente ao host.

Recebe os mesmos campos do exemplo de create, usando `ProgrammingEditDTO`. É uma substituição completa dos campos editáveis, inclusive da seleção de categorias.

Número e complemento também são substituídos no PUT. Se omitidos, assumem string vazia e limpam o valor anterior; reenviar os valores atuais quando quiser preservá-los. Ambos continuam opcionais, com limites de 20 e 200 caracteres. O mesmo comportamento vale para o PUT de host.

- Obrigatórios: `name`, `description`, `startDate`, `endDate`, `isFree`, `address`, `cep`, `minPrice`, `maxPrice` e `categoryIds`.
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

Retorno: `200` com lista de objetos contendo `id`, `name` e `isActive`, inclusive `[]`. Use os IDs retornados em `categoryIds` ao criar ou editar programações.

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

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

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
| POST /api/Category/AddCategoryToUser | JWT de qualquer usuário autenticado | Array JSON direto, por exemplo [1, 2] | 200 com {"message":"Categorias adicionadas com sucesso."} |
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

HostController.Create passa a retornar 201 com somente as propriedades result (retorno de _hostAppService.Create) e auth (JWT). O result foi declarado antes do try para poder ser usado no retorno. O .http usa createHost.response.body.$.result.id, e o protótipo lê result para reaproveitar o host; auth.accessToken permanece igual. Nenhuma migration gerada ou aplicada nesta alteração. O retorno de result representa a entidade Hosts completa, inclusive suas navegações serializáveis.


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