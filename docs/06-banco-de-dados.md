# Banco de dados

Perambulando | Atualização: 19/10/2026

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
