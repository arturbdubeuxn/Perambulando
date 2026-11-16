# Carrossel Pro - Correções dos itens 2 a 5

Data: 27/10/2026. Escopo autorizado: itens 2 a 5 da revisão do carrossel. A distribuição entre assinantes e as outras regressões de SubscriptionService não foram alteradas.

## Alterações

- ProgrammingRepository.GetAllProgrammingsWithProHost captura UTC atual uma vez e exige assinatura com Status Active, StartsAt <= now e now < ExpiresAt. Não depende de uma consulta anterior de assinatura para materializar Expired.
- A consulta exige programação, host e proprietário ativos, além de EndDate > now. Eventos em andamento são mantidos; encerrados são excluídos.
- SubscriptionMapping preserva Active para assinatura vigente; retorna Expired no vencimento e Inactive antes do início. Cancelled e ausência de assinatura mantêm o comportamento esperado. DTO continua com somente id/status/startsAt/expiresAt.
- ProgrammingController captura ArgumentException da paginação e retorna ProblemDetails 400. Validação continua no ProgrammingService: take de 1 a 100 e skip não negativo.
- Protótipo identifica a operação como Carrossel de programações Pro e mostra os critérios/limites. Valores iniciais take=10 e skip=0; GET público sem JWT/corpo. Exemplos .http adicionados.

## Verificações

Build completo aprovado em saída isolada: zero erros e dez avisos existentes. O erro de sintaxe da interface apontado na revisão já estava corrigido no código recebido para esta tarefa; não foi necessário alterar a interface.

35 verificações aprovadas com API/EF/PostgreSQL reais em banco descartável. Cenários: assinatura vigente, futura, vencida ainda marcada Active, cancelada, conta sem assinatura, proprietário/host/programação inativos, evento encerrado e evento em andamento. Confirmados os status de mapping, acesso público 200, endereço no DTO, paginação ordenada e lista vazia 200.

Take zero/negativo/acima de 100, skip negativo e valores textuais inválidos retornaram 400 com ProblemDetails. A consulta excluiu a assinatura vencida mesmo sem modificar seu status armazenado, comprovando que a vigência é avaliada diretamente no SELECT. Os dez registros de teste permaneceram armazenados durante as consultas.

Verificador local: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/CarouselFlowCheck.csproj e .cs. API isolada em porta livre e Production, para não executar migrations. Schema criado apenas no banco com prefixo carousel_flow_; processo e banco temporários removidos no finally. Banco principal preservado.

Protótipo: node --check em app.js e catalog.mjs e 63 testes com API simulada aprovados. Novo caso confirma operação pública, valores de paginação iniciais, ausência de JWT/corpo e apresentação do erro 400.

## Pendências preservadas

A ordenação continua por StartDate/Id. Distribuição/rotação entre assinantes não foi implementada nesta tarefa. A revisão anterior também apontou IsProAsync rejeitando conta sem assinatura e ActivateAsync verificando apenas o status; esses comportamentos não fazem parte dos itens solicitados e não foram corrigidos aqui.

Sem alterações de entidades, migrations, configuração de simulação, bloqueio de concorrência, pagamentos ou PDFs. API do Visual Studio não reiniciada; recompilar/reiniciar para testar os arquivos novos.
