# US17 - Revisão do código atual

Data: 27/10/2026. Referência: docs/09-us17-plano-pro.md. Revisão do checkout salvo nesta data; nenhuma correção de produção, migration ou pagamento executado nesta tarefa.

## Resultado

A base de assinatura foi implementada nas camadas existentes, mas a US17 ainda está parcialmente concluída. O próximo passo recomendado é corrigir a configuração EF, o controle da simulação, a validade efetiva do Pro e as operações concorrentes antes de gerar/aplicar a migration e avançar para o carrossel.

Build em saída isolada: aprovado, zero erros e dez avisos existentes. Teste local SubscriptionCodeReview.csproj: onze verificações de comportamento aprovadas com dependências simuladas, duas falhas funcionais reproduzidas como observações e inspeção do modelo EF sem conexão. Docker indisponível nesta revisão: não houve verificação do schema real, persistência, SQL concorrente ou endpoints HTTP.

## Achados em ordem de prioridade

### P1 - Ativação ignora a configuração de simulação

SubscriptionService recebe IConfiguration no construtor (linha 10), mas não utiliza a configuração em ActivateAsync. Com Pro:SimulationEnabled=false, o teste conseguiu ativar a assinatura. SubscriptionController tem um catch para a mensagem de simulação desabilitada (linha 32), porém o service não lança essa falha. A ativação gratuita fica disponível sempre que a API puder ser acessada por uma conta ativa.

Corrigir o service para exigir true explícito; configuração ausente/false deve negar ativação de forma controlada. Cancelamento e consulta podem continuar disponíveis. Testar os três estados de configuração.

### P1 - Relacionamento adicional indevido no modelo EF

Subscription.cs declara a navegação user na linha 8; SubscriptionConfiguration.cs:13 configura HasOne<User>() sem vinculá-la. O modelo real de EF confirmou duas FKs: UserId, relacionamento único sem navegação, e userId, shadow property ligada à navegação user em relacionamento não único. Não é apenas uma divergência de estilo.

Vincular a navegação explicitamente ao relacionamento de UserId. A tabela de usuário atual é Users; não AspNetUsers como descrito em documentação anterior. Revisar o modelo e script SQL antes da migration. A inspeção também retornou HasPendingModelChanges=true; não foi localizada migration de Subscription nem sua definição no snapshot atual. O schema do banco não pôde ser confirmado.

### P1 - Perfil e tokens continuam sinalizando Pro após expiração

Subscription.IsEffective e SubscriptionMapping calculam corretamente a expiração. Porém UserMapping.cs:37 usa user.isPro e JwtTokenService.cs:20 emite a mesma flag, sem consulta da vigência. O teste mostrou SubscriptionResponseDTO com Expired e benefício false enquanto User.isPro continuava true.

Centralizar a consulta de benefício efetivo e utilizar a assinatura vigente no perfil, nos novos tokens e, futuramente, nas permissões de carrossel/estatísticas. Claims antigas não devem autorizar benefícios. Não depender de uma rotina que atualiza a flag para que o vencimento funcione.

### P2 - Concorrência ainda não protegida no caso de uso

O service faz GetByUserIdAsync e depois AddAsync/UpdateAsync. A repetição sequencial é idempotente, mas duas primeiras ativações simultâneas podem consultar ausência e tentar inserir juntas. O índice único protege a unicidade, não transforma o conflito em retorno idempotente. Não há tratamento correspondente de DbUpdateException no controller/repository; uma violação pode resultar em 500. Ativar e cancelar simultaneamente também precisam de política explícita.

A documentação menciona bloqueio de linha e transação explícita, mas o repositório atual só chama SaveChangesAsync. Usuário e assinatura estão rastreados no mesmo DbContext no caminho atual, então o SaveChanges pode persistir suas alterações de forma atômica; isso não resolve a corrida entre consultas e escritas concorrentes. Não confundir ausência de transação explícita com ausência de atomicidade do SaveChanges.

Definir serialização por usuário ou controle de concorrência, manter o índice único e tratar os conflitos esperados. Testar em PostgreSQL descartável antes de afirmar que a concorrência está resolvida.

### P2 - Documentação descreve proteções ausentes

Fontes anteriores dizem que SimulationEnabled é respeitada e que há bloqueio de linha, e referenciam testes locais no perfil de outro usuário. O código atual não implementa essas proteções. Esses resultados históricos não validam este checkout. Esta revisão substitui essas alegações para o estado atual; os PDFs anteriores não foram regenerados.

### P3 - Organização e nulabilidade

A base segue as camadas e interface de mapping existentes. Melhorias menores: nomear a navegação User conforme o padrão das outras entidades, expandir construtores/catches comprimidos para legibilidade e revisar retornos anuláveis de AddAsync/UpdateAsync quando a operação bem-sucedida sempre devolve a entidade. O nome da navegação só deve ser alterado com o mapeamento explícito revisado.

## O que já foi cumprido

| Item | Estado e evidência |
|---|---|
| Entidade Subscription e enum | Implementados; regra IsEffective utiliza início inclusivo/fim exclusivo |
| Configuração e DbSet | Implementados, mas relacionamento precisa de correção e migration está pendente no modelo |
| Camadas e DI | Repository, Service, AppService, Mapping, interfaces e registros Scoped presentes |
| DTO de resposta | Situação, validade, IsSimulation e flags de benefícios presentes |
| Controller | Activate, MySubscription e Cancel autenticados; usuário identificado pelo JWT |
| Ativação mensal | UTC e AddMonths(1) implementados |
| Ativação repetida sequencial | Testada; não adiciona linha/período no cenário simulado |
| Cancelamento/reativação | Cancelamento imediato e repetição testados; reativação reaproveita linha |
| Sem assinatura | DTO retorna Inactive/benefícios false, sem erro |
| Expiração no DTO | Testada; converte Active vencida para Expired e benefícios false |
| Exemplos HTTP | Rotas de assinatura já adicionadas |

## Ainda não cumprido

- Controle de SimulationEnabled; validade efetiva no perfil/JWT; relacionamento único correto; política de concorrência e validação do banco.
- Entidade/configuração/persistência de ProgrammingInteraction, eventos e deduplicação de EventId.
- Endpoint de interações, limitação de frequência e coleta correta no frontend.
- Consulta de carrossel com Pro efetivo, distribuição e paginação estáveis.
- Estatísticas por host, agregações, período, autorização de titular/Pro e séries diárias.
- Fluxos especiais do protótipo para assinatura, carrossel e painel. Catálogo automático de rotas não equivale a implementar esses fluxos.
- Testes HTTP/PostgreSQL da assinatura e testes de vencimento com JWT antigo; testes de concorrência e autorização dos benefícios.

## Sequência recomendada

1. Corrigir o relacionamento de Subscription e confirmar uma única FK para UserId.
2. Aplicar configuração explícita para simulação e centralizar vigência do Pro sem criar dependência circular entre UserService e SubscriptionService.
3. Resolver concorrência de ativação/cancelamento e revisar a coerência de User.isPro como compatibilidade.
4. Preparar a migration para revisão; testar em banco descartável antes de aplicar no principal. O Program.cs em Development bloqueia mudanças pendentes e executa migrations; considerar isso na revisão.
5. Validar os três endpoints com banco real isolado, atualizar a documentação e o fluxo do protótipo.
6. Implementar carrossel, depois coleta de eventos e consulta estatística. Nenhuma integração financeira nesta etapa.

## Verificações executadas

- Build isolado do backend com -p:NuGetAudit=false: zero erros/dez avisos existentes.
- Onze verificações locais de ausência, vigência/fronteiras, expiração no DTO, ativação/repetição, isPro no objeto rastreável simulado, cancelamento/repetição, reativação e conta inativa.
- Reprodução de ativação com simulação desabilitada e divergência de isPro após expiração.
- Inspeção de metadados do EF: FKs UserId e userId, sendo a segunda shadow property; HasPendingModelChanges=true.
- Sem acesso ao banco real: Docker desligado/indisponível. Nenhuma migration gerada/aplicada. Nenhuma edição de código funcional, reinicialização de API ou exportação de PDF.
