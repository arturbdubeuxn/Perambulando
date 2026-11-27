# Agenda e localização dos estabelecimentos — 27/11/2026

## Implementação

Pedido: preencher eventos anteriores/próximos, utilizar endereços reais e mostrar o pin do evento no lugar do estabelecimento de comércio/gastronomia somente durante sua duração. O usuário recusou novas alterações no backend; esta entrega altera apenas frontend, documentação e dados do lote fictício.

### Dados gravados

Aplicado [agenda-enderecos-2026-11-27.sql](agenda-enderecos-2026-11-27.sql) somente nos 75 hosts do usuário técnico `demo-rosarinho-20261125`. Criados 305 eventos: dois passados e dois futuros por host, mais cinco eventos de demonstração em andamento em hosts de gastronomia/comércio. Preservados IDs, datas, preços, imagens e vínculos dos 50 eventos anteriores.

No instante da validação: 355 eventos do lote, sendo 151 encerrados, 199 futuros e cinco em andamento. Todos têm imagens, descrições e categorias; links de cobrança permanecem vazios. Os cinco eventos em andamento duram três horas, começando 30 minutos antes da aplicação. Eles encerram normalmente; a carga não cria eventos permanentes nem os reprograma automaticamente.

Os 75 endereços sintéticos foram substituídos por 75 referências reais distintas de rua/número e pontos georreferenciados do OpenStreetMap. Campos de bairro foram conferidos com os polígonos municipais, em vez de inventar bairros para coordenadas. CEP foi mantido vazio quando não publicado na referência (45 casos), sem usar um CEP fictício. Não foram copiados nomes, telefones ou CNPJs de empresas reais.

| Bairro confirmado pela geometria | Hosts fictícios |
|---|---:|
| Encruzilhada | 21 |
| Graças | 18 |
| Tamarineira | 8 |
| Arruda | 6 |
| Rosarinho | 5 |
| Espinheiro | 5 |
| Jaqueira | 4 |
| Aflitos | 3 |
| Torreão | 2 |
| Casa Amarela | 2 |
| Ponto de Parada | 1 |

As coordenadas ficam a até 1.854 m do ponto de referência usado pelo lote (-8.0275, -34.894), segundo PostGIS. OSM pode representar o ponto do estabelecimento ou centro de edificação; isso não comprova entrada exata, situação cadastral ou atendimento real. Nomes, eventos, preços e funcionamento permanecem fictícios, com aviso de ausência de vínculo com os locais reais.

Os três hosts fora do lote e seus dados foram preservados. Permaneceram 357 dias/496 períodos de funcionamento no banco inteiro; esta entrega não os alterou.

### Frontend

- `nearbyPins.ts` resolve datas, host e endereço por endpoints públicos existentes, com até quatro consultas de detalhes em paralelo e reutilização da consulta do mesmo host dentro do lote de respostas.
- Em comércio/gastronomia no mesmo `AddressId`: antes de começar, pin azul do estabelecimento; `startDate <= agora < endDate`, pin laranja do evento; no término exato, volta ao estabelecimento. Um timer acompanha as próximas mudanças sem exigir recarregar a página. Programações de produtores e eventos em outro endereço mantêm seus resultados originais.
- O frontend compensa a regra atual da API, que ainda oculta hosts com eventos futuros. Recupera os dados públicos do host e usa as coordenadas do evento no mesmo endereço. Não modifica o endpoint, suas consultas SQL ou DTOs. Em filtros de categoria, não introduz hosts alheios ao filtro. Em falhas de consulta dos detalhes, preserva o resultado recebido da API.
- Paginação continua contando os registros originais da API, antes da consolidação de pins, para evitar pular/duplicar páginas. Pins repetidos do mesmo host são consolidados; eventos simultâneos no mesmo endereço usam o início mais antigo e, no empate, o menor ID.
- `NearbyMap.tsx` é reutilizado no mapa de proximidade e nos detalhes da programação, com OpenFreeMap/MapLibre, atribuição e recuperação de erro existentes.
- `frontend/assets/enderecos-demonstracao-recife.json` guarda as 75 referências públicas utilizadas na carga, incluindo tipo/ID OSM. Os detalhes usam a referência somente quando cidade, rua, número, bairro e CEP coincidem. Isso mantém a coordenada do mapa igual à gravada no PostGIS, inclusive em eventos encerrados, sem depender de consulta externa para o lote.
- Fora dessas referências, o fluxo existente de geocodificação permanece; o cache agora depende do endereço completo, valida coordenadas e ignora o cache antigo. Foi retirada a tentativa baseada apenas no CEP, que podia localizar o centro postal em vez do evento. A lista de próximos continua consultando `Nearby/GetNearMe` com as coordenadas do evento e excluindo o evento selecionado.

### Fontes e atribuição

- Dados de rua/número e pontos: [OpenStreetMap e licença ODbL](https://www.openstreetmap.org/copyright), consulta limitada à região por Overpass. Consulta realizada em 25/11/2026; referências selecionadas/conferidas em 27/11/2026.
- Bairros: [Prefeitura do Recife — Mapas de limites e divisões territoriais](https://dados.recife.pe.gov.br/dataset/mapas-de-limites-e-divisoes-territoriais), recurso Limites dos Bairros – 2023 GeoJSON, licença ODbL. Atribuição também exibida no mapa.

## Proteção e execução

Backup PostgreSQL custom anterior à carga: `%TEMP%/perambulando-before-agenda-20261127-122736.dump` (70.533 bytes), também em `/tmp/` do container. Catálogo conferido com `pg_restore --list`; restauração completa não testada. TEMP não garante retenção permanente.

Script transacional com bloqueio consultivo, verificação dos 75 hosts/endereços, proteção contra endereço compartilhado com dados externos, comparação JSON dos registros fora do lote e preservação dos campos dos eventos existentes. Executado primeiro com ROLLBACK e depois com COMMIT. Reexecuções confirmaram zero inserções/vínculos duplicados. Nenhum usuário, role, assinatura, schema, migration, configuração Docker ou arquivo em `backend/` foi alterado nesta entrega.

## Validações realizadas

- Contagens e verificações dentro da transação aprovadas: mínimo de dois passados e dois futuros por host; datas, preços, endereços, imagens e categorias consistentes; dados externos preservados.
- PostGIS confirmou 75 endereços distintos com SRID 4326, distância máxima e bairros; todos os 355 eventos têm imagens e categoria.
- ESLint e TypeScript aprovados; 16 testes Node aprovados, incluindo limite exato de início/fim, retorno do pin azul, duplicatas, categorias, produtores, eventos em outro endereço, cache e referências.
- Exportação Expo Web aprovada.
- Edge/Playwright com respostas HTTP simuladas usando um retrato dos registros já gravados e mapa externo real: perfil sem login com horários e as duas faixas; evento encerrado com mapa no ponto real; consulta de proximidade usando as coordenadas correspondentes do banco; nenhuma chamada de geocodificação externa para esse endereço.
- Fundo vetorial conferido após trazer o mapa à área visível e aguardar o carregamento real da camada; captura confirma ruas/bairros e ponto na região de referência. Preservada a integração Leaflet/MapLibre existente e o isolamento do iframe.
- Pins de gastronomia/comércio e produtor conferidos, com cards clicáveis. Relógio do navegador avançado comprovou a troca automática de azul para evento e o retorno ao azul no término, sem recarregar a página nem alterar datas no banco.

## Pendências e limites

API de aplicação não estava ativa durante a validação e não foi iniciada. O usuário deve iniciá-la normalmente para visualizar os dados e exercitar a integração HTTP real; a validação de interface não substitui esse teste.

A regra da API permanece igual em outros clientes: a troca temporal foi implementada no mapa do frontend. O cache de referências resolve o lote de demonstração, não substitui o geocodificador para todos os endereços futuros. Fotos são ilustrativas externas; funcionamento e eventos não representam as empresas presentes nesses endereços.

Protótipo externo não alterado porque não houve alteração da API. PDFs preservados.
