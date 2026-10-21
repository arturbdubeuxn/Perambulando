# Banco de dados

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 20/10/2026

Base: Data/Context/Context.cs, Data/Configurations, migrations e ContextModelSnapshot. A migration de localização foi aplicada ao banco local em 19/10/2026, após backup e conferência do histórico anterior. As alterações de código estão na branch Artur-Desktop.

## 1. Tecnologia e contexto

A API usa PostgreSQL por meio do Npgsql e EF Core. `Context` herda `IdentityDbContext<User>` e expõe `Categories`, `Hosts`, `Programmings` e `ProgrammingXCategories`. `OnModelCreating` aplica primeiro a configuração Identity e depois as configurações da assembly.

| Item | Valor encontrado |
|---|---|
| Target da API | net10.0 |
| EF Core | 10.0.11 |
| Provider Npgsql EF Core | 10.0.3 |
| Plugin espacial | Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite 10.0.3 |
| PostGIS no banco verificado | 3.6.4 |
| Configuração da conexão | ConnectionStrings:DefaultConnection |
| Variável equivalente | ConnectionStrings__DefaultConnection |

## 2. Tabelas de negócio

| Tabela | Chave | Finalidade |
|---|---|---|
| Users | Id string/text | Conta Identity, dados básicos e flags de usuário |
| Hosts | Id integer identity | Estabelecimento pertencente ao usuário |
| Programmings | Id integer identity | Evento/programação pertencente ao host |
| Categories | Id integer identity | Cadastro de categorias |
| ProgrammingXCategories | Id integer identity | Vínculo de programação e categoria |

Não há `Products` no snapshot atual. `SourceUrl` não faz parte de Programmings no modelo atual.

## 3. Relações e exclusões físicas

```text
Users 1 -> N Hosts 1 -> N Programmings
Programmings 1 -> N ProgrammingXCategories N <- 1 Categories
```

| Dependente | FK | Referência | Exclusão no snapshot |
|---|---|---|---|
| Hosts | UserId | Users.Id | Cascade |
| Programmings | HostId | Hosts.Id | Cascade |
| ProgrammingXCategories | ProgrammingId | Programmings.Id | Cascade |
| ProgrammingXCategories | CategoryId | Categories.Id | Cascade |

As actions de exclusão de host e programação são lógicas: alteram IsActive. Essas operações não acionam cascade. A exclusão de usuário usa o Identity para remover fisicamente a conta; se o banco corresponder ao snapshot, o cascade pode alcançar hosts, programações e vínculos. Isso difere da desativação lógica.

## 4. Tabelas do Identity

Além de Users: `AspNetRoles`, `AspNetUserRoles`, `AspNetUserClaims`, `AspNetRoleClaims`, `AspNetUserLogins` e `AspNetUserTokens`. O EF usa também sua tabela de histórico de migrations.

Users persiste Id, UserName, NormalizedUserName, Email, NormalizedEmail, PasswordHash, Typeofuser, IsActive, isPro e CreatedAt.

`UserConfiguration` ignora no mapeamento: PhoneNumber, PhoneNumberConfirmed, AccessFailedCount, LockoutEnabled, LockoutEnd, TwoFactorEnabled, SecurityStamp, ConcurrencyStamp e EmailConfirmed. Portanto, a presença dessas propriedades herdadas em C# não significa que estejam persistidas. Em particular, não se deve presumir que bloqueio por tentativas e confirmação de e-mail estejam completos apenas por usar Identity.

## 5. Tipos e limites

| Dados | Tipo PostgreSQL / limite |
|---|---|
| IDs inteiros e enums | integer |
| IDs Identity e FKs de usuário | text |
| Flags | boolean |
| Datas | timestamp with time zone |
| MinPrice e MaxPrice | real (float em C#) |
| Hosts.Location / Programmings.Location | geography(Point,4326), permitindo NULL |
| Hosts.AddressNumber / Programmings.AddressNumber | varchar(20), não nulo; registros anteriores recebem vazio |
| Hosts.AddressComplement / Programmings.AddressComplement | varchar(200), não nulo; registros anteriores recebem vazio |
| Category.Name | varchar(100), não nulo |
| Hosts.Name / Neighborhood | varchar(150), não nulo |
| Hosts.Description | varchar(2000), não nulo |
| Hosts.Address | varchar(300), não nulo |
| Hosts.CNPJ / CEP / Phone | varchar(18) / varchar(9) / varchar(30), não nulos |
| Hosts.LogoUrl / InstagranUrl | varchar(2048), não nulos |
| UserName e e-mail normalizados ou originais | varchar(256) |
| Strings de Programming | text, não nulas no snapshot |

Não nulo no banco não equivale a texto não vazio: strings vazias podem satisfazer a restrição NOT NULL. Os campos opcionais de URL são inicializados como string vazia, apesar de as colunas não aceitarem null.

Datas devem ser tratadas em UTC para esse mapeamento Npgsql. Preços são float/real atualmente, não decimal; essa é a representação existente.

## 6. Índices e integridade

- UserName normalizado possui índice único `UserNameIndex`.
- NormalizedEmail possui `EmailIndex` sem unicidade no snapshot. A exigência de e-mail único está na validação do Identity; não há garantia equivalente por índice único nessa coluna.
- Role normalizada possui índice único `RoleNameIndex`.
- Hosts.UserId e Programmings.HostId são indexados.
- IX_Hosts_Location e IX_Programmings_Location usam GiST para as colunas geográficas.
- Os IDs de programação e categoria na tabela de vínculo têm índices separados e FKs.
- Não há índice composto único de ProgrammingId + CategoryId. O create pode gerar vínculos repetidos, embora a leitura de categorias use Distinct e o edit rejeite IDs duplicados.
- Não há constraint de check no snapshot para preços, intervalo de datas, enums ou status ativo de categoria.

## 7. Persistência e transações

CreateWithCategoriesAsync e EditWithCategoriesAsync de ProgrammingRepository agrupam campos e vínculos antes de um único SaveChangesAsync. No provedor relacional, esse save usa transação por padrão quando necessário. Não há Unit of Work explícito.

As edições usam entidades rastreadas pelo contexto. Consultas de listagem e detalhes do host usam AsNoTracking em partes dos fluxos. Não há filtro global de IsActive no contexto: a disponibilidade é filtrada nos métodos dos repositórios.

Criar host e atribuir role ao usuário envolve etapas de persistência separadas; não há uma transação envolvendo o fluxo inteiro.

## 8. Migrations

Última migration: 20261019182924_AddAddressNumberAndComplement, aplicada ao banco local. Adiciona quatro colunas varchar não nulas, com default vazio na migração dos registros anteriores. A anterior é 20261019175604_AddGeographicLocation, que habilita PostGIS, adiciona Location opcional e os índices GiST.

Não foram renomeadas colunas Adrress: elas não haviam sido criadas no banco. AddressNumber e AddressComplement são os nomes definitivos. Não há extração automática de número do texto de Address. NOT NULL permite string vazia; os campos permanecem opcionais no contrato HTTP.

O provider está configurado com UseNetTopologySuite e o Context declara postgis. Os registros existentes ficaram com Location NULL; não foram fabricadas coordenadas (0,0). O rollback remove apenas as novas colunas e índices e preserva a extensão PostGIS. Reverter a migration perde as coordenadas eventualmente gravadas nessas duas colunas.

No startup de Development, a aplicação verifica se existem migrations e executa `Database.MigrateAsync`. Fora de Development não há aplicação automática nesse trecho do startup.

Comandos de referência, executados na pasta que contém o csproj:

```text
dotnet ef migrations list
dotnet ef migrations add NomeDaMigration --output-dir Data/Migrations
dotnet ef database update
```

No Package Manager Console do Visual Studio, os equivalentes são Add-Migration NomeDaMigration e Update-Database. A migration de localização já existe e está aplicada neste banco; não é necessário criá-la novamente.

Os SQLs revisados ficam em docs/sql/AddGeographicLocation.sql e docs/sql/AddAddressNumberAndComplement.sql. São atualizações entre migrations consecutivas, não instaladores completos. docs/sql/VerificarPostGIS.sql contém consultas somente de leitura para conferir extensão, colunas e índices.

CREATE EXTENSION exige que os arquivos PostGIS já existam no servidor e que a conta tenha permissão. Na configuração Docker existente, foi necessário instalar os pacotes antes de aplicar o SQL. A extensão não é instalada por um pacote NuGet.

Uma migration pode conter remoções e recriações, não apenas adições. Conferir Up, Down e o diff antes de aplicá-la faz parte da revisão da alteração.

## 9. Limites do esquema atual

Há suporte de persistência geográfica e integração Geoapify. Ainda não há consulta de proximidade. Location é ignorada na serialização das entidades e os DTOs não recebem coordenadas. A propriedade é opcional para permitir os cadastros existentes. Também não há refresh token/revogação JWT implementados.

## 10. Verificação desta atualização

A compilação passou com zero erros e os três avisos de nulidade de navegação já existentes. O EF confirmou que o modelo e a migration estão alinhados. Foram conferidos no banco a extensão PostGIS 3.6.4, as duas colunas geography anuláveis, os dois índices e o histórico da migration. Uma chamada ST_DWithin com pontos constantes funcionou sem gravar dados.

As contagens antes/depois foram iguais: Users 11, Hosts 12, Programmings 7, Categories 12 e ProgrammingXCategories 10. Os 12 hosts e as 7 programações continuam sem coordenadas, aguardando geocodificação. Não foram feitos cadastros ou exclusões para testar.

A migration de número/complemento também teve backup anterior e comparação de contagens e hashes dos endereços antigos, preservados. As quatro colunas foram conferidas: limites 20/200, não nulas, vazias nos 12 hosts e 7 eventos anteriores. Foram executadas 48 verificações offline cobrindo create/edit/detalhes, mapeamentos, limites, persistência por serviço e rejeição de edição por usuário não dono. Os 17 testes do protótipo passaram com API simulada; o catálogo dos quatro formulários foi conferido contra os DTOs reais.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

A integração Geoapify preenche Location com Point(longitude, latitude), SRID 4326, usando as colunas geography existentes. Nenhuma migration ou alteração de esquema foi necessária. Cadastro/edição só persiste após sucesso da geocodificação. Registros anteriores não foram modificados: Location nula será preenchida na próxima edição válida, mesmo sem mudança de endereço. Não houve gravação no banco real nos testes desta etapa. Consulta por proximidade permanece pendente.

Veja a [configuração e os critérios da integração](README.md). Validação: build sem erros (três avisos CS8618 preexistentes), 63 verificações com HTTP/repositórios simulados e 17 testes do protótipo. Consulta HTTPS real ao Geoapify validada em 19/10/2026, com resultado building no Brasil e confiança 1. A chave foi configurada em Geoapify__ApiKey no ambiente do usuário Windows, sem inclusão nos arquivos. O fluxo completo via API/banco ainda precisa ser exercitado após reiniciar o processo que inicia a aplicação. PDFs não regenerados.


## UserXCategories — 20/10/2026

A migration 20261020121359_AddUserXCategories cria UserXCategories com Id inteiro identity (PK), UserId text não nulo, CategoryId inteiro não nulo, CreatedAt/UpdatedAt timestamptz não nulos. Há FKs para Users e Categories com cascade e índices separados em UserId e CategoryId. Não existe índice único para o par (UserId, CategoryId).

A atualização do protótipo não gerou nem aplicou migrations. A verificação EF has-pending-model-changes retornou que não houve alterações no modelo desde a última migration; isso não confirma que a migration já foi aplicada ao banco conectado. O cadastro/consulta de interesses depende de UserXCategories existir no banco. Nenhum registro real foi alterado nos testes.

Validação desta etapa: build concluído sem erros (sete avisos CS8618 na compilação completa); node --check em public/app.js e catalog.mjs; 22 testes aprovados com API simulada, incluindo array JSON na raiz, JWT, seleção de categorias, lista vazia e detalhes das sugestões. Corpos JSON do .http validados com variáveis substituídas. Não houve teste CRUD no banco real, aplicação de migration ou regeneração de PDFs.


## Address — código preparado para revisão em 21/10/2026

**Estado atual do código:** endereço normalizado na entidade Address (tabela planejada Addresses), com Street, Number, Complement, Neighborhood, CEP e Location. Hosts/Programming usam AddressId e navegação. **O banco ainda usa o modelo anterior: nenhuma migration ou transferência de dados foi executada.** As seções anteriores desta documentação registram o funcionamento anterior e não substituem o novo contrato descrito nesta seção.

GET /api/Address/GetAllAddress?search=Cais&limit=10 exige JWT, sem role específica; retorna somente endereços próprios ou publicados por programações/hosts ativos. Abaixo de três letras/dígitos retorna []; limite 1–20. Host/programação recebem exatamente AddressId ou objeto AddressCreateDTO (Street/Number obrigatórios, bairro/complemento opcionais, CEP válido). Detalhes retornam endereço aninhado; os campos antigos na raiz foram retirados. IDs inacessíveis retornam 404; seleção inválida retorna 400; mantidos 422/503 da geocodificação.

O serviço de endereços resolve seleção/equivalência e coordena a geocodificação; não salva isoladamente. Inclusão de endereço e host/programação ocorre no mesmo SaveChanges. Trocar o endereço muda o vínculo e preserva o registro anterior. Location/índice GiST passam a Address. Autoria usa FK opcional SetNull na exclusão de usuário, preservando o endereço; os vínculos de host/programação usam Restrict. NormalizedKey tem índice não único; duplicidade simultânea continua possível.

Protótipo e .http adaptados: autocomplete vazio até três caracteres, espera de 300 ms, escolha de endereço existente ou cadastro novo, JWT e IDs preservados. A interface avisa que a migration está pendente. Program.cs bloqueia migrations automáticas em Development enquanto modelo e snapshot diferem.

Validação: build sem erros (sete avisos CS8618 preexistentes), 48 verificações .NET sem banco/provedor externo e 38 testes do protótipo com API simulada aprovados. Nenhum PDF regenerado. O teste integrado com o schema novo depende da revisão e migration.

Veja o [resumo completo para revisão, contratos e plano de transferência dos dados](validacoes/refatoracao-address-revisao-2026-10-21.md). **Aguardando revisão do usuário antes de gerar a migration.**


## AddAddress no AddressService — 21/10/2026

Implementado Task<Address> AddAddress(int addressId, Address? newAddress, string userId), com construtor e dependências explícitos no padrão das classes existentes. As quatro chamadas de HostService/ProgrammingService usam AddAddress em vez de ResolveAsync. Nenhuma pasta foi criada.

Com AddressId, consulta GetByIdAsync e rejeita ID inexistente. Com objeto novo, remove espaços nas extremidades, normaliza CEP para oito dígitos, consulta GetExistingAddressAsync comparando logradouro, número, complemento, bairro e CEP e reutiliza o equivalente. A comparação ignora caixa, mas não remove acentos/abreviações. Prioriza equivalentes com coordenadas. Quando não existe equivalente, preenche AddWho com o usuário informado; a autoria anterior é preservada na reutilização. Geocodifica somente quando Location está ausente. A função retorna a entidade e não executa SaveChanges; a gravação permanece com o host/programação. A seleção recebida deve conter somente ID ou somente novo endereço, e usuário, logradouro, número e CEP precisam ser válidos. Argumentos inválidos geram ArgumentException.

Foram alinhados GetAllAddressAsync(string), GetByIdAsync(int) e GetExistingAddressAsync(Address) no repositório/interface usados pelo serviço. A consulta de autocomplete segue a interface atual do usuário: search apenas, no mínimo três letras/dígitos, até dez registros. Usa Street e CEP diretamente; não depende dos campos removidos CreatedByUserId, SearchStreet, NormalizedKey nem do helper AddressNormalization. O modelo atual usa AddWho; não foi acrescentado filtro por proprietário ao catálogo compartilhado.

Os AppServices de host/programação ainda estão em adaptação e atualmente mapeiam apenas AddressId; para o caminho de endereço novo precisam encaminhar também a entidade Address. O AddressAppService também continua com referência a Mappings removida e métodos incompatíveis/faltantes em relação à interface. Esta etapa não conclui esses trechos da refatoração nem o tratamento HTTP de todas as exceções de argumento.

Validação: 15 verificações isoladas da função/interface reais compiladas com o compilador .NET e dependências simuladas, cobrindo seleção existente, coordenadas ausentes, reutilização, autoria, normalização, validações e propagação de falha de geocodificação. Nenhum banco/provedor externo utilizado. O build completo permanece bloqueado por três erros já existentes em AddressAppService (namespace Mappings, GetAllAddressAsync e GetDetailsbyIdAsync). Nenhuma migration gerada/aplicada ou PDF atualizado.


## Persistência de novos endereços com host/programação — 21/10/2026

Concluído o encaminhamento de dto.Address no create e no edit de HostAppService e ProgrammingAppService. O mapeamento é feito inline, com new Address, preenchendo Street, Number, Complement, Neighborhood e CEP; opcionais nulos viram strings vazias. Quando somente AddressId é informado, não se cria um objeto de endereço novo. Os serviços existentes chamam AddAddress, que reutiliza o registro equivalente/existente ou prepara um novo com autoria e geocodificação.

HostRepository.Create/EditAsync e ProgrammingRepository.CreateWithCategoriesAsync/EditWithCategoriesAsync/EditAsync incluem explicitamente Db.Addresses.Add quando Address.Id == 0. O endereço é salvo pelo mesmo SaveChangesAsync do host/programação, junto com as categorias quando aplicável. O EF atribui o ID gerado ao vínculo AddressId pela navegação. Um endereço já existente não é incluído novamente; na edição, o endereço anterior é mantido. Não foi acrescentado SaveChanges isolado no AddressService ou no AddressRepository.

AddressAppService foi alinhado à interface atual GetAllAddressAsync(string)/GetDetailsbyIdAsync(int), com construtor explícito e mapeamentos inline para AddressDetailsDTO; removida a dependência de Mappings inexistente. A compilação voltou a passar. O autocomplete e o .http usam apenas search, acompanhando a assinatura atual, com até dez resultados. Nenhuma pasta foi criada.

Validação: build GeoLocation com zero erros e sete avisos CS8618 preexistentes; 21 verificações temporárias com AppServices/repositórios reais e EF, incluindo os quatro mapeamentos, navegações/FKs, estados Added/Modified/Unchanged e ausência de duplicação ao selecionar endereço existente. Um interceptor bloqueou as seis tentativas de abertura de conexão antes de acessar qualquer banco. Também passaram os 39 testes do protótipo com API simulada e node --check em app.js. Os arquivos temporários de teste foram removidos.

**Nenhuma migration foi gerada ou aplicada e não houve gravação real no banco.** A validação de INSERTs/IDs efetivamente gravados no PostgreSQL permanece para depois da revisão e da migration de Address. As pendências de mapeamento e os três erros de AddressAppService registrados nas seções anteriores foram resolvidos nesta etapa. PDFs preservados.


## Migration AddAddress corrigida — 21/10/2026

20261021193025_AddAddress foi revisada para preservar dados: Addresses é criada primeiro, AddressId começa anulável e sem default 0, os endereços/coordenadas/datas/autoria existentes são copiados e vinculados com os IDs gerados, e só depois são criadas as restrições e removidas as colunas antigas. Down devolve os endereços aos campos anteriores antes de remover a tabela; bloqueia reversão que descartaria endereços sem vínculo. Campos que excedem os novos limites interrompem a migration sem truncamento. Não foram alterados Designer, snapshot, entidades ou contratos HTTP nesta correção.

Build sem erros (sete avisos preexistentes) e 20 verificações de Up/Down no PostgreSQL com dados fictícios em schema isolado, revertido ao final. Conferência somente de leitura do banco da aplicação: 23 hosts, nove programações, colunas antigas presentes e AddAddress não aplicada. Encontrados CEPs incompatíveis em Hosts ID 12 (872878282), Programmings ID 6 (fsdfsdfsd) e ID 7 (FSDFSDFDS). Nenhum registro foi alterado; é necessário revisá-los antes de aplicar.

[Alterações completas, testes e pendências](validacoes/migration-address-correcao-2026-10-21.md). A migration continua aguardando revisão/aplicação; não foi executado Update-Database nem reiniciada a API. Nenhum PDF atualizado.

## AddAddress aplicada — 21/10/2026

Esta atualização substitui o estado pendente registrado nas etapas anteriores. Por autorização do usuário, foi aplicado `20261021193025_AddAddress` no banco local `perambulando`, na branch Artur-Desktop. Antes da operação foi salvo um backup completo em `C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/backups/perambulando-before-addaddress-20261021.dump` (37.519 bytes; catálogo do pg_restore conferido).

Os CEPs inválidos de Hosts ID 12 (872878282) e Programmings IDs 6 (fsdfsdfsd) e 7 (FSDFSDFDS) foram substituídos por string vazia, sem inventar um CEP correto. Os valores anteriores permanecem no backup e neste registro. Os demais campos desses registros foram preservados. Esses três endereços legados continuam precisando de um CEP válido quando forem editados; não houve relaxamento das validações de novos cadastros.

A aplicação foi feita com Database.MigrateAsync no Context real, sem iniciar a API. Confirmados modelo alinhado ao snapshot, somente AddAddress pendente antes da execução e nenhuma migration pendente depois. Foram preservados 23 hosts e nove programações, transferidos para 32 Addresses. Comparados todos os demais campos dos pais, logradouro/número/complemento/bairro, coordenadas binárias/SRID, datas/autoria e CEPs (exceto os três vazios e a retirada de hífen prevista). Conferidas as duas FKs validadas, a remoção das 12 colunas antigas e as contagens de Users, Categories, ProgrammingXCategories e UserXCategories. Não foram excluídos hosts ou programações. Build incremental GeoLocation concluído com zero erros. Não foram realizados novos cadastros nem chamadas de geocodificação nesta etapa; a verificação CRUD pela API continua separada da validação da transferência. PDFs não foram atualizados.