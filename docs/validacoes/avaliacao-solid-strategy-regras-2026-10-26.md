# Avaliação técnica do Perambulando — 26/10/2026

## Parecer e notas

O sistema possui uma base organizada para um MVP e melhorias concretas de separação de responsabilidades. As prioridades atuais estão em segurança da conta, consistência das regras e integridade dos vínculos. Aumentar o número de classes/interfaces não resolveria esses pontos por si só.

| Critério | Nota de 0 a 10 | Fundamentação |
|---|---:|---|
| SOLID | 6,5 | Interfaces, DI e mappers favorecem separação e testes; regras duplicadas e dependência HTTP/Identity no Domain limitam o isolamento. |
| Strategy — uso efetivo | 5,0 | Há contratos adequados para trocar comportamentos, especialmente geocodificação, mas pouca evidência de famílias de algoritmos alternativos implementadas. |
| Regras de negócio | 6,0 | Propriedade, host ativo, CNPJ e persistência conjunta têm proteção útil; há lacunas de usuário ativo, vínculos repetidos e consistência das categorias/edições. |
| Avaliação geral | 6,0 | Julgamento qualitativo da implementação atual; não é uma certificação ou medição automática. |

A nota de Strategy avalia seu uso atual, não uma obrigação de empregar esse padrão em todo CRUD. Não recomendo criar estratégias artificiais para aumentar a nota.

## Escopo e verificações

- Revisão dos controllers, AppServices, mappers, interfaces, serviços do Domain, repositórios, configurações EF, autenticação e validações salvos no workspace.
- Build ReviewCheck: aprovado, zero erros, sete avisos CS8618 preexistentes.
- Verificações controladas com serviços/repositórios simulados reproduziram: programação encaminhada à gravação sem leitura do usuário ativo; ausência de consulta ao status das categorias da programação; edição de evento já iniciado bloqueada; duas adições do mesmo interesse encaminhadas ao repositório.
- Modelo EF inspecionado em memória: campos de bloqueio/stamps do Identity ignorados; ausência de índices únicos nos dois vínculos de categorias e de índice único de CNPJ.
- 52 testes existentes do protótipo aprovados, com API simulada. Esses testes não demonstram segurança do login, validade de JWT em requisições reais, restrições do banco ou concorrência.
- Não houve conexão com o banco, requisição HTTP autenticada real, teste de ataques, chamada aos provedores, execução/geração de migration ou alteração de código de produção. O schema efetivamente instalado pode conter intervenções manuais não representadas no modelo; não foi auditado.
- A migration de Favorite continua pendente por decisão do usuário. Isso não foi classificado como falha de implementação; impede assumir que a API nova possa ser iniciada/testada no banco atual sem revisão e migração.

## Acertos concretos

1. **Conversões explícitas e encapsuladas.** Mappers com interfaces e DI reduzem duplicação e deixam claro quais campos podem entrar/sair. Não copiam roles, hashes e autoria automaticamente do cliente. Referência: [ProgrammingMapping.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Application/Mapping/ProgrammingMapping.cs:17>).
2. **Vínculos montados sem persistência antecipada.** CreateProgrammingLinks cria objetos ligados à mesma entidade; a gravação fica no caso de uso. Referência: [ProgrammingXCategoryAppService.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Application/AppServices/ProgrammingXCategoryAppService.cs:20>).
3. **Persistência conjunta de programação/categorias.** CreateWithCategoriesAsync adiciona a programação e seus vínculos antes do mesmo SaveChangesAsync. Não é correto afirmar que toda operação precisa de UnitOfWork próprio ou de várias chamadas de SaveChanges para ficar atômica. Referência: [ProgrammingRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/ProgrammingRepository.cs:68>).
4. **Cadastro de host e atribuição de role em transação.** O repositório inicia transação, grava, executa a atribuição da role e faz commit/rollback no mesmo fluxo. Referência: [HostRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/HostRepository.cs:40>).
5. **Autorização de host no servidor.** Alterar/desativar host usa usuário ativo e confirma ADMIN pelo Identity, preservando a autoria. Referência: [HostService.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Service/HostService.cs:120>).
6. **Unicidade de favorito preparada no modelo.** Índice único UserId/ProgrammingId e reativação do vínculo são boas decisões. O índice depende da futura migration. Referência: [FavoriteConfigurations.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Configurations/FavoriteConfigurations.cs:14>).
7. **Integrações substituíveis e com limite de tempo.** HttpClient por interface, timeouts e exceções específicas facilitam testes e trocas de provedor. Referência: [Program.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Presentation/Program.cs:60>).
8. **Proteção útil do CNPJ na API.** A normalização, verificação e advisory lock reduzem corrida entre chamadas da API. A ressalva é a falta da garantia no próprio schema, descrita adiante.

## Ajustes por prioridade

### P1 — corrigir antes de considerar o sistema pronto para produção

### R01. Bloqueio de login não tem os campos persistidos

**O que acontece:** o login chama CheckPasswordSignInAsync com lockoutOnFailure=true, mas AccessFailedCount, LockoutEnabled e LockoutEnd estão ignorados no modelo EF. SecurityStamp e ConcurrencyStamp também são ignorados.

**Consequência:** contadores e estado de bloqueio não são mantidos no banco. A chamada com a opção true não é evidência de que tentativas repetidas serão bloqueadas entre requisições. A remoção dos stamps também limita recursos do Identity e sua proteção contra atualizações concorrentes.

**Ajuste:** revisar quais recursos do Identity serão utilizados, restaurar as propriedades necessárias, configurar o bloqueio e testar tentativas consecutivas com persistência real. Considerar limitação de tentativas por origem como proteção complementar. Guardar SecurityStamp, por si só, não revoga JWTs: o token também precisa ser verificado segundo a política definida.

**Evidências:** [UserConfiguration.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Configurations/UserConfiguration.cs:18>) e [UserController.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Presentation/Controllers/UserController.cs:78>). A ausência das propriedades foi confirmada no modelo EF; não foi executado um teste de força bruta em HTTP.

### R02. Usuário inativo pode continuar operando com token ainda válido

**O que acontece:** ProgrammingService recebe IUserRepository, mas não o consulta no cadastro. Verifica usuário preenchido, propriedade e IsActive do host; não o IsActive do usuário. A configuração JWT valida assinatura/emissor/audiência/tempo, sem verificação global de usuário ativo ou revogação. FavoriteService e alteração de host fazem essa verificação, portanto a política também é inconsistente entre casos de uso.

**Exemplo:** usuário recebe JWT com HOST, depois é desativado, mas o host continua ativo. O fluxo de criação de programação ainda o aceita enquanto o JWT for válido.

**Ajuste:** definir uma política única de usuário ativo/revogação e aplicá-la consistentemente. Verificação na autenticação/autorização e proteção nos casos de uso sensíveis são opções; duração do token e eventual cache/versão de sessão devem seguir essa decisão. Não presumir que IsActive=false invalida automaticamente um JWT já emitido.

**Evidências:** [ProgrammingService.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Service/ProgrammingService.cs:127>) e [Program.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Presentation/Program.cs:133>). Em dependências simuladas, o serviço encaminhou a programação ao repositório com zero leituras do usuário inativo.

### R03. Interesses repetidos e vínculos sem unicidade no modelo

**O que acontece:** a deduplicação atual evita repetição dentro de uma lista, mas o POST de interesses não verifica os vínculos já armazenados. O repositório adiciona todos os recebidos. UserXCategory e ProgrammingXCategory não possuem índice único de par no modelo.

**Exemplo:** enviar duas vezes a categoria 1 para o mesmo usuário encaminha dois vínculos ao repositório. Na programação, a validação da requisição protege a lista, mas edições concorrentes continuam sem uma garantia equivalente no schema.

**Consequência:** registros duplicados, respostas difíceis de interpretar, maior custo de consulta e correções de dados futuras. Se o banco tiver restrição manual fora do modelo, a API ainda precisará tratar a operação repetida corretamente.

**Ajuste:** garantir unicidade UserId/CategoryId e ProgrammingId/CategoryId no banco após auditar/deduplicar os dados, além de tornar o caso de uso de adição idempotente ou rejeitar duplicidade de forma controlada. Definir comportamento de edições concorrentes.

**Evidências:** [UserXCategoryService.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Service/UserXCategoryService.cs:17>), [UserXCategoryRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/UserXCategoryRepository.cs:16>) e [UserXCategoryConfigurations.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Configurations/UserXCategoryConfigurations.cs:11>). A falta de unicidade foi confirmada no modelo, e o serviço repetiu o encaminhamento em duas chamadas simuladas.

### P2 — corrigir na próxima etapa de confiabilidade

### R04. Categoria inativa pode ser vinculada à programação

**O que acontece:** a validação de programação checa IDs positivos, lista não vazia e duplicidade; não consulta existência/status ativo. Uma FK pode impedir ID inexistente, mas aceita categoria existente e inativa.

**Consequência:** a seleção oferecida ao usuário e o que o backend aceita ficam divergentes. Filtrar o GET de categorias ativas não impede envio manual de IDs ou uso de uma seleção que ficou desatualizada.

**Ajuste:** se categorias ativas são requisito do vínculo, validar o estado no comando de criação/edição. Manter a FK como garantia de referência, sem tratá-la como verificação de IsActive. Essa verificação havia sido removida a pedido do usuário; o risco técnico permanece e merece decisão consciente.

**Evidência:** [ProgrammingValidations.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Validations/Validations/ProgrammingValidations.cs:23>). A reprodução simulada confirmou que o cadastro não consultou o repositório de categorias.

### R05. Início futuro bloqueia toda edição de uma programação já iniciada

**O que acontece:** StartDate <= now é rejeitado na validação compartilhada por criação e edição, mesmo se a edição alterar apenas texto ou imagem.

**Consequência:** ao começar o evento, o responsável perde a possibilidade de corrigir informações pelo endpoint atual.

**Ajuste:** definir a regra de edição de eventos iniciados/encerrados. Em geral, início futuro é uma pré-condição de cadastro; editar um evento existente exige uma regra própria ou comparação com as datas originais. Não retirar a regra da criação sem essa decisão.

**Evidência:** [ProgrammingValidations.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Validations/Validations/ProgrammingValidations.cs:38>). Bloqueio reproduzido em EditProgrammingAsync com dependências simuladas. Caso essa proibição seja intencional, deve ser documentada e apresentada na interface.

### R06. CNPJ único depende do caminho de gravação da API

**O que acontece:** HostConfiguration não configura unicidade de CNPJ; a API protege suas gravações por consulta e advisory lock.

**Consequência:** importações, SQL manual e novos fluxos que não sigam a mesma normalização/lock podem violar a regra. O lock global também serializa operações de CNPJs diferentes.

**Ajuste:** manter a proteção atual até preparar uma restrição única sobre a representação normalizada no banco. Auditar dados legados antes da migration. Não é correto afirmar que duas requisições normais da API já duplicariam CNPJ: o lock existente foi criado para proteger esse cenário.

**Evidências:** [HostRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/HostRepository.cs:18>) e [HostConfiguration.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Configurations/HostConfiguration.cs:17>). Ausência do índice confirmada no modelo EF, sem inspeção do schema real.

### R07. Tratamento de erro depende de texto e de detalhes do PostgreSQL

**O que acontece:** a controller decide tratar uma InvalidOperationException pelo conteúdo exato de ex.Message. Também conhece PostgresException, SQLSTATE e nomes de constraints.

**Consequência:** mudar uma mensagem ou um nome de constraint pode transformar um erro esperado em 500. O comportamento HTTP fica acoplado ao banco.

**Ajuste:** definir exceções/resultados específicos para falhas de negócio, traduzir erros de persistência em uma fronteira adequada e padronizar a conversão para ProblemDetails. Não é necessário colocar catch(Exception) em toda action: falhas inesperadas devem ter tratamento central e logs, sem expor detalhes internos.

**Evidência:** [ProgrammingController.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Presentation/Controllers/ProgrammingController.cs:143>) e ProgrammingController.cs:107.

### R08. Mesmas regras de programação na Application e no Domain

**O que acontece:** UTC, início futuro, ordem das datas, faixa de preço e gratuidade são verificadas em ProgrammingValidation e ProgrammingValidations.

**Consequência:** uma regra nova/corrigida pode ser aplicada em apenas um lugar, criando resultados diferentes para chamadas via AppService e chamadas diretas ao serviço.

**Ajuste:** definir uma fonte para regras de negócio; manter validações de formato/preenchimento na entrada. A regra de domínio deve continuar protegida mesmo quando o serviço não for chamado por uma controller. Não remover regras do Domain apenas para diminuir linhas.

**Evidências:** [ProgrammingValidation.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Application/Validations/Validations/Programming/ProgrammingValidation.cs:26>) e [ProgrammingValidations.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Validations/Validations/ProgrammingValidations.cs:38>).

### R09. Preços em float

**O que acontece:** modelo e DTO usam float para MinPrice/MaxPrice.

**Consequência:** representação binária aproximada pode produzir diferenças de arredondamento, especialmente em futuros cálculos/descontos/totais. O fato de o sistema ainda não cobrar pagamentos não torna float uma boa escolha para representar preço.

**Ajuste:** adotar decimal com precisão/escala definidas e política de arredondamento, revisando contrato, dados e migration. Manter latitude/longitude ou outras medidas separadas dessa decisão.

**Evidência:** [Programming.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Model/Programming.cs:21>).

### R10. O Domain conhece HTTP e depende do framework de identidade

**O que acontece:** CnpjExceptionExtensions, no Domain, recebe ControllerBase e devolve ObjectResult. User/serviços também dependem de tipos de Identity, e emissão JWT/configuração está em Domain/Service. Os imports não utilizados de Application são ruído adicional; o problema concreto não é apenas ter um using, mas utilizar tipos e comportamentos de outra camada.

**Consequência:** reutilizar regras em um worker, console ou testes exige trazer dependências web/identidade, e a divisão em pastas não impõe fronteiras de compilação, pois o backend é um único projeto.

**Ajuste:** manter CnpjException no Domain e colocar a tradução HTTP na apresentação. Esse conversor foi uma alteração nossa anterior e recomendo corrigir sua localização. Isolar identidade/emissão de tokens por contratos quando essa separação tiver benefício concreto; não é preciso reescrever o projeto inteiro para aplicar o primeiro ajuste.

**Evidência:** [CnpjExceptionExtensions.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Exceptions/CnpjExceptionExtensions.cs:7>) e Domain/Interfaces/Service/IUserService.cs:8.

### R11. Testes úteis ainda não formam uma proteção durável de backend

**O que acontece:** há testes do protótipo e harnesses de serviços em diretórios temporários. Não encontrei um projeto de testes automatizados de backend integrado à solução atual. Vários testes do protótipo usam API simulada.

**Consequência:** podem passar enquanto o backend mantém um erro de autorização, de configuração EF ou de contrato real. A comparação de mapeamentos valida dados, não valida todo o sistema.

**Ajuste:** incorporar ao repositório testes de regras, autorização e integração com PostgreSQL, com fixtures isoladas. Priorizar os casos P1 e transações/duplicidades. Incluir execução em CI. Evitar testes que apenas repetem os setters do código.

### R12. Busca de endereço diverge entre backend e protótipo

**O que acontece:** AddressRepository exige seis caracteres alfanuméricos; o protótipo anuncia e envia consultas a partir de três.

**Consequência:** o usuário segue a orientação da interface e recebe lista vazia sem entender que o mínimo real é outro. Os testes simulados não identificam a divergência.

**Ajuste:** escolher o mínimo desejado e alinhar repositório, mensagens, documentação e teste de contrato. A revisão não alterou nenhum desses comportamentos.

**Evidência:** [AddressRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/AddressRepository.cs:18>); prototipo-api/public/app.js:589 e :614.

### P3 — melhorias de contrato e evolução

### R13. Required não detecta omissão de bool/float não anuláveis

ProgrammingDTO usa Required em IsFree/MinPrice/MaxPrice, mas esses campos recebem false/zero quando omitidos. Se a exigência for envio explícito, usar anuláveis com Required e ajustar o mapeamento. Se valores padrão forem permitidos, documentá-los e não depender do atributo para distinguir omissão. Referência: [ProgrammingDTO.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Application/DTO/ProgrammingDTO.cs:16>).

### R14. Listagens e consultas devem acompanhar o crescimento

Programações e favoritos são carregados em listas completas; várias operações não propagam CancellationToken. CategoryRepository.GetbyId executa FirstOrDefault síncrono e retorna Task.FromResult, que não torna o acesso ao banco assíncrono. Definir paginação/ordenação estável nas listas que podem crescer, propagar cancelamento nas operações relevantes e usar as operações assíncronas do EF para IO. Isso é uma melhoria de escala; não foi realizado teste de carga. Referência: [CategoryRepository.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Data/Repository/CategoryRepository.cs:46>) e ProgrammingRepository.cs:14.

### R15. Verificação de null após uso da coleção

GetAllProgrammingsByUserCategories faz Select antes de testar userCategories == null. O repositório atual retorna lista não nula; portanto a falha não foi observada no caminho normal. O check é ineficaz caso outra implementação retorne null. Definir contrato de listas nunca nulas e remover o check morto, ou checar antes de enumerar se null fizer parte do contrato. Referência: [ProgrammingService.cs](<C:/Users/Artur/source/repos/Projetos - 4/Projetos - 4/Domain/Service/ProgrammingService.cs:157>).

### R16. Política de administração e concorrência precisa ser explícita

A alteração de host aceita ADMIN confirmado no Identity. As rotas de programação aceitam a role ADMIN, mas o serviço continua exigindo propriedade do host. Isso não é necessariamente um erro: é preciso definir se o administrador pode gerenciar programações de terceiros. Também convém definir como resolver dois PUT concorrentes que alteram o mesmo recurso; os modelos de negócio não têm token de concorrência e os stamps de Identity estão ignorados. Não houve teste de corrida real. Priorizar controle otimista de concorrência quando houver perda de atualização observada/risco de negócio definido, sem adicionar locks globais a todos os CRUDs.

## Avaliação dos princípios SOLID

| Princípio | Avaliação |
|---|---|
| S — responsabilidade única | Melhorou com mappers/validadores; HostService ainda coordena regras, roles, provedor CNPJ e endereço. Número de dependências é um sinal para revisar coesão, não prova automática de violação. |
| O — aberto para extensão | Contratos de provedores e mappers permitem trocar implementações na DI. Regras duplicadas e decisões por mensagens exigem alterações em vários pontos. |
| L — substituição | Não identifiquei violação concreta suficiente para afirmar que heranças/interfaces estão quebradas. Contratos claros de null, listas vazias, exceções e efeitos colaterais são importantes para que substituições sejam seguras. |
| I — segregação de interfaces | As interfaces por responsabilidade são razoavelmente específicas. Evitar um contrato genérico gigante de CRUD/validação que obrigue implementações a expor operações sem sentido. |
| D — inversão de dependência | AppServices e serviços recebem várias interfaces, o que é positivo. O Domain ainda contém adaptações HTTP e dependências concretas do framework. Ter interface não elimina dependência invertida entre camadas. |

Não é obrigatório adotar DDD com entidades ricas, criar um projeto para cada pasta ou usar UnitOfWork próprio para seguir SOLID. Essas decisões precisam resolver um problema concreto. Algumas dependências não utilizadas e imports/nomes inconsistentes merecem limpeza posterior, com prioridade inferior aos achados funcionais.

## Strategy: onde faz sentido e onde não faz

Strategy encapsula alternativas de um comportamento sob um contrato comum. A escolha pode ocorrer na configuração da DI; não precisa acontecer a cada requisição.

O melhor ponto atual é IGeocodingService: outro provedor pode implementar GeocodeAsync e ser selecionado na composição. A integração existente também tem características de Adapter, pois traduz um serviço externo para o contrato interno. Só identifiquei Geoapify como implementação produtiva dessa operação.

IValidation<T> ajuda a padronizar validadores, mas UserValidation e ProgrammingValidation recebem tipos diferentes e não são, por isso, duas estratégias intercambiáveis do mesmo algoritmo. IProgrammingMapping com uma implementação favorece DI/testes; não demonstra sozinho uma família de estratégias.

Não há benefício obrigatório em criar Strategy para cada método de cadastro/edição ou para todo enum de host. Quando surgirem regras realmente diferentes por tipo de host, identificar o comportamento variável e avaliar estratégias específicas. Não duplicar fluxos inteiros por antecipação.

## Ordem de trabalho recomendada

1. Corrigir persistência de bloqueio de login e a política de usuário ativo/JWT.
2. Garantir unicidade dos vínculos e definir o comportamento de adições repetidas.
3. Validar categorias e revisar a edição de eventos iniciados.
4. Preparar unicidade de CNPJ no schema, revisar os dados e testar concorrência.
5. Consolidar regras de negócio e padronizar falhas, movendo a conversão HTTP para a apresentação.
6. Migrar preços para decimal e tornar os testes de backend versionados/reproduzíveis.
7. Alinhar a busca de endereços e evoluir paginação/cancelamento conforme o uso.

Produtos e busca completa por proximidade não foram considerados erros de SOLID por ainda estarem pendentes. Regras pretendidas e funcionalidades implementadas precisam continuar diferenciadas na documentação.
