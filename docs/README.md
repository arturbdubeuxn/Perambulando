# Documentação do Perambulando

Atualização: 20/10/2026. As mudanças de localização foram preparadas na branch Artur-Desktop e a migration foi aplicada ao banco local, com verificação das colunas, índices, versão do PostGIS e contagens dos registros.

Na mesma branch foram completados AddressNumber/AddressComplement em hosts e programações, DTOs, mapeamentos e edição pelos serviços. A migration AddAddressNumberAndComplement foi aplicada com backup e preservação dos registros/endereços anteriores. Ambos os campos são opcionais, com limites 20/200; os exemplos .http e o protótipo foram atualizados. PDFs continuam sem exportação automática.

| Documento | Conteúdo |
|---|---|
| [01 - Controllers](01-controllers.md) | Todas as rotas atuais, autorização, entrada, exemplos e respostas |
| [02 - Regras de negócio](02-regras-de-negocio.md) | Propriedade, fluxos de cadastro, edição, desativação e categorias |
| [03 - Tokens](03-tokens.md) | Emissão, claims, validação, expiração, atualização e logout |
| [04 - DTOs](04-dtos.md) | Campos, tipos, validações, uso e diferenças de mapeamento |
| [05 - Docker](05-docker.md) | Situação encontrada, configuração necessária e operação futura |
| [06 - Banco de dados](06-banco-de-dados.md) | PostgreSQL, EF Core, tabelas, relacionamentos, índices e migrations |
| [07 - Entidades e models](07-entidades-models.md) | Classes do domínio, propriedades, padrões e navegações |

As versões PDF ficam em `pdf/`. As fontes Markdown são a base editável. Para regenerar todos os PDFs, execute `python exportar_pdfs.py` nesta pasta com Python e ReportLab disponíveis. No ambiente Codex, prefira o Python do runtime disponibilizado pela ferramenta de dependências. A exportação não atualiza o conteúdo técnico automaticamente: confira os documentos afetados antes de exportar.

## Manutenção a cada mudança

| Alteração no sistema | Documentos a revisar |
|---|---|
| Rota, verbo, status, autenticação ou contrato HTTP | Controllers; DTOs; Tokens quando aplicável |
| Regra de propriedade, disponibilidade ou validação | Regras de negócio; Controllers; DTOs |
| Claims, roles, login, expiração ou renovação | Tokens; Controllers; Regras de negócio |
| Campo ou mapeamento de entrada/saída | DTOs; Controllers; Entidades e BD se persistido |
| Entidade, configuração EF, índice ou migration | Entidades; BD; Regras de negócio |
| Container, imagem, rede, volume ou variável de ambiente | Docker; BD; Tokens conforme a variável |

Atualize os Markdown afetados e suas datas a cada alteração. PDFs somente devem ser atualizados quando o usuário pedir explicitamente; podem representar uma edição anterior às fontes. Confira também o protótipo e o arquivo `.http` quando houver alteração funcional. Não marque testes de execução como realizados quando a análise tiver sido apenas estática.

## Estado importante desta edição

Há 19 endpoints nos controllers. A rota antiga GetAllProgrammingsbyHostId foi retirada do .http; o perfil de host continua retornando suas programações. Foram adicionados docker/postgres/Dockerfile e compose.postgis.yaml para preparar uma imagem PostgreSQL 17 com PostGIS e reutilizar o volume existente. Location é opcional, tem índice GiST e não é serializada diretamente. A geocodificação via Geoapify está integrada; a chave precisa ser configurada para uso real. A busca por proximidade ainda não está implementada. Nenhum PDF foi regenerado nesta etapa.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

Validação da alteração de bairro opcional: build GeoLocation concluído com zero erros e três avisos CS8618 preexistentes; node --check em app.js e catalog.mjs; 17 testes do protótipo aprovados com API simulada; catálogo real conferido com bairro não obrigatório nos quatro formulários. Não foram executadas gravações na API/banco nem regenerados PDFs nesta alteração.

## Geocodificação via Geoapify — 19/10/2026

Cadastro de host e programação consulta o Geoapify antes de persistir, após verificar usuário/propriedade. A edição consulta somente se Location for nula ou se Address, AddressNumber, Neighborhood ou CEP mudar. Alterar apenas complemento não consulta. Falha não salva o cadastro/edição nem substitui as coordenadas anteriores; os demais dados rastreados só são alterados após sucesso da geocodificação.

- Entrada HTTP permanece igual: logradouro, número opcional, bairro opcional e CEP; o complemento não participa da busca. Não há novo endpoint de geocodificação nem entrada de coordenadas pelo cliente.
- A implementação Data/Services/GeoapifyGeocodingService realiza GET HTTPS com format=json, limit=5, lang=pt e filter=countrycode:br, com parâmetros estruturados street/housenumber/postcode/country (sem text). Interface IGeocodingService, endereço GeocodingAddress e erro GeocodingException ficam no domínio. HostService e ProgrammingService coordenam as consultas; o Program.cs registra o HttpClient e a configuração.
- Critério definido nesta implementação: resultado no Brasil, tipo building/street/amenity, nome de logradouro compatível, mesmos três primeiros dígitos do CEP e coordenadas finitas. Os critérios de confiança e as tentativas estão na seção de tolerância abaixo. Resultado somente de CEP/cidade ou baixa confiança retorna 422. Resultado de rua pode representar uma posição aproximada, sem garantir o ponto exato do imóvel.
- Sem resultados/endereço insuficiente: ProblemDetails 422. Chave ausente, erro HTTP do provedor (inclusive 401/403/429), timeout/rede ou JSON/coordenadas inválidos: ProblemDetails 503. Tempo limite de 10 segundos por consulta e 15 segundos no total; até duas buscas para endereço sem candidato aceitável. Falhas HTTP/rede/JSON não geram repetição. Sem redirecionamentos HTTP.
- Persistência: Point(longitude, latitude) com SRID 4326 na coluna geography existente. Não há migration nova. Registros anteriores não são geocodificados em lote; recebem coordenadas na próxima edição válida. Location continua ignorada na serialização das entidades e os DTOs de detalhes ainda não expõem coordenadas.
- A chave é exclusiva do servidor. Configure Geoapify__ApiKey como variável de ambiente do processo que inicia a API. O appsettings.json contém somente o bloco vazio e é versionado; mantenha a chave real fora dele. O bloco local foi criado vazio; nunca coloque a chave no protótipo, JWT ou .http. O cliente HTTP não registra suas URLs, que contêm a chave.
- Em Docker, forneça Geoapify__ApiKey ao container da aplicação, não ao PostgreSQL. O compose.postgis.yaml atual disponibiliza somente o banco. A API precisa de saída HTTPS para api.geoapify.com.

Referência: [API oficial de geocodificação Geoapify](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/). A consulta externa real foi validada após configurar a variável de ambiente do usuário Windows; o processo da API precisa ser reiniciado para herdá-la. A busca “perto de mim” e a montagem do mapa permanecem pendentes. PDFs não foram regenerados.

### Ativar e testar

1. Obtenha a chave no [Geoapify MyProjects](https://myprojects.geoapify.com/).
2. Defina `Geoapify__ApiKey` no ambiente do processo que inicia a API. No PowerShell: `$env:Geoapify__ApiKey = "SUA_CHAVE"`, e inicie a aplicação nesse mesmo terminal. No Visual Studio, use uma variável de ambiente do usuário Windows e reinicie o Visual Studio para herdá-la. O appsettings.json versionado contém apenas o bloco vazio; não preencha a chave real nele.
3. Reinicie a API. No protótipo ou arquivo .http, faça login e cadastre um host/programação com endereço e CEP reais. Não envie coordenadas. O banco receberá Location.
4. Se retornar 422, confira endereço/número/CEP. Se retornar 503, confira chave, conectividade e limites do provedor. Edição com Location preenchida e sem mudança de endereço não depende da consulta externa.

Validação desta integração: build sem erros e três avisos CS8618 preexistentes; 63 verificações temporárias com HTTP/repositórios simulados (adapter, serviços, propriedade e ProblemDetails 422/503 nas quatro actions); 17 testes do protótipo e verificação de sintaxe JavaScript aprovados. Após configurar Geoapify__ApiKey no ambiente do usuário Windows, foi realizada consulta HTTPS real ao Geoapify em 19/10/2026: resultado building no Brasil, confiança 1 e coordenadas válidas. A chave não foi incluída nos arquivos. O fluxo completo de criação/edição via API e banco não foi executado; reinicie o Visual Studio e a API para herdarem a variável. Não houve gravação no banco. PDFs preservados.

### Tolerância ampliada do MVP — 19/10/2026

A busca continua somente com Geoapify e aceita localização aproximada. Mantém coordenadas finitas, país brasileiro, tipo building/street/amenity, cidade/estado presentes e correspondência do nome da via. O prefixo exigido do CEP passa de cinco para três dígitos, ampliando a região possível. São priorizados o CEP completo, depois os cinco primeiros dígitos, o número do imóvel, o tipo building e a confiança. Isso não comprova cidade/UF do usuário nem garante erro máximo em metros.

Na regra geral, a confiança mínima é 0,25; abaixo de 0,7 exige também confiança de rua e de cidade >= 0,5. Com confiança geral >= 0,7, indicadores específicos ausentes não impedem aceitação. Exceção de aproximação: se o CEP completo coincide e a confiança da rua é >= 0,8, aceita pontuação geral baixa ou zero, desde que ela seja válida e todos os demais critérios de país, tipo, nome da via, cidade/estado e coordenadas passem. Isso atende resultados do provedor que reconhecem fortemente a rua mas não confirmam o imóvel. Não há conversão dessas pontuações em porcentagem garantida de acerto.

Na comparação, ignora acentos, pontuação, caixa, artigos/preposições de/da/do/das/dos e o tipo inicial da via (rua, avenida, praça, largo etc.). Reconhece abreviações Mal/Gen/Dr/Prof/Pres. Praças e largos podem ser identificados por name/address_line1 se street não vier preenchido. Não usa comparação difusa livre de nomes.

São feitas até duas consultas sequenciais, somente se a anterior não tiver candidato aceitável: primeiro com número; depois sem número. Se já não há número (vazio/s/n), a segunda usa texto com rua, bairro opcional e CEP. O modo estruturado nunca é misturado com text. Preserva número e demais dados originais no banco. Resultados somente de bairro/CEP/cidade continuam rejeitados. Falhas do provedor não provocam novas tentativas.

Limites: HttpClient de 10 s por requisição e prazo de 15 s para as duas consultas juntas, inferior ao timeout de 20 s do protótipo. Erro de endereço permanece 422 e indisponibilidade permanece 503. Não muda autenticação, rotas, DTOs, entidades ou schema. Não adiciona ViaCEP, geocodificação em lote ou mapa. O protótipo mantém o aviso de localização aproximada. PDFs não foram regenerados.

Validação da tolerância ampliada: compilação sem erros (três avisos CS8618 preexistentes), 53 verificações simuladas aprovadas e 17 testes do protótipo aprovados, com node --check em app.js e catalog.mjs. Os testes simulados cobrem os dois modos de fallback, limite de duas consultas, aceitação aproximada, rejeição de bairro/CEP/cidade, erros do provedor, coordenadas inválidas e cancelamento. Não houve gravação de registros nem alteração de schema nesta etapa.

Comparação real no Geoapify em 19/10/2026: antes 6/10 endereços de teste aceitos; depois 10/10. Conjunto: MASP, Sesc Pompeia, Pinacoteca Luz, Pinacoteca Estação, Pinacoteca Contemporânea, Museu do Amanhã, CCBB Rio, Paço do Frevo, CESAR School e Museu Oscar Niemeyer. Consultas realizadas pelo adapter .NET, sem passar pelo CRUD nem gravar no banco; aceitação do resultado não comprova precisão do imóvel. Reinicie a API para carregar a implementação nova.


### Teste adicional no Recife — 19/10/2026

Foram consultados dez novos endereços pela implementação atual: nove aceitos e UFRPE rejeitada com 422 por ausência de candidato da rua na região informada. Sem alteração do algoritmo e sem gravação no banco. Veja [endereços, fontes, coordenadas e diagnóstico](validacoes/geocodificacao-recife-2026-10-19.md). PDFs preservados.

### Abrangência atual — 19/10/2026

A pedido do usuário, foi retirada a restrição temporária por estado: as consultas não enviam state=Pernambuco nem incluem um estado fixo no texto. A validação por sigla/nome de Pernambuco foi removida. A busca volta a considerar todo o Brasil, mantendo o filtro countrycode:br, o prefixo de três dígitos do CEP, o nome da via, a exigência de cidade/estado identificáveis no retorno e as demais regras de aproximação e fallback. Portanto não aceita indiscriminadamente ruas homônimas distantes.

Protótipo e comentários do .http foram ajustados. Os exemplos podem continuar usando endereços de Pernambuco, mas não representam limite de cobertura. Sem alterações em DTOs, endpoints, autorização, entidades ou banco. PDFs preservados.

Validação da retirada da restrição: compilação sem erros (três avisos CS8618 preexistentes), 10 verificações simuladas aprovadas (PE/CE/SP, ausência de estado fixo nas duas modalidades de consulta e manutenção de país/CEP/estado identificável), 17 testes do protótipo aprovados e sintaxe JavaScript verificada. Nenhuma nova consulta real ao Geoapify nem gravação no banco nesta retirada.


## Ambiente de testes: interesses do usuário — 20/10/2026

O painel agora oferece “Adicionar categorias de interesse” (POST /api/Category/AddCategoryToUser, corpo array [1,2]) e “Ver programações pelos meus interesses” (GET /api/Programming/GetUserProgrammingPreferences, sem corpo). Reaproveita JWT e IDs; seleção de categorias ativas por checkbox; sugestões abrem detalhes públicos. O .http inclui os dois endpoints e uma consulta após criar/editar programação. IDs inválidos, lista vazia, falta de atomicidade e vínculos repetidos entre envios continuam limitações do backend, descritas nos documentos 01/02.

Restaurada a sobrecarga interna GetAllProgrammingsbyHostId(int) no contrato/serviço para corrigir o CS7036 no perfil do host. As demais mudanças do usuário foram preservadas. EF informou ausência de alterações de modelo desde a última migration, sem confirmar aplicação ao banco.

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
