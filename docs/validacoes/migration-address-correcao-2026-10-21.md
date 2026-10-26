# Correção da migration AddAddress — 21/10/2026

Branch: Artur-Desktop. Arquivo atual: backend/Projetos - 4/Data/Migrations/20261021193025_AddAddress.cs.

## Alterações feitas

1. A migration confere os limites dos endereços antigos antes de alterar a estrutura. Se algum campo não couber, interrompe com tabela e ID do registro; não trunca textos.
2. Cria Addresses e adiciona AddressId inicialmente anulável, sem default 0.
3. Percorre todos os hosts e programações, incluindo inativos. Insere um endereço por registro, copia logradouro, número, complemento, bairro e Point sem recalcular coordenadas e recebe o ID com INSERT ... RETURNING.
4. Atualiza Hosts.AddressId/Programmings.AddressId com os IDs gerados. Address.CreatedAt vem de Hosts.CreatedAt ou Programmings.CreatedDate; AddWho vem do UserId do host. CEP perde somente o hífen para caber no campo de oito caracteres. Campos vazios históricos são mantidos; não se inventa endereço/número.
5. Confere que nenhum vínculo ficou nulo. Só então torna AddressId obrigatório, cria índices/FKs e remove os índices e campos antigos.
6. Down recria os campos antigos, copia os endereços e coordenadas de volta e depois remove as FKs, AddressId e Addresses. Se existirem endereços sem vínculo, interrompe antes de descartá-los. IDs e metadados próprios de Addresses não têm representação no schema antigo; antes de uma reversão é necessário preservar o histórico desejado.

Foram mantidos os nomes, os tipos finais e o comportamento Cascade definidos na migration gerada pelo usuário. Não foi necessário alterar entidades, configurações, Designer ou snapshot nesta correção. Nenhuma nova migration foi criada. Não houve Update-Database nem reinício da API, cuja inicialização em Development aplica migrations pendentes.

## Testes realizados

- Build GeoLocation sem erros; sete avisos CS8618 preexistentes.
- 39 testes do protótipo com API simulada aprovados após ajustar somente o aviso de revisão; node --check em app.js e server.mjs.
- 20 verificações com SQL gerado a partir das operações reais de Up/Down pelo provider Npgsql e executado em um schema isolado do PostgreSQL, contendo somente dados fictícios e uma transação com rollback final.
- Cobertura: AddressId sem default 0; cópia antes de remoção; dados em excesso/CEP longo bloqueados; programação sem host bloqueada; transferência de hosts/programações ativos e inativos; preservação de textos, coordenadas/SRID, datas/autoria; IDs válidos; FKs validadas; retirada dos campos antigos; Down com restauração dos campos e índices; bloqueio de perda de endereço sem vínculo; banco vazio; rollback removendo o schema de teste.
- Comparadas contagens, presença das colunas antigas e histórico de migrations da aplicação antes e depois: permaneceram iguais. A migration AddAddress não consta como aplicada.
- O teste não abriu uma aplicação ASP.NET nem executou suas migrations na inicialização. Não consultou geocodificação externa. Os arquivos temporários do teste foram removidos após a validação.

## Conferência do banco atual — somente leitura

O banco da aplicação contém 23 hosts e nove programações, mantém as colunas antigas e ainda não aplicou 20261021193025_AddAddress. Nenhuma programação está sem host.

Três registros não cabem no CEP de oito caracteres, mesmo após retirar o hífen:

| Tabela | ID | CEP atual | Problema |
|---|---|---|---|
| Hosts | 12 | 872878282 | Nove dígitos |
| Programmings | 6 | fsdfsdfsd | Nove caracteres, não é um CEP válido |
| Programmings | 7 | FSDFSDFDS | Nove caracteres, não é um CEP válido |

Esses registros NÃO foram corrigidos nem excluídos. A migration corrigida os identifica e interrompe antes da alteração de estrutura. É necessário definir os CEPs corretos ou a destinação desses dados de teste antes de aplicar. Não foi assumido qual dígito remover nem foram inventados CEPs.

## Estado da entrega

Migration corrigida e validada em dados isolados, **ainda não aplicada ao banco da aplicação**. Aguardando revisão do usuário e correção dos três registros. PDFs não foram regenerados.

## AddAddress aplicada — 21/10/2026

Esta atualização substitui o estado pendente registrado nas etapas anteriores. Por autorização do usuário, foi aplicado `20261021193025_AddAddress` no banco local `perambulando`, na branch Artur-Desktop. Antes da operação foi salvo um backup completo em `C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/backups/perambulando-before-addaddress-20261021.dump` (37.519 bytes; catálogo do pg_restore conferido).

Os CEPs inválidos de Hosts ID 12 (872878282) e Programmings IDs 6 (fsdfsdfsd) e 7 (FSDFSDFDS) foram substituídos por string vazia, sem inventar um CEP correto. Os valores anteriores permanecem no backup e neste registro. Os demais campos desses registros foram preservados. Esses três endereços legados continuam precisando de um CEP válido quando forem editados; não houve relaxamento das validações de novos cadastros.

A aplicação foi feita com Database.MigrateAsync no Context real, sem iniciar a API. Confirmados modelo alinhado ao snapshot, somente AddAddress pendente antes da execução e nenhuma migration pendente depois. Foram preservados 23 hosts e nove programações, transferidos para 32 Addresses. Comparados todos os demais campos dos pais, logradouro/número/complemento/bairro, coordenadas binárias/SRID, datas/autoria e CEPs (exceto os três vazios e a retirada de hífen prevista). Conferidas as duas FKs validadas, a remoção das 12 colunas antigas e as contagens de Users, Categories, ProgrammingXCategories e UserXCategories. Não foram excluídos hosts ou programações. Build incremental GeoLocation concluído com zero erros. Não foram realizados novos cadastros nem chamadas de geocodificação nesta etapa; a verificação CRUD pela API continua separada da validação da transferência. PDFs não foram atualizados.
Validação do protótipo após atualizar o aviso: node --check em public/app.js e server.mjs passou. A primeira execução paralela de node --test apresentou ECONNRESET na consulta local de arquivos estáticos (37 aprovados/2 falhas contabilizadas). Repetição sequencial com node --test --test-concurrency=1: 39/39 aprovados, usando API simulada. Os quatro arquivos temporários do executor .NET foram removidos; o backup foi mantido.
