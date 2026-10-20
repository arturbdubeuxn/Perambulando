# DTOs e contratos de dados

Perambulando | Atualização: 20/10/2026

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

Entrada de POST /api/Host/Create. Os campos originais não possuem atributos de validação explícita; os novos campos de número/complemento têm MaxLength, conforme indicado abaixo.

| Campo | Tipo C# | Padrão |
|---|---|---|
| typeofhost | Hosts.TypeofHost | 0 (Productor) |
| cnpj | string | Vazio |
| logoUrl | string | Vazio |
| instagranUrl | string | Vazio |
| address | string | Vazio |
| addressNumber | string | Vazio; MaxLength(20), opcional |
| addressComplement | string | Vazio; MaxLength(200), opcional |
| neighborhood | string? | Opcional; padrão vazio |
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
| addressNumber | string | MaxLength(20), opcional |
| addressComplement | string | MaxLength(200), opcional |
| neighborhood | string? | Opcional, MaxLength(150) |
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
| addressNumber, addressComplement | string |
| programmings | List<ProgrammingDetailsDTO> |

Programmings inicia como lista vazia. O app service preenche programações ativas do host, incluindo número/complemento de cada evento, mas não carrega Categories nesse mapeamento. O DTO interno possui Id como campo público, não como propriedade; ele não é serializado pela configuração JSON padrão atual, portanto a lista continua sem identificador JSON utilizável diretamente.

O DTO não contém UserId, canEdit ou canDelete. Autenticação para consulta não significa propriedade para mutação.

## 10. ProgrammingCreateDTO

Entrada de POST /api/Programming/{HostId}/Create. HostId vem da rota e dono vem do JWT.

| Campo | Tipo C# | Validação no DTO |
|---|---|---|
| name, description | string | Required |
| startDate, endDate | DateTime | Required, mas não anuláveis |
| isFree | bool | Required, mas não anulável |
| address, cep | string | Required |
| neighborhood | string? | Opcional |
| addressNumber | string | MaxLength(20), opcional; padrão vazio |
| addressComplement | string | MaxLength(200), opcional; padrão vazio |
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
| address, cep | string | Required |
| neighborhood | string? | Opcional |
| addressNumber | string | MaxLength(20), opcional; padrão vazio |
| addressComplement | string | MaxLength(200), opcional; padrão vazio |
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
| addressNumber, addressComplement | string |
| imageUrl, ticketUrl, instagranUrl | string |
| hostName, hostLogoUrl | string |
| createdDate, updateDate | DateTime |
| minPrice, maxPrice | float |
| categories | List<Category>? |

Não tem propriedade Id serializável, HostId, IsActive ou SourceUrl. Existe um campo público Id, que não entra no JSON pela configuração padrão. No endpoint público, Categories é carregada via GetAllCategoriesbyProgrammingId. No perfil do host, a propriedade não é preenchida e fica null. Cada Category tem id, name e isActive; não é um DTO reduzido próprio.

Nos quatro DTOs de entrada de host/programação, número e complemento são opcionais e strings; número aceita valores alfanuméricos ou s/n. Os nomes públicos corretos são addressNumber e addressComplement. Os nomes anteriores AdrressNumber/AdrressComplement não têm aliases. Nas edições PUT, enviar novamente os valores a preservar; omissão usa string vazia e limpa o valor anterior.

## 13. Respostas sem DTO próprio

Hosts e Programming agora possuem Location (Point anulável) para persistência, com JsonIgnore. Ela não é recebida nos DTOs nem aparece nas respostas que serializam entidades. A exposição de latitude/longitude para mapas será uma etapa futura; os contratos atuais deste documento permanecem iguais.

- Login retorna objeto anônimo de autenticação: accessToken, tokenType e expiresAt.
- Edit de usuário retorna envelope anônimo com user e auth.
- Create de host retorna envelope anônimo com host (HostCreatedDTO) e auth.
- Listagem de hosts e edit de host retornam entidades Hosts.
- Create/edit de programação retornam entidade Programming.
- Listagem de categorias retorna entidades Category.
- Erros do controller usam ProblemDetails/ValidationProblemDetails, além dos status do middleware.

Não há classes DTO específicas para esses envelopes. Mudar uma entidade pode mudar respostas HTTP que a retornam diretamente; revisar esse impacto antes de alterar o model.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

Não foram criados DTOs HTTP novos. O backend calcula a localização com Address, AddressNumber, Neighborhood e CEP dos DTOs atuais; número e bairro permanecem opcionais. Complemento não participa da busca. DTOs de entrada não recebem latitude/longitude e DTOs de detalhes ainda não as expõem. O record interno GeocodingAddress transporta os quatro componentes para IGeocodingService; não é contrato de endpoint.

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


## UserXCategoryDTO e contratos de interesses — 20/10/2026

| Campo interno | Tipo | Origem |
|---|---|---|
| UserId | string | ID do JWT, atribuído pelo controller |
| CategoryIds | List<int> | Array JSON do corpo; padrão new List<int>() |

Esse DTO não é o corpo público do endpoint. POST AddCategoryToUser recebe List<int> diretamente: [1,2]. O catálogo do protótipo reconhece List<int>/int[] como corpo na raiz, inclusive a inferência de [ApiController], e mantém DTOs comuns como objetos. O UserXCategoryAppService retorna List<UserXCategory>; a action retorna apenas {message:...}.

GET GetUserProgrammingPreferences não recebe dados no corpo e devolve List<Programming> diretamente. Os registros têm id/hostId e campos da entidade; não se deve esperar o contrato enriquecido de ProgrammingDetailsDTO (categories, hostName etc.). Para abrir detalhes, usar o ID retornado no endpoint público já existente.

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


## Uso interno na edição de interesses — 20/10/2026

UserXCategoryDTO permanece com UserId e CategoryIds. EditCategoryToUserAsync interpreta CategoryIds como a seleção completa desejada, não apenas as inclusões: mantém em comum, inclui novos e remove ausentes. IDs repetidos na entrada são desconsiderados; lista vazia continua inválida. O AppService mapeia os vínculos e o service calcula as diferenças; retorno interno List<UserXCategory>. Ainda não há action HTTP para essa edição. Build e nove verificações simuladas aprovados; sem acesso ao banco e sem exportar PDFs.


## Retorno completo da edição de interesses — 20/10/2026

Estado atual: preservada a comparação de categorias em dois foreach no UserXCategoryService, com categoriesToAdd/categoriesTodelete e mapeamento para vínculos. A consulta usa CategoryService.GetAllCategoriesPrefereces, que delega a CategoryRepository.GetAllCategoriesbyUserId. Removida a consulta GetAllByUserIdAsync de UserXCategoryRepository e de sua interface.

As categorias recebidas são identificadas por newLinks.CategoryId, pois o AppService não preenche a navegação Category. O repository.EditAsync recebe userId e as listas de inclusão/exclusão. Para excluir, consulta os vínculos reais pelo usuário e pelos CategoryIds, evitando tentar remover objetos novos com Id zero. Mantidos foreach de inclusão e um único SaveChangesAsync quando há alterações. Após salvar (ou quando nada muda), consulta e retorna todos os UserXCategory desse usuário, ordenados por CategoryId e Id, incluindo vínculos mantidos e IDs gerados nas inclusões. O service repassa essa lista ao AppService. Duplicidades preexistentes mantidas também aparecem no retorno, que representa os registros reais.

Nenhuma action, DTO, rota ou formulário foi alterado; a edição continua interna, sem endpoint. Compilação GeoLocation concluída com zero erros e sete avisos CS8618 preexistentes. Nesta revisão não foram executados testes de integração ou gravações no banco; os testes simulados mencionados em seções anteriores correspondem às versões anteriores. Sem migrations e sem regenerar PDFs.


## Endpoint de edição de interesses — 20/10/2026

PUT /api/Category/EditCategoryToUser exige JWT, sem role HOST. O usuário vem exclusivamente do JWT. Corpo JSON: array de IDs, por exemplo [2,3]; é a seleção completa desejada. Mantém vínculos em comum, remove ausentes e inclui novos. Retorna 200 com todos os UserXCategory do usuário após salvar, ordenados por CategoryId/Id, incluindo IDs, UserId, CategoryId e datas. O retorno representa vínculos, não Category nem Programming.

Seleção vazia/nula ou ID <= 0 retorna 400; JSON inválido é tratado pelo ApiController. Token ausente/inválido/expirado ou usuário não identificado retorna 401. Categorias positivas inexistentes ainda falham pela FK sem resposta controlada específica; não foi implementada validação de status ativo ou saneamento de duplicidades anteriores. O repositório mantém a gravação conjunta das diferenças.

O .http inclui edição e conferência das categorias após editar. O protótipo oferece Editar categorias de interesse, botão Carregar interesses atuais, seleção de categorias ativas, envio do array completo e apresentação dos vínculos retornados com seus IDs. Preserva JWT e IDs de host/programação. A action foi adicionada para tornar o fluxo acessível; o inventário atual contém 19 actions.

Validação: build GeoLocation sem erros (sete avisos CS8618 preexistentes); node --check em app.js e catalog.mjs; 27 testes do protótipo com API simulada aprovados; 13 verificações temporárias de service/controller com repositórios simulados aprovadas. API iniciou em Staging com a conexão de desenvolvimento carregada no ambiente do processo, evitando MigrateAsync automático. PUT sem JWT retornou 401; GET público de categorias retornou 200 com 12 categorias. Catálogo e app.js servidos em 127.0.0.1:5173 conferidos com a nova rota. Nenhum PDF foi regenerado.


Validação adicional no PostgreSQL — 20/10/2026: oito verificações com Context, CategoryRepository e UserXCategoryRepository reais aprovadas dentro de transação revertida. Cobriram retorno completo com IDs gerados, preservação de vínculo/data, exclusão pelo ID real, deduplicação da entrada, isolamento entre usuários, seleção idêntica, rollback automático da gravação em falha de FK e remoção de todos os registros temporários pelo rollback final. Verificadas zero migrations pendentes; nenhuma migration aplicada. Não foram alterados registros existentes.
