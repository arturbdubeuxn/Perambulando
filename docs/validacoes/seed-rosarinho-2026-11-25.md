# Carga fictícia do Rosarinho e arredores

> Revisão em 27/11/2026: a carga inicial abaixo é histórica. Os 75 hosts agora usam endereços reais de referência com coordenadas OSM e bairros conferidos; têm pelo menos dois eventos passados e dois futuros cada. O lote passou de 50 para 355 eventos, incluindo cinco em andamento no instante da atualização. Os demais registros foram preservados. Use o [script e relatório atuais](agenda-enderecos-2026-11-27.md); o seed inicial recusa o novo total e não deve ser usado para recriar/atualizar esta agenda.

> Atualização posterior em 25/11/2026: banco alinhado às 29 migrations; CNPJs de demonstração substituídos por identificadores sintéticos normalizados com verificadores. Os formatos inválidos citados no histórico abaixo não são mais o estado atual. O seed foi compatibilizado. Veja [execução e validações](atualizacao-modelo-2026-11-25.md).

Atualização: 25/11/2026. Execução solicitada pelo usuário no banco do container `perambulando-dev-database-1`.

## Implementação

Script: [seed-rosarinho-2026-11-25.sql](seed-rosarinho-2026-11-25.sql). Carga transacional, com bloqueio consultivo, validação de contagens antes do commit e marcador fixo para não duplicar o lote em reexecuções. Um lote preexistente incompleto interrompe a execução em vez de sobrescrever registros.

Foram adicionados 75 hosts, 75 endereços e 50 eventos em 50 hosts distintos, com 50 vínculos de categoria e oito categorias de demonstração. Os outros 25 estabelecimentos permanecem sem eventos. Os dois hosts anteriores foram preservados: total atual de 77 hosts e 50 eventos. Não foi interpretado o pedido como autorização para apagar estabelecimentos existentes para reduzir o total global a 75.

| Bairro | Hosts novos | Eventos |
|---|---:|---:|
| Rosarinho | 30 | 22 |
| Tamarineira | 9 | 6 |
| Encruzilhada | 9 | 6 |
| Ponto de Parada | 9 | 6 |
| Aflitos | 9 | 5 |
| Jaqueira | 9 | 5 |
| Total do lote | 75 | 50 |

Os eventos vão de 26/11/2026 a 14/01/2027, das 18h às 21h no fuso America/Recife. Há 25 gratuitos e 25 pagos com preços ilustrativos, sem links de cobrança. Temas incluem música, artes, literatura, dança, gastronomia, feiras e jogos.

Todos os nomes e descrições sinalizam ficção. Ruas, números, CEP 00000000 e coordenadas são sintéticos; os pontos aproximados servem somente para testar proximidade, sem comprovar endereço ou limites oficiais de bairros. CNPJs no formato DEMO-ROS-00001 são identificadores de teste, sem validade cadastral e sem consulta à Receita. Não podem passar pelos fluxos de validação de CNPJ/CEP como dados reais. Imagens, telefone e links sociais ficam vazios. Não foram consultados Geoapify ou provedores de cadastro.

Proprietário técnico: `demo-rosarinho-20261125`, com papel HOST e e-mail reservado `demo.rosarinho@example.invalid`. Não possui senha e não foi configurado para login. Nenhuma conta existente recebeu estabelecimentos adicionais. Os registros não aparecem em Meus estabelecimentos de outro usuário autenticado.

## Validações realizadas

- Schema real e limites conferidos antes da carga; nenhum model, migration ou código do backend foi alterado.
- Contagens anteriores: 2 hosts e nenhum evento. Contagens posteriores: 77 hosts e 50 eventos.
- Lote: 75 hosts, 75 endereços, 50 eventos em 50 hosts distintos.
- Nenhum evento com término anterior ao início, preço mínimo superior ao máximo, endereço diferente do host ou categoria ausente.
- Todos os pontos com SRID 4326 e a menos de 3 km do centro sintético adotado para o Rosarinho.
- Reexecução confirmou lote já completo sem inserções adicionais.
- Horários UTC/local conferidos e ajustados somente nos eventos do lote para início às 18h em Recife.

## Pendências e limites

Visualização no frontend e respostas dos endpoints não testadas. O schema do banco está atrás de alguns modelos presentes no checkout (por exemplo, colunas de preço de Hosts e tabelas de horários); este trabalho não aplicou migrations para reconciliá-los. Eventuais falhas da API por schema não são corrigidas pela carga.

Nenhuma alteração de contrato da API ou funcionalidade: protótipo externo preservado. Nenhum PDF gerado.

## Fotos ilustrativas do lote — 25/11/2026

Executado [imagens-rosarinho-2026-11-25.sql](imagens-rosarinho-2026-11-25.sql) após a carga inicial: 75 LogoUrl de estabelecimentos e 50 ImageUrl de eventos preenchidos em transação, somente no usuário técnico do lote e somente em campos vazios. Fotos selecionadas por tema (cafés, restaurantes, música, artes, livros e encontros); são imagens ilustrativas externas, não retratos dos locais fictícios. Dez URLs do domínio images.unsplash.com verificadas com HTTP 200 e Content-Type image/jpeg antes da gravação. O frontend existente usa esses campos nos cards; não foi necessário alterar telas ou API. Imagens dependem de internet e da disponibilidade do provedor. Galerias adicionais/HostsPhotos não foram criadas. Telefones e links de contato/cobrança continuam vazios. Visualização manual no navegador pendente. Nenhum PDF gerado.

## Funcionamento preenchido posteriormente — 25/11/2026

Os 50 hosts classificados como gastronomia/comércio receberam semanas completas nas tabelas existentes; os 25 produtores não são elegíveis segundo o backend. Veja [horários do lote](horarios-rosarinho-2026-11-25.md) para perfis, validações e limites. Nenhum arquivo do backend foi alterado.
