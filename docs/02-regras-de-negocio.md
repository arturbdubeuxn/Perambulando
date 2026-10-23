# Regras de negócio

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 20/10/2026

Este documento descreve o código atual de controllers, app services, serviços e repositórios. Uma pendência registrada aqui não significa que a regra já tenha sido implementada.

## 1. Responsabilidades das camadas

| Camada | Responsabilidade observada |
|---|---|
| Controller | HTTP, usuário do JWT, validação de entrada, autorização por role e conversão de resultados em status |
| Application / AppService | Mapeamento DTO-entidade, montagem dos vínculos de categorias e composição dos retornos |
| Domain / Service | Verificação de propriedade, busca de registros existentes e alteração de seus dados |
| Data / Repository | Consultas EF Core, filtros de disponibilidade e persistência |

As verificações entre campos de programação ficam no controller, conforme o padrão solicitado pelo usuário. Não há Unit of Work explícito; os repositórios de programação salvam os campos e os vínculos em uma única chamada ao contexto.

## 2. Usuário e autenticação

- O cadastro é público e cria uma conta pelo Identity. E-mail único é exigido na configuração do Identity.
- O nome informado é usado como `UserName`: também fica sujeito às regras de nome e unicidade do Identity. Não há campo independente de nome de exibição.
- Login procura pelo e-mail, exige usuário ativo e verifica a senha. O fluxo retorna JWT, não cria a sessão da aplicação por cookie.
- Perfil e edição de usuário operam sobre o ID do JWT. A edição modifica nome, e-mail e tipo e retorna um novo token.
- A exclusão de conta recebe um e-mail no corpo, encontra o usuário e compara o ID com `sub` do token. Usa `DeleteAsync`, e não `IsActive = false`. A senha do DTO não é verificada por essa action.

## 3. Propriedade dos estabelecimentos

```text
JWT.sub -> User.Id -> Hosts.UserId -> Programming.HostId
```

Uma conta pode ter vários hosts. O cadastro associa `host.UserId` ao usuário autenticado, sem aceitar o dono do frontend. Não é necessário ter programação para cadastrar um host, inclusive Gastronomia ou Comércio.

Após cadastrar, o serviço atribui a role HOST se necessário. A resposta traz JWT atualizado para que a interface possa usar as funcionalidades protegidas sem novo login.

A criação do host e a atribuição da role não formam uma operação atômica no código atual. Se o host for salvo e a role falhar, a action retorna erro informando essa situação. A role HOST deve existir previamente; não há criação dessa role no fluxo de cadastro.

## 4. Gestão do host

- Listar meus hosts retorna somente os ativos do usuário do token.
- Consultar o perfil exige login, mas não exige ser o dono. Portanto, perfil privado significa privado para visitantes; outros usuários autenticados podem consultar.
- Editar exige host ativo pertencente ao usuário. O serviço procura por ID do host e ID do dono e altera os campos editáveis, preservando dono e criação.
- Desativar altera `IsActive` e `UpdatedAt`. Um host já inativo deixa de ser encontrado por esse fluxo.
- Roles ADMIN e HOST abrem acesso às actions de gestão. Mesmo ADMIN passa pela verificação de dono atual; não há exceção administrativa de propriedade.

## 5. Cadastro de programação

O usuário precisa ter role ADMIN ou HOST e ser dono do host ativo informado na rota. Cada programação pertence a um único host. A quantidade de programações por host não tem limite de negócio implementado.

| Aspecto | Regra atual no create |
|---|---|
| Nome, descrição e endereço | Strings obrigatórias pelo DTO |
| Datas | Início posterior ao instante atual e anterior ao término |
| Preços | Não negativos; mínimo menor ou igual ao máximo |
| Gratuidade | Preços devem ser zero |
| Categorias | Lista não vazia; IDs positivos; existência garantida pela FK com erro tratado |
| Localização | Endereço próprio da programação, sem obrigação de coincidir com o host |

O app service monta cada `ProgrammingXCategory` em um foreach. O repositório adiciona a programação e os vínculos e executa um único `SaveChangesAsync`. No provedor relacional, essa gravação é transacional por padrão: uma falha na gravação impede persistência parcial daquele save.

## 6. Edição de programação

Primeiro é verificado se o host pertence ao usuário e está ativo. Depois é buscada a programação ativa desse mesmo host. A edição não aceita transferir o evento para outro dono ou host.

- O PUT recebe o conjunto completo de campos editáveis.
- Os preços precisam ser finitos, não negativos, ordenados e iguais a zero se gratuita.
- Datas precisam estar em UTC e início deve ser anterior ao término. Diferentemente do create, o edit não rejeita expressamente início no passado.
- Categorias devem ter IDs positivos, sem repetição e pelo menos um item.
- O serviço consulta `GetAllCategoriesbyProgrammingId`, calcula vínculos retirados e novos e preserva os que continuam selecionados.
- Campos e vínculos são gravados juntos no repositório; a data de atualização muda para UTC.

## 7. Desativação e acesso público

Desativar programação altera `IsActive` para false; não apaga o registro nem os vínculos. A consulta pública e as consultas internas normais exigem programação e host ativos. Desativar um host não altera cada programação, mas as torna indisponíveis nessas consultas.

Uma nova tentativa de desativação encontra o registro indisponível e retorna 404. A API não possui action de reativação atualmente.

Os detalhes de programação são públicos e incluem categorias vinculadas, dados do evento, nome e logo do host e links informados. Já o perfil do host exige autenticação.

## 8. Categorias

`GetallCategories` lista somente categorias ativas. `GetAllCategoriesbyProgrammingId` consulta a tabela de vínculo, seleciona categorias distintas e ordena por ID, sem filtrar status ativo.

O código de gravação não revalida se uma categoria está ativa. O GET de seleção facilita a interface, mas não impede o envio manual de um ID inativo. Essa é uma característica atual, não uma garantia de integridade fornecida pelo frontend.

## 9. Pendências e diferenças conhecidas

- Cadastro de host sem validação explícita de campos obrigatórios ou valor do enum no DTO.
- Create de programação sem rejeição de categorias repetidas; não existe índice único do par de vínculo no snapshot.
- `[Required]` sobre bool/float não anuláveis no create não identifica a ausência desses campos no JSON.
- Create e edit possuem diferenças nas verificações de datas e de preços finitos.
- Hosts e Programming possuem Location opcional, armazenada em geography(Point,4326), com índices GiST. A migration já foi aplicada ao banco local. Os registros existentes permanecem com Location NULL. A geocodificação via Geoapify está integrada e depende da chave configurada. O endpoint de proximidade ainda não existe.
- Compartilhamento pode usar a consulta pública existente, mas a página e o botão de compartilhar dependem do frontend.
- O perfil do host não inclui IDs nas programações mapeadas e não carrega suas categorias.
- Não há métricas de visualização, favoritos ou engajamento implementadas nos fluxos analisados.

## Fontes de implementação

A Location é interna à persistência e possui JsonIgnore nas duas entidades. O Geoapify ainda não é chamado no cadastro/edição. Foram adicionados AddressNumber e AddressComplement às entidades, DTOs e mapeamentos de create/edit/detalhes, incluindo programações no perfil do host. Os nomes AdrressNumber e AdrressComplement foram corrigidos antes da criação das colunas.

Número é string opcional de até 20 caracteres, aceitando 175A e s/n; complemento é opcional, até 200 caracteres. Os campos iniciam vazios. A edição completa substitui os valores, e a omissão no PUT os limpa. Não se extrai número automaticamente do endereço antigo. A migration AddAddressNumberAndComplement foi aplicada com preservação de registros e do texto de Address.

Presentation/Controllers, Application/AppServices, Domain/Service, Data/Repository e DTOs. A etapa de endereço teve 48 verificações offline de mapeamento/validação/propriedade e conferência do esquema real; não foram executados cadastros ou exclusões contra dados reais como teste.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

HostService e ProgrammingService usam IGeocodingService após verificar usuário/propriedade e antes de salvar. A edição geocodifica se Location é nula ou se logradouro, número, bairro ou CEP mudar; apenas complemento não exige nova consulta. O ponto é obtido antes de modificar a entidade rastreada. Falha bloqueia a gravação, preservando os dados anteriores. Critério atual do MVP: resultado brasileiro building/street/amenity, nome de logradouro compatível e mesmos três primeiros dígitos do CEP. Veja os limites de confiança e as duas tentativas na seção de tolerância abaixo. Resultados somente de bairro/cidade/CEP são recusados. O ponto de rua pode ser aproximado. Não há repetição automática nem atualização em lote dos registros existentes.

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


## Preferências por categorias — 20/10/2026

O POST de interesses usa o ID do usuário autenticado e percorre CategoryIds.Distinct(), criando um UserXCategory por ID. Cada chamada AddAsync salva separadamente; portanto, uma falha posterior pode deixar vínculos anteriores gravados. O retorno do AppService agora é List<UserXCategory>; o controller devolve uma mensagem, sem expor essa lista.

A operação adiciona interesses. Não remove seleção anterior nem impede vínculos duplicados em requisições diferentes. Não há transação envolvendo toda a lista. IDs inexistentes falham pela FK; categorias inativas não são validadas no cadastro dos interesses. Essas são limitações atuais, não correções realizadas nesta etapa.

GetUserProgrammingPreferences percorre AppService -> serviço -> CategoryRepository (interesses) -> ProgrammingRepository (joins). Retorna programações ativas, de hosts ativos, com pelo menos uma categoria ativa contida nos interesses; usa Distinct e ordena por StartDate. Não exige que todas as categorias coincidam, nem implementa filtro de evento encerrado ou proximidade geográfica.

Foi restaurada a sobrecarga interna GetAllProgrammingsbyHostId(int) na interface e no serviço para o perfil de host existente voltar a compilar, preservando o fluxo anterior. A sobrecarga com userId continua verificando propriedade. Nenhuma action nova foi criada nesta atualização do protótipo.

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


## Edição dos interesses no service — 20/10/2026

EditCategoryToUserAsync monta os vínculos no AppService e envia a seleção completa de uma só vez para UserXCategoryService.EditAsync(userId, userCategories). O service consulta somente os vínculos desse usuário, elimina IDs repetidos da entrada e compara os conjuntos: mantém os vínculos em comum, adiciona categorias novas e remove vínculos de categorias ausentes na seleção. Exemplo: [1,2] -> [2,3] mantém 2, remove 1 e adiciona 3. Mantém IDs e datas dos vínculos existentes; uma seleção igual não provoca gravação.

O repositório recebe as inclusões e exclusões já decididas pelo service e executa um único SaveChangesAsync, usando a transação padrão do EF Core para essa gravação. Isso evita salvar apenas uma parte das inclusões/exclusões da edição. Não muda o comportamento do POST de adição, que ainda salva cada vínculo separadamente. Duplicidades preexistentes de categorias mantidas não são saneadas; validação de categorias inativas e controle de edições concorrentes continuam pendentes. IDs inexistentes continuam sujeitos à FK.

Mantida a regra de pelo menos uma categoria: lista nula/vazia é rejeitada. O service rejeita usuário vazio e vínculos com UserId diferente do usuário informado. O retorno interno é List<UserXCategory> com a seleção final, distinta por CategoryId. Nenhum contrato HTTP ou DTO foi alterado. Ainda não existe action de edição no CategoryController; por isso o .http e os formulários mantêm somente adição e consultas. O catálogo automático continua lendo as rotas salvas, sem inventar endpoint de edição.

Validação: compilação GeoLocation com zero erros e sete avisos CS8618 preexistentes; nove verificações temporárias com repositório simulado aprovadas, cobrindo diferenças, entrada repetida, preservação de vínculo/data, retorno, isolamento por usuário, gravação única, seleção igual, primeira seleção e rejeições. Nenhum dado real alterado, migration aplicada ou PDF regenerado.


Simplificação da comparação de interesses — 20/10/2026: o service usa dois foreach. O primeiro percorre os vínculos atuais e separa os ausentes da seleção para remoção. O segundo percorre a seleção sem IDs repetidos e usa FirstOrDefault para manter o vínculo existente ou separar uma inclusão. Retorna a lista montada nesse segundo laço. Removidos os conjuntos HashSet, as projeções de IDs e a composição final por Concat. Permanecem as validações, os contratos e uma única gravação pelo repositório; nenhuma rota ou formulário mudou. Compilação verificada nesta revisão; os nove testes anteriores correspondem à implementação anterior. PDFs preservados.


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


## AddAddress no AddressService — 21/10/2026

Implementado Task<Address> AddAddress(int addressId, Address? newAddress, string userId), com construtor e dependências explícitos no padrão das classes existentes. As quatro chamadas de HostService/ProgrammingService usam AddAddress em vez de ResolveAsync. Nenhuma pasta foi criada.

Com AddressId, consulta GetByIdAsync e rejeita ID inexistente. Com objeto novo, remove espaços nas extremidades, normaliza CEP para oito dígitos, consulta GetExistingAddressAsync comparando logradouro, número, complemento, bairro e CEP e reutiliza o equivalente. A comparação ignora caixa, mas não remove acentos/abreviações. Prioriza equivalentes com coordenadas. Quando não existe equivalente, preenche AddWho com o usuário informado; a autoria anterior é preservada na reutilização. Geocodifica somente quando Location está ausente. A função retorna a entidade e não executa SaveChanges; a gravação permanece com o host/programação. A seleção recebida deve conter somente ID ou somente novo endereço, e usuário, logradouro, número e CEP precisam ser válidos. Argumentos inválidos geram ArgumentException.

Foram alinhados GetAllAddressAsync(string), GetByIdAsync(int) e GetExistingAddressAsync(Address) no repositório/interface usados pelo serviço. A consulta de autocomplete segue a interface atual do usuário: search apenas, no mínimo três letras/dígitos, até dez registros. Usa Street e CEP diretamente; não depende dos campos removidos CreatedByUserId, SearchStreet, NormalizedKey nem do helper AddressNormalization. O modelo atual usa AddWho; não foi acrescentado filtro por proprietário ao catálogo compartilhado.

Os AppServices de host/programação ainda estão em adaptação e atualmente mapeiam apenas AddressId; para o caminho de endereço novo precisam encaminhar também a entidade Address. O AddressAppService também continua com referência a Mappings removida e métodos incompatíveis/faltantes em relação à interface. Esta etapa não conclui esses trechos da refatoração nem o tratamento HTTP de todas as exceções de argumento.

Validação: 15 verificações isoladas da função/interface reais compiladas com o compilador .NET e dependências simuladas, cobrindo seleção existente, coordenadas ausentes, reutilização, autoria, normalização, validações e propagação de falha de geocodificação. Nenhum banco/provedor externo utilizado. O build completo permanece bloqueado por três erros já existentes em AddressAppService (namespace Mappings, GetAllAddressAsync e GetDetailsbyIdAsync). Nenhuma migration gerada/aplicada ou PDF atualizado.


## Persistência de novos endereços com host/programação — 21/10/2026

Concluído o encaminhamento de dto.Address no create e no edit de HostAppService e ProgrammingAppService. O mapeamento é feito inline, com new Address, preenchendo Street, Number, Complement, Neighborhood e CEP; opcionais nulos viram strings vazias. Quando somente AddressId é informado, não se cria um objeto de endereço novo. Os serviços existentes chamam AddAddress, que reutiliza o registro equivalente/existente ou prepara um novo com autoria e geocodificação.

HostRepository.Create/EditAsync e ProgrammingRepository.CreateWithCategoriesAsync/EditWithCategoriesAsync/EditAsync incluem explicitamente Db.Addresses.Add quando Address.Id == 0. O endereço é salvo pelo mesmo SaveChangesAsync do host/programação, junto com as categorias quando aplicável. O EF atribui o ID gerado ao vínculo AddressId pela navegação. Um endereço já existente não é incluído novamente; na edição, o endereço anterior é mantido. Não foi acrescentado SaveChanges isolado no AddressService ou no AddressRepository.

AddressAppService foi alinhado à interface atual GetAllAddressAsync(string)/GetDetailsbyIdAsync(int), com construtor explícito e mapeamentos inline para AddressDetailsDTO; removida a dependência de Mappings inexistente. A compilação voltou a passar. O autocomplete e o .http usam apenas search, acompanhando a assinatura atual, com até dez resultados. Nenhuma pasta foi criada.

Validação: build GeoLocation com zero erros e sete avisos CS8618 preexistentes; 21 verificações temporárias com AppServices/repositórios reais e EF, incluindo os quatro mapeamentos, navegações/FKs, estados Added/Modified/Unchanged e ausência de duplicação ao selecionar endereço existente. Um interceptor bloqueou as seis tentativas de abertura de conexão antes de acessar qualquer banco. Também passaram os 39 testes do protótipo com API simulada e node --check em app.js. Os arquivos temporários de teste foram removidos.

**Nenhuma migration foi gerada ou aplicada e não houve gravação real no banco.** A validação de INSERTs/IDs efetivamente gravados no PostgreSQL permanece para depois da revisão e da migration de Address. As pendências de mapeamento e os três erros de AddressAppService registrados nas seções anteriores foram resolvidos nesta etapa. PDFs preservados.


## Migration AddAddress corrigida — 21/10/2026

20261021193025_AddAddress foi revisada para preservar dados: Addresses é criada primeiro, AddressId começa anulável e sem default 0, os endereços/coordenadas/datas/autoria existentes são copiados e vinculados com os IDs gerados, e só depois são criadas as restrições e removidas as colunas antigas. Down devolve os endereços aos campos anteriores antes de remover a tabela; bloqueia reversão que descartaria endereços sem vínculo. Campos que excedem os novos limites interrompem a migration sem truncamento. Não foram alterados Designer, snapshot, entidades ou contratos HTTP nesta correção.

Build sem erros (sete avisos preexistentes) e 20 verificações de Up/Down no PostgreSQL com dados fictícios em schema isolado, revertido ao final. Conferência somente de leitura do banco da aplicação: 23 hosts, nove programações, colunas antigas presentes e AddAddress não aplicada. Encontrados CEPs incompatíveis em Hosts ID 12 (872878282), Programmings ID 6 (fsdfsdfsd) e ID 7 (FSDFSDFDS). Nenhum registro foi alterado; é necessário revisá-los antes de aplicar.

[Alterações completas, testes e pendências](validacoes/migration-address-correcao-2026-10-21.md). A migration continua aguardando revisão/aplicação; não foi executado Update-Database nem reiniciada a API. Nenhum PDF atualizado.

### Estado do banco após a aplicação — 21/10/2026

AddAddress foi aplicada por autorização do usuário: 23 hosts e nove programações preservados, vinculados a 32 Addresses; sem migrations pendentes. Somente os CEPs inválidos de Hosts ID 12 e Programmings IDs 6/7 foram esvaziados, com os valores anteriores preservados em backup. Campos e coordenadas foram conferidos após a transferência. Não houve mudança adicional de contrato HTTP ou de regra de validação. Consulte docs/validacoes/migration-address-correcao-2026-10-21.md para a evidência completa. PDFs preservados.

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


## Validações compartilhadas de programação — 23/10/2026

Esta atualização substitui as referências anteriores a `IProgrammingRules`: o contrato é `IProgrammingValidations`, implementado por `ProgrammingValidations` no domínio e registrado como scoped na DI. `ProgrammingService` chama a validação no início do cadastro e da edição, inclusive quando invocado diretamente, antes de consultar repositórios, resolver endereço ou modificar a entidade rastreada.

As duas operações exigem host positivo; pelo menos uma categoria, com IDs positivos e sem repetição; datas UTC, início futuro e fim posterior ao início; preços finitos e não negativos, mínimo menor ou igual ao máximo; programação gratuita com ambos os preços zero; programação paga com pelo menos um preço positivo; e seleção de endereço existente ou novo endereço. Navegação já carregada com o mesmo ID do endereço é aceita, sem tratá-la como novo endereço. O serviço normaliza essa seleção antes de chamar AddressService.

A verificação de propriedade do host ativo permanece no serviço. A desativação não exige datas futuras. A escolha de categorias de preferências do usuário (`UserXCategory`) continua facultativa; a obrigatoriedade acima pertence à programação. A existência das categorias continua sujeita ao fluxo de persistência existente; esta alteração não acrescenta consulta de categorias ativas.

Validação realizada: build com zero erros e sete avisos CS8618 existentes; 77 verificações aprovadas com repositórios e AddressService simulados. Cobertura de chamadas diretas ao domínio, AppService real, resolução de DI, entradas inválidas sem acesso às dependências, propriedade do host e alternativas de endereço. Reprodução: `dotnet run --project docs/validacoes/ProgrammingDomainValidation.Tests.csproj`. Não foram executados testes HTTP nem gravações no banco ou consultas ao Geoapify.
