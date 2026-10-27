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

## Consulta e validação de CNPJ — 25/10/2026
Integração Minha Receita nas camadas existentes: HostController -> HostAppService -> HostService -> ICompanyRegistrationService/MinhaReceitaService. ICnpjValidations/CnpjValidations normalizam e validam formato e dígitos verificadores numéricos e alfanuméricos, sem converter o identificador em número. Os DTOs de cadastro/edição exigem CNPJ e formato compatível. Nenhuma pasta nova de produção foi criada.
GET /api/Host/GetByCNPJ?cnpj=33683111000280 exige JWT e retorna CompanyRegistrationDTO: cnpj, legalName, tradeName, registrationStatus, statusDescription, checkedAt (UTC da consulta), street, number, complement, neighborhood, cep, city e state. Nenhum dado de sócios é devolvido. Consulta bem-sucedida retorna 200 inclusive para situação não ativa; o formulário informa a situação. Falhas: 400 formato/DV inválido, 404 não localizado na base consultada, 503 indisponibilidade, limite, timeout ou resposta inválida. CheckedAt não representa atualização da base oficial nem é persistido.
Criar host e alterar CNPJ exigem consulta com situacao_cadastral=2 antes de geocodificar ou salvar. Cadastro duplicado retorna 409; empresa não ativa retorna 422. Edição sem mudança do CNPJ normalizado dispensa nova consulta externa, mas valida formato/DV e duplicidade. O próprio host é excluído da busca de duplicados. Hosts inativos continuam reservando o CNPJ. Não há validação externa na desativação. Falhas da consulta não salvam o host. Registros legados não foram corrigidos ou excluídos automaticamente.
O repositório repete a verificação de duplicidade dentro da transação, sob pg_advisory_xact_lock(721904, 1), utilizado no cadastro e alteração do CNPJ. Isso serializa essas gravações entre instâncias desta API. Não existe índice único novo: gravações externas que ignorem o lock não são protegidas. Uma restrição única no banco exige auditoria/normalização dos registros legados e revisão de migration; permanece melhoria pendente. A transação existente de cadastro com role HOST foi preservada.
Protótipo: consulta automática após 500 ms ao completar o CNPJ. Resultados de consultas antigas são ignorados. Nome e endereço são sugestões aplicadas somente por botões de confirmação; não sobrescrevem o formulário automaticamente. Cidade/UF são exibidas mas seguem fora da persistência de Address. A consulta não comprova representação da empresa pelo usuário. Minha Receita é uma base secundária e pode estar desatualizada; ausência não comprova inexistência definitiva.
Validação: build sem erros (sete avisos CS8618 preexistentes), node --check, 50 testes do protótipo com API simulada e 30 verificações C# com dependências simuladas (DV, normalização, respostas inválidas, ausência, timeout, cancelamento, regras de criação/edição, situação ativa, duplicidade e propriedade). Consulta real somente de leitura pelo adaptador C# confirmou resposta válida e ativa para o exemplo público do provedor. A suíte não executou cadastros reais nem teste concorrente contra PostgreSQL. NuGet não conseguiu consultar a base de vulnerabilidades (NU1900) na execução do harness; isso não impediu a compilação/testes. PDFs não regenerados. Nenhuma migration criada por esta integração.
Fontes: https://docs.minhareceita.org/como-usar/ ; https://docs.minhareceita.org/sobre-os-dados/ ; https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf

Verificação em 25/10/2026: ao reiniciar a API para testar CNPJ, a inicialização automática aplicou a migration preexistente 20261025121346_AddCEPApi. A integração CNPJ não gerou migration nova.


## Favorites — modelo preparado em 26/10/2026; banco ainda sem alteração desta etapa

Favorite foi adicionado ao Context e possui FavoriteConfigurations em Data/Configurations. Nenhuma migration foi gerada ou aplicada nesta etapa. Revisar as alterações de modelo antes de criar/aplicar a migration. Não confundir o mapeamento abaixo com tabela já existente no banco.

- Tabela planejada: Favorites; PK Id int gerada pelo EF/PostgreSQL.
- UserId string obrigatório, FK para User/Identity; não é int como no desenho, pois deve ter o mesmo tipo da chave de usuário atual.
- ProgrammingId int obrigatório, FK para Programmings.
- IsActive bool; CreatedAt e UpdatedAt DateTime em UTC definidos pela aplicação.
- Índice único composto UserId/ProgrammingId, incluindo vínculos inativos. A remoção é lógica e o novo favorito reativa o vínculo existente.
- FKs com Cascade para exclusão física de usuário/programação. Desativar IsActive desses registros não apaga os favoritos.
- Adicionar/remover utiliza transação e advisory lock por usuário/programação para serializar chamadas concorrentes da API. O índice único será criado somente ao aplicar a futura migration.

O bloqueio existente de inicialização em Development detectará alterações pendentes de modelo e impedirá iniciar a versão nova até revisar/migrar. Sua mensagem foi generalizada, pois não se refere mais apenas a Address. A API não foi reiniciada para contornar esse bloqueio. O modelo e suas FKs/índice foram inspecionados em memória, sem abrir conexão com o banco. Persistência/concorrência reais pendentes após revisão da migration.


## Consulta de host para alteração — 26/10/2026

VerificationbyId agora aceita um parâmetro interno isAdmin (padrão false) e filtra Id/IsActive junto de UserId ou permissão administrativa confirmada pelo HostService. A role é consultada pelo UserManager com o usuário ativo, nunca aceita do corpo da requisição. A unicidade do CNPJ conserva as verificações e o advisory lock anteriores; não foi adicionado índice/migration. Nenhum schema, dado ou snapshot de migration foi alterado nesta revisão.


## R03 — unicidade dos vínculos de categorias (26/10/2026)

Configurados no EF os índices únicos IX_UserXCategories_UserId_CategoryId e IX_ProgrammingXCategories_ProgrammingId_CategoryId. Ainda não existem garantias de aplicação desses índices no banco: nenhuma migration foi gerada/aplicada. O Docker não ficou acessível para auditoria real. Os repositórios usam transações/advisory locks nos namespaces 721905 (usuário) e 721906 (programação); locks serializam chamadas da API e o índice futuro garante unicidade também contra outros escritores.

Scripts em validacoes: auditar-vinculos-categorias.sql é somente leitura; deduplicar-vinculos-categorias-revisao.sql é material para revisão, mantém menor Id, aborta com FKs externas e termina em ROLLBACK. Nenhum SQL foi executado. Revisar backup, duplicidades e migration em janela sem gravações antes de aplicar ao banco. Persistência/concorrência real ainda não foram testadas.

Validação: build sem erros; 13 verificações locais de modelo/snapshots/409, 41 cenários de mapeamento e 52 testes do protótipo com dependências simuladas aprovados. Sem teste de persistência no PostgreSQL, alteração de dados, migration ou PDF. [Registro completo e pendências](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## R03 — Docker disponível, auditoria e testes reais (26/10/2026)

Auditoria READ ONLY em perambulando: UserXCategories possui 13 linhas, ProgrammingXCategories 28; zero pares duplicados e zero excedentes nas duas tabelas. Nenhuma FK externa aponta para os IDs dos vínculos. Os índices compostos únicos ainda não foram criados. Não é necessária limpeza com o estado atual; repetir auditoria caso ocorram novas gravações antes da migration.

As 13 verificações de integração passaram. O banco descartável foi removido; o banco principal manteve as contagens e não foi alterado. Nenhuma migration, limpeza de dados ou PDF executado. [Relatório e comando de teste](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## Bloqueio de login e stamps do Identity — 26/10/2026

Modelo EF restaura cinco campos de Users: AccessFailedCount, LockoutEnabled (default true), LockoutEnd, SecurityStamp e ConcurrencyStamp; restaura também ConcurrencyStamp de AspNetRoles. Os dois ConcurrencyStamp são tokens de concorrência. Auditoria somente leitura confirmou que essas colunas ainda não existem no banco perambulando. Migration não gerada/aplicada; revisar backfill dos stamps e habilitação das contas existentes antes da implantação.

Implementação, roteiro da migration e teste reproduzível: [revisão R01](validacoes/identity-bloqueio-login-2026-10-26.md).

## Registro do serviço de vínculos de programação — 26/10/2026

Corrigida a dependência ausente IProgrammingXCategoryAppService no container de DI. A falha ao construir ProgrammingAppService impedia o EF de obter o Context pelo provider da aplicação e provocava o erro secundário de DbContextOptions<Context>. Build aprovado com zero erros e sete avisos CS8618 preexistentes. O terminal desta sessão não tem dotnet-ef; a criação de migration deve ser repetida pelo Package Manager Console do Visual Studio. Nenhuma migration foi gerada/aplicada nesta correção.

## Verificação após AddFavorite — 26/10/2026

Estado auditado: AddFavorite (20261026163834) consta no histórico; nenhum migration pendente e snapshot alinhado ao modelo. Confirmados cinco campos Identity em Users, ConcurrencyStamp de AspNetRoles, tabela/FKs/índice único de Favorites e unicidade dos pares em UserXCategories e ProgrammingXCategories, sem duplicidades. Pendência: 23 usuários e duas roles ficaram com stamps nulos; SecurityStamp nulo causa falha na contabilização de senha incorreta. Não houve correção de dados no banco principal durante a auditoria.

Evidências e teste reproduzível: [auditoria da migration](validacoes/validacao-migration-addfavorite-2026-10-26.md).

## Limpeza autorizada das contas antigas — 26/10/2026

Limpeza executada em transação, com backup prévio e confirmação do usuário para cascatas. Excluídos 23 usuários antigos, 29 hosts e 13 programações e seus dependentes. Estado confirmado após a exclusão: Users/Hosts/Programmings/UserXCategories/ProgrammingXCategories/Favorites vazios; 12 Categories e 35 Addresses preservados; ADMIN e HOST preservadas, ambas com ConcurrencyStamp preenchido. Schema e histórico de migrations não foram alterados.

## Edição de datas e preços decimais — 26/10/2026

Programações passam a mapear MinPrice/MaxPrice com HasPrecision(12,2), tipo numeric(12,2). Migration 20261026175332_ProgrammingPricesDecimal gerada com apenas as duas alterações de coluna; Designer/snapshot atualizados. Testada em banco PostgreSQL descartável, mas não aplicada ao principal. Auditoria principal encontrou zero programações, zero preços incompatíveis e colunas ainda real. Aplicar a migration revisada antes de iniciar a API com esse modelo.

Detalhes e teste reproduzível: [revisão de datas/preços](validacoes/programming-datas-precos-2026-10-26.md).

## Extração de métodos na edição de programação — 26/10/2026

EditWithCategoriesAsync foi dividido em métodos privados dentro de ProgrammingRepository. Todos usam o mesmo Context; auxiliares não abrem transações nem salvam. Continua existindo uma transação e um SaveChangesAsync para a operação completa. Não houve alteração de schema ou migration nesta refatoração.

Validação desta extração: build aprovado; 21 verificações existentes de programação repetidas com sucesso em PostgreSQL isolado, usando AppService/Service/repositórios reais. Banco temporário removido; banco principal não alterado. Não foram criados novos testes nem alterado o tratamento de erros nesta etapa.

## Consulta dos vínculos de uma programação — 26/10/2026

Nova consulta interna em ProgrammingXCategories filtra ProgrammingId e retorna os registros completos de vínculo. Mantém rastreamento do Context para reaproveitamento na edição; não grava dados, não muda schema e não exige migration. Não foi criado endpoint HTTP.

## Joins nos interesses do usuário — 26/10/2026

Consultas internas de UserXCategories fazem join com Categories pela FK. Comparações entre listas já carregadas usam LINQ em memória; escritas continuam por AddAsync/RemoveRange/SaveChangesAsync. Índice único de par, bloqueio transacional por usuário e filtro de erro de unicidade preservados. Nenhuma alteração de schema ou migration nesta refatoração.

Implementação e testes: [consultas com joins](validacoes/user-categories-joins-2026-10-26.md).

## Edição de interesses com foreach — 26/10/2026

Edição de interesses usa Db.Remove e Db.Add em laços, seguida de um SaveChangesAsync dentro da transação existente. Não altera schema nem migrations. Build aprovado; nenhum teste de banco executado nesta simplificação. Pendência observada no AddAsync atual: somente marca inclusões no contexto e retorna; falta SaveChangesAsync no fluxo de cadastro.

## Model no fluxo de cadastro de favoritos — 26/10/2026

FavoriteRepository.AddAsync recebe Favorite em vez de IDs separados. Usa as chaves do objeto para o bloqueio e a consulta; persiste o objeto mapeado apenas quando não existe o par. Para par existente, retorna o registro armazenado ou o reativa, preservando IDs e dados de criação. Transação, índice único, carregamento de programação/host e SaveChangesAsync mantidos. Sem alteração de schema ou migration.

## Listagem paginada de programações — 26/10/2026

Consulta paginada de Programmings usa AsNoTracking, Include(Address), filtro de programação/host ativos, ORDER BY StartDate/Id e Skip(skip).Take(take) antes da materialização. A paginação é executada pelo EF no PostgreSQL, sem carregar toda a coleção. Não exige migration ou alteração de schema. Offset maior que o total retorna lista vazia.


## Migration AddAddressCity preparada — 26/10/2026

Adicionada a migration 20261026200000_AddAddressCity e seu snapshot/target model, com City obrigatório no armazenamento, character varying(150), default vazio para preservar registros anteriores. O campo é opcional na entrada HTTP. O cadastro de endereço normaliza City e a deduplicação passa a comparar também a cidade.

A migration não foi aplicada ao banco. A implantação exige aplicá-la antes de executar as consultas que leem Address.City. Não houve backfill nem inferência de cidade; endereços antigos continuam com string vazia até preenchimento. Não houve conexão ao PostgreSQL real. A geração do SQL da migration e a correspondência do snapshot com o modelo foram aprovadas nos testes isolados.

## Cidade habilitada no filtro e no protótipo — 27/10/2026

Esta atualização substitui a indisponibilidade de City registrada anteriormente. Coluna Addresses.City e migrations AddAddressCity/AddCity confirmadas em leitura no banco principal; a migration AddCity do usuário tem Up/Down vazios porque a coluna já estava contemplada anteriormente. Nenhuma migration criada, alterada ou aplicada nesta tarefa.

HostRepository.FilterAsync passa a comparar a cidade completa do endereço, ignorando caixa e espaços nas extremidades do filtro. City nula/vazia não restringe; bairro permanece fora dos filtros de host. Removida a rejeição de cidade do HostService. A cidade continua opcional no AddressCreateDTO (máximo 150 caracteres); models, mappings e persistência já estavam preparados.

Protótipo inclui Cidade nos quatro formulários de cadastro/edição de host/programação e envia address.city quando o endereço é novo. ViaCEP preenche cidade junto de rua/bairro, sem sobrescrever alteração manual durante a consulta. Seleção de endereço existente, carregar edição, consulta de CNPJ e Usar endereço do host preservam/exibem cidade; seleção existente continua enviando somente addressId. Exemplos HTTP atualizados. Endereços antigos com cidade vazia não aparecem ao aplicar um filtro por cidade; não houve backfill automático.

Validação: build aprovado; 59 testes do protótipo com API simulada aprovados; 68 verificações com login/HTTP/EF/PostgreSQL reais em banco descartável aprovadas, incluindo Recife/Olinda, cidade em branco, nome completo, caixa/espaços e combinação com nome/tipo/paginação. Banco temporário removido e banco principal preservado. Ambiente reiniciado, interface/catálogo e consulta pública da API respondendo 200. Sem PDFs novos.


## US17 — primeira etapa preparada em 27/10/2026

Implementados no código: Subscription e configuração EF, repository, service, app service, mapping, interfaces, DTO e controller. Rotas autenticadas: POST /api/Subscription/Activate, GET /api/Subscription/MySubscription e PATCH /api/Subscription/Cancel. Titular vem do JWT; não há corpo de entrada. Retorno 200 com Id, Status, StartsAt e ExpiresAt (camelCase no JSON). Status numérico: 0 Inactive, 1 Active, 2 Cancelled, 3 Expired (calculado). Sem assinatura, datas/Id nulos e Status Inactive. Identidade ausente/inativa: 401. Simulação desabilitada: Activate retorna 403.

Regras confirmadas: assinatura por usuário cobrindo todos os hosts, um mês via AddMonths(1), sem renovação automática, repetição não estende vigência, cancelamento imediato e reativação inicia novo período. Datas UTC; limite final exclusivo. Pro:SimulationEnabled precisa ser explicitamente true (variável Pro__SimulationEnabled); configuração ausente desabilita ativação. Nenhuma cobrança. Cancelamento continua disponível com simulação desligada.

Persistência proposta: tabela Subscriptions, índice único UserId, FK para AspNetUsers com Restrict. Escritas bloqueiam a linha do usuário dentro de transação PostgreSQL e atualizam User.isPro na mesma transação. Nenhum usuário existente recebe assinatura automaticamente. MySubscription calcula vigência; perfil/JWT ainda usam o booleano legado e precisam ser ajustados na próxima etapa. As permissões retornadas indicam elegibilidade; carrossel e estatísticas ainda não foram implementados.

Validação: dotnet build aprovado, zero erros e dez avisos em arquivos existentes. 14 testes isolados com repositório/usuário simulados passaram: ausência de assinatura, identidade, simulação, duração, repetição, fronteiras de validade, cancelamento, reativação e expiração. Testes locais: C:/Users/rafae/Documents/ChatGPT/Perambulando/SubscriptionRules.Tests.csproj. Concorrência, SQL e HTTP ainda não foram testados em PostgreSQL.

Migration não gerada nem aplicada; banco inalterado. O guard existente HasPendingModelChanges em Development deve impedir inicialização até revisão e preparação da migration. Depois de gerar a migration, a inicialização em Development a aplica automaticamente: revisar esse fluxo antes de iniciar contra banco real. Próxima etapa: revisar migration/SQL, estratégia para usuários legados e validar em banco descartável; depois integrar benefício efetivo ao perfil/JWT.

Protótipo externo indicado no AGENTS.md (C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api) não existe neste computador e não foi atualizado. Exemplos .http adicionados. PDFs preservados.

## Revisão US17 do checkout atual - 27/10/2026

A [revisão atual da US17](validacoes/us17-revisao-codigo-2026-10-27.md) substitui as alegações anteriores de configuração de simulação aplicada, bloqueio de linha e concorrência resolvida. O código atual ignora SimulationEnabled, o EF gera uma FK shadow userId adicional e perfil/JWT continuam usando isPro sem conferir validade. A base das camadas/endpoints existe; carrossel, interações e estatísticas permanecem pendentes. Build aprovado; onze verificações locais e inspeção de modelo EF executadas. Banco/HTTP não verificados porque Docker está indisponível. Sem correções funcionais, migration ou PDF nesta revisão.

## Pro calculado pela assinatura - 27/10/2026

User.isPro removido do model e das escritas de ativação/cancelamento; claim isPro removida dos novos JWTs. UserProfileDTO mantém IsPro, calculado por SubscriptionService.IsProAsync e mapeado no UserAppService, sem ciclo de DI. Claim Pro de tokens antigos não determina o benefício. Navegação Subscription.user ligada explicitamente a UserId, eliminando a FK shadow extra. Essas correções substituem os achados correspondentes da revisão anterior; configuração de simulação e concorrência continuam pendentes.

Auditoria em leitura: três usuários reais, zero marcados Pro e nenhuma tabela Subscriptions. Migration de criação de Subscriptions/remoção da coluna Users.isPro não foi gerada/aplicada; precisa de revisão antes de usar o novo código contra o banco principal. Build aprovado, 30 verificações HTTP/EF/PostgreSQL reais em banco descartável e 61 testes simulados do protótipo aprovados. Dados reais preservados; sem PDF novo. [Alterações, testes e plano de migration](validacoes/us17-remocao-ispro-2026-10-27.md).

## Expiração persistida ao consultar a assinatura - 27/10/2026

SubscriptionService.GetAsync agora verifica Active com ExpiresAt <= UTC atual e solicita ExpireAsync ao repositório. A transição grava Status Expired (3) e UpdatedAt. Consultas de MySubscription e de perfil/IsProAsync passam pelo fluxo; a atualização acontece sob demanda, sem tarefa agendada. Antes da próxima consulta, a linha pode continuar Active, mas IsEffective e o mapping já negam/apresentam corretamente um prazo vencido. Assinaturas Cancelled não são alteradas.

O repositório usa UPDATE condicional por ID, status Active e prazo vencido, evitando sobrescrever um prazo renovado antes da escrita. Retorna a situação atual em leitura sem rastreamento; não altera as datas originais de validade. Consulta repetida não modifica UpdatedAt novamente. Não foram reintroduzidos o controle de SimulationEnabled ou o bloqueio por usuário desfeitos anteriormente.

Build aprovado, 15 verificações reais em PostgreSQL descartável e 62 testes simulados do protótipo aprovados. Verificadas persistência de Expired, expiração pelo perfil, idempotência, preservação de vigentes/canceladas e proteção de prazo vigente no UPDATE condicional. Banco temporário removido; banco principal não alterado nesta tarefa. Sem mudança de DTO/rotas, nova migration, reinicialização da API ou PDF.
