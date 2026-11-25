# Auditoria do schema — PaginaGestaoHost

> Estado posterior: atualização autorizada e aplicada em 25/11/2026. As oito migrations estão instaladas e os identificadores fictícios foram corrigidos. Este documento preserva o diagnóstico anterior; veja [execução e validações](atualizacao-modelo-2026-11-25.md).

Data: 25/11/2026. Solicitada apenas verificação e informação das atualizações necessárias. Nenhuma migration, correção de dados ou atualização do schema aplicada.

## Evidências

Comparados os arquivos Up das migrations da branch `PaginaGestaoHost`, o catálogo information_schema, índices e histórico do PostgreSQL do container `perambulando-dev-database-1`. Banco com 21 migrations aplicadas até `20261027144220_AddCity`; checkout com 29, sendo oito pendentes.

O endpoint `/api/Programming/Details/1` respondeu HTTP 500; log do PostgreSQL confirmou `column h.MaxPrice does not exist`. A consulta inclui o host, cujo modelo atual também espera MinPrice. O endpoint de categorias respondeu HTTP 200 com CORS, mas a resposta 500 de detalhes não apresentou Access-Control-Allow-Origin, explicando o erro genérico Failed to fetch no navegador. Não é evidência de ausência do evento nem de falha da foto.

## Migrations pendentes, na ordem

| Migration | Efeito previsto no banco |
|---|---|
| 20261027205921_AddSubscription | Remove Users.isPro e cria Subscriptions, com estado, vigência, cancelamento, vínculo ao usuário e índice único por usuário. Não transfere o valor antigo para assinaturas. |
| 20261027213653_AddSubscriptionChange | Up vazio: apenas registro da migration no histórico. |
| 20261029191257_AddProgrammingInteractions | Cria ProgrammingInteractions para visualizações/cliques, índice único de EventId, índices por evento/data e usuário e restrição Type entre 0 e 3. |
| 20261101123823_AddUniqueHostCnpj | Valida formato e unicidade após normalização, normaliza CNPJ, cria índice único e check de formato. Interrompe se houver dados incompatíveis. |
| 20261104205955_AddHostHours | Cria HostOpeningDays e HostOpeningPeriods com horários e indicador de fechamento no dia seguinte. Um registro de dia por host/dia da semana. Não preenche horários existentes. |
| 20261105173104_AddPricePerHost | Adiciona Hosts.MinPrice e Hosts.MaxPrice como numeric(12,2), ambas anuláveis. Corrige a ausência imediata apontada pelo endpoint de detalhes. |
| 20261114192817_AddRoadMap | Cria Roadmaps e RoadmapProgrammings, vinculando usuários, roteiros, hosts e eventos com ordem e datas. |
| 20261116014703_AddHostsPhotos | Cria HostsPhotos para galeria com PhotoUrl, IsActive, CreateAt e vínculo ao host. Não migra LogoUrl para a galeria automaticamente. |

São sete tabelas novas e duas colunas de preço; inclui também remoção de coluna, normalização de dados, índices, chaves estrangeiras e restrições. As migrations já existem: não é necessário inventar uma migration só para contornar a consulta de detalhes. Não marcar migrations como aplicadas nem pular etapas manualmente.

## Auditoria dos dados que podem impedir a atualização

Consultas realizadas em transação READ ONLY:

- 77 hosts e 50 eventos presentes; 75 hosts pertencem ao lote fictício.
- 75 CNPJs não passam pela expressão normalizada `^[A-Z0-9]{12}[0-9]{2}$`: todos do lote, com identificadores DEMO-ROS-00001 a DEMO-ROS-00075. Sua normalização resulta em 12 caracteres, não 14. Foram escolhidos como placeholders sem validade cadastral, mas impedem AddUniqueHostCnpj.
- Nenhum grupo de CNPJs duplicados após a normalização atual. O registro histórico de duplicados não descreve o estado atual; não há motivo para excluir ou mesclar hosts com base nele.
- 75 CNPJs seriam normalizados pela migration, mas a validação do formato a interromperia antes disso.
- Nenhum usuário está com Users.isPro=true neste banco. Ainda assim, AddSubscription remove a coluna e deve ser incluída no backup/revisão; não cria contratos retroativamente.

## Sequência recomendada, ainda não executada

1. Fazer backup do banco antes de qualquer atualização.
2. Preparar um mapeamento dos 75 identificadores de demonstração para identificadores sintéticos únicos compatíveis com o formato, mantendo nomes, IDs, endereços, fotos, eventos e vínculos. Não atribuir CNPJs de empresas reais nem apresentar a carga como cadastro empresarial validado. Os validadores de aplicação/provedor têm exigências adicionais à expressão SQL.
3. Revisar o SQL gerado das oito migrations antes da aplicação e conferir se o modelo atual tem alterações adicionais não cobertas pelo snapshot. Esta auditoria leu o schema e as migrations; não executou verificação EF de pending-model-changes nem gerou SQL pelo EF.
4. Após autorização, aplicar a cadeia de migrations com a API parada e validar contagens, histórico, índices, detalhes de eventos, listagem de hosts, galerias, horários e interações.

Não basta executar database update agora: AddUniqueHostCnpj bloqueia a cadeia antes de AddPricePerHost. Nenhum host precisa ser apagado para resolver os identificadores sintéticos.

## Limites

Sem alteração de código do backend, frontend, Program.cs, CORS, modelos ou migrations. Sem gravações no banco nesta auditoria. Protótipo externo e PDFs preservados. Atualização e testes posteriores dependem de autorização específica.
