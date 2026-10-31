# DTOs e contratos de dados

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 20/10/2026

Base: as 11 classes em `Application/DTO`, seus mapeamentos nos app services e uso nos controllers. Nomes nas tabelas seguem o JSON usual em camelCase. O código C# mantém a grafia original das propriedades.

## 1. Convenções de validação

`[Required]` em string impede ausência/null e texto vazio na validação padrão do MVC. Em um tipo valor não anulável, como bool ou float, o valor padrão já existe quando o JSON omite o campo: o atributo sozinho não identifica essa omissão.

Os tipos anuláveis com Required no edit permitem identificar ausência. `[ApiController]` responde 400 para ModelState inválido antes de executar a action. Regras entre campos de programação, como faixa de preço e ordem de datas, são verificadas no controller.

URLs opcionais iniciam vazias nos DTOs de entrada. Não há atributo Url nesses campos. Limite de tamanho de string não valida conteúdo, CNPJ, CEP ou existência do endereço.

## 2. UserDTO — cadastro e edição (26/10/2026)

DTO compartilhado de POST /api/User/auth/Register e PUT /api/User/Edit. Substitui UserRegisterDTO e UserEditDTO. Login, exclusão e perfil mantêm seus DTOs próprios.

| Campo JSON | Tipo C# | Regra |
|---|---|---|
| name | string | Required, MaxLength(256) |
| email | string | Required, EmailAddress, MaxLength(256) |
| password | string? | Opcional no DTO compartilhado; obrigatório somente no cadastro |
| typeofUser | User.TypeofUser? | Required, EnumDataType; 0=Local, 1=Turist |

O tipo de usuário agora deve ser enviado explicitamente no cadastro e na edição. O enum próprio que existia no DTO de cadastro foi removido; ambos utilizam o enum da entidade User.

UserValidation : IValidation<UserDTO> verifica as anotações comuns e protege contra argumento nulo. UserAppService recebe um único validador para as duas operações. A obrigatoriedade específica de senha no cadastro é tratada em UserService.Create: ausência/vazio/espaços retorna IdentityResult com erro PasswordRequired, antes de criar a conta. Política de força da senha e unicidade permanecem no Identity. Não há campo que indique operação, autoria ou permissão enviado pelo cliente.

## 3. UserLoginDTO

Entrada de POST /api/User/auth/Login.

| Campo | Tipo C# | Validação |
|---|---|---|
| email | string | Required, EmailAddress |
| password | string | Required |

Não contém userId, roles ou hostId. Essas informações não são fornecidas pelo cliente como prova de identidade.

## 4. Edição com UserDTO

PUT /api/User/Edit utiliza UserDTO e continua editando somente nome, e-mail e tipo do usuário identificado pelo JWT. Nome/e-mail passam por Trim como antes; a conversão do enum usa Value após validação. Password pode ser omitido; mesmo se enviado, não altera a senha, pois não é mapeado na edição. O endpoint não altera isPro, IsActive ou roles e continua retornando perfil e JWT atualizado após sucesso.

O protótipo mantém senha no cadastro (marcada obrigatória) e a retira do formulário de edição, mesmo que o catálogo leia a propriedade do DTO compartilhado. UserProfileDTO e respostas não expõem senha/hash.

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

## 6. HostDTO — cadastro e edição (26/10/2026)

Entrada compartilhada de POST /api/Host/Create e PUT /api/Host/{hostId}/Edit. Substitui HostRegisterDTO e HostEditDTO.

| Campo | Tipo C# | Regra |
|---|---|---|
| typeofhost | TypeofHost? | Required e EnumDataType; obrigatório em ambas as operações |
| cnpj | string | Required, MaxLength(18), formato numérico/alfanumérico com ou sem máscara |
| logoUrl, instagranUrl | string | MaxLength(2048); padrão vazio |
| addressId | int? | Range(1, int.MaxValue), se informado |
| address | AddressCreateDTO? | Novo endereço, alternativa a addressId |
| phone | string | MaxLength(30); padrão vazio |
| name | string | Required, MaxLength(150) |
| description | string | Required, MaxLength(2000) |

Typeofhost é anulável para distinguir ausência de zero. Omitir ou enviar null falha na validação; valores válidos são 0=Productor, 1=Gastronomy e 2=Business. Valores fora do enum também falham. Isso torna o tipo explicitamente obrigatório no cadastro, como já era na edição.

HostValidation implementa IValidation<HostDTO> e aplica somente a regra de escolher exatamente um entre addressId e address. Required, EnumDataType, tamanhos, formatos e valores positivos são responsabilidades das anotações do DTO na entrada HTTP. O AppService valida antes do mapeamento e usa Typeofhost.Value na criação e edição. As verificações de CNPJ no domínio permanecem no fluxo existente.

## 7. Edição com HostDTO

O PUT continua exigindo os campos editáveis completos e o hostId da rota. Usuário vem do JWT; o DTO não permite informar autoria. DTOs de resposta permanecem próprios. A diferença anterior de anulabilidade entre cadastro/edição foi eliminada por solicitação do usuário.

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

## 10. ProgrammingDTO — criação e edição (26/10/2026)

Entrada compartilhada de POST /api/Programming/{HostId}/Create e PUT /api/Programming/{hostId}/Edit/{Programmingid}. HostId e ID de edição vêm da rota; o usuário vem do JWT. Os antigos ProgrammingCreateDTO e ProgrammingEditDTO foram removidos, pois tinham os mesmos tipos, valores iniciais e validações. A ordem de declaração dos campos era a única diferença de estrutura relevante para leitura.

| Campo | Tipo C# | Regra atual |
|---|---|---|
| name, description | string | Required; padrão vazio |
| startDate, endDate | DateTime | Required, não anuláveis |
| isFree | bool | Required, não anulável |
| addressId | int? | Opcional; Range(1, int.MaxValue) |
| address | AddressCreateDTO? | Endereço novo; alternativa a AddressId |
| imageUrl, ticketUrl, instagranUrl | string | Padrão vazio |
| minPrice, maxPrice | float | Required e Range(0, float.MaxValue), não anuláveis |
| categoryIds | List<int> | Inicializada vazia; não possui Required ou MinLength |

ProgrammingValidation implementa IValidation<ProgrammingDTO>, valida as anotações e rejeita categoryIds nulo antes do mapeamento. ProgrammingValidations, no Domain, mantém as regras comuns de endereço, início futuro, UTC, ordem das datas, faixa/gratuidade de preços e categorias positivas, não vazias e sem repetição. Não houve mudança das regras nesta unificação.

Os tipos bool, float e DateTime continuam não anuláveis: Required não distingue ausência no JSON de valor padrão. Os DTOs de resposta não foram unificados com este DTO de entrada.

## 11. Edição com ProgrammingDTO

A edição utiliza o mesmo DTO da seção anterior e continua sendo substituição completa dos campos editáveis. Reenvie os valores a preservar e a lista final de categorias; o serviço calcula os vínculos a adicionar/remover. Nenhuma propriedade foi incluída ou removida do corpo JSON.

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


## Consulta ViaCEP — 24/10/2026
Implementado GET /api/Address/GetByCEP?cep=50030-220, com JWT obrigatório. Fluxo: AddressController -> AddressAppService -> AddressService -> IPostalCodeService/ViaCepService. Formato validado no serviço; aceita oito dígitos ou hífen após o quinto dígito. Retorno PostalAddressDTO: cep, street, neighborhood, city, state. Sem número ou complemento do imóvel.
Respostas: 200 encontrado, 400 formato inválido, 401 sem autenticação, 404 quando o ViaCEP confirma ausência e 503 por timeout, HTTP malsucedido ou resposta inválida. Timeout de oito segundos; cancelamento da requisição propagado. Consulta não grava no banco nem aciona a Geoapify. O formulário permite preencher manualmente se a consulta falhar e mantém número/complemento.
Escopo desta etapa: preenchimento assistido nos quatro formulários de criar/editar host/programação. Cidade e UF são exibidos na consulta, ainda não persistidos em Address nem enviados à geocodificação. A inclusão dessas colunas e seu uso pela Geoapify continuam pendentes de etapa própria, com revisão da migration. PostalAddress é um resultado de consulta, não uma entidade mapeada no EF. Não há migration nesta entrega.
Validações executadas: build sem erros (sete avisos CS8618 existentes), node --check, 44 testes do protótipo com API simulada e dez verificações do adaptador C# com HttpMessageHandler simulado (sucesso, ausência, resposta inválida, HTTP 429/500, falha de rede e timeout). Nenhum cadastro real foi criado nos testes. PDFs não regenerados.


## Consulta e validação de CNPJ — 25/10/2026
Integração Minha Receita nas camadas existentes: HostController -> HostAppService -> HostService -> ICompanyRegistrationService/MinhaReceitaService. ICnpjValidations/CnpjValidations normalizam e validam formato e dígitos verificadores numéricos e alfanuméricos, sem converter o identificador em número. Os DTOs de cadastro/edição exigem CNPJ e formato compatível. Nenhuma pasta nova de produção foi criada.
GET /api/Host/GetByCNPJ?cnpj=33683111000280 exige JWT e retorna CompanyRegistrationDTO: cnpj, legalName, tradeName, registrationStatus, statusDescription, checkedAt (UTC da consulta), street, number, complement, neighborhood, cep, city e state. Nenhum dado de sócios é devolvido. Consulta bem-sucedida retorna 200 inclusive para situação não ativa; o formulário informa a situação. Falhas: 400 formato/DV inválido, 404 não localizado na base consultada, 503 indisponibilidade, limite, timeout ou resposta inválida. CheckedAt não representa atualização da base oficial nem é persistido.
Criar host e alterar CNPJ exigem consulta com situacao_cadastral=2 antes de geocodificar ou salvar. Cadastro duplicado retorna 409; empresa não ativa retorna 422. Edição sem mudança do CNPJ normalizado dispensa nova consulta externa, mas valida formato/DV e duplicidade. O próprio host é excluído da busca de duplicados. Hosts inativos continuam reservando o CNPJ. Não há validação externa na desativação. Falhas da consulta não salvam o host. Registros legados não foram corrigidos ou excluídos automaticamente.
O repositório repete a verificação de duplicidade dentro da transação, sob pg_advisory_xact_lock(721904, 1), utilizado no cadastro e alteração do CNPJ. Isso serializa essas gravações entre instâncias desta API. Não existe índice único novo: gravações externas que ignorem o lock não são protegidas. Uma restrição única no banco exige auditoria/normalização dos registros legados e revisão de migration; permanece melhoria pendente. A transação existente de cadastro com role HOST foi preservada.
Protótipo: consulta automática após 500 ms ao completar o CNPJ. Resultados de consultas antigas são ignorados. Nome e endereço são sugestões aplicadas somente por botões de confirmação; não sobrescrevem o formulário automaticamente. Cidade/UF são exibidas mas seguem fora da persistência de Address. A consulta não comprova representação da empresa pelo usuário. Minha Receita é uma base secundária e pode estar desatualizada; ausência não comprova inexistência definitiva.
Validação: build sem erros (sete avisos CS8618 preexistentes), node --check, 50 testes do protótipo com API simulada e 30 verificações C# com dependências simuladas (DV, normalização, respostas inválidas, ausência, timeout, cancelamento, regras de criação/edição, situação ativa, duplicidade e propriedade). Consulta real somente de leitura pelo adaptador C# confirmou resposta válida e ativa para o exemplo público do provedor. A suíte não executou cadastros reais nem teste concorrente contra PostgreSQL. NuGet não conseguiu consultar a base de vulnerabilidades (NU1900) na execução do harness; isso não impediu a compilação/testes. PDFs não regenerados. Nenhuma migration criada por esta integração.
Fontes: https://docs.minhareceita.org/como-usar/ ; https://docs.minhareceita.org/sobre-os-dados/ ; https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf


## FavoriteResponseDTO — 26/10/2026

Resposta explícita de favoritar, listar e desfavoritar, mapeada no FavoriteAppService. Evita serializar as entidades/navegações User e Programming.

| Propriedade | Tipo | Finalidade |
|---|---|---|
| Id | int | ID do vínculo Favorite |
| UserId | string | Usuário proprietário do vínculo, obtido do JWT |
| ProgrammingId | int | ID da programação para consultar os detalhes públicos |
| IsActive | bool | Situação do favorito |
| CreatedAt / UpdatedAt | DateTime UTC | Criação e última alteração do vínculo |
| ProgrammingName / ImageUrl | string | Resumo da programação |
| StartDate / EndDate | DateTime | Datas da programação |
| HostId / HostName | int / string | Identificação do host |

Os endpoints novos não possuem corpo de entrada: POST/PATCH recebem programmingId na rota; GET usa somente o JWT. Validação de ID positivo é responsabilidade do serviço. Não há DTO de criação com UserId enviado pelo cliente. O front abre os detalhes usando ProgrammingId, e não Id. Migration pendente; testes de integração com o banco não executados.


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

Verificação complementar: 14 verificações de HostDTO/AppService aprovadas com serviço simulado, cobrindo ausência/null/enum inválido antes do serviço e os três tipos válidos na criação e edição. Sem HTTP ou banco real.


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


## Conversão de ProgrammingDTO centralizada — 26/10/2026

Criada a classe estática ProgrammingMapping em Application/AppServices, na pasta já existente. ToModel(ProgrammingDTO dto) contém a conversão explícita dos campos de entrada para Programming, incluindo o endereço novo e a conversão de complemento/bairro nulos para string vazia. AddressId omitido continua sendo zero no modelo; endereço selecionado por ID continua sem navegação preenchida nessa etapa.

CreateProgrammingAsync e EditProgrammingAsync validam o DTO antes de chamar ProgrammingMapping.ToModel(dto). O AppService atribui HostId da rota e, na edição, Id da rota. Esses identificadores não são preenchidos a partir de atributos enviados no DTO. Os vínculos de categorias continuam sendo montados no AppService, com referência à mesma entidade produzida pelo mapper. Mapeamentos de respostas, autorização e persistência do serviço foram preservados.

Novos atributos editáveis devem ser adicionados ao DTO/modelo e ao ToModel, centralizando a conversão comum. Caso o serviço copie propriedades para uma entidade existente, a lógica de atualização também pode precisar incluir o novo atributo; a conversão centralizada não faz cópia automática de todas as propriedades nem substitui regras de negócio.

Validação: build MappingCheck aprovado, zero erros e sete avisos CS8618 preexistentes; comparação dos dois fluxos e contratos do catálogo conferida; node --check e 52 testes existentes do protótipo com API simulada aprovados. Não houve teste de persistência ou CRUD real nesta refatoração. Nenhuma nova pasta, mudança de rota/DTO JSON, registro de DI, migration, reinício da API ou exportação de PDFs.


## Conversão de Programming para resposta encapsulada — 26/10/2026

ProgrammingMapping, na pasta Application/Mapping/Programming organizada pelo usuário (namespace Application.Mapping), agora contém ToDTO(Programming programming), retornando ProgrammingResponseDTO com os mesmos campos e AddressDetailsDTO que antes eram montados no AppService. ToModel foi preservado como método de instância. O mapper é registrado como Scoped e recebido pelo construtor de ProgrammingAppService; o using foi ajustado ao namespace existente.

Cadastro, edição e retorno interno de desativação chamam _programmingMapping.ToDTO(result). As listagens por host e por interesses usam Select(_programmingMapping.ToDTO).ToList(). A consulta que retorna ProgrammingDetailsDTO mantém seu mapeamento próprio, incluindo host e categorias. Os retornos null existentes foram preservados antes da conversão.

Address deve estar carregado no modelo, como já era exigido pelos blocos anteriores; as consultas do repositório incluem a navegação usada nas listagens. O mapper não consulta banco nem resolve geocodificação. Sem mudança de campos, autorização, rotas ou verbos; o PATCH de desativação continua respondendo HTTP 204 na controller.

Validação: build MappingCheck aprovado, zero erros e sete avisos CS8618 preexistentes; revisão dos cinco usos do mapper e dos campos de resposta; node --check e 52 testes existentes do protótipo com API simulada aprovados. Não houve CRUD real ou teste de persistência nesta refatoração. Nenhuma migration, pasta nova, reinício da API ou exportação de PDFs.


## Interface do mapper de programação — 26/10/2026

A interface existente Application/Mapping/Interfaces/IProgrammingMapping agora declara Programming ToModel(ProgrammingDTO dto) e ProgrammingResponseDTO ToDTO(Programming programming). ProgrammingMapping implementa essa interface; ProgrammingAppService depende de IProgrammingMapping no campo e no construtor. A DI registra AddScoped<IProgrammingMapping, ProgrammingMapping>(), substituindo o registro apenas da classe concreta.

Lógica de conversão, regras, rotas, DTOs JSON, autorização e respostas preservados. O protótipo e os exemplos HTTP continuam compatíveis; nenhuma alteração de formulário necessária. Build MappingCheck aprovado: zero erros e sete avisos CS8618 preexistentes. Verificação desta etapa limitada à compilação/revisão das referências; não foram repetidos testes de interface, CRUD real ou acesso ao banco. Sem migration, reinício de API ou exportação de PDFs.


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


## Criação dos vínculos de programação encapsulada — 26/10/2026

IProgrammingXCategoryAppService agora declara List<ProgrammingXCategory> CreateProgrammingLinks(Programming programming, List<int> categoriesIds). O retorno foi corrigido em relação à declaração incompleta que usava Task<ProgrammingXCategoryResponseDTO>: essa operação é síncrona, monta modelos em memória e não devolve um DTO de vínculo salvo.

ProgrammingXCategoryAppService implementa o método, protege argumentos nulos e percorre a lista chamando IProgrammingXCategoryMapping.ToModel(categoryId, programming) para cada item. Todos os vínculos referenciam a mesma instância de Programming recebida; a ordem e possíveis repetições da entrada são preservadas para a validação já existente no domínio. O método não consulta nem salva vínculos individualmente. CreateProgrammingXCategoryAsync, que já existia para outro fluxo de gravação, permanece separado.

ProgrammingAppService chama o método no cadastro e na edição após validar/mapear o DTO e atribuir os IDs da rota. Foram removidos a declaração duplicada de links e os foreach antigos que ainda referenciavam um campo de mapper retirado pelo usuário. A dependência IProgrammingXCategoryAppService e seu registro de DI já existiam e foram reaproveitados.

Os vínculos seguem para CreateProgrammingAsync/EditProgrammingAsync do domínio, preservando as verificações de categorias/propriedade e a gravação conjunta pelo repositório existente. Nenhuma nova action, pasta, rota ou alteração de corpo JSON/retorno foi criada. Protótipo e exemplos HTTP permanecem compatíveis.

Validação: build MappingCheck aprovado, zero erros e sete avisos CS8618 preexistentes; comparação de 41 cenários de entradas/respostas com a baseline dos AppServices aprovada, incluindo criação/edição e identidade da entidade referenciada nos vínculos; resolução de DI aprovada com serviços simulados. node --check e 52 testes do protótipo com API simulada aprovados. Sem banco, persistência/concorrência real, reinício da API, migration ou atualização de PDFs.


## R03 — unicidade dos vínculos de categorias (26/10/2026)

Nenhum DTO ou corpo JSON foi alterado. O POST repetido de interesses devolve os IDs solicitados sem duplicá-los e não inclui interesses fora da requisição. A seleção observada é um parâmetro interno entre serviço e repositório, não um campo enviado pelo cliente. Conflitos passam a ser ProblemDetails 409 nas actions existentes.

Validação: build sem erros; 13 verificações locais de modelo/snapshots/409, 41 cenários de mapeamento e 52 testes do protótipo com dependências simuladas aprovados. Sem teste de persistência no PostgreSQL, alteração de dados, migration ou PDF. [Registro completo e pendências](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## R03 — Docker disponível, auditoria e testes reais (26/10/2026)

A continuação de R03 validou os repositórios reais sem alterar DTOs ou mapeamentos. Repetições reaproveitam IDs e edições conflitantes lançam CategoryLinksConflictException. A interface não recebeu novos campos.

As 13 verificações de integração passaram. O banco descartável foi removido; o banco principal manteve as contagens e não foi alterado. Nenhuma migration, limpeza de dados ou PDF executado. [Relatório e comando de teste](validacoes/unicidade-vinculos-categorias-2026-10-26.md).

## Edição de datas e preços decimais — 26/10/2026

ProgrammingDTO, ProgrammingResponseDTO e ProgrammingDetailsDTO usam decimal em MinPrice/MaxPrice. Entrada admite 0 a 9999999999.99 via Range(typeof(decimal), ...), com limites interpretados em cultura invariável. Validação compartilhada exige no máximo duas casas. JSON continua numérico. O mesmo ProgrammingDTO atende criação e edição; datas passadas só são permitidas na edição.

Detalhes e teste reproduzível: [revisão de datas/preços](validacoes/programming-datas-precos-2026-10-26.md).

## Mapping de favorito para model — 26/10/2026

FavoriteMapping passa a oferecer ToModel(string userId, int programmingId), declarado também em IFavoriteMapping. Cria Favorite com UserId e ProgrammingId; não exige DTO novo. ToDTO continua convertendo o favorito para FavoriteResponseDTO. O novo método fica disponível para uso, sem alterar o fluxo existente de persistência.

## Model no fluxo de cadastro de favoritos — 26/10/2026

O ToModel de FavoriteMapping passou a ser usado pelo cadastro no AppService. UserId vem do usuário autenticado e ProgrammingId do parâmetro da action; userId null é convertido em string vazia e continua sendo recusado pela validação de autenticação do service. ToDTO recebe o resultado persistido, inclusive quando o repositório reaproveita favorito existente. FavoriteResponseDTO e o contrato HTTP não mudaram.

## Endpoint público de paginação — 26/10/2026

GetAllProgrammings recebe take e skip como int pela query, com padrões 10/0. Não há DTO de entrada nem corpo. Resposta é List<ProgrammingResponseDTO> com os campos existentes, incluindo endereço; não inclui contagem total nem metadados de paginação.

## Restauração após reorganização do backend — 26/10/2026

Restaurados AddressMapping, CategoryMapping, UserMapping, HostMapping, ProgrammingMapping, FavoriteMapping, UserXCategoryMapping e ProgrammingXCategoryMapping e suas interfaces no backend reorganizado. Mantidos ToModel/ToDTO, ToEditModel de usuário, modelos de vínculos e DTOs de detalhes/resposta. Os arquivos foram comparados por hash com as implementações locais anteriores: 16 correspondências. Não foram recriados DTOs antigos de create/edit excluídos pelo usuário.

## Mapping de ProgrammingFilter — 26/10/2026

Criados IProgrammingFilterMapping e ProgrammingFilterMapping nas pastas existentes de Mapping/Interfaces e Mapping. ToModel recebe ProgrammingFilterDTO e retorna ProgrammingFilter; ToDTO faz o caminho inverso. Os dois métodos conferem argumento nulo, mapeiam explicitamente os 11 campos atuais e preservam filtros opcionais nulos. CategoriesId é copiada para uma lista independente quando presente. Registro scoped adicionado junto aos demais mappings no Program.cs.

Não altera rotas, persistência ou migrações. O consumo pelo fluxo de FilterAsync ainda está pendente. Conferência estática realizada e build executado: continua impedido somente pelo CS1061 existente no controller, pois IProgrammingAppService ainda não declara FilterAsync. Não houve testes de execução, acesso ao banco ou exportação de PDFs.

## City no endereço e consulta de filtros — 26/10/2026

AddressCreateDTO passa a aceitar City opcional com MaxLength(150). AddressDetailsDTO expõe City. AddressMapping transporta City nas duas direções, normalizando nulo para string vazia e removendo espaços externos na entrada. Demais contratos de host/programação permanecem iguais. ProgrammingFilterDTO mantém seus 11 campos atuais, sem alterações nesta etapa.

City ainda vazio não atende filtro de cidade não vazia. Os endereços antigos precisam ser preenchidos posteriormente; não houve tentativa de inferir cidades pelo logradouro ou fazer preenchimento em massa.

## Mapping dos filtros de host — 27/10/2026

Criados HostFilterMapping e IHostFilterMapping, com ToModel(HostFilterDTO) e registro Scoped. O mapping copia Name, Types, City, HasProgrammings, Take e Skip para HostFilter no domínio, preservando filtros opcionais e copiando a lista de tipos. Segue o padrão dos mappings existentes; não aplica regras de consulta ou validação de filtros.

A implementação de FilterAsync nas demais camadas permanece pendente: a action já iniciada chama IHostAppService.FilterAsync, ainda inexistente. Build tentado: um erro CS1061 nessa chamada preexistente e dez avisos; nenhum erro apontado nos arquivos do mapping. Sem mudança funcional de endpoint nesta etapa, sem alteração do protótipo, banco, migration ou PDFs.

## Consulta de hosts por filtros — 27/10/2026

HostRepository.FilterAsync implementado em sintaxe LINQ de consulta (from/where/select), com Address incluído e AsNoTracking. Retorna somente hosts ativos. Name aceita correspondência parcial sem distinção de maiúsculas/minúsculas (sem normalização de acentos); Types nulo/vazio não restringe e múltiplos tipos são alternativas. Os demais filtros são combinados. HasProgrammings considera programações ativas com EndDate posterior ao instante UTC da consulta: true exige existência, false exige ausência e null não restringe. Ordena por Name/Id antes de Skip/Take, retornando lista vazia sem correspondências.

Take <= 0 e Skip < 0 lançam ArgumentException. City preenchido lança ArgumentException explicativa: Address não possui cidade persistida. Não houve alteração de model/schema ou migration. A action HostFilter iniciada pelo usuário permanece como está: falta revisar binding por query e tratamento de ArgumentException para HTTP 400 antes de considerar o fluxo HTTP concluído. O catálogo automático do protótipo deve acompanhar o contrato salvo; nenhum formulário ou contrato foi modificado nesta tarefa de repositório.

Validação: build aprovado com zero erros e dez avisos existentes; sem teste HTTP ou consulta ao banco real. PDFs preservados.

## Remoção de bairro dos filtros de host — 27/10/2026

Neighborhood removido de HostFilterDTO, HostFilter, HostFilterMapping e da consulta HostRepository.FilterAsync. Bairro continua opcional no endereço e nos formulários de cadastro/edição, para exibição; não participa da seleção de hosts. Proximidade permanece uma implementação futura. Nenhuma alteração no schema ou migration. O catálogo do protótipo lê o DTO atualizado; ajustada descoberta da pasta da API para aceitar a estrutura atual e a estrutura backend/Projetos - 4. PDFs preservados.

Validação da remoção do bairro: build com zero erros/dez avisos existentes; node --check aprovado em catalog.mjs, public/app.js e server.mjs; 56 testes do protótipo com API simulada aprovados (execução liberada para portas locais). Catálogo real carregado com sucesso. A action HostFilter ainda não explicita FromQuery e o catálogo não reconhece seus campos; essa pendência anterior não foi alterada nesta tarefa. Sem requisições ao banco real.

## Filtro de hosts: fluxo verificado — 27/10/2026

Esta verificação substitui as pendências anteriores de binding e validação do filtro. GET /api/Host/HostFilter permanece autenticado (qualquer usuário logado), recebe HostFilterDTO por FromQuery e retorna List<HostResponseDTO> com 200, inclusive []. ArgumentException do service vira ProblemDetails 400. Sem autenticação/token inválido: 401. Name, Types, HasProgrammings, Take e Skip são aplicados; City preenchido retorna 400 por indisponibilidade, pois Address não possui cidade. Bairro permanece opcional e visual no endereço, fora do filtro. Paginação inválida e valores fora do enum são rejeitados no service.

Protótipo reconhece o DTO de query e envia tipos em parâmetros repetidos, booleano opcional com Todos e GET sem corpo. Exemplos adicionados ao arquivo Projetos - 4.http. Resultado: build aprovado; 62 verificações HTTP/EF/PostgreSQL reais em banco descartável e 58 testes simulados do protótipo aprovados. Banco temporário removido, banco principal preservado. Sem migration, commit ou PDFs. Detalhes: [relatório de verificação](validacoes/host-filter-fluxo-2026-10-27.md).

## Cidade habilitada no filtro e no protótipo — 27/10/2026

Esta atualização substitui a indisponibilidade de City registrada anteriormente. Coluna Addresses.City e migrations AddAddressCity/AddCity confirmadas em leitura no banco principal; a migration AddCity do usuário tem Up/Down vazios porque a coluna já estava contemplada anteriormente. Nenhuma migration criada, alterada ou aplicada nesta tarefa.

HostRepository.FilterAsync passa a comparar a cidade completa do endereço, ignorando caixa e espaços nas extremidades do filtro. City nula/vazia não restringe; bairro permanece fora dos filtros de host. Removida a rejeição de cidade do HostService. A cidade continua opcional no AddressCreateDTO (máximo 150 caracteres); models, mappings e persistência já estavam preparados.

Protótipo inclui Cidade nos quatro formulários de cadastro/edição de host/programação e envia address.city quando o endereço é novo. ViaCEP preenche cidade junto de rua/bairro, sem sobrescrever alteração manual durante a consulta. Seleção de endereço existente, carregar edição, consulta de CNPJ e Usar endereço do host preservam/exibem cidade; seleção existente continua enviando somente addressId. Exemplos HTTP atualizados. Endereços antigos com cidade vazia não aparecem ao aplicar um filtro por cidade; não houve backfill automático.

Validação: build aprovado; 59 testes do protótipo com API simulada aprovados; 68 verificações com login/HTTP/EF/PostgreSQL reais em banco descartável aprovadas, incluindo Recife/Olinda, cidade em branco, nome completo, caixa/espaços e combinação com nome/tipo/paginação. Banco temporário removido e banco principal preservado. Ambiente reiniciado, interface/catálogo e consulta pública da API respondendo 200. Sem PDFs novos.


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

## Resposta de assinatura simplificada - 27/10/2026

Por decisão do usuário, removidos IsSimulation, CanFeatureProgrammings e CanViewStatistics do SubscriptionResponseDTO e do mapping. Resposta contém somente id, status, startsAt e expiresAt. Status continua numérico: 0 Inactive, 1 Active, 2 Cancelled, 3 Expired. Uma linha Active vencida retorna Expired; uma linha Active com início futuro retorna Inactive. O frontend usa o status efetivo e o backend mantém Subscription.IsEffective/SubscriptionService.IsProAsync para autorização; criação de programação continua independente de Pro.

Não houve mudança de entidade, banco, migration ou controller. Protótipo já exibe a resposta genérica sem depender das flags; novo caso simulado confirma o contrato. Build aprovado; 10 verificações locais do mapping/serialização e 62 testes do protótipo aprovados. API do Visual Studio não reiniciada; recompilar/reiniciar para receber o JSON novo. Fontes Markdown atualizadas; PDFs preservados.

## Expiração persistida ao consultar a assinatura - 27/10/2026

SubscriptionService.GetAsync agora verifica Active com ExpiresAt <= UTC atual e solicita ExpireAsync ao repositório. A transição grava Status Expired (3) e UpdatedAt. Consultas de MySubscription e de perfil/IsProAsync passam pelo fluxo; a atualização acontece sob demanda, sem tarefa agendada. Antes da próxima consulta, a linha pode continuar Active, mas IsEffective e o mapping já negam/apresentam corretamente um prazo vencido. Assinaturas Cancelled não são alteradas.

O repositório usa UPDATE condicional por ID, status Active e prazo vencido, evitando sobrescrever um prazo renovado antes da escrita. Retorna a situação atual em leitura sem rastreamento; não altera as datas originais de validade. Consulta repetida não modifica UpdatedAt novamente. Não foram reintroduzidos o controle de SimulationEnabled ou o bloqueio por usuário desfeitos anteriormente.

Build aprovado, 15 verificações reais em PostgreSQL descartável e 62 testes simulados do protótipo aprovados. Verificadas persistência de Expired, expiração pelo perfil, idempotência, preservação de vigentes/canceladas e proteção de prazo vigente no UPDATE condicional. Banco temporário removido; banco principal não alterado nesta tarefa. Sem mudança de DTO/rotas, nova migration, reinicialização da API ou PDF.

## Carrossel Pro: correções dos itens 2 a 5 - 27/10/2026

GET /api/Programming/GetAllProgrammingsWithProHost permanece público, com take=10/skip=0 como padrões. Aceita take de 1 a 100 e skip >= 0; paginação inválida retorna ProblemDetails 400. Consulta verifica status e datas UTC de assinatura vigente, proprietário/host/programação ativos e evento não encerrado; mantém eventos em andamento. Mapping de assinatura preserva Active na vigência, Expired após o prazo e Inactive antes do início.

Build aprovado; 35 verificações HTTP/EF/PostgreSQL reais em banco descartável e 63 testes simulados do protótipo aprovados. Exemplos HTTP e ajuda do protótipo atualizados. Distribuição entre assinantes e demais regressões da revisão permanecem fora deste escopo. Nenhuma migration, escrita no banco principal, reinicialização da API do Visual Studio ou PDF. [Detalhes e testes](validacoes/carrossel-correcoes-2-5-2026-10-27.md).

## categoryIds no ProgrammingResponseDTO - 27/10/2026

ProgrammingMapping.ToDTO agora preenche a lista categoryIds já adicionada pelo usuário ao DTO. IDs distintos/ordenados dos vínculos atuais, ou [] sem vínculo. Todas as consultas que alimentam ProgrammingResponseDTO carregam ProgrammingXCategories junto do endereço, sem busca por item no mapping. Cadastro, edição, listagens, filtro e carrossel incluem os IDs; os detalhes públicos preservam seu contrato Categories com nomes. Categorias vinculadas inativas não são removidas silenciosamente da lista de IDs.

Navegação de Programming ligada à FK existente; EF confirmou ausência de mudança de schema pendente. Build aprovado, 21 verificações reais em PostgreSQL descartável e 64 testes simulados do protótipo aprovados. Protótipo exibe os IDs/nomes disponíveis e reaproveita a lista na edição. Sem migration, escrita no banco principal, PDF ou reinicialização da API. [Implementação e testes](validacoes/programming-response-categorias-2026-10-27.md).

## Status da assinatura definido no service — 27/10/2026

A regra de status efetivo fica em `SubscriptionService.GetStatus`, exposta por `ISubscriptionService`: ausência retorna Inactive; assinatura Active vencida retorna Expired; Active com início futuro retorna Inactive; nos demais casos preserva o status. `IsProAsync` também utiliza essa regra. `GetAsync` mantém a gravação de Expired ao consultar uma assinatura Active vencida; uma assinatura futura não é gravada como Inactive.

`SubscriptionAppService` consulta essa regra nos retornos de consulta, ativação e cancelamento e passa o status explicitamente para `ISubscriptionMapping.ToDTO`. O mapping apenas copia os campos, sem consultar relógio ou aplicar regras de validade. Esta descrição substitui as referências anteriores ao cálculo de validade no mapping. O JSON continua com id, status, startsAt e expiresAt; rotas e formulários permanecem iguais.

Validação: compilação aprovada, 16 verificações locais com service/appservice/mapping reais e repositório simulado, além de 64 testes simulados do protótipo e verificações de sintaxe JavaScript. Não houve teste HTTP ou alteração no banco nesta refatoração. Sem migration, reinicialização da API ou regeneração de PDFs.

## Categorias completas nas respostas de programação — 27/10/2026

ProgrammingResponseDTO substitui a antiga lista categoryIds de saída por Categories, uma List<CategoryResponseDTO>. ProgrammingDetailsDTO usa o mesmo tipo e inicializa a lista vazia. No JSON, ambos devolvem categories: [{ "id": 1, "name": "Música", "isActive": true }]. IsActive é preservado pelo CategoryResponseDTO já existente. Sem vínculos, categories é [], nunca null. Esta atualização substitui o contrato anterior que retornava somente IDs no Response.

ProgrammingMapping utiliza ICategoryMapping, elimina duplicidades por ID e ordena as categorias por ID. As consultas de listagem geral, por host, preferências, filtro, detalhes e carrossel carregam a categoria de cada vínculo. Criação e edição carregam as categorias após salvar para que os nomes também estejam disponíveis nas respostas dessas operações. As categorias vinculadas inativas continuam visíveis com seu status, preservando o comportamento anterior. Entrada de criação/edição continua usando categoryIds; nenhuma rota, verbo ou autorização foi alterada.

O protótipo já suporta categories com objetos: exibe seus nomes sem outra consulta e extrai os IDs ao carregar a edição. Caso simulado atualizado para confirmar esse contrato sem cache prévio de categorias.

Validação: build com zero erros (10 avisos preexistentes); 28 verificações com EF/PostgreSQL e API HTTP em porta temporária, incluindo paginação, preferências, filtro, carrossel, criação, substituição de categorias na edição e detalhes com/sem vínculos. Banco descartável removido ao final; banco principal preservado. Modelo sem alterações pendentes para migration. Também aprovados node --check em public/app.js e catalog.mjs e os 64 testes simulados do protótipo. Sem migration, reinicialização da API do Visual Studio ou exportação de PDF.


## Estatísticas implementadas em 29/10/2026

ProgrammingInteractionDTO: EventId e Type nullable com Required para rejeitar omissão (0 é tipo válido). HostStatisticsPeriodDTO: datas UTC como strings; HostStatisticsRankingFilterDTO: datas, sortBy, take e skip. Saídas independentes: HostStatisticsSummaryDTO, lista de HostStatisticsDailyDTO e HostStatisticsRankingDTO (items de ProgrammingStatisticsDTO), sem herança; favoritos atuais fora do filtro temporal.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

## US17 — Resumo de estatísticas implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Summary exige JWT de usuário ativo, propriedade do host ativo e Pro vigente no banco. Não há exceção administrativa. Retorna hostId, startDate, endDate e contadores long: detailViews, carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow. Sem dados, os contadores são zero. Período UTC de início inclusivo/fim exclusivo, padrão de 30 dias e limite 366. Interações incluem programações desativadas no histórico. Favoritos ativos de contas ativas representam o total atual e não são filtrados pelo período. Retornos: 200, 400 (período/ID), 401 (autenticação/conta), 403 (Pro) e 404 (host/propriedade).

Implementado nas camadas existentes com HostStatisticsFilterDTO/HostStatisticsSummaryDTO, respectivos modelos NotMapped, mappings com interfaces, AppService, Service e Repository. Service concentra autorização/período; mappings só copiam campos; joins/agregações executam no banco. Nenhuma tabela de totais ou migration nova. A execução depende das migrations existentes de assinatura/interações/favoritos no banco utilizado.

Coleta aprovada em 24 verificações reais após a correção do usuário; Summary aprovado em 35 verificações HTTP/EF/PostgreSQL, incluindo contagens e bloqueio imediato por cancelamento/expiração com mesmo JWT. Build sem erros, 10 avisos preexistentes; snapshot sem mudanças pendentes. Protótipo e .http atualizados; datas de query convertidas para UTC, totais exibidos e 67 testes simulados aprovados. Testes reais em bancos descartáveis removidos; principal preservado, API do Visual Studio não reiniciada e PDFs não exportados. Daily, Ranking, coleta automática e painel definitivo são as próximas etapas. [Regras, implementação e validação](validacoes/us17-host-summary-2026-10-30.md).

## US17 — Série diária implementada — 30/10/2026

GET /api/Host/{hostId}/Statistics/Daily usa os mesmos filtros e autorização do Summary por ISumarryStatitcsValidations. Retorna lista ordenada de {date, detailViews, carouselClicks, ticketClicks, nearbyClicks}, com dias UTC sem eventos preenchidos com zero. Inclui histórico de programações desativadas; não contém favoritos históricos. Início inclusivo/fim exclusivo e períodos parciais preservam as horas do filtro. Padrão de 30 dias de duração pode tocar 31 datas; máximo 366 dias de duração pode tocar 367 datas. Fim à meia-noite não gera dia extra.

HostStatisticsDaily (NotMapped), HostStatisticsDailyDTO e mapping com interface seguem as pastas existentes; repository agrega no banco e service preenche lacunas, sem repetir validações. Nenhuma tabela ou migration nova. Controller usa try/catch. .http e protótipo atualizados; resultado apresentado como tabela diária em UTC.

Summary revalidado antes da implementação (35 verificações). Daily e regressão do resumo aprovados em 73 verificações HTTP/EF/PostgreSQL, com fuso da conexão America/Recife; build sem erros e 10 avisos preexistentes; snapshot sem mudanças. Sintaxe JS e 68 testes simulados do protótipo aprovados. Bancos descartáveis removidos; banco principal preservado. Sem restart da API do Visual Studio ou exportação PDF. Ranking é a próxima etapa. [Contrato, regras e testes](validacoes/us17-host-daily-2026-10-30.md).

## US17 — Ranking implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Ranking retorna ProgrammingStatisticsDTO[] com posição global, identificação/estado da programação e cinco indicadores. Aceita startDate/endDate, sortBy (detailViews padrão; carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow), take=10 (1–100) e skip=0 (>=0). Ordem decrescente e desempate pelo ID; página vazia retorna []. Inclui histórico desativado e programações sem dados. Interações respeitam o período UTC; favoritos ativos de contas ativas representam o total atual.

Roles ADMIN,HOST acrescentadas pelo usuário foram preservadas em Summary/Daily e aplicadas ao Ranking. Nas três actions, essas roles são necessárias, mas não substituem propriedade do host ativo, usuário ativo e Pro vigente. ADMIN não tem exceção. Esta descrição substitui referências anteriores à dispensa de role. Retornos 200, 400, 401, 403 e 404 conforme filtro/autenticação/role/Pro/propriedade.

RankingStatisticsValidations reaproveita ISumarryStatitcsValidations e valida paginação/indicador. Service usa o filtro validado, consulta e atribui posições; repository agrega interações e favoritos separadamente e usa left joins, ordenação e paginação no banco, evitando multiplicação das contagens. AppService usa mappings com interfaces; controller só coordena retornos e exceções. Filtro específico e classes/DTOs existentes seguem as pastas atuais. Não há tabela/índice/migration nova.

Versão final aprovada em 129 verificações HTTP/EF/PostgreSQL de Ranking/Summary/Daily, com build sem erros e 10 avisos preexistentes. Protótipo/.http atualizados; sintaxe JS e 70 testes simulados aprovados, incluindo roles formatadas com espaços. Bancos descartáveis removidos, principal preservado, API principal não reiniciada e PDFs não exportados. Próximas etapas: coleta automática no frontend, painel Pro definitivo e validação integrada. [Contrato, regras e testes](validacoes/us17-host-ranking-2026-10-30.md).


## Limite de três categorias — 31/10/2026

ProgrammingDTO.categoryIds e UserXCategoryDTO.CategoryIds possuem MaxLength(3), com mensagens em português. ProgrammingValidation e UserXCategoryValidation também verificam o limite para chamadas do AppService fora da validação automática MVC. O primeiro rejeita lista nula/vazia; o segundo preserva [] para seleção opcional. As actions de preferências recebem List<int> diretamente, por isso a validação do AppService é necessária. Formatos JSON e nomes de propriedades preservados. Foram aprovadas 17 verificações cobrindo limites, total acumulado, edição e lista vazia.
