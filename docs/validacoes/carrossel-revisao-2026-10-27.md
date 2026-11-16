# Revisão do carrossel Pro - 27/10/2026

Revisão solicitada pelo usuário, sem correções de código funcional, migrations ou alterações de dados reais. O endpoint de consulta foi implementado nas camadas, mas o fluxo ainda não está pronto para aprovação.

## P1 - Compilação bloqueada

Application/Interfaces/IProgrammingAppService.cs:16 declara Task<List<ProgrammingResponseDTO> sem fechar o segundo >. Build do backend falhou com CS1003 nessa linha. Assinatura esperada: Task<List<ProgrammingResponseDTO>> GetAllProgrammingsWithProHost(int take, int skip).

Isso impede validar o endpoint completo desta versão. Não foi corrigido automaticamente durante a revisão.

## P1 - Elegibilidade Pro verifica somente o status persistido

ProgrammingRepository.cs:185 aceita qualquer assinatura com Status Active, sem StartsAt/ExpiresAt. A expiração persistida depende de uma consulta de assinatura; a consulta do carrossel acessa a tabela diretamente e não chama SubscriptionService.GetAsync. Portanto uma assinatura vencida ainda marcada Active continua promovendo eventos, e uma assinatura com início futuro também entra.

Aplicar a vigência diretamente na consulta SQL: StartsAt <= UTC atual e UTC atual < ExpiresAt. Não chamar um service por programação em um foreach para corrigir isso, pois criaria consultas repetidas. Também falta conferir p.Host.User.IsActive para excluir proprietários inativos; host ativo não significa proprietário ativo.

Os três casos foram reproduzidos com a expressão LINQ atual em PostgreSQL descartável.

## P1 - Mapping apresenta conta Pro vigente como Inactive

SubscriptionMapping.cs:20-22 entra no if para qualquer Active e retorna Expired se venceu ou Inactive em todos os demais casos. Uma assinatura vigente nunca retorna Active pelo DTO. Reproduzido isoladamente com StartsAt passado e ExpiresAt futuro.

Preservar Active dentro da vigência; retornar Expired quando venceu e Inactive quando ainda não iniciou. Essa falha diverge entre a resposta usada pelo frontend e a consulta de destaque do backend.

## P1 - Usuário sem assinatura não consegue consultar o perfil normalmente

SubscriptionService.IsProAsync lança UnauthorizedAccessException quando não há assinatura. UserAppService.GetProfileAsync chama esse método após encontrar uma conta válida, e UserController.Profile não trata a exceção. Uma conta gratuita pode resultar em 500 no perfil, em vez de IsPro=false. Conclusão por leitura do fluxo; HTTP não executado porque a aplicação está com compilação bloqueada.

Não ter assinatura é um estado normal. Retornar false nesse caso; ausência/inatividade do usuário continua sendo uma validação separada.

## P2 - Programações encerradas aparecem no destaque

A consulta nova verifica programação/host ativos, mas não EndDate. O teste mostrou evento encerrado no resultado. Pelo plano do carrossel, eventos em andamento devem aparecer, mas encerrados não: usar EndDate > UTC atual, sem exigir StartDate futuro.

## P2 - Paginação inválida não vira falha controlada

ProgrammingService.cs:188-195 lança ArgumentException para take <= 0 ou skip < 0, mas a nova action ProgrammingController.cs:226-229 não tem o tratamento correspondente. Com os filtros inválidos, a exceção escapa e pode virar 500; o padrão esperado é ProblemDetails 400. A validação no service é correta, falta sua tradução no controller. Não há limite máximo para take; o plano sugeriu até 100.

## P2 - Distribuição entre assinantes ainda não implementada

OrderBy(StartDate).ThenBy(Id).Skip/Take é estável e correto para paginação simples, mas não atende à proposta de rodadas por usuário. Um assinante com muitos eventos antigos pode ocupar todas as primeiras posições. Ainda não há rotação ou distribuição antes da paginação.

Definir se o MVP aceita somente lista cronológica Pro ou se mantém a regra do plano. Se mantida, implementar a distribuição por usuário antes de paginar, com referência estável para evitar repetição entre páginas.

## P2 - Reativar depende do estado persistido da assinatura

ActivateAsync retorna a assinatura atual sempre que Status Active, sem verificar seu prazo. Se estiver vencida e não tiver sido consultada antes para transicionar a Expired, clicar Ativar pode apenas devolver a assinatura vencida. É uma regressão relacionada à fonte de elegibilidade do carrossel; revisar as datas nessa regra também. Não foi executada ativação real nesta revisão.

## Pontos corretos

- Fluxo Controller -> AppService -> Service -> Repository e respectivas interfaces foi criado.
- AppService reaproveita ProgrammingMapping.ToDTO e ProgrammingResponseDTO.
- Consulta usa AsNoTracking e Include(Address), pagina no banco e desempata ordenação por ID.
- Any sobre Subscriptions evita multiplicar programações por join de assinatura.
- Filtros de programação ativa e host ativo funcionam; conta sem assinatura e assinatura Cancelled são excluídas.
- O endpoint é público no estado atual por não ter Authorize na action/classe nem fallback obrigatório. AllowAnonymous explícito pode documentar essa intenção, mas sua ausência não é uma falha de autorização nesta configuração.

## Validação e limites

Build completo: falhou com um erro CS1003 em IProgrammingAppService.cs:16. Nenhum teste HTTP da versão completa foi executado.

Para avaliar a consulta sem alterar o projeto, copiou-se somente o método atual GetAllProgrammingsWithProHost e o mapping atual para um verificador local, com namespaces de teste e modelos mínimos equivalentes nos campos utilizados. A consulta LINQ não foi corrigida. As cópias compilam em projeto independente com as mesmas versões de EF/Npgsql do backend; o teste não equivale à compilação ou inicialização de toda a aplicação atual.

O PostgreSQL descartável recebeu dez cenários: assinatura vigente, em andamento, evento encerrado, assinatura Active vencida, assinatura futura, Cancelled, proprietário inativo, host inativo, programação inativa e usuário sem assinatura. Oito verificações de comportamentos corretos passaram; quatro inclusões incorretas foram reproduzidas (vencida, futura, encerrada e proprietário inativo), além do mapping Active -> Inactive.

Fontes locais: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/CarouselCodeReview.csproj e arquivos auxiliares. Banco com prefixo carousel_review_ removido ao terminar; banco principal preservado. Nenhuma migration/PDF/alteração no protótipo foi executada.

## Ordem recomendada

1. Corrigir a assinatura da interface para voltar a compilar.
2. Corrigir a regra de vigência no carrossel, mapping e reativação; conta gratuita deve continuar consultando seu perfil.
3. Excluir eventos encerrados e proprietários inativos.
4. Tratar paginação inválida como 400 e definir teto de take.
5. Implementar ou revisar o requisito de distribuição entre assinantes.
6. Repetir build e testar o endpoint completo em PostgreSQL isolado, atualizar .http/protótipo e registrar os resultados antes de considerar a etapa concluída.
