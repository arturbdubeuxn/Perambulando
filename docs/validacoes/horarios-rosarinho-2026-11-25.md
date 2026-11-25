# Funcionamento semanal dos estabelecimentos fictícios

Atualização: 25/11/2026. Preenchimento autorizado pelo usuário, sem alterações na pasta de backend.

## Implementação executada

O serviço existente OpeningHoursService aceita funcionamento semanal apenas para Gastronomy (1) e Business (2). O lote contém 25 hosts de cada tipo e 25 Productor (0). Foram preenchidos somente os 50 elegíveis; produtores continuam regidos pelas datas das programações, sem horários semanais. Os dois hosts anteriores foram preservados.

[Script executado](horarios-rosarinho-2026-11-25.sql): transação com bloqueio das tabelas de funcionamento, precondições e validações antes do commit. Usa HostOpeningDays e HostOpeningPeriods, com DayOfWeek de 0 (domingo) a 6 (sábado), IsClosed e ClosesNextDay, conforme as implementações existentes. Preenche apenas hosts do usuário técnico `demo-rosarinho-20261125` que não possuem dias cadastrados. Reexecução preserva semanas existentes e não cria duplicatas; não corrige automaticamente semanas parciais ou editadas manualmente.

| Perfil fictício | Quantidade | Funcionamento |
|---|---:|---|
| Comércio | 25 | Segunda a sábado: 09h–12h e 14h–18h. Domingo fechado. |
| Café/livraria do tipo gastronomia | 10 | Segunda a sábado: 08h–20h. Domingo: 08h–13h. |
| Espaço noturno do tipo gastronomia | 10 | Terça a quinta: 18h–23h. Sexta e sábado: 18h–02h do dia seguinte. Domingo: 16h–22h. Segunda fechado. |
| Restaurante, demais hosts do tipo gastronomia | 5 | Terça a domingo: 11h30–15h e 18h–22h. Segunda fechado. |

São horários ilustrativos locais do estabelecimento em Recife, sem conversão para UTC nas colunas time without time zone. Não representam funcionamento de empresas reais. Tipos dos hosts, nomes, preços, eventos, imagens, endereços e CNPJs não foram modificados. Horários não são apresentados como garantia de realização dos eventos fictícios.

Backup custom anterior à carga: `%TEMP%/perambulando-before-openinghours-20261125.dump` no Windows, também em `/tmp/perambulando-before-openinghours-20261125.dump` no container. Catálogo conferido com pg_restore --list; restauração completa não executada. Backup fora do Git, em local temporário sem garantia de retenção permanente.

## Validações realizadas

- 50 semanas completas, 350 dias e 490 períodos gravados; 40 dias fechados sem períodos e 20 períodos com fechamento no dia seguinte.
- Todas as semanas gravadas foram exportadas e aprovadas pela classe OpeningHoursValidations real do projeto em um programa temporário. Nenhuma classe ou função de domínio foi reimplementada para substituir sua validação.
- Script também verifica sete dias distintos, intervalos positivos até 24h, coerência de IsClosed e ausência de sobreposição, incluindo a virada da semana.
- HostFilter respondeu HTTP 200 e retornou as contagens esperadas: segunda às 10h, 35 hosts; domingo às 09h, 10; sábado e domingo à 01h, 10 em cada consulta. Confirma integração com os filtros existentes e o fechamento no dia seguinte.
- Reexecução do script inseriu zero dias/períodos; totais mantidos.
- Banco preservado com 77 hosts/50 eventos; nenhum dia de funcionamento adicionado aos produtores ou aos hosts anteriores.
- Compilação do programa temporário com referência ao projeto real aprovada; git diff da pasta backend vazio.

## Limites e pendências

Conferência visual no frontend e consulta autenticada do endpoint OpeningHours não realizadas. Não foi criada senha para o usuário técnico nem alterada a autorização existente. Não houve mudança de schema, migration, código, contrato da API ou protótipo externo. PDFs preservados.
