# Atualização do banco para o modelo atual

Data: 25/11/2026. Branch: `PaginaGestaoHost`. Atualização autorizada pelo usuário após [auditoria](auditoria-schema-2026-11-25.md).

## Implementação executada

- Backup PostgreSQL custom criado antes da atualização. Cópia local: `C:/Users/danie/AppData/Local/Temp/perambulando-before-schema-20261125.dump` (45.100 bytes); cópia no container de banco: `/tmp/perambulando-before-schema-20261125.dump`. O catálogo do backup foi lido com pg_restore --list; restauração completa não foi testada. O arquivo contém dados do ambiente e não foi adicionado ao repositório. A pasta temporária não garante retenção permanente.
- EF CLI 10.0.11 instalado em pasta temporária, sem alteração dos pacotes ou ferramentas do repositório. Modelo compilado e conferido com has-pending-model-changes: corresponde ao snapshot da última migration existente.
- [SQL das oito migrations](migrations-pendentes-2026-11-25.sql) gerado pelo EF, sem transações individuais, e revisado antes da execução. Não foram criadas ou editadas migrations de aplicação.
- [Script de atualização](atualizar-modelo-2026-11-25.sql) aplicou correção de CNPJ e todas as migrations em uma transação, com locks, precondições e validações de preservação antes do commit. O script é específico ao estado inicial auditado de 21 migrations e recusa reexecução sobre o banco já atualizado.
- API local da porta 5014 pausada durante a atualização e reiniciada em Production após o commit. Está em segundo plano (PID 30464 na execução desta entrega); logs em `%TEMP%/perambulando-api-20261125-update.stdout.log` e `.stderr.log`. Não iniciar outra API na mesma porta enquanto esse processo estiver ativo. O frontend e o banco não foram reiniciados.

## Alterações no schema e dados

Aplicadas as oito migrations de AddSubscription até AddHostsPhotos. O histórico passou de 21 para 29. Criadas Subscriptions, ProgrammingInteractions, HostOpeningDays, HostOpeningPeriods, Roadmaps, RoadmapProgrammings e HostsPhotos. Hosts recebeu MinPrice/MaxPrice anuláveis numeric(12,2), índice único de CNPJ e check de formato; chaves estrangeiras, índices e demais restrições das migrations foram criados. Users.isPro foi removido conforme a migration existente, após confirmar que não havia valores true.

Os 75 CNPJs `DEMO-ROS-00001` a `DEMO-ROS-00075` foram substituídos por identificadores sintéticos alfanuméricos de 14 caracteres: prefixo DEMO, sequência de oito dígitos e dois verificadores. Todos passaram pela classe CnpjValidations real do projeto, usada em um programa temporário, sem consulta ao provedor. Isso comprova compatibilidade com o algoritmo, não cadastro ou validade na Receita Federal. Os CNPJs dos dois hosts anteriores não foram alterados.

Os 77 IDs de hosts e 50 IDs de eventos, usuários e vínculos foram preservados. A transação comparou o conteúdo JSON de todas as linhas de Hosts, Programmings e Users antes/depois, desconsiderando apenas os CNPJs corrigidos, novas colunas de preço e coluna isPro removida. Fotos, nomes, datas, preços dos eventos, coordenadas e endereços existentes não foram modificados. As novas tabelas não receberam assinaturas, estatísticas, horários ou roteiros inventados; os preços dos estabelecimentos permanecem nulos até preenchimento.

O [seed](seed-rosarinho-2026-11-25.sql) foi compatibilizado com o modelo atual: não depende de Users.isPro e calcula identificadores sintéticos com verificadores. Reexecução no lote existente confirmou ausência de duplicação; uma carga nova do zero não foi executada neste banco.

## Validações realizadas

- Build do backend e verificação EF do snapshot aprovados; nenhuma diferença de modelo pendente.
- EF migrations list confirmou as 29 migrations aplicadas.
- Sete tabelas novas e duas colunas de preço com tipo e nulabilidade corretos.
- Nenhum CNPJ com formato inválido ou duplicado.
- 77 hosts/50 eventos mantidos; 75 hosts fictícios com imagem e 50 eventos com imagem.
- GET /api/Programming/Details/{id}: todos os 50 eventos responderam HTTP 200, com CORS para http://localhost:8081, ID correto e imagem presente. O HTTP 500 por Hosts.MaxPrice deixou de ocorrer.
- Categorias, listagem de eventos, HostFilter?Take=100 e Nearby/GetNearProgramming/1 responderam HTTP 200. Rotas existentes preservadas.
- Reexecução do seed detectou lote completo, sem inserções adicionais.

## Limites e pendências

Revisão visual do clique em eventos no navegador pendente. Fluxos autenticados de edição, contratação, horários e galerias não exercitados nesta entrega; foram verificadas criação do schema e consultas públicas. Não foram preenchidos dados comerciais reais nem consultadas APIs de CNPJ/Geoapify.

Nenhum código do backend, frontend, modelo, rota, DTO, Program.cs, CORS ou migration foi alterado nesta atualização. Não houve nova funcionalidade/contrato de API; protótipo externo preservado. Nenhum PDF gerado.
