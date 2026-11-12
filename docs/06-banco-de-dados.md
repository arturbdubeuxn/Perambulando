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


## Estatísticas implementadas em 29/10/2026

Migration 20261029191257_AddProgrammingInteractions preparada com tabela de eventos, EventId único, FKs Restrict para Programmings/Users e índices. Nenhuma migration aplicada ao banco real; SQL para revisão em docs/sql.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

### Interações: idempotência e concorrência corrigidas — 30/10/2026

Reenvio de EventId com mesmo ProgrammingId, Type e UserId retorna 204 sem inserir ou mudar CreatedAt; reutilização com outros dados retorna 409. Validação reconhece eventos já aceitos; service reutiliza o registro existente; repository recupera a linha vencedora ao disputar especificamente o índice único EventId. Falhas de outras constraints não são ocultadas. Sem alteração de DTO, rota, autorização, modelo ou migration.

Build aprovado com zero erros e 10 avisos preexistentes; 24 verificações reais HTTP/BD/repository e 66 testes simulados do protótipo aprovados, incluindo concorrência idêntica e conflitante. Banco descartável removido e principal preservado. [Detalhes da correção e evidências](validacoes/programming-interaction-revisao-2026-10-30.md). PDFs preservados; API do Visual Studio não reiniciada.

## US17 — Resumo de estatísticas implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Summary exige JWT de usuário ativo, propriedade do host ativo e Pro vigente no banco. Não há exceção administrativa. Retorna hostId, startDate, endDate e contadores long: detailViews, carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow. Sem dados, os contadores são zero. Período UTC de início inclusivo/fim exclusivo, padrão de 30 dias e limite 366. Interações incluem programações desativadas no histórico. Favoritos ativos de contas ativas representam o total atual e não são filtrados pelo período. Retornos: 200, 400 (período/ID), 401 (autenticação/conta), 403 (Pro) e 404 (host/propriedade).

Implementado nas camadas existentes com HostStatisticsFilterDTO/HostStatisticsSummaryDTO, respectivos modelos NotMapped, mappings com interfaces, AppService, Service e Repository. Service concentra autorização/período; mappings só copiam campos; joins/agregações executam no banco. Nenhuma tabela de totais ou migration nova. A execução depende das migrations existentes de assinatura/interações/favoritos no banco utilizado.

Coleta aprovada em 24 verificações reais após a correção do usuário; Summary aprovado em 35 verificações HTTP/EF/PostgreSQL, incluindo contagens e bloqueio imediato por cancelamento/expiração com mesmo JWT. Build sem erros, 10 avisos preexistentes; snapshot sem mudanças pendentes. Protótipo e .http atualizados; datas de query convertidas para UTC, totais exibidos e 67 testes simulados aprovados. Testes reais em bancos descartáveis removidos; principal preservado, API do Visual Studio não reiniciada e PDFs não exportados. Daily, Ranking, coleta automática e painel definitivo são as próximas etapas. [Regras, implementação e validação](validacoes/us17-host-summary-2026-10-30.md).

## US17 — Série diária implementada — 30/10/2026

GET /api/Host/{hostId}/Statistics/Daily usa os mesmos filtros e autorização do Summary por ISumarryStatitcsValidations. Retorna lista ordenada de {date, detailViews, carouselClicks, ticketClicks, nearbyClicks}, com dias UTC sem eventos preenchidos com zero. Inclui histórico de programações desativadas; não contém favoritos históricos. Início inclusivo/fim exclusivo e períodos parciais preservam as horas do filtro. Padrão de 30 dias de duração pode tocar 31 datas; máximo 366 dias de duração pode tocar 367 datas. Fim à meia-noite não gera dia extra.

HostStatisticsDaily (NotMapped), HostStatisticsDailyDTO e mapping com interface seguem as pastas existentes; repository agrega no banco e service preenche lacunas, sem repetir validações. Nenhuma tabela ou migration nova. Controller usa try/catch. .http e protótipo atualizados; resultado apresentado como tabela diária em UTC.

Summary revalidado antes da implementação (35 verificações). Daily e regressão do resumo aprovados em 73 verificações HTTP/EF/PostgreSQL, com fuso da conexão America/Recife; build sem erros e 10 avisos preexistentes; snapshot sem mudanças. Sintaxe JS e 68 testes simulados do protótipo aprovados. Bancos descartáveis removidos; banco principal preservado. Sem restart da API do Visual Studio ou exportação PDF. Ranking é a próxima etapa. [Contrato, regras e testes](validacoes/us17-host-daily-2026-10-30.md).

## US17 — Ranking implementado — 30/10/2026

GET /api/Host/{hostId}/Statistics/Ranking retorna ProgrammingStatisticsDTO[] com posição global, identificação/estado da programação e cinco indicadores. Aceita startDate/endDate, sortBy (detailViews padrão; carouselClicks, ticketClicks, nearbyClicks, activeFavoritesNow), take=10 (1–100) e skip=0 (>=0). Ordem decrescente e desempate pelo ID; página vazia retorna []. Inclui histórico desativado e programações sem dados. Interações respeitam o período UTC; favoritos ativos de contas ativas representam o total atual.

Roles ADMIN,HOST acrescentadas pelo usuário foram preservadas em Summary/Daily e aplicadas ao Ranking. Nas três actions, essas roles são necessárias, mas não substituem propriedade do host ativo, usuário ativo e Pro vigente. ADMIN não tem exceção. Esta descrição substitui referências anteriores à dispensa de role. Retornos 200, 400, 401, 403 e 404 conforme filtro/autenticação/role/Pro/propriedade.

RankingStatisticsValidations reaproveita ISumarryStatitcsValidations e valida paginação/indicador. Service usa o filtro validado, consulta e atribui posições; repository agrega interações e favoritos separadamente e usa left joins, ordenação e paginação no banco, evitando multiplicação das contagens. AppService usa mappings com interfaces; controller só coordena retornos e exceções. Filtro específico e classes/DTOs existentes seguem as pastas atuais. Não há tabela/índice/migration nova.

Versão final aprovada em 129 verificações HTTP/EF/PostgreSQL de Ranking/Summary/Daily, com build sem erros e 10 avisos preexistentes. Protótipo/.http atualizados; sintaxe JS e 70 testes simulados aprovados, incluindo roles formatadas com espaços. Bancos descartáveis removidos, principal preservado, API principal não reiniciada e PDFs não exportados. Próximas etapas: coleta automática no frontend, painel Pro definitivo e validação integrada. [Contrato, regras e testes](validacoes/us17-host-ranking-2026-10-30.md).


## Limite de três categorias — 31/10/2026

Nenhuma alteração de schema ou migration. UserXCategoryRepository.AddAsync/EditAsync usam transação e SELECT 1 FROM "Users" WHERE "Id" = parâmetro FOR UPDATE antes de consultar os vínculos e conferir o total final de até 3 preferências. O SQL é parametrizado por ExecuteSqlInterpolatedAsync. A transação mantém o bloqueio até commit/dispose e o POST ignora IDs já existentes. Não há trigger/restrição de contagem no banco: gravações externas ao fluxo podem violar o limite. Dados antigos preservados. Integração e concorrência real ainda não verificadas nesta etapa por Docker desligado; build e testes com dependências simuladas aprovados.


## Dados fictícios para teste de interações — 31/10/2026

Com autorização expressa, a migration existente 20261029191257_AddProgrammingInteractions foi aplicada ao banco local perambulando em localhost:5432. Era a única migration pendente. Cria ProgrammingInteractions, FKs, check de tipo e índices existentes no código, incluindo unicidade de EventId. Referências anteriores à ausência dessa tabela neste banco ficam superadas. Não foram criadas migrations novas.

Foi inserida uma conta fictícia HOST, com assinatura Pro ativa até 30/11/2026, host 37 e programações 20, 21, 22, 23 e 24. Foram distribuídas 20 interações anônimas, datadas nos 14 dias anteriores à carga, para aparecerem no período padrão das estatísticas: 4 DetailView, 5 CarouselClick, 5 TicketClick e 6 NearbyClick. Quantidades por programação: 20=3, 21=3, 22=5, 23=6, 24=3. Favoritos não foram criados. Endereço e CNPJ do host são sintéticos, inseridos diretamente para teste, sem consultas ViaCEP/Geoapify/CNPJ; não representam cadastro verificado de uma empresa real.

A conta é dona das programações, mas as interações foram atribuídas a visitantes anônimos para não representar auto-interações do responsável. Verificadas a senha pelo Identity, a role HOST, a assinatura vigente, os cinco registros, os vinte eventos e o total 20 por HostStatisticsRepository.GetSummaryAsync. Credenciais de teste foram entregues no chat; senha não registrada na documentação. Nenhum dado preexistente removido, nenhuma API principal reiniciada e nenhum PDF exportado. Não foi realizado login HTTP nesta carga.


## Limite de categorias sob concorrência — 01/11/2026

Os fluxos de gravação de vínculos passam a conferir o estado final dentro da transação, após adquirir bloqueio da linha da programação (Programmings) ou do usuário (Users) com SELECT ... FOR UPDATE parametrizado. Não há bloqueio global: operações em programações/usuários distintos podem prosseguir. As validações existentes no DTO e nos services permanecem como primeira verificação.

ProgrammingRepository.EditWithCategoriesAsync usa currentLinks recebido como seleção esperada, bloqueia a programação e relê os vínculos. Se o conjunto de IDs mudou desde a leitura do service, lança CategoryLinksConflictException, já tratado como 409 na controller. Caso contrário, calcula o conjunto final após remoções/adições e exige de 1 a 3 categorias antes de salvar campos e vínculos. CreateWithCategoriesAsync também rejeita listas com zero ou mais de três antes de anexar entidades/gravar.

UserXCategoryRepository.AddAsync e EditAsync bloqueiam a mesma linha Users, serializando POST versus POST, PUT versus PUT e POST versus PUT. AddAsync relê os vínculos e confere a união com os novos IDs: excesso de três gera ArgumentException/400, sem inserções parciais. Reenvio de categoria existente reaproveita o vínculo e retorna os itens solicitados, sem violar unicidade. Lista vazia continua sem efeito.

O service de edição de preferências envia expectedCategoryIds com os IDs da seleção que leu, através do parâmetro acrescentado em IUserXCategoryRepository.EditAsync. O repository compara essa seleção com a leitura feita após o bloqueio e retorna 409 se houve alteração. Depois valida o total final de até três e aplica a diferença existente. [] continua removendo todas as preferências. O snapshot é interno, entre leitura do service e gravação; não implementa versão/ETag de formulário nem detecta edições de campos não relacionados às categorias.

Com conflito, recarregue e revise a seleção antes de reenviar. A controller já traduz a exceção, sem action nova. Nenhum formato de DTO, rota, autenticação, model, índice ou migration foi alterado. Não houve limpeza de dados antigos. As garantias abrangem os fluxos de persistência da aplicação que compartilham esses bloqueios, não gravações SQL externas que os ignorem.

Validação desta etapa: build isolado sem erros (10 avisos preexistentes), 32 verificações HTTP/PostgreSQL de concorrência/limites/atomicidade e 37 regressões HTTP de autenticação aprovadas. Os testes mantiveram duas requisições reais aguardando bloqueio no PostgreSQL para garantir a sobreposição: POST/POST com IDs distintos, POSTs idênticos, PUT/PUT de preferências, POST/PUT e PUT/PUT de programação. Confirmados 200/400 para excesso no POST, 200/409 nas edições, ausência de gravação parcial e de sobrescrita dos campos da programação perdedora, além de substituição normal e listas vazias. Sintaxe JS e 85 testes simulados do protótipo passaram.

API/bancos descartáveis removidos. Banco principal preservado, API principal não reiniciada e PDFs não exportados. Protótipo e .http esclarecem limite e conflito; não há reenvio automático.


## Unicidade de CNPJ no banco — 01/11/2026

Aplicada **20261101123823_AddUniqueHostCnpj** ao banco local perambulando em localhost:5432. Auditoria anterior: sete hosts, zero grupos de CNPJ normalizado duplicado, zero formatos estruturais inválidos e zero registros precisando de normalização. Depois da aplicação, os sete IDs/CNPJs permanecem idênticos e as 20 interações do host 37 foram confirmadas. Histórico sem migrations pendentes e modelo/snapshot alinhados.

Up adquire LOCK TABLE Hosts IN SHARE ROW EXCLUSIVE MODE dentro da transação; verifica formatos e duplicidades pela representação normalizada, interrompendo em caso de inconsistência, sem apagar/escolher registros automaticamente. Remove máscara/espaços externos e converte letras para maiúsculas nos registros compatíveis, cria índice único IX_Hosts_CNPJ e check CK_Hosts_CNPJ_Normalized. Em caso de duplicidade/formato inválido, nada é aplicado. Down remove somente o índice e o check; não apaga hosts nem restaura máscaras antigas. Não foi alterado tamanho/tipo da coluna CNPJ.

Testes em banco descartável cobriram a cadeia de migrations, rejeição de dados duplicados/inválidos, normalização numérica/alfanumérica, rollback de auditoria, Down/Up sem perda de hosts, cadastros e edições simultâneos, índice para inativos, inserção direta e HTTP 409. Não foram realizadas consultas reais de CNPJ/CEP/geocodificação nesses testes. API principal não reiniciada e PDFs preservados.


## Favoritos e preferências repetidos — 01/11/2026

Nenhuma migration ou alteração de schema nesta correção. O índice único existente IX_Favorites_UserId_ProgrammingId continua garantindo um vínculo por par, inclusive quando IsActive=false. FavoriteRepository.AddAsync/DeleteAsync passam a compartilhar bloqueio transacional na linha Users antes de consultar/recarregar e gravar o favorito. Isso serializa criação/reativação/desativação pelo mesmo usuário, inclusive entre instâncias da API atualizada, sem bloqueio global.

Id e CreatedAt do vínculo existente são preservados. UpdatedAt muda em transições de estado, calculado em UTC depois de adquirir o bloqueio. Repetições que já estão no estado desejado não alteram a data. Recarregar a entidade impede usar valores antigos do ChangeTracker após aguardar outra operação. SQL externo que ignore o protocolo de bloqueio não recebe garantia de idempotência da API, mas o índice único não foi removido.

43 verificações em API/PostgreSQL descartáveis aprovadas, incluindo POST/PATCH repetidos/simultâneos, reativação entre leitura inicial e bloqueio do PATCH, datas/identidade, preferências repetidas, isolamento por usuário, conta/host/programação inativos e manutenção do índice/snapshot. Banco principal não foi escrito, nenhum favorito real foi modificado e nenhuma migration foi executada. APIs/bancos de teste encerrados/removidos.


## Exclusão lógica de usuário — 01/11/2026

Nenhuma alteração de model/schema/migration foi necessária: IsActive e os campos de status/data já existiam. DELETE /api/User deixa de executar a remoção física do Identity. A conta e as FKs permanecem, eliminando o bloqueio por FK Restrict de assinaturas/interações no fluxo normal de exclusão.

UserRepository.DeleteAsync controla transação e SELECT ... FOR UPDATE na linha Users, recarrega o usuário e executa a função de desativação coordenada pelo service. Hosts/programações/favoritos/assinatura são obtidos como entidades rastreadas no mesmo Context scoped do store do Identity. UserManager.UpdateAsync salva a conta e as alterações rastreadas dentro dessa transação. Em falha de Identity/banco há rollback e ChangeTracker.Clear; em sucesso há commit. FKs Restrict/Cascade e índices únicos permanecem inalterados, sem exclusão em cascata nem remoção de registros históricos.

50 verificações em PostgreSQL/API descartáveis cobriram assinatura ativa/cancelada/expirada/ausente; múltiplos hosts e programação ativa em host já inativo; favoritos próprios indisponíveis e favoritos de terceiros; interações/endereços/categorias/Identity preservados; reserva de e-mail; bloqueio do JWT/login; concorrência do Identity e reativação manual sem republicação. Trigger de falha e validator Identity simulados, apenas no banco/contexto descartável, confirmaram rollback completo e posterior reenvio bem-sucedido. Mais 37 regressões de autenticação e 89 testes simulados do protótipo passaram. Build sem erros, com 10 avisos preexistentes. Nenhum usuário/host/programação do banco principal foi desativado nos testes; nenhum PDF exportado.


## Preparação de dias de funcionamento — 04/11/2026

HostOpeningDay e HostOpeningPeriod foram definidos em Domain/Model como futura base de dias/períodos. Ainda não foram adicionados DbSets, configurações, navegação em Hosts ou migration. Relacionamentos, unicidade HostId/DayOfWeek e tipos de coluna serão configurados na etapa de persistência. Não há mudança no schema nem aplicação de migration. Verificação apenas estática do Context e build sem erros/dez avisos anteriores; nenhum acesso ao banco ou PDF.

## Contrato do repository de funcionamento — 04/11/2026

Criada Domain/Interfaces/Repository/IOpeningHoursRepository na branch ARTUR-DESKETOP, seguindo as interfaces existentes, sem novas pastas. Define Task<List<HostOpeningDay>> GetByHostIdAsync(int hostId) e Task<List<HostOpeningDay>> EditAsync(List<HostOpeningDay> days, int hostId). O contrato prevê consulta de dias com seus períodos e substituição integral da semana, retornando os registros atualizados.

Recebe somente hostId e entidades, sem userId, DTO ou CancellationToken. O futuro service será responsável por autorização/propriedade, disponibilidade/tipo do host e chamada de OpeningHoursValidations antes de persistir. A futura implementação Data/Repository deverá carregar os períodos e efetuar a substituição da semana em uma operação atômica. Nenhuma consulta/transação foi implementada nesta etapa; a interface não garante essas regras por si só.

Sem classe concreta, DI do repository, configuração EF, DbSets, migration ou endpoint. Build isolado aprovado com zero erros e dez avisos anteriores. Não houve teste funcional, banco/HTTP, API reiniciada, Expo ou PDF. Próxima etapa: implementar OpeningHoursService utilizando este contrato.

## Mapeamento EF dos dias e períodos preparado — 04/11/2026

Adicionados ao Context os DbSets HostOpeningDays e HostOpeningPeriods. Criadas Data/Configurations/HostOpeningDayConfiguration e HostOpeningPeriodConfiguration, descobertas pelo ApplyConfigurationsFromAssembly já existente. Tabelas definidas como HostOpeningDays e HostOpeningPeriods, com Id como PK e FKs obrigatórias HostId/HostOpeningDayId. Não foi necessário acrescentar coleção inversa em Hosts.

DayOfWeek é convertido para int e IsClosed é obrigatório. Índice único do par HostId/DayOfWeek protege contra duplicação do mesmo dia para um host. OpeningTime/ClosingTime usam TimeOnly com tipo PostgreSQL time without time zone obrigatório; ClosesNextDay é obrigatório. As regras de sete dias, enum válido, duração, fechado/períodos e sobreposição permanecem no domínio; esse índice não substitui essas validações e não garante ausência de sobreposição no banco.

Relacionamentos: HostOpeningDay.Host → Hosts, um host para vários dias, FK HostId, Cascade; HostOpeningPeriod.HostOpeningDay ↔ HostOpeningDay.Periods, um dia para vários períodos, FK HostOpeningDayId, Cascade. Remoção física de um dia remove seus períodos; remoção física de um host remove dias/períodos. Alterar IsActive do host não executa cascata de exclusão e preserva a agenda.

Modelo EF agora possui alterações pendentes de migration. Nenhuma migration foi gerada ou aplicada; snapshot e banco permanecem anteriores. Não houve backfill de agenda para hosts antigos. Prepare/revise a migration na etapa autorizada posterior antes de usar a nova persistência. O repository concreto ainda não foi implementado e a API principal não foi reiniciada.

Verificação: 23 verificações locais do modelo Npgsql/EF, sem abrir conexão ou SaveChanges, aprovaram entidades, PKs/FKs, ausência de propriedades sombra, unicidade, tipos obrigatórios, navegações e cascatas no ChangeTracker. SQL estrutural de criação foi apenas inspecionado em memória para conferir tabelas/índice/colunas; isso não gerou arquivo de migration nem foi executado. Build do backend sem erros/dez avisos preexistentes; builds incrementais finais dos harnesses sem erros/avisos novos. 70 regressões do service aprovadas com Identity/repositories simulados. Harnesses locais tmp/OpeningHoursEfModelCheck.cs e tmp/OpeningHoursServiceCheck.cs no workspace do protótipo, não são testes versionados no backend. Sem banco/HTTP real, Expo ou PDF.

## Repository de funcionamento implementado — 04/11/2026

Criado Data/Repository/OpeningHoursRepository implementando IOpeningHoursRepository, com Context recebido pelo construtor e campo Db conforme HostRepository. GetByHostIdAsync filtra HostId, usa AsNoTracking, inclui Periods ordenados por OpeningTime/Id e ordena os dias por DayOfWeek. Consulta sem agenda retorna lista vazia e não mantém entidades rastreadas.

EditAsync substitui a semana inteira em transação: bloqueia a linha do host ativo com SELECT parametrizado FOR UPDATE; consulta os dias atuais com períodos; remove os dias e salva a remoção; adiciona os novos dias/períodos e salva a inclusão; consulta a semana atualizada ainda dentro da transação; confirma e retorna. Dois SaveChanges dentro da mesma transação evitam conflito transitório com o índice único HostId/DayOfWeek sem expor um estado intermediário confirmado. Cascata remove os períodos antigos. Falha reverte a operação, limpa o ChangeTracker e propaga a exceção original, sem convertê-la genericamente em conflito.

O bloqueio por host serializa substituições concorrentes, inclusive quando a agenda ainda está vazia. A última operação executada prevalece como semana completa; não foi implementado controle otimista por versão nem HTTP 409 para edição desatualizada. A leitura do resultado ocorre antes do commit para retornar a semana gravada por aquela chamada. A existência/atividade do host é novamente conferida sob bloqueio; a autorização, tipos permitidos, sete dias e validação de horários continuam no service. O repository pressupõe dias previamente validados e vinculados ao host da operação.

Registrados IOpeningHoursRepository/OpeningHoursRepository e IOpeningHoursService/OpeningHoursService como scoped no Program.cs. Não foram criados AppService concreto, controller ou endpoint de funcionamento nesta etapa. Nenhum contrato HTTP ou formulário foi alterado.

Verificação: backend compilado com zero erros e dez avisos preexistentes; build incremental final do harness sem erros/avisos novos. 23 verificações reais com EF/Npgsql/PostgreSQL em banco descartável aprovaram resolução DI, criação, carregamento/ordenação, AsNoTracking, substituição, cascata, preservação de outro host, índice único, rollback com preservação de IDs/períodos, reutilização do Context, recusa de host inexistente/inativo, duas edições concorrentes e ausência de períodos órfãos.

Docker Desktop foi iniciado porque estava desligado; container PostgreSQL local ficou disponível. O teste criou banco com nome aleatório e prefixo opening_hours_check_, bloqueou destino remoto e removeu esse banco ao finalizar. Usou EnsureCreated exclusivamente nesse banco vazio; não executou Migrate, não gerou arquivos de migration e não abriu o banco principal. Harness local C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/OpeningHoursRepositoryCheck.cs, não versionado no backend. Migration principal continua pendente de revisão/autorização. Sem API principal reiniciada, Expo ou PDF.


## Cadastro transacional de host e agenda — 04/11/2026

Hosts.OpeningDays foi incluída como navegação inversa da FK HostOpeningDay.HostId. A configuração agora usa WithMany(host => host.OpeningDays), preservando tabelas, colunas, FKs e índice único HostId/DayOfWeek já preparados. A navegação opcional distingue, antes de rastrear o grafo de criação, semana omitida (null) de uma semana explicitamente enviada vazia (inválida). Não há nova coluna para essa propriedade.

Db.Set<Hosts>().Add(host) no HostRepository existente rastreia os novos dias/períodos e propaga o ID gerado do host às FKs. A primeira gravação e a atribuição da role continuam na mesma transação. Não houve gravação adicional em outro service após o commit. Testes comprovaram rollback do host, endereço novo, dias, períodos e role após falha simulada.

33 verificações integradas aprovadas com EnsureCreated exclusivamente em banco de nome aleatório host_opening_check_<guid>, removido ao final. CNPJ/geocodificação simulados; EF/Npgsql/PostgreSQL e Identity reais. Nenhuma migration criada/aplicada, nenhum snapshot alterado, banco principal preservado. Schema principal de funcionamento continua pendente de revisão/migration.


## MinPrice/MaxPrice em Hosts — 05/11/2026

Preparadas duas propriedades decimal? MinPrice e MaxPrice em Hosts, configuradas por HasPrecision(12,2), nullable. Isso permite preservar hosts antigos sem estimativa conhecida, evitando preencher zeros fictícios. Valores efetivamente enviados são validados no HostValidation da Application antes do mapping e da chamada ao service, incluindo escala e limite numérico. Não foram criados CHECKs nem backfill nesta etapa.

HostRepository.GetByIdAsync inclui OpeningDays e Periods além de Address, com AsNoTracking, para o perfil retornar a grade real. Não muda tabelas de horários ou suas FKs. Cadastro/edição continuam com as transações existentes.

77 verificações integradas aprovadas com EnsureCreated somente em banco aleatório host_prices_check_<guid>, removido ao final; persistência e Identity reais, CNPJ/geocodificação simulados. Foram verificadas escala/precisão/nullability do modelo, centavos após cadastro/edição, legado nulo, consulta da grade e preservação da agenda ao editar preços. Nenhuma migration/snapshot foi gerada/alterada/aplicada; banco principal preservado. Usuário informou que a migration anterior de horários rodou: as duas colunas monetárias são uma alteração nova e ainda dependem de outra migration. API não reiniciada por essa pendência.


## Chat: objetos de domínio sem persistência — 05/11/2026

TravelChatMessage, TravelChatLocation e TravelChatResponse são tipos usados pelo mapping e pelo contrato ITravelChatService. Não foram adicionados a DbSets, relacionamentos ou configurações EF. Nenhuma tabela, migration ou gravação de conversa foi criada; persistência permanece pendente.


## Chat: Point apenas em memória — 05/11/2026

TravelChatLocation.Location agora usa Point? com SRID 4326 criado pelo mapping (longitude, latitude). Objeto não mapeado no EF; nenhuma coluna, índice, migration ou consulta de proximidade foi criada. Address e seu mapeamento espacial permanecem preservados.

## Chat: model da conversa — 05/11/2026

Criado Domain/Model/TravelChatConversation.cs após conferir ausência de model equivalente e comparar Favorite/Subscription. Contém Id (int), User (navegação), UserId (string), IsActive (true inicialmente), CreatedAt e UpdatedAt (inicializados com DateTime.UtcNow), seguindo o padrão existente de Favorite. UserId permitirá associar a conversa ao usuário autenticado; o model não verifica propriedade por si só.

Não foram adicionadas coleção de mensagens, preferências extraídas ou estado do workflow neste passo. TravelChatMessage continua sendo o objeto de entrada do service, não uma mensagem persistida de histórico. Model User e DTOs preservados. Sem DbSet, configuração EF, migration, tabela, repository ou utilização do novo model pelo service; criação/consulta de conversas e verificação de propriedade continuam pendentes. O UserId da conversa deverá ser preenchido pelo fluxo servidor, nunca pelo DTO do aplicativo.

Próximo baby step: definir a interface do repository para criar/consultar uma conversa pertencente ao usuário, antes de implementar acesso a dados. Action SendMessage permanece sem funcionamento completo e sem registros de DI da feature. Sem alterações no protótipo, n8n, banco ou PDFs.

Validação do model: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Não foram criados testes para propriedades sem lógica. Sem teste HTTP, persistência, banco ou n8n.

## Chat: interface do repository de conversa — 05/11/2026

Criada Domain/Interfaces/Repository/ITravelChatConversationRepository.cs após conferir contratos existentes de Address, Favorite e OpeningHours e ausência de repository equivalente. Contém somente:

```csharp
Task<TravelChatConversation> AddAsync(TravelChatConversation conversation, CancellationToken cancellationToken = default);
Task<TravelChatConversation?> GetByIdAsync(int conversationId, string userId, CancellationToken cancellationToken = default);
```

AddAsync representa salvar a conversa cujo UserId deverá ser preenchido no service a partir da identidade autenticada. GetByIdAsync recebe ID da conversa e do usuário: o contrato da futura implementação exige restringir a consulta à conversa ativa pertencente ao usuário e retornar null para inexistente, inativa ou alheia, permitindo resposta 404 uniforme pelo service. Esse filtro ainda não foi implementado nem testado em banco. CancellationToken permitirá propagar cancelamento à persistência, sem modificar os repositories existentes.

Este passo define apenas a interface no domínio. Sem repository concreto, DbSet, configuração EF, migration, tabela, DI ou chamada desta interface no service. Não foram acrescentadas operações de listagem/edição, actions ou contratos HTTP. IUserService.GetProfileAsync permanece como função reutilizada para validar a conta. Próximo baby step: conectar o contrato ao TravelChatService para iniciar uma conversa ou consultar a conversa do usuário, com repository simulado na validação.

Sem mudança no protótipo, workflow, banco ou PDFs; action continua indisponível em execução por implementação/DI pendentes.

Validação da interface: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para interface sem implementação, HTTP, persistência, banco ou n8n.

## Chat: seleção/início da conversa no service — 05/11/2026

TravelChatService agora recebe ITravelChatConversationRepository pelo construtor. Após rejeitar mensagem nula e reutilizar IUserService.GetProfileAsync para validar a conta, resolve a conversa: sem ConversationId, chama AddAsync com novo TravelChatConversation cujo UserId vem do parâmetro autenticado do service; com ID, exige valor positivo e chama GetByIdAsync(id, userId). Conversa ausente, inativa ou de outro usuário gera a mesma KeyNotFoundException, já traduzida para 404 pela action. Não cria outra conversa silenciosamente quando um ID existente não pode ser usado.

CancellationToken é verificado antes de consultar o usuário e antes de iniciar a etapa de conversa, e encaminhado aos dois métodos do repository. GetProfileAsync mantém contrato existente sem token. Erros de persistência não são mascarados. O objeto de conversa resolvido foi preparado para as próximas etapas de histórico/contexto; ainda não produz resposta.

Limite incremental: após resolver a conversa, o fluxo continua lançando NotImplementedException. Se fosse ligado a um repository real neste estágio, AddAsync poderia salvar uma conversa antes da falha final; por isso a feature permanece sem DI e não deve ser apresentada como funcional. Não há repository concreto, EF, migration ou chamadas reais ao banco. Atomicidade de histórico e resposta, falhas do workflow e novas tentativas deverão ser resolvidas antes de habilitar o fluxo completo.

Sem alteração de DTO, mapping, rota, protótipo, n8n ou PDF. Próximo baby step proposto: definir o model de mensagem persistida do histórico, separado de TravelChatMessage (entrada do service), antes de criar os respectivos contratos de persistência.

Validação desta etapa: dotnet run --no-restore de TravelChatConversationCheck.cs/.csproj compilou o backend sem erros, com nove avisos existentes, e aprovou 22 verificações com IUserService/repository simulados: início/continuidade, identidade enviada, conversa inexistente/inativa/alheia, IDs inválidos, usuário indisponível, cancelamento, mensagem nula e falhas de persistência propagadas. O fluxo válido foi verificado somente até a exceção do trecho pendente. git diff --check sem erros; sem HTTP, banco real ou n8n.

## Chat: model da mensagem do histórico — 05/11/2026

Criado Domain/Model/TravelChatHistoryMessage.cs após conferir os models existentes e ausência de equivalente. Segue o padrão de navegação/chave de HostOpeningPeriod e enum no mesmo arquivo de ProgrammingInteraction.

Campos: Id (int), Conversation (TravelChatConversation), ConversationId (int), Role (TravelChatMessageRole), Text (string inicializada vazia) e CreatedAt (DateTime.UtcNow). TravelChatMessageRole define User=0 e Assistant=1. O papel deverá ser atribuído pelo servidor conforme a origem da mensagem, não recebido do aplicativo para autorizar mensagens de assistente. O usuário proprietário será obtido pela conversa, sem duplicar UserId em cada mensagem.

TravelChatMessage continua como entrada do service, com localização opcional; não foi transformado na entidade do histórico. O novo model não contém coordenadas, precisão, JWT ou instrução de sistema. Text permite armazenar perguntas do assistente e respostas do usuário; persistência estruturada de perguntas, sugestões e preferências será tratada em passos posteriores, não está implementada por este model.

Estado: somente estrutura de domínio, sem coleção acrescentada à conversa, repository de mensagens, DbSet, configuração EF, limites de coluna, índice, migration ou tabela. Nenhum histórico está sendo salvo ou consultado; service e DI permanecem incompletos. Próximo baby step: definir a interface do repository de mensagens do histórico, para adicionar mensagem e recuperar contexto da conversa, preservando a verificação de propriedade no fluxo.

Sem alteração de DTO, mapping, rota, protótipo, banco, workflow ou PDFs. Nenhum teste funcional ou de persistência foi realizado nesta etapa de propriedades sem lógica.

Validação do model de histórico: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.

## Chat: interface do repository de histórico — 05/11/2026

Criada Domain/Interfaces/Repository/ITravelChatHistoryMessageRepository.cs após conferir os repositories existentes e ausência de equivalente. Contém somente AddAsync(TravelChatHistoryMessage message, CancellationToken cancellationToken = default) e GetRecentByConversationIdAsync(int conversationId, string userId, int take = 20, CancellationToken cancellationToken = default), retornando respectivamente a mensagem salva e List<TravelChatHistoryMessage>.

Contrato para a futura implementação: AddAsync salva a mensagem vinculada à conversa previamente validada pelo service; Role será atribuído pelo servidor. Consulta deve restringir a conversa ativa pertencente ao userId, selecionar as últimas take mensagens por CreatedAt/Id e devolvê-las em ordem cronológica crescente (CreatedAt e Id como desempate), para contexto do n8n. take padrão 20 não significa carregar todo o histórico; limitar a faixa de 1 a 100 na implementação/fluxo, conforme padrão de paginação do sistema. Consulta sem registros elegíveis retorna lista vazia; a inexistência/propriedade da conversa deve ser verificada antes pelo contrato já existente de conversa, evitando interpretar lista vazia como autorização.

Este passo define apenas a interface. Não implementa ordenação, filtros, validações, acesso a dados, histórico no service, DI, EF ou persistência. Essas garantias ainda dependem de código e testes futuros. Não foi criada action de consulta de histórico nem alterado DTO/rota. Próximo baby step: conectar o repository de histórico ao TravelChatService para recuperar contexto e registrar a mensagem do usuário, com dependências simuladas e decisão explícita sobre falhas/reenvio antes de habilitar persistência real.

Sem alteração de protótipo, banco, workflow ou PDF; a feature permanece incompleta e indisponível em execução.

Validação da interface de histórico: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Sem testes automatizados para interface sem implementação, HTTP, persistência, banco ou n8n.

## Chat: histórico conectado ao service — 05/11/2026

TravelChatService agora recebe ITravelChatHistoryMessageRepository no construtor. Após reutilizar GetProfileAsync e resolver/validar a conversa, chama GetRecentByConversationIdAsync(conversation.Id, userId, take: 20, cancellationToken) e, em seguida, AddAsync com ConversationId validado, Role=User e Text da mensagem atual. CreatedAt segue a inicialização UTC do model. Nenhuma coordenada ou metadado de localização é copiado para o histórico.

A leitura ocorre antes da gravação para que o contexto recente não contenha novamente a mensagem atual, que será enviada separadamente ao workflow em passo futuro. O contexto é recuperado, mas ainda não utilizado: a integração com o workflow não foi criada. Não são geradas nem salvas respostas fictícias de assistente. Falha na leitura impede a gravação da mensagem; falha na gravação é propagada, sem repetição automática. Cancelamento é verificado antes da leitura e entre leitura/gravação, além de ser encaminhado ao repository.

Limite incremental: o método ainda termina em NotImplementedException depois dessas operações. Se conectado ao banco nesta etapa, poderia salvar conversa/mensagem sem completar a resposta. Portanto não foram registrados DI ou repositories concretos e a feature continua indisponível em execução. A primeira versão não tem ClientMessageId/idempotência: reenvio não poderá ser tratado como exatamente uma gravação; não haverá retry automático. Recuperação de falhas, política de mensagens pendentes e concorrência deverão ser resolvidas antes de habilitar o fluxo real, sem prometer atomicidade que ainda não existe.

DTOs, mappings, rota e verificação de propriedade preservados. Sem DbSet, configuração EF, migrations, banco, workflow, protótipo alterado ou PDF. Próximo baby step: definir o contrato do serviço de interpretação do n8n no domínio, incluindo mensagem atual e contexto recente, antes de implementar transporte HTTP na Data.

Validação do histórico no service: dotnet run --no-restore do harness TravelChatConversationCheck compilou o backend sem erros (nove avisos anteriores) e aprovou 33 verificações com dependências simuladas. Cobrem início/continuidade/propriedade, ordem leitura→gravação, ConversationId/UserId/Role/Text, limite 20, encaminhamento de cancelamento, nenhuma gravação em erro de leitura/acesso, cancelamento durante leitura e propagação de falhas de gravação. Fluxo válido termina no ponto ainda pendente. git diff --check sem erros; sem HTTP, banco real ou n8n.


## IA simplificada: sem persistência de chat — 05/11/2026

Primeira versão redefinida para prompt único e listas de programações/hosts. TravelChatService deixou de depender dos repositories de conversa/histórico. Models/interfaces anteriores ficam inativos, sem EF/tabelas. Nenhuma migration ou alteração de banco.

## Limpeza da IA simplificada — 05/11/2026

Removidos do código os seis arquivos fora do escopo vigente: TravelChatLocationDTO, TravelChatLocation, TravelChatConversation, TravelChatHistoryMessage (incluindo TravelChatMessageRole), ITravelChatConversationRepository e ITravelChatHistoryMessageRepository. A conferência de referências mostrou apenas dependências entre os próprios arquivos removidos; o fluxo do prompt já estava desacoplado deles.

As menções anteriores a esses tipos como preparação inativa são históricas e estão substituídas por esta remoção. Não há mais models/interfaces de conversa, histórico ou localização específicos da IA. Address.Location e o restante da localização já existente do sistema foram preservados. Mantidos os contratos de interpretação/preferências/intenções necessários à próxima etapa do prompt único, além de controller, DTOs, validação, mapping, AppService e service atuais.

Sem mudança de contrato público, lógica de busca ou registros de DI. A integração n8n e os filtros continuam pendentes. Sem migração, banco, protótipo ou PDF alterados.

Validação da limpeza: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores. Busca C# no backend sem referências aos tipos removidos; git diff --check sem erros. Não foram repetidos testes funcionais: remoção apenas de tipos já desacoplados. Sem HTTP, banco ou n8n.

## Hosts: filtros de preço/funcionamento e validação separada — 05/11/2026

GET /api/Host/HostFilter mantém autenticação, paginação e resposta List<HostResponseDTO>. HostFilterDTO, HostFilter e HostFilterMapping agora incluem:

| Campo | Tipo/uso |
|---|---|
| MinPrice / MaxPrice | decimal?; limites opcionais de faixa estimada de gasto por pessoa |
| DayOfWeek | DayOfWeek?; 0=domingo até 6=sábado |
| StartTime / EndTime | TimeOnly?; intervalo opcional em horário semanal do estabelecimento |
| EndsNextDay | bool, padrão false; término do intervalo solicitado no dia seguinte |

Preço usa interseção inclusiva: host.MaxPrice >= MinPrice solicitado e host.MinPrice <= MaxPrice solicitado. Limite ausente não restringe; faixa desconhecida não é tratada como zero/gratuidade e não satisfaz comparação com limite conhecido. Trata-se de estimativa por pessoa, não garantia de valor exato ou de toda a faixa caber no orçamento.

Funcionamento usa qualquer sobreposição positiva, conforme escolha explícita do usuário. Apenas DayOfWeek busca qualquer abertura no dia, incluindo cauda de intervalo iniciado no dia anterior. Com período, dia/início/término são exigidos; deve durar mais de zero e até 24 horas. Horários iguais exigem EndsNextDay=true (24h). Tocar exatamente na abertura/fechamento sem tempo em comum não conta. A consulta considera dias/períodos ativos da agenda (IsClosed=false), múltiplos intervalos, madrugada e semana cíclica (sábado/domingo e domingo/segunda). Agenda ausente não significa aberto. Dia marcado fechado não elimina a cauda de um intervalo válido iniciado no dia anterior. Sem filtro de agenda, hosts sem agenda continuam elegíveis.

Repository aplica preços e Any de dias/períodos diretamente no IQueryable, antes de OrderBy/Skip/Take. Não há carregamento de toda a tabela ou filtro após paginação. Busca preserva nome, cidade, tipos, HasProgrammings e atividade do host. Não altera entities Hosts/HostOpeningDay/HostOpeningPeriod, schema ou migrações: usa campos já existentes.

Por solicitação do usuário, todas as validações do filtro (nulo, Take/Skip, Types, preços não negativos/duas casas/ordem dos limites, dia da semana, campos necessários e duração) foram extraídas para Domain/Validations/Validations/HostFilterValidations, com IHostFilterValidations. HostService recebe a interface pelo construtor e executa Validate(filter) antes do repository. Mensagens/exceções preservadas. Registro scoped acrescentado em Presentation/Program.cs ao lado das validações existentes; alteração necessária à injeção desta funcionalidade, não para suportar o protótipo. Controller continua traduzindo ArgumentException para ProblemDetails 400; DataAnnotations continuam as restrições estruturais no DTO.

Integração com IA: quando VisitDate existir, TravelChatService passa seu DayOfWeek; com período completo confirmado, passa início/fim/virada. Orçamento confirmado por pessoa/por parada vira MaxPrice; não inventa MinPrice, que não existe nas preferências atuais. Orçamento total/grupo permanece sem conversão. Sem data, não aplica horário semanal isolado. Os horários do filtro são horários da agenda, sem novo fuso nomeado ou conversão automática de localização. Client n8n/DI da IA ainda pendentes; a busca pública de hosts reutiliza os services existentes. Especialidade como cafeteria ainda não é distinguida por tipo de host.

Protótipo: catálogo reconhece preços numéricos, horários e seleção de dia da semana com domingo=0; formulários/query mantêm JWT e filtros opcionais, sem herdar preços de um host selecionado. Ajuda explica sobreposição e preços estimados. Exemplo .http atualizado com período normal, madrugada, dia inteiro e entrada inválida. Mudanças de catálogo também tipam DayOfWeek em DTOs já existentes; testes de regressão preservados.

Sem alteração de banco principal, entidades persistidas, configurações EF, migrations, CORS, emissão JWT ou PDF. A API não foi reiniciada.

Validação concluída dos filtros e extração: build do backend aprovado sem erros/nove avisos anteriores; HostFilterHoursCheck executou 197 verificações com EF/PostgreSQL reais em banco local descartável (intervalos/limites, múltiplos períodos, virada de dia/semana, agenda ausente/fechada, faixa monetária, legado nulo, paginação posterior aos filtros, mapping e rejeições de validação). Inclui 147 comparações de intervalos semanais contra um oráculo independente e sete consultas por dia sem período. Banco descartável removido em finally; banco principal preservado. A primeira conexão tentou porta 5434 do Development e foi recusada; teste passou com configuração base da porta 5432 já ativa, sem alteração de config/container/volume. Harness emitiu um aviso CS8602 próprio, separado dos nove avisos do backend.

TravelChatResultsCheck executou 29 verificações simuladas do fluxo combinado, incluindo transferência de dia/período/virada/MaxPrice para HostFilter. node --check de app.js/catalog.mjs e arquivos de teste aprovado; catálogo real conferido; 105 testes do protótipo aprovados com API simulada. Primeira execução da nova fixture de UI falhou por aguardar incorretamente a sincronização inicial; fixture corrigida antes do resultado final. Sem teste HTTP real, API reiniciada, n8n ou PDF. Os exemplos .http foram atualizados, mas não executados contra dados reais. git diff --check sem erros.

## IA: primeiro retorno manual e diagnóstico de listas vazias — 06/11/2026

Usuário informou retorno da API com Programmings=[] e Hosts=[] e trouxe a interpretação do n8n para Recife, 07/11/2026, 09:00–12:00, Turismo (categoria 8), Café (categoria 12) e hostTypes=[1]. Os IDs são do catálogo real; valor monetário/pessoas não informados permaneceram null. Código/status HTTP não foi colado nesta troca; não confundir esse relato com execução automatizada do fluxo completo pelo assistente.

Inspeção do assistente em transação PostgreSQL explicitamente READ ONLY, na configuração base localhost:5432/perambulando: categorias 8=Turismo e 12=Café existem/ativas; zero programações ativas/não encerradas/com host ativo, mesmo antes dos filtros de cidade/data; zero hosts gastronômicos ativos em todas as cidades. Repositories reais retornaram zero para ambas as categorias no período e para host tipo 1/Recife tanto sem agenda quanto com sábado e sábado 09–12. Portanto, nesse banco e nesse momento, o retorno vazio é coerente com os cadastros, não evidência de falha no transporte ou falta de agenda apenas.

Nenhum dado criado/alterado/excluído, nenhuma migration, workflow ou chamada de IA executada pelo assistente. A inspeção consultou apenas contagens e os nomes/atividade das categorias relevantes; não gravou resultados de usuários em arquivos. Próximo teste de presença de sugestões dependerá de cadastros compatíveis, sem alterar silenciosamente filtros ou povoar banco real para teste automatizado de interface. O estado dos dados acima é temporal, não uma regra permanente da API.

## Roteiros personalizados — 12/11/2026

Implementação preparada; migration `20261112194651_AddRoadmaps` criada, **não aplicada**. Não reinicie em Development antes de revisar: o Program.cs existente executa MigrateAsync na inicialização. Nenhuma mudança de schema foi executada nesta etapa.

### Contrato e acesso
- `POST /api/Roadmap`: público, JWT opcional; retorna 201 e Location para a consulta compartilhada. UserId vem exclusivamente da identidade autenticada, nunca do corpo. Sem token cria roteiro anônimo, que não pode ser editado ou desativado depois.
- `GET /api/Roadmap/Shared/{shareId}`: público, somente leitura; identificador UUID aleatório. Compartilha nome e paradas, nunca UserId/e-mail. Roteiros inativos ou de contas desativadas retornam 404. SharePath é uma rota relativa da API que retorna JSON; o frontend deve compor sua página pública a partir de ShareId, sem colocar JWT no link.
- `GET /api/Roadmap/GetAllRoadmapbyUserId?take=10&skip=0`: JWT obrigatório; somente roteiros ativos do usuário autenticado. Não recebe userId externo; take de 1 a 100 e skip não negativo. Lista vazia retorna 200 com [].
- `PUT /api/Roadmap/{id}`: JWT do dono, substitui nome e lista completa de paradas; exige Version da última leitura. Anônimo/outro dono não obtêm acesso por ShareId; 404 para roteiro indisponível e 409 para versão desatualizada/concorrência.
- `PATCH /api/Roadmap/{id}/Deactivate?version={uuid}`: dono autenticado e versão atual; soft delete, retorna 204 e torna o compartilhamento indisponível.
- `POST /api/TravelChat/Messages` passou a permitir anônimos. Com JWT válido, continua verificando usuário ativo pelo IUserService.GetProfileAsync. Authorization inválido/expirado não é aceito silenciosamente como anônimo. Sem header, não consulta perfil. Não envia identidade ao n8n.
- Criação de roteiro e TravelChat usam o limitador local por IP já existente, ProgrammingInteractions (120/minuto); excesso retorna 429. Não substitui política de quotas distribuídas de produção.

### DTOs, entidades e regras
RoadmapDTO: Name obrigatório até 150 caracteres, Version opcional na criação/obrigatória na edição e Stops de 1 a 30. Cada RoadmapStopDTO recebe somente ProgrammingId OU HostId, mais StartDate/EndDate UTC. A ordem da lista define Position. IDs positivos, início anterior ao fim, período entre 2000 e 2100, sem sobreposição; intervalos adjacentes são permitidos. Não exige participação integral: a visita deve caber no evento. Não calcula tempo de deslocamento, vagas ou reservas e não exige que os IDs pertençam a uma resposta específica da IA: opções ativas de qualquer página são novamente conferidas no banco.

Hosts elegíveis são Gastronomia/Comércio com grade cadastrada. A visita inteira deve caber em um intervalo aberto, incluindo viradas de dia e períodos do dia anterior; não atravessa intervalo fechado. Grade local interpretada em America/Recife, enquanto entrada e persistência usam UTC. O modelo atual não possui timezone por estabelecimento; ampliação a outros fusos fica pendente. Cada programação/host pode aparecer uma vez por roteiro. Validações ocorrem ao criar/editar; alterações posteriores no catálogo não reservam nem garantem disponibilidade. IsAvailable no retorno indica somente o estado ativo da opção/host.

RoadmapResponseDTO: Id, Name, ShareId, SharePath, Version, CreatedAt, CanEdit e Stops ordenadas com nome, IDs, período e IsAvailable. Consulta compartilhada sempre retorna CanEdit=false; criação autenticada/listagem privada/edição retornam true. Não é possível apropriar-se de um roteiro anônimo depois do login.

Persistência: Roadmaps (UserId nullable, ShareId único, Version como token de concorrência), RoadmapStops (FKs, posição única por roteiro, alvo exclusivo e período positivo com checks), RoadmapProgrammingUsages (histórico, par RoadmapId/ProgrammingId único). FKs de catálogo e usuário restritivas preservam referências; a desativação de usuário já é lógica. Criação usa um SaveChanges atômico. Edição usa transação: troca versão, remove paradas antigas, adiciona as novas e registra somente inclusões inéditas. Conflitos de versão são 409; outras falhas de banco não são mascaradas como conflito.

### Estatísticas
Summary, Daily e Ranking retornam RoadmapInclusions. Ranking aceita sortBy=roadmapInclusions. A métrica conta a primeira inclusão de uma programação em cada roteiro, na data UTC dessa inclusão; retirar/recolocar a mesma programação no mesmo roteiro não conta outra vez. A desativação do roteiro preserva esse histórico. Exclusão de autointeração compara dono do host ao usuário autenticado; não é possível identificar o dono quando navega anonimamente. Conta inclusões, não pessoas únicas, reservas ou comparecimento. Roteiros com somente hosts não aumentam a métrica de programações.

Agregações de favoritos, interações e inclusões são independentes, evitando produto cartesiano. Ranking faz left joins e mantém zeros; Daily reúne os grupos por data e o service mantém dias sem dados com zero. Autorização Pro e propriedade das estatísticas permanecem.

### Testes e operação
Harness em docs/validacoes/RoadmapChecks.csproj valida regras sem conexão ao banco. Exemplos de todas as rotas no arquivo Projetos - 4.http. Painel prototipo-api sincroniza os contratos e permite selecionar hosts/programações entre páginas, informar horários, ordenar e preparar o POST. Dados só são enviados ao clicar Enviar requisição; JWT é opcional nas duas operações públicas. Compartilhamento de rota da API é JSON, sem nova página pública no Expo. PDFs não foram regenerados.

Limites da verificação: não foram aplicadas migrations nem executadas gravações HTTP/integração PostgreSQL. Testes de transação, concorrência real e execução das agregações no PostgreSQL devem ocorrer após a revisão/aplicação autorizada da migration. Não confundir compilação/testes com banco atualizado.
