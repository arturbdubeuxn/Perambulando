# Documentação do Perambulando

> Ambiente local de banco atualizado em 26/10/2026: o PostgreSQL 17.11 com PostGIS 3.6.4 definido pelo projeto usa `127.0.0.1:5434`, pois 5432 e 5433 já estão ocupadas por instalações anteriores preservadas. Compose e `appsettings.Development.json` local foram alinhados; as 16 migrations existentes foram aplicadas ao volume novo. O banco anterior foi preservado, mas seus registros não foram migrados. Nenhum código funcional, model, migration ou contrato HTTP foi alterado. Consulte [Docker](05-docker.md).

> Atualização estrutural de 26/10/2026: o código foi organizado como um único repositório com `backend/` e `frontend/`. A solução e o projeto .NET mantêm o nome `Projetos - 4` dentro de `backend/`. `frontend/` contém a aplicação Expo/React Native Web com TypeScript, identidade visual Perambulando e rotas locais para criação de evento e cadastro de host, ainda sem integração com a API. `docs/`, `docker/` e `compose.postgis.yaml` permanecem na raiz. O backend não teve contratos, regras, modelos, migrations ou configuração de execução alterados. Consulte [Arquitetura frontend e backend](08-arquitetura-frontend-backend.md) para a descrição completa. PDFs não foram regenerados.

## Estrutura do repositório — 26/10/2026

- Backend: `backend/Projetos - 4.slnx` e `backend/Projetos - 4/Projetos - 4.csproj`.
- Frontend: `frontend/`, criado com Expo SDK 58, React Native 0.88 e TypeScript 6.
- Compartilhado: `docs/`, `docker/` e `compose.postgis.yaml` permanecem na raiz.
- A separação é feita dentro do mesmo repositório Git; não foram criados repositórios Git aninhados.

Comandos básicos:

```powershell
dotnet build ".\backend\Projetos - 4.slnx"
dotnet run --project ".\backend\Projetos - 4\Projetos - 4.csproj"

cd frontend
npm install
npm start
```

O frontend possui as interfaces responsivas de criação de evento (`/`) e cadastro de host (`/cadastro_host`), com Expo Router e identidade visual Perambulando. Os campos usam somente estado local; não foram adicionados cliente HTTP, variáveis de URL da API, autenticação, armazenamento de JWT, persistência nem regras de negócio.

Validações realizadas em 26/10/2026: `dotnet build ".\backend\Projetos - 4.slnx" --no-restore` concluído com zero erros e sete avisos CS8618 preexistentes; `tsc --noEmit` aprovado; configuração pública do Expo carregada como SDK 58 para Android e iOS; `expo-doctor` aprovou 20/20 verificações. Node.js 24.20.0 LTS e npm 11.19.0 foram instalados no escopo do usuário. Não foram iniciados emulador, API ou banco, nem realizados testes funcionais. Como não houve mudança de contrato ou funcionalidade da API, o protótipo externo não foi alterado. PDFs preservados.

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Atualização: 21/10/2026. A refatoração de Address está preparada apenas no código, aguardando revisão antes da migration. Histórico anterior: As mudanças de localização foram preparadas na branch Artur-Desktop e a migration foi aplicada ao banco local, com verificação das colunas, índices, versão do PostGIS e contagens dos registros.

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
| [08 - Arquitetura frontend e backend](08-arquitetura-frontend-backend.md) | Separação dos diretórios, conteúdo, responsabilidades, execução e fluxo entre aplicativo, API e banco |

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
| Estrutura, dependência ou comunicação entre frontend e backend | Arquitetura frontend e backend; Controllers e DTOs quando houver mudança de contrato |

Atualize os Markdown afetados e suas datas a cada alteração. PDFs somente devem ser atualizados quando o usuário pedir explicitamente; podem representar uma edição anterior às fontes. Confira também o protótipo e o arquivo `.http` quando houver alteração funcional. Não marque testes de execução como realizados quando a análise tiver sido apenas estática.

## Estado importante desta edição

O código preparado para revisão tem 20 endpoints nos controllers; o banco ainda aguarda a migration de Address. A rota antiga GetAllProgrammingsbyHostId foi retirada do .http; o perfil de host continua retornando suas programações. Foram adicionados docker/postgres/Dockerfile e compose.postgis.yaml para preparar uma imagem PostgreSQL 17 com PostGIS e reutilizar o volume existente. Location é opcional, tem índice GiST e não é serializada diretamente. A geocodificação via Geoapify está integrada; a chave precisa ser configurada para uso real. A busca por proximidade ainda não está implementada. Nenhum PDF foi regenerado nesta etapa.

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

## AddAddress aplicada — 21/10/2026

Esta atualização substitui o estado pendente registrado nas etapas anteriores. Por autorização do usuário, foi aplicado `20261021193025_AddAddress` no banco local `perambulando`, na branch Artur-Desktop. Antes da operação foi salvo um backup completo em `C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/backups/perambulando-before-addaddress-20261021.dump` (37.519 bytes; catálogo do pg_restore conferido).

Os CEPs inválidos de Hosts ID 12 (872878282) e Programmings IDs 6 (fsdfsdfsd) e 7 (FSDFSDFDS) foram substituídos por string vazia, sem inventar um CEP correto. Os valores anteriores permanecem no backup e neste registro. Os demais campos desses registros foram preservados. Esses três endereços legados continuam precisando de um CEP válido quando forem editados; não houve relaxamento das validações de novos cadastros.

A aplicação foi feita com Database.MigrateAsync no Context real, sem iniciar a API. Confirmados modelo alinhado ao snapshot, somente AddAddress pendente antes da execução e nenhuma migration pendente depois. Foram preservados 23 hosts e nove programações, transferidos para 32 Addresses. Comparados todos os demais campos dos pais, logradouro/número/complemento/bairro, coordenadas binárias/SRID, datas/autoria e CEPs (exceto os três vazios e a retirada de hífen prevista). Conferidas as duas FKs validadas, a remoção das 12 colunas antigas e as contagens de Users, Categories, ProgrammingXCategories e UserXCategories. Não foram excluídos hosts ou programações. Build incremental GeoLocation concluído com zero erros. Não foram realizados novos cadastros nem chamadas de geocodificação nesta etapa; a verificação CRUD pela API continua separada da validação da transferência. PDFs não foram atualizados.
## Arquivo HTTP e ambiente de testes — 21/10/2026

Atualizado Projetos - 4/Projetos - 4.http após AddAddress: 29 requisições nomeadas. A busca de endereços ficou antes do cadastro de host, com exemplos por logradouro, CEP, consulta curta e vazia. Create de host demonstra endereço novo; create de programação reutiliza result.addressId do host; edições reutilizam address.id dos detalhes. Há alternativas opcionais de criação com endereço existente (host) e novo (programação), identificadas como cadastros adicionais. Enviar exatamente addressId ou address. Mantidos os caminhos result.id/auth.accessToken do host e o JWT encadeado, categorias, consultas públicas e limpeza manual ao final.

Validação: 29 combinações de rota/verbo conferidas contra o OpenAPI da API local; 12 corpos JSON analisados após substituir as variáveis; nomes únicos e referências de respostas conferidos. Nenhuma requisição de criação/edição/exclusão foi executada. O banco e a API já estavam ativos; foram reutilizados o backend na porta 5014 e o protótipo na 5173. Conferidos GET de categorias (200), busca de endereços sem JWT (401), OpenAPI (200), saúde, catálogo e página atualizada do protótipo (200). Não houve mudança de controller, DTO ou migration nesta etapa, nem exportação de PDFs.

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


## Atualização de ProgrammingValidations — 23/10/2026

Implementado `IProgrammingValidations` / `ProgrammingValidations` no domínio, substituindo a dependência incompleta de `IProgrammingRules`. Cadastro e edição aplicam as mesmas regras independentemente do consumidor do serviço. Os validadores genéricos de DTO mantêm as verificações de entrada, e a DI registra a implementação de domínio. Consulte as atualizações de 23/10 nos documentos de regras de negócio, DTOs e controllers.

Build aprovado com sete avisos CS8618 existentes. O conjunto `docs/validacoes/ProgrammingDomainValidation.Tests.csproj` executou 77 verificações aprovadas, sem banco ou serviços externos. Os testes cobrem domínio, AppService e DI; HTTP e protótipo não foram testados nesta etapa. O protótipo não estava disponível nos caminhos locais conhecidos. PDFs não foram regenerados.
Validação: 29 combinações de rota/verbo conferidas contra o OpenAPI da API local; 12 corpos JSON analisados após substituir as variáveis; nomes únicos e referências de respostas conferidos. Nenhuma requisição de criação/edição/exclusão foi executada. O banco e a API já estavam ativos; foram reutilizados o backend na porta 5014 e o protótipo na 5173. Conferidos GET de categorias (200), busca de endereços sem JWT (401), OpenAPI (200), saúde, catálogo e página atualizada do protótipo (200). Não houve mudança de controller, DTO ou migration nesta etapa, nem exportação de PDFs.
## Métodos auxiliares de categorias na edição de programação — 22/10/2026

Na branch Artur-Desktop, a comparação das categorias da edição foi extraída para dois métodos síncronos de CategoryService, declarados em ICategoryService: GetCategoryIdsToRemove(currentCategories, links) retorna os IDs atuais ausentes na seleção desejada; GetLinksToAdd(currentCategories, links) retorna os objetos ProgrammingXCategory recebidos cujas categorias ainda não estão vinculadas. Mantidos os HashSets/Except/Where originais, inclusive a ordem e as referências dos vínculos recebidos; não foram acrescentadas consultas ou gravações nos auxiliares.

ProgrammingService recebe ICategoryService pelo construtor. EditProgrammingAsync consulta as categorias atuais uma vez e chama os dois auxiliares antes da atualização e do EditWithCategoriesAsync existentes. A inscrição de ICategoryService/CategoryService já existia; Program.cs não precisou ser alterado. Rotas, DTOs, autorização, respostas, persistência e comportamento do protótipo/.http permanecem iguais. Nenhuma pasta, entidade ou migration foi criada; PDFs preservados.
Verificação executada nesta extração: dotnet build --no-restore --configuration CategoryHelpers -p:UseAppHost=false concluído com zero erros e sete avisos CS8618 preexistentes; git diff --check passou. Não foram executados testes novos de CRUD nem testes do protótipo, pois os contratos e o código da interface permaneceram iguais. Nenhum dado real foi alterado.

## GetLinksToAdd no ProgrammingXCategoryService — 22/10/2026

Ajustada a responsabilidade do auxiliar: GetLinksToAdd(currentCategories, links) foi movido de CategoryService/ICategoryService para ProgrammingXCategoryService/IProgrammingXCategoryService, com a mesma implementação e retorno dos vínculos recebidos. GetCategoryIdsToRemove permanece no CategoryService. ProgrammingService agora recebe IProgrammingXCategoryService no construtor e chama esse serviço na edição. Foram adicionados somente os registros Scoped do serviço e de IProgrammingXCategoryRepository/ProgrammingXCategoryRepository no bloco existente de Program.cs, necessários para resolver a nova dependência.

Rotas, DTOs, autenticação, respostas e lógica de persistência foram preservados; .http e protótipo continuam compatíveis. Nenhuma pasta ou migration criada. Build CategoryHelpers sem restore aprovado: zero erros e sete avisos CS8618 preexistentes; git diff --check aprovado. Não houve teste CRUD, reinício da API ou acesso ao banco real nesta etapa. PDFs preservados.

24/10/2026: consulta ViaCEP e preenchimento assistido implementados; veja Controllers e DTOs. Cidade/UF persistidos e integração desses campos à Geoapify permanecem pendentes. Sem migration ou atualização de PDFs.


25/10/2026: Minha Receita integrada para consulta automática e validação de CNPJ de hosts. Veja Controllers, Regras, DTOs, BD e Models. Branch codex/minha-receita-cnpj; sem migration nova ou exportação de PDF.


26/10/2026: Favorite preparado nas camadas existentes, com endpoints autenticados, DTO, mapeamento EF, exemplos HTTP e protótipo. Veja Controllers, Regras, DTOs, Banco e Models. Sem migration gerada/aplicada; sem atualização de PDFs. Build e testes simulados aprovados; persistência real pendente da migration revisada.


26/10/2026: DTOs de programação de criação/edição unificados em ProgrammingDTO, com ProgrammingValidation na Application. Host e usuário mantêm DTOs distintos pelas diferenças de contrato. Detalhes nos documentos de Controllers, Regras e DTOs. Build aprovado; catálogo e 51 testes simulados do protótipo aprovados. Sem migration ou PDF novo.


26/10/2026: HostDTO unificou os DTOs de cadastro/edição de host. Typeofhost é obrigatório em ambos, inclusive presença explícita; HostValidation é compartilhado. Esta decisão substitui a separação registrada anteriormente. Veja Controllers, Regras e DTOs.


26/10/2026: HostValidation adaptado ao padrão de verificações explícitas do ProgrammingValidation, incluindo campos do endereço novo. Veja Controllers, Regras e DTOs. Build, 64 verificações simuladas do backend e 51 testes do protótipo aprovados. Sem migration/PDF novo.


26/10/2026: HostValidation passa a conter somente regra de negócio de seleção de endereço. Campos/anotações ficam nos DTOs; dados e autorização ficam no domínio/repositório. Corrigido acesso do ADMIN ativo à edição/desativação de hosts de terceiros. CNPJ único e bloqueio de programação por host inativo preservados. Produtos não existem no módulo atual. Build, 30 verificações simuladas e 51 testes do protótipo aprovados; sem migration/PDF novo.


26/10/2026: DTOs/validadores de criação e edição de usuário unificados em UserDTO/UserValidation. Senha exigida somente no cadastro pelo serviço; edição preserva a senha. Tipo obrigatório em ambos. Build, 28 verificações simuladas do backend e 52 testes do protótipo aprovados. Sem migration/PDF novo.


26/10/2026: conversão de ProgrammingDTO para Programming centralizada em ProgrammingMapping.ToModel, reutilizada no cadastro/edição do AppService. IDs das rotas e vínculos continuam no AppService. Build aprovado; contratos e 52 testes simulados do protótipo conferidos. Sem alteração de schema, migration ou PDF.


26/10/2026: ProgrammingMapping.ToDTO centraliza ProgrammingResponseDTO nos cinco retornos correspondentes do AppService. Mapper de instância na pasta Mapping/Programming, registrado na DI. Build e 52 testes simulados do protótipo aprovados; sem alteração de contrato, migration ou PDF.


26/10/2026: IProgrammingMapping declara ToModel/ToDTO e passou a ser a dependência do ProgrammingAppService, com registro Scoped da implementação. Compilação aprovada; contratos HTTP preservados. Sem migration/PDF novo.


26/10/2026: padrão de mappers por interface aplicado a Host, User, Address, Category, Favorite, UserXCategory e ProgrammingXCategory. Detalhes de programação também centralizados; todos os AppServices usam os mappers registrados como Scoped. Build aprovado, 41 cenários comparados com a baseline anterior e 52 testes simulados do protótipo aprovados. Contratos e regras preservados; sem migration/PDF novo.


26/10/2026: CreateProgrammingLinks implementado no ProgrammingXCategoryAppService com retorno síncrono de lista de modelos. Cadastro/edição de programação reutilizam o método, mantendo gravação no fluxo conjunto existente. Build, 41 cenários de comparação e 52 testes simulados aprovados; sem migration/PDF novo.


26/10/2026: [Avaliação de SOLID, Strategy e regras de negócio](validacoes/avaliacao-solid-strategy-regras-2026-10-26.md), com notas, acertos e 16 achados/decisões ordenados por prioridade. Revisão somente: nenhuma correção de produção ou migration executada. Build aprovado, verificações controladas e 52 testes simulados do protótipo.


26/10/2026: R03 preparado no código: POST de interesses idempotente, índices únicos no modelo e conflito 409 para edições simultâneas. [Detalhes e pendências de banco](validacoes/unicidade-vinculos-categorias-2026-10-26.md). Auditoria real indisponível por Docker não acessível; nenhuma migration/limpeza executada. 13 verificações locais, 41 cenários de mapeamento e 52 testes do protótipo aprovados. Sem PDF novo.


26/10/2026: Docker disponível. [Auditoria e testes reais de R03](validacoes/unicidade-vinculos-categorias-2026-10-26.md): zero duplicidades em 13 interesses e 28 vínculos de programação; 13 verificações reais em banco descartável aprovadas, incluindo concorrência/rollback/índices. Banco descartável removido. Banco principal preservado; índices únicos continuam pendentes de migration revisada. Não é necessária limpeza no estado auditado.


## Bloqueio de login e stamps do Identity — 26/10/2026

Correção R01 preparada: persistência dos campos de bloqueio e stamps do Identity, cinco falhas/15 minutos e proteção de concorrência de usuários/roles. Banco principal auditado somente em leitura; migration pendente de revisão, incluindo backfill das contas existentes. Protótipo informa a política sem alterar rotas ou contratos. PDFs preservados.

Implementação, roteiro da migration e teste reproduzível: [revisão R01](validacoes/identity-bloqueio-login-2026-10-26.md).

## Registro do serviço de vínculos de programação — 26/10/2026

Correção de inicialização do EF: IProgrammingXCategoryAppService registrado como scoped em Program.cs. Build aprovado; nenhuma alteração de contrato HTTP, regra, DTO ou schema. Migration não gerada/aplicada. A CLI dotnet-ef não está disponível no terminal da sessão; repetir pelo Package Manager Console do Visual Studio.

## Verificação após AddFavorite — 26/10/2026

Migration AddFavorite confirmada no banco principal, sem migrations pendentes ou diferença de snapshot. Estrutura Identity, Favorites e índices únicos de categorias instalada. Ainda há pendência R01: stamps das 23 contas antigas e duas roles não foram inicializados; senha incorreta em conta com SecurityStamp nulo causa exceção no Identity. Banco principal acessado somente em leitura nesta verificação; PDFs preservados.

Evidências e teste reproduzível: [auditoria da migration](validacoes/validacao-migration-addfavorite-2026-10-26.md).

## Limpeza autorizada das contas antigas — 26/10/2026

Limpeza autorizada concluída: 23 contas antigas e seus 29 hosts/13 programações removidos com dependentes; roles ADMIN/HOST preservadas com stamps inicializados. Restam 12 categorias e 35 endereços. Cadastro/login precisam ser refeitos para novos testes. Backup local preservado no workspace Perambulando/tmp/perambulando-before-old-users-20261026.dump. PDFs não regenerados.

## Edição de datas e preços decimais — 26/10/2026

R05 corrigido: edição aceita eventos iniciados/encerrados, cadastro mantém início futuro. R09 preparado: preços decimal/numeric(12,2), até duas casas, com migration ProgrammingPricesDecimal gerada e pendente de aplicação no banco principal. Build e 21 verificações PostgreSQL isoladas aprovados; protótipo atualizado com sintaxe e 52 testes simulados aprovados. PDFs preservados.

Detalhes e teste reproduzível: [revisão de datas/preços](validacoes/programming-datas-precos-2026-10-26.md).

## Extração de métodos na edição de programação — 26/10/2026

EditWithCategoriesAsync separado em quatro auxiliares privados no repositório existente, preservando transação única e SaveChangesAsync único. Interface e chamada do service alinhadas à assinatura de três parâmetros. Sem mudanças de rota, DTO, regras ou schema; PDFs preservados.

Validação desta extração: build aprovado; 21 verificações existentes de programação repetidas com sucesso em PostgreSQL isolado, usando AppService/Service/repositórios reais. Banco temporário removido; banco principal não alterado. Não foram criados novos testes nem alterado o tratamento de erros nesta etapa.

## Consulta dos vínculos de uma programação — 26/10/2026

GetAllByProgrammingIdAsync disponibilizado nas camadas Repository/Service de ProgrammingXCategory e conectado ao argumento currentLinks da edição. Retorno List<ProgrammingXCategory>, vazio se não houver vínculos. Sem novas pastas, rotas, DTOs ou alterações de schema; PDFs preservados.

Validação da nova consulta: build aprovado com zero erros e oito avisos existentes. Nenhuma consulta/gravação em banco ou teste HTTP foi executado nesta etapa.

## Joins nos interesses do usuário — 26/10/2026

Refatorados AddAsync/EditAsync de UserXCategoryRepository para sintaxe de consulta com joins. Contratos HTTP e DTOs preservados. Alinhada chamada do service ao argumento expectedCategoryIds e retiradas de duas interfaces declarações de CreateProgrammingXCategoryAsync cujas implementações já tinham sido removidas. Build aprovado; verificações PostgreSQL descritas no relatório vinculado. PDFs preservados.

Implementação e testes: [consultas com joins](validacoes/user-categories-joins-2026-10-26.md).

## Edição de interesses com foreach — 26/10/2026

EditAsync de interesses simplificado com foreach e operações diretas do Context, mantendo as proteções existentes e retorno de todos os vínculos atualizados. Build aprovado com zero erros e oito avisos existentes. AddAsync mantido como escrito pelo usuário, ainda sem SaveChangesAsync; essa pendência de persistência foi informada. Sem alteração de rotas, DTOs, schema ou PDFs.

## Mapping de favorito para model — 26/10/2026

FavoriteMapping/IFavoriteMapping agora têm ToModel(string userId, int programmingId). Nenhuma mudança de contrato HTTP ou persistência. Build tentado, bloqueado pelo erro existente CS1501 em UserXCategoryService: chamada EditAsync com quatro argumentos versus assinatura atual de três. Essa refatoração de interesses não foi alterada na tarefa de mapping. PDFs preservados.

## Model no fluxo de cadastro de favoritos — 26/10/2026

Cadastro de favoritos utiliza ToModel no AppService e passa Favorite por Service/Repository, com interfaces alinhadas. Preservados validações, idempotência/reativação e resposta HTTP. Build tentado: permanece bloqueado por CS1501 em UserXCategoryService (EditAsync chamado com quatro argumentos; interface atual aceita três). Nenhum erro novo de favoritos foi reportado pelo compilador. Sem testes de execução/banco ou PDFs nesta etapa.

## Listagem paginada de programações — 26/10/2026

Adicionado GetAllProgrammingsAsync(take, skip) nas camadas existentes, com retorno de ProgrammingResponseDTO no AppService. Exemplos: (10,0) primeira página; (10,10) segunda. Função interna, sem nova action HTTP ou alteração de protótipo. Build tentado, bloqueado pelo erro existente CS1501 em UserXCategoryService: EditAsync chamado com quatro argumentos, mas assinatura atual aceita três. Nenhum teste de execução/banco realizado nesta etapa; PDFs preservados.

## Endpoint público de paginação — 26/10/2026

Endpoint público GET /api/Programming/GetAllProgrammings?take=10&skip=0 criado e incluído no .http e no protótipo. Padrões take=10/skip=0; 200 com lista e 400 para paginação inválida. Corrigida chamada antiga de EditAsync de interesses com quatro argumentos para a assinatura atual de três. Build aprovado com zero erros e dez avisos existentes. node --check em app.js/catalog.mjs e 53 testes com API simulada aprovados; catálogo real confirmou rota pública e queries numéricas. Sem teste HTTP com banco principal, alteração de schema ou exportação de PDFs.

## Restauração após reorganização do backend — 26/10/2026

Projeto ativo após reorganização: backend/Projetos - 4/Projetos - 4.csproj. Oito mappings e oito interfaces restaurados no caminho novo; AppServices e DI existentes preservados. Build completo aprovado com zero erros e dez avisos existentes; build normal também gerou o executável esperado pelo Visual Studio. Recuperado appsettings.json local ignorado pelo Git com JWT anterior e conexão local PostgreSQL 5432, sem modificar o appsettings.Development.json compartilhado (5434). Verificação temporária em Production na porta 5015 e GET público paginado retornou HTTP 200; processo encerrado, sem migrations. Protótipo aponta agora para backend/Projetos - 4; node --check e 53 testes simulados aprovados, catálogo com 26 rotas. PDFs não regenerados.

## Conexão HTTPS do protótipo — 26/10/2026

Corrigido null na conexão do protótipo: o perfil HTTPS devolvia 307 vazio da porta 5014 para 7042. Proxy agora responde com diagnóstico de redirecionamento e usa a confiança TLS do sistema; botão Verificar conexão ajusta HTTPS e repete somente GET. Validação real: HTTP 307 com mensagem/destino e HTTPS 200 com 12 categorias. 56 testes com API simulada e node --check de server.mjs/app.js aprovados. Protótipo reiniciado; usuário deve recarregar a página. Nenhuma gravação no banco, alteração em Program.cs/CORS ou PDF.

## Movimentação definitiva dos mappings — 26/10/2026

Após a remoção indevida da cópia de backend, os 16 arquivos restantes de Projetos - 4/Application/Mapping foram movidos com git mv para backend/Projetos - 4/Application/Mapping. Nenhum mapping permanece rastreado no diretório antigo. Caminhos absolutos e git -C na raiz foram usados para evitar que a execução dentro de backend altere o destino. A movimentação está preparada no índice, sem commit ou push automáticos; lógica, interfaces, rotas e banco preservados.

Validação: build do projeto em diretório temporário de saída aprovado com zero erros e dez avisos existentes, sem interferir na API em depuração. Git reconheceu os 16 arquivos como renomeações sem alteração de conteúdo. Sem mudança no protótipo, testes novos, migrations ou PDFs nesta movimentação.

## Modelo não persistido de filtros — 26/10/2026

Adicionado ProgrammingFilter ao domínio, com os mesmos campos do DTO de filtro atual e [NotMapped], sem alterações ao contexto ou migrations. Consulte 07-entidades-models.md. A implementação de FilterAsync no AppService continua pendente; o build acusa CS1061 na chamada já existente do controller. Nenhuma API ou banco foi iniciado e nenhum PDF foi regenerado. Esta etapa não altera o contrato HTTP ou o protótipo.
## Mapeamento de filtros — 26/10/2026

Adicionados ProgrammingFilterMapping e IProgrammingFilterMapping, com ToModel/ToDTO explícitos entre o DTO e o modelo não persistido, e registro scoped na DI. Detalhes em 04-dtos.md. Build tentado: permanece o CS1061 da chamada existente a FilterAsync no controller. O fluxo de busca ainda não está implementado; nenhuma rota ou protótipo foi alterado nesta etapa e nenhum PDF foi regenerado.

## Query de filtros e cidade — 26/10/2026

Implementado ProgrammingRepository.FilterAsync na sintaxe LINQ de consulta solicitada, com left joins de categorias, filtros opcionais, Distinct e paginação estável por data/ID. Incluído Address.City nos DTOs, mapping, normalização, deduplicação, configuração EF e migration AddAddressCity preparada; ela não foi aplicada ao banco e os registros antigos ainda precisam ter cidade preenchida. Corrigido somente o await ausente na delegação de FilterAsync já criada pelo usuário no service.

Validação: 25 verificações isoladas aprovadas em docs/validacoes/ProgrammingFilterQuery.Tests.csproj. O projeto compila os fontes reais de consulta/modelos/configurações/migrations, executa filtros no SQLite em memória (Location ignorada e conversão de decimal para double apenas no contexto de teste), confere tradução PostgreSQL com interceptação antes de conectar, SQL da migration e snapshot. Não houve teste HTTP nem acesso ao banco do usuário.

O build completo foi tentado, mas encontra CS7036 em HostAppService: a chamada GetAllProgrammingsbyHostId(hostId) não corresponde à interface atual que exige userId. Essa alteração em andamento foi preservada. As validações de regras combinadas do filtro no service seguem pendentes. Protótipo indisponível nos caminhos conhecidos; PDFs preservados. As seções desta atualização substituem os registros anteriores que indicavam que FilterAsync ainda não havia sido declarado.

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

## Filtro de programações sem restrições implícitas no protótipo — 27/10/2026

Diagnóstico confirmado em leitura: GET /api/Programming/Filter?take=10&skip=0 retorna 3 programações (15, 16 e 17); a mesma busca com hostId=33 retorna somente a 17. O protótipo herdava state.hostId para uma query opcional, preenchendo automaticamente o host da última criação; preços opcionais também começavam em zero. Corrigido app.js: IDs são reaproveitados automaticamente somente em parâmetros de rota, e minPrice/maxPrice de query começam vazios. Filtros de host/preço continuam disponíveis quando preenchidos explicitamente. Cadastro/edição preservam seus valores padrão e IDs de rota.

A consulta de programações não foi alterada nesta correção: eventos em andamento são permitidos até EndDate; encerrados permanecem fora da busca. As três programações verificadas ainda não haviam iniciado, portanto o resultado único não era causado por datas. 60 testes simulados do protótipo e node --check aprovados; duas consultas HTTP reais de leitura confirmaram os resultados acima. Nenhuma gravação no banco, migration ou reinicialização da API do Visual Studio. Após Ctrl+F5, novos formulários de filtro começam sem host/preços implícitos. PDFs preservados.


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

## Revisão da implementação do carrossel - 27/10/2026

GetAllProgrammingsWithProHost foi implementado nas camadas, mas ainda não está aprovado: build bloqueado por > ausente em IProgrammingAppService; consulta usa somente Status Active e inclui assinaturas vencidas/futuras, proprietários inativos e eventos encerrados; faltam tratamento 400 da paginação e distribuição por assinante. Mapping de assinatura também apresenta Active vigente como Inactive, e IsProAsync passou a lançar falha para conta sem assinatura. Oito comportamentos corretos e cinco falhas foram verificados em consulta/mapping isolados, com PostgreSQL descartável; endpoint completo não pôde ser testado. Sem correções funcionais ou alteração de dados reais. [Relatório completo](validacoes/carrossel-revisao-2026-10-27.md).

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

## Listagem exclusiva para turistas — 28/10/2026

`GET /api/Programming/GetAllTuristProgrammings?take=10&skip=0` exige autenticação e a claim numérica `typeofuser=1`, já emitida pelo JwtTokenService para User.TypeofUser.Turist. Não exige role HOST/ADMIN nem assinatura Pro. O controller bloqueia claim ausente/Local com 403 e utiliza o ID do usuário autenticado, sem aceitar ID ou tipo do usuário pela query.

ProgrammingAppService chama ProgrammingService.GetAllTuristProgrammings, que valida take de 1 a 100 e skip não negativo e consulta IUserRepository.GetbyId. O usuário deve existir, estar ativo e ainda ter Typeofuser Turist no banco; divergência do JWT, usuário inexistente ou inativo resulta em 403. JWT inválido, vencido ou ausente resulta em 401 pelo middleware. O formato do JWT não mudou; contas cujo tipo foi alterado de Local para Turist precisam de token atualizado.

A consulta reutiliza GetAllProgrammingsAsync do repositório: programações e hosts ativos, ordenados por StartDate e Id, com Skip/Take no banco. Retorna ProgrammingResponseDTO com endereço e categories (id, name, isActive); página vazia retorna 200 com []. Não há campo que classifique uma programação como turística: esta funcionalidade restringe quem acessa a listagem, não seleciona eventos por uma categoria turística. Preserva o comportamento da listagem geral quanto às datas, inclusive eventos iniciados ou encerrados. A listagem geral pública permanece disponível.

O frontend pode exibir a seção somente quando a claim typeofuser for 1; o backend continua aplicando a autorização. No protótipo de testes, a operação aparece como “Programações para turistas”, com instrução de acesso e paginação padrão, permitindo testar também as recusas. Exemplos adicionados ao arquivo Projetos - 4.http.

Validação executada: compilação aprovada com zero erros e 10 avisos preexistentes; 45 verificações HTTP/EF/PostgreSQL em banco descartável (28 de regressão e 17 da listagem turística), incluindo 401, 403 por tipo/claim/conta, paginação inválida, resposta vazia, endereço/categorias e exclusão de hosts inativos. Banco descartável removido; banco principal preservado. Node --check aprovado em public/app.js e catalog.mjs e 65 testes simulados do protótipo aprovados. Sem nova pasta de aplicação, migration, reinicialização da API do Visual Studio ou exportação de PDF.

### Revalidação antes do commit — 28/10/2026

GetAllTuristProgrammings aprovado na versão salva: 52 verificações HTTP/EF/PostgreSQL em banco descartável e 65 testes simulados do protótipo, com sintaxe JavaScript e compilação aprovadas. Git diff --check sem problemas após limpeza de espaço em branco. Sem falha funcional encontrada; dados reais preservados. Ocultação da seção no frontend final permanece responsabilidade da interface. [Relatório e limites dos testes](validacoes/turist-programmings-pre-commit-2026-10-28.md). Nenhuma migration ou PDF gerado.


## Estatísticas implementadas em 29/10/2026

Backend de estatísticas implementado: coleta de quatro tipos de interação, favoritos atuais, série diária e ranking. Migration preparada, não aplicada ao banco real. Frontend e protótipo ainda pendentes.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

### Revisão de ProgrammingInteraction — 30/10/2026

Módulo ainda não aprovado: build completo falha com 16 erros por registros de HostStatistics sem classes/interfaces existentes; falta registrar IProgrammingInteractionValidation; reenvio idêntico de EventId causa violação de unicidade sem tratamento. Dez verificações isoladas com PostgreSQL descartável passaram, e os bloqueios de DI/reenvio foram reproduzidos. Sem teste HTTP da aplicação completa e sem alteração funcional nesta revisão. [Relatório com evidências e próximos passos](validacoes/programming-interaction-revisao-2026-10-30.md). Banco principal e PDFs preservados.

### Revalidação de interações após ajustes — 30/10/2026

Build e DI corrigidos: aplicação completa compila e responde. Em 11 verificações HTTP/BD com banco descartável, persistiu um bloqueio: reenvio idêntico do EventId retorna 500, em vez de 204. Evento novo retorna 204 e reutilização conflitante retorna 409. [Evidências atualizadas](validacoes/programming-interaction-revisao-2026-10-30.md). Sem mudanças funcionais, migration ou PDF nesta revisão.

### Interações: idempotência e concorrência corrigidas — 30/10/2026

Reenvio de EventId com mesmo ProgrammingId, Type e UserId retorna 204 sem inserir ou mudar CreatedAt; reutilização com outros dados retorna 409. Validação reconhece eventos já aceitos; service reutiliza o registro existente; repository recupera a linha vencedora ao disputar especificamente o índice único EventId. Falhas de outras constraints não são ocultadas. Sem alteração de DTO, rota, autorização, modelo ou migration.

Build aprovado com zero erros e 10 avisos preexistentes; 24 verificações reais HTTP/BD/repository e 66 testes simulados do protótipo aprovados, incluindo concorrência idêntica e conflitante. Banco descartável removido e principal preservado. [Detalhes da correção e evidências](validacoes/programming-interaction-revisao-2026-10-30.md). PDFs preservados; API do Visual Studio não reiniciada.

### Interações: regressão de concorrência na última revisão — 30/10/2026

Retornar ProgrammingInteraction no service é compatível e compila, mas a remoção da recuperação de EventId duplicado no repository reintroduziu o risco de 500 sob concorrência. Quatorze verificações HTTP/BD passaram, seguidas de falha 23505 no teste de inserções concorrentes do repository. Aprovação anterior não se aplica a esta versão. [Evidências atualizadas](validacoes/programming-interaction-revisao-2026-10-30.md). Sem alterações funcionais ou em dados reais nesta revisão.

## US17 — Resumo de estatísticas implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Summary exige JWT de usuário ativo, propriedade do host ativo e Pro vigente no banco. Não há exceção administrativa. Retorna hostId, startDate, endDate e contadores long: detailViews, carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow. Sem dados, os contadores são zero. Período UTC de início inclusivo/fim exclusivo, padrão de 30 dias e limite 366. Interações incluem programações desativadas no histórico. Favoritos ativos de contas ativas representam o total atual e não são filtrados pelo período. Retornos: 200, 400 (período/ID), 401 (autenticação/conta), 403 (Pro) e 404 (host/propriedade).

Implementado nas camadas existentes com HostStatisticsFilterDTO/HostStatisticsSummaryDTO, respectivos modelos NotMapped, mappings com interfaces, AppService, Service e Repository. Service concentra autorização/período; mappings só copiam campos; joins/agregações executam no banco. Nenhuma tabela de totais ou migration nova. A execução depende das migrations existentes de assinatura/interações/favoritos no banco utilizado.

Coleta aprovada em 24 verificações reais após a correção do usuário; Summary aprovado em 35 verificações HTTP/EF/PostgreSQL, incluindo contagens e bloqueio imediato por cancelamento/expiração com mesmo JWT. Build sem erros, 10 avisos preexistentes; snapshot sem mudanças pendentes. Protótipo e .http atualizados; datas de query convertidas para UTC, totais exibidos e 67 testes simulados aprovados. Testes reais em bancos descartáveis removidos; principal preservado, API do Visual Studio não reiniciada e PDFs não exportados. Daily, Ranking, coleta automática e painel definitivo são as próximas etapas. [Regras, implementação e validação](validacoes/us17-host-summary-2026-10-30.md).

## Validações do resumo encapsuladas — 30/10/2026

Todas as verificações e a definição do período padrão foram movidas de HostStatisticsService para Domain/Validations/Validations/SumarryStatitcsValidations, com interface ISumarryStatitcsValidations em Domain/Validations/Interface e registro scoped no Program.cs. Mantida a grafia solicitada pelo usuário. A classe injeta IHostRepository, IUserService e ISubscriptionService, seguindo o padrão de ProgrammingInteractionValidation.

Validate retorna Task<HostStatisticsFilter>: aplica as mesmas verificações de filtro, usuário, ID, propriedade, Pro, UTC, ordem das datas e limite 366 dias, e devolve uma nova instância com as datas efetivas. Não altera o filtro original. HostStatisticsService injeta somente o repository de estatísticas e essa validação; aguarda Validate e passa o período retornado à consulta. Regras, mensagens, ordem das verificações, status HTTP e contrato permanecem iguais; mappings continuam sem regras.

Build aprovado com zero erros e 10 avisos preexistentes; 35 verificações reais HTTP/EF/PostgreSQL do Summary aprovadas após a refatoração, confirmando também a DI. Banco descartável removido e principal preservado. Protótipo sem mudança de contrato/formulários: sintaxe JavaScript e 67 testes simulados aprovados. Git diff --check aprovado. Sem migration, reinicialização da API do Visual Studio ou exportação PDF.

## US17 — Série diária implementada — 30/10/2026

GET /api/Host/{hostId}/Statistics/Daily usa os mesmos filtros e autorização do Summary por ISumarryStatitcsValidations. Retorna lista ordenada de {date, detailViews, carouselClicks, ticketClicks, nearbyClicks}, com dias UTC sem eventos preenchidos com zero. Inclui histórico de programações desativadas; não contém favoritos históricos. Início inclusivo/fim exclusivo e períodos parciais preservam as horas do filtro. Padrão de 30 dias de duração pode tocar 31 datas; máximo 366 dias de duração pode tocar 367 datas. Fim à meia-noite não gera dia extra.

HostStatisticsDaily (NotMapped), HostStatisticsDailyDTO e mapping com interface seguem as pastas existentes; repository agrega no banco e service preenche lacunas, sem repetir validações. Nenhuma tabela ou migration nova. Controller usa try/catch. .http e protótipo atualizados; resultado apresentado como tabela diária em UTC.

Summary revalidado antes da implementação (35 verificações). Daily e regressão do resumo aprovados em 73 verificações HTTP/EF/PostgreSQL, com fuso da conexão America/Recife; build sem erros e 10 avisos preexistentes; snapshot sem mudanças. Sintaxe JS e 68 testes simulados do protótipo aprovados. Bancos descartáveis removidos; banco principal preservado. Sem restart da API do Visual Studio ou exportação PDF. Ranking é a próxima etapa. [Contrato, regras e testes](validacoes/us17-host-daily-2026-10-30.md).

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


## Limite de três categorias — 31/10/2026

Limite de categorias: programações aceitam de 1 a 3 categorias; preferências do usuário aceitam de 0 a 3. Cadastro e edição rejeitam excesso com 400. POST de preferências considera vínculos já armazenados. Protótipo bloqueia a quarta seleção; edição permite trocar categorias. Build sem erros (10 avisos preexistentes), 17 verificações de validações/service e 84 testes simulados do protótipo aprovados. Testes HTTP/PostgreSQL e concorrência real pendentes por Docker desligado; nenhuma migration, limpeza de dados, alteração do Expo ou exportação de PDF.


## Extração das validações de adição de preferências — 31/10/2026

As verificações de UserXCategoryService.AddAsync foram movidas para Domain/Validations/Validations/UserXCategoryValidations, através de IUserXCategoryValidations em Domain/Validations/Interface. Segue o padrão de validação assíncrona e injeção por construtor já utilizado no Domain. O registro scoped foi adicionado em Program.cs.

Validate recebe userId e os vínculos: rejeita coleção nula, usuário vazio, vínculos de outro usuário, total acumulado acima de três, IDs inválidos e categorias inexistentes/inativas. Usa ICategoryService para consultar preferências atuais e categorias ativas. Mensagens e exceções preservadas. Lista vazia é válida e não executa consultas de categorias; o service mantém somente o retorno vazio sem persistência, além de chamar a validação e delegar o cadastro ao repository.

A edição não foi refatorada nesta etapa. Repository, transação, bloqueio concorrente e verificação do total antes de salvar permanecem como estavam. Nenhuma rota, DTO, autenticação, resposta, model ou migration mudou; revisão do protótipo confirmou compatibilidade dos fluxos existentes, sem alteração funcional de interface.

Build sem erros, com 10 avisos preexistentes. Foram aprovadas 24 verificações locais de validações/service com dependências simuladas, incluindo regressões dos limites, vínculo alheio, usuário vazio, coleção nula, categoria inválida/ausente e ausência de gravação em rejeições. Não foi executada nova integração PostgreSQL nem reiniciada a API principal. PDFs preservados.


## Dados fictícios para teste de interações — 31/10/2026

Com autorização expressa, a migration existente 20261029191257_AddProgrammingInteractions foi aplicada ao banco local perambulando em localhost:5432. Era a única migration pendente. Cria ProgrammingInteractions, FKs, check de tipo e índices existentes no código, incluindo unicidade de EventId. Referências anteriores à ausência dessa tabela neste banco ficam superadas. Não foram criadas migrations novas.

Foi inserida uma conta fictícia HOST, com assinatura Pro ativa até 30/11/2026, host 37 e programações 20, 21, 22, 23 e 24. Foram distribuídas 20 interações anônimas, datadas nos 14 dias anteriores à carga, para aparecerem no período padrão das estatísticas: 4 DetailView, 5 CarouselClick, 5 TicketClick e 6 NearbyClick. Quantidades por programação: 20=3, 21=3, 22=5, 23=6, 24=3. Favoritos não foram criados. Endereço e CNPJ do host são sintéticos, inseridos diretamente para teste, sem consultas ViaCEP/Geoapify/CNPJ; não representam cadastro verificado de uma empresa real.

A conta é dona das programações, mas as interações foram atribuídas a visitantes anônimos para não representar auto-interações do responsável. Verificadas a senha pelo Identity, a role HOST, a assinatura vigente, os cinco registros, os vinte eventos e o total 20 por HostStatisticsRepository.GetSummaryAsync. Credenciais de teste foram entregues no chat; senha não registrada na documentação. Nenhum dado preexistente removido, nenhuma API principal reiniciada e nenhum PDF exportado. Não foi realizado login HTTP nesta carga.


## Revisão sênior — 31/10/2026

Avaliação da versão salva: **6,5/10** para MVP em desenvolvimento. Foram reproduzidos 15 cenários de defeitos em banco/API descartáveis; 129 verificações de estatísticas e 84 testes simulados do protótipo passaram. Prioridades: conta inativa com JWT válido, limites de categorias sob concorrência, CNPJ duplicado, favoritos/preferências repetidos e exclusão de conta com assinatura. Sem correções funcionais, migrations, alterações no banco principal ou exportação de PDFs nesta revisão. A versão salva de UserXCategoryRepository insere diretamente e não contém o bloqueio/checagem final citados em atualizações anteriores; a avaliação atual registra essa pendência. [Relatório completo, evidências e ordem de correção](validacoes/revisao-senior-2026-10-31.md).
