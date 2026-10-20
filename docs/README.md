# Documentação do Perambulando

Atualização: 19/10/2026. As mudanças de localização foram preparadas na branch Artur-Desktop e a migration foi aplicada ao banco local, com verificação das colunas, índices, versão do PostGIS e contagens dos registros.

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

Há 15 endpoints nos controllers. A requisição GetAllProgrammingsbyHostId presente no .http não corresponde a uma action atual; o método interno continua sendo usado pelo perfil de host. Foram adicionados docker/postgres/Dockerfile e compose.postgis.yaml para preparar uma imagem PostgreSQL 17 com PostGIS e reutilizar o volume existente. Location é opcional, tem índice GiST e não é serializada diretamente. A geocodificação via Geoapify está integrada; a chave precisa ser configurada para uso real. A busca por proximidade ainda não está implementada. Nenhum PDF foi regenerado nesta etapa.

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
