# US17 - Remoção da flag Pro do usuário

Data: 27/10/2026. Alteração autorizada pelo usuário para adotar Subscription como única fonte do benefício. Não foram geradas/aplicadas migrations ou alterados usuários reais.

## Alterações

- Removida a propriedade User.isPro e suas atribuições em ativação/cancelamento.
- JwtTokenService não emite mais a claim isPro. Identidade, roles, assinatura e expiração do JWT preservadas.
- Adicionado ISubscriptionService.IsProAsync/SubscriptionService.IsProAsync. A função valida a conta via fluxo existente e calcula Status Active, início inclusivo e fim exclusivo no horário UTC atual.
- UserAppService recebe ISubscriptionService e utiliza a consulta para preencher UserProfileDTO.IsPro, passando o resultado para IUserMapping.ToDTO(User, bool)/UserMapping. O JSON do perfil mantém isPro e não exige novo login para refletir ativação, cancelamento ou vencimento.
- UserService permanece independente de SubscriptionService; a DI foi validada na inicialização da API isolada.
- Corrigido o relacionamento da navegação Subscription.user com UserId. Metadados EF confirmam uma FK única explícita, sem a shadow property userId adicional da revisão anterior.
- Exemplos HTTP incluem consulta de perfil após ativação/cancelamento com o mesmo token.

## Auditoria e migration pendente

Banco principal consultado somente em leitura: três usuários, nenhum isPro=true, e tabela Subscriptions inexistente. Não houve transferência automática de benefício nem alteração da coluna real.

O próximo passo de banco é revisar e gerar uma migration que crie Subscriptions (PK, FK UserId para Users com Restrict, índice único por usuário e campos da entidade) e remova Users.isPro. Snapshot/migrations existentes não foram editados manualmente. Revalidar contagem de Pro imediatamente antes de aplicar se houver novos dados.

Importante: o código novo de Profile consulta Subscriptions; antes de usar esse código no banco principal é necessário aplicar a migration revisada. O Program.cs atual em Development detecta modelo pendente e também executa migrations: não iniciar essa etapa como atalho para a revisão. Dados existentes ficam preservados enquanto a migration não for aplicada.

## Validações executadas

Build isolado aprovado: zero erros e dez avisos existentes na compilação completa. Trinta verificações reais com HTTP, login, DI, EF e PostgreSQL em banco descartável aprovadas:

- Modelo User sem isPro, Subscription com uma FK e indicação de modelo pendente de migration.
- Login e identidade preservados; token novo não contém isPro.
- Perfil sem assinatura retorna false.
- Ativação torna perfil Pro com o token emitido anteriormente.
- Ativação repetida preserva período na precisão de microssegundos do PostgreSQL.
- Cancelamento remove o benefício do perfil sem novo login; reativação reutiliza a linha.
- Vencimento é refletido no perfil e MySubscription sem atualizar o usuário.
- Token legado válido com claim isPro=true não sobrepõe assinatura vencida.
- Assinatura com início futuro não concede benefício.
- Fluxos não criam duplicidade sequencial de assinatura.

Verificador local: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/SubscriptionIsProFlowCheck.csproj e .cs. Banco descartável com prefixo subscription_ispro_check_, schema criado somente nele via EnsureCreated e API isolada em Production/porta livre. Processo e banco temporários removidos ao terminar; banco principal preservado.

Protótipo: node --check em app.js/catalog.mjs/server.mjs e 61 testes com API simulada aprovados. Novo teste cobre JWT sem claim, perfil Pro/normal e claim legada divergente. O protótipo já usa isPro do perfil; não foi necessária alteração do JS de produção nessa parte. Exemplos e README atualizados.

## Limites e pendências não alteradas

Esta tarefa não implementa o controle de SimulationEnabled, a concorrência de ativação/cancelamento, o carrossel ou as estatísticas. Essas pendências da revisão anterior continuam abertas. Não foi iniciado servidor adicional em portas do Visual Studio. PDFs não regenerados; a fonte do plano foi atualizada para a decisão mais recente.
