# DTOs e contratos de dados

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


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

Retornado dentro de `result` após cadastro, com id, addressId e name. O envelope completo também contém `auth`, que é um objeto de autenticação, não uma propriedade deste DTO.

| Campo | Tipo C# |
|---|---|
| id | int |
| addressId | int |
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
- Create de host retorna envelope anônimo com result (HostCreatedDTO: id, addressId, name) e auth.
- Listagem de hosts e edit de host retornam HostResponseDTO com AddressDetailsDTO aninhado.
- Create/edit de programação retornam ProgrammingResponseDTO, com AddressDetailsDTO e sem navegação Host.
- Listagem de categorias retorna CategoryResponseDTO (id, name e isActive).
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

## Respostas de host com DTOs — 22/10/2026

Esta seção substitui as descrições anteriores de retorno de entidades Hosts.

- Cadastro: HTTP 201 com `{ result, auth }`; `result` é HostCreatedDTO e contém somente `id`, `addressId` e `name`. `auth` mantém `accessToken`, `tokenType` e `expiresAt`.
- Edição: HTTP 200 com HostResponseDTO. Listagem: HTTP 200 com uma lista desse DTO, inclusive `[]`.
- HostResponseDTO permite `id`, `typeofhost`, `cnpj`, `logoUrl`, `instagranUrl`, `phone`, `name`, `description`, `addressId`, `address`, `isActive`, `createdAt` e `updatedAt`.
- `address` usa AddressDetailsDTO: `id`, `street`, `number`, `complement`, `neighborhood` e `cep`.
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


## Separação de validações de programação — 23/10/2026

`ProgrammingCreateValidation` e `ProgrammingEditValidation` continuam implementando `IValidation<T>` e verificam as anotações dos DTOs e a presença da lista de categorias antes de seu mapeamento. As regras compartilhadas entre cadastro e edição são aplicadas sobre a entidade por `ProgrammingValidations`, no domínio. Os DTOs permanecem com anotações e sem métodos próprios. Uma lista vazia chega ao domínio e é rejeitada para programação; as preferências opcionais de UserXCategory não mudaram.

Rotas, tipos dos campos e DTOs de resposta não mudaram. Os tipos não anuláveis atuais de bool, float e DateTime continuam sem distinguir ausência do campo no JSON de valor padrão; essa revisão de contrato não faz parte desta alteração.

Validação realizada: 77 verificações aprovadas no conjunto ProgrammingDomainValidation, incluindo AppService, validadores de entrada, serviço de domínio e DI reais, com persistência simulada. Sem teste de model binding HTTP nesta etapa.
