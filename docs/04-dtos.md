# DTOs e contratos de dados

Perambulando | Atualização: 18/10/2026

Base: as 11 classes em `Application/DTO`, seus mapeamentos nos app services e uso nos controllers. Nomes nas tabelas seguem o JSON usual em camelCase. O código C# mantém a grafia original das propriedades.

## 1. Convenções de validação

`[Required]` em string impede ausência/null e texto vazio na validação padrão do MVC. Em um tipo valor não anulável, como bool ou float, o valor padrão já existe quando o JSON omite o campo: o atributo sozinho não identifica essa omissão.

Os tipos anuláveis com Required no edit permitem identificar ausência. `[ApiController]` responde 400 para ModelState inválido antes de executar a action. Regras entre campos de programação, como faixa de preço e ordem de datas, são verificadas no controller.

URLs opcionais iniciam vazias nos DTOs de entrada. Não há atributo Url nesses campos. Limite de tamanho de string não valida conteúdo, CNPJ, CEP ou existência do endereço.

## 2. UserRegisterDTO

Entrada de POST /api/User/auth/Register. Também é reutilizado pelo DELETE /api/User, que utiliza apenas o e-mail na busca e valida o dono pelo token.

| Campo JSON | Tipo C# | Validação explícita no DTO |
|---|---|---|
| name | string | Nenhum atributo; padrão vazio |
| email | string | Nenhum atributo; padrão vazio |
| password | string | Nenhum atributo; padrão vazio |
| typeofUser | enum TypeOfUser | Nenhum atributo; padrão 0 |

Enum declarado dentro do DTO: Local = 0; Turist = 1. No cadastro, o app service converte para o enum de User, usa name como UserName e encaminha a senha ao Identity. O Identity valida conta/senha e exige e-mail único pela configuração da aplicação. O enum do cadastro não tem validação EnumDataType.

## 3. UserLoginDTO

Entrada de POST /api/User/auth/Login.

| Campo | Tipo C# | Validação |
|---|---|---|
| email | string | Required, EmailAddress |
| password | string | Required |

Não contém userId, roles ou hostId. Essas informações não são fornecidas pelo cliente como prova de identidade.

## 4. UserEditDTO

Entrada de PUT /api/User/Edit. O usuário-alvo vem do JWT.

| Campo | Tipo C# | Validação |
|---|---|---|
| name | string | Required, MaxLength(256) |
| email | string | Required, EmailAddress, MaxLength(256) |
| typeofUser | User.TypeofUser? | Required, EnumDataType |

Nome/e-mail passam por Trim no app service. A conversão do enum usa Value após validação. O contrato não edita senha, isPro, IsActive nem roles.

## 5. UserProfileDTO

Saída de GET /api/User/Profile e campo `user` na resposta de edição.

| Campo | Tipo C# | Origem |
|---|---|---|
| id | string | User.Id |
| name | string | User.UserName ou vazio |
| email | string | User.Email ou vazio |
| typeofUser | User.TypeofUser | User.Typeofuser |
| isPro | bool | User.isPro |
| createdAt | DateTime | User.CreatedAt |

Não expõe PasswordHash. Os tipos enum são numéricos na configuração JSON atual.

## 6. HostRegisterDTO

Entrada de POST /api/Host/Create. Todos os campos abaixo estão sem atributos de validação explícita no DTO de cadastro.

| Campo | Tipo C# | Padrão |
|---|---|---|
| typeofhost | Hosts.TypeofHost | 0 (Productor) |
| cnpj | string | Vazio |
| logoUrl | string | Vazio |
| instagranUrl | string | Vazio |
| address | string | Vazio |
| neighborhood | string | Vazio |
| cep | string | Vazio |
| phone | string | Vazio |
| name | string | Vazio |
| description | string | Vazio |

Tipos de host: Productor = 0; Gastronomy = 1; Business = 2. O DTO não recebe UserId; o serviço o preenche pelo usuário autenticado. As restrições de coluna no EF continuam existindo e podem causar falhas de gravação se forem excedidas, mesmo sem validação antecipada no DTO.

## 7. HostEditDTO

Entrada de PUT /api/Host/{hostId}/Edit. Mesmo conjunto de campos do cadastro, com validação mais restritiva.

| Campo | Tipo C# | Validação |
|---|---|---|
| typeofhost | Hosts.TypeofHost? | Required, EnumDataType |
| name | string | Required, MaxLength(150) |
| description | string | Required, MaxLength(2000) |
| address | string | Required, MaxLength(300) |
| neighborhood | string | Required, MaxLength(150) |
| cep | string | Required, MaxLength(9) |
| cnpj | string | MaxLength(18) |
| phone | string | MaxLength(30) |
| logoUrl | string | MaxLength(2048) |
| instagranUrl | string | MaxLength(2048) |

Não contém o dono nem flags de atividade. O serviço atualiza a entidade existente do dono, preservando esses dados.

## 8. HostCreatedDTO

Retornado dentro de `host` após cadastro. O envelope completo também contém `auth`, que é um objeto de autenticação, não uma propriedade deste DTO.

| Campo | Tipo C# |
|---|---|
| id | int |
| name | string |

## 9. HostDetailsDTO

Saída de GET /api/Host/Details/{hostId}, que exige login.

| Campo | Tipo C# |
|---|---|
| id | int |
| name, description | string |
| typeofhost | Hosts.TypeofHost |
| cnpj, logoUrl, instagranUrl | string |
| address, neighborhood, cep, phone | string |
| programmings | List<ProgrammingDetailsDTO> |

Programmings inicia como lista vazia. O app service preenche programações ativas do host, mas não carrega Categories nesse mapeamento. O DTO interno de programação não possui Id, portanto a lista não fornece um identificador para abrir/editar cada item diretamente.

O DTO não contém UserId, canEdit ou canDelete. Autenticação para consulta não significa propriedade para mutação.

## 10. ProgrammingCreateDTO

Entrada de POST /api/Programming/{HostId}/Create. HostId vem da rota e dono vem do JWT.

| Campo | Tipo C# | Validação no DTO |
|---|---|---|
| name, description | string | Required |
| startDate, endDate | DateTime | Required, mas não anuláveis |
| isFree | bool | Required, mas não anulável |
| address, neighborhood, cep | string | Required |
| imageUrl, ticketUrl, instagranUrl | string | Sem atributos; padrão vazio |
| minPrice, maxPrice | float | Required, mas não anuláveis |
| categoryIds | List<int> | Required; inicializada vazia |

O controller exige categoria não vazia e IDs positivos, valida início futuro e anterior ao término e a faixa de preços/gratuidade. Não rejeita categorias repetidas no create. Categoria inexistente é tratada por FK. A seleção não verifica status ativo no save.

Omissões de IsFree e preços assumem false/zero; Required não força envio explícito. A lista vazia é rejeitada no controller, não pelo Required da coleção. Para horários, envie ISO 8601 em UTC com Z.

## 11. ProgrammingEditDTO

Entrada de PUT /api/Programming/{hostId}/Edit/{Programmingid}. Todos os dados editáveis devem ser reenviados.

| Campo | Tipo C# | Validação no DTO |
|---|---|---|
| name, description | string | Required |
| startDate, endDate | DateTime? | Required |
| isFree | bool? | Required |
| address, neighborhood, cep | string | Required |
| imageUrl, ticketUrl, instagranUrl | string | Sem atributos; padrão vazio |
| minPrice, maxPrice | float? | Required |
| categoryIds | List<int> | Required, MinLength(1) |

O controller valida UTC, ordem das datas, preços finitos/não negativos/ordenados e zero se gratuita. A lista deve ter IDs positivos sem repetição. Não há validação de início futuro nesse edit. O app service monta os vínculos e o serviço calcula inclusões/remoções comparando com as categorias atuais.

## 12. ProgrammingDetailsDTO

Saída da consulta pública de programação e tipo reutilizado na lista de programações do perfil do host.

| Campo | Tipo C# |
|---|---|
| name, description | string |
| startDate, endDate | DateTime |
| isFree | bool |
| address, neighborhood, cep | string |
| imageUrl, ticketUrl, instagranUrl | string |
| hostName, hostLogoUrl | string |
| createdDate, updateDate | DateTime |
| minPrice, maxPrice | float |
| categories | List<Category>? |

Não tem Id, HostId, IsActive ou SourceUrl. No endpoint público, Categories é carregada via GetAllCategoriesbyProgrammingId. No perfil do host, a propriedade não é preenchida e fica null. Cada Category tem id, name e isActive; não é um DTO reduzido próprio.

## 13. Respostas sem DTO próprio

- Login retorna objeto anônimo de autenticação: accessToken, tokenType e expiresAt.
- Edit de usuário retorna envelope anônimo com user e auth.
- Create de host retorna envelope anônimo com host (HostCreatedDTO) e auth.
- Listagem de hosts e edit de host retornam entidades Hosts.
- Create/edit de programação retornam entidade Programming.
- Listagem de categorias retorna entidades Category.
- Erros do controller usam ProblemDetails/ValidationProblemDetails, além dos status do middleware.

Não há classes DTO específicas para esses envelopes. Mudar uma entidade pode mudar respostas HTTP que a retornam diretamente; revisar esse impacto antes de alterar o model.
