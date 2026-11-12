# Entidades e models

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 20/10/2026

As cinco entidades de negócio ficam em `Domain/Model`. Entidades representam o domínio e a persistência; DTOs representam entradas e saídas HTTP. Nem toda propriedade herdada de Identity é persistida, e nem todo campo da entidade é exposto nos DTOs.

## 1. User

Herda `IdentityUser`, com ID string, nome de usuário, e-mail, hash de senha e demais membros do Identity. O nome recebido da API é armazenado em UserName, não em uma propriedade Name independente.

| Propriedade própria | Tipo C# | Padrão | Uso |
|---|---|---|---|
| Typeofuser | TypeofUser | 0 | Local = 0; Turist = 1 |
| IsActive | bool | true | Disponibilidade da conta nos fluxos que a consultam |
| isPro | bool | false | Flag retornada no perfil e em claim do JWT |
| CreatedAt | DateTime | DateTime.UtcNow | Criação |

O ID identifica a pessoa. A role HOST é um vínculo Identity e não um valor do enum TypeofUser. Ser Local/Turist não determina ser dono de host.

Configuração: tabela Users; UserName e e-mail com limite 256; diversos campos herdados são ignorados no EF. Consulte o documento de BD para a lista.

## 2. Hosts

Cada host pertence a um usuário; o mesmo usuário pode ter vários hosts. Não há coleção de programação declarada nesta classe: o perfil carrega a lista por consulta.

| Propriedade | Tipo C# | Padrão / papel |
|---|---|---|
| Id | int | PK, gerada no banco |
| UserId | string | FK do usuário; atribuído a partir do JWT |
| User | User | Navegação; inicializada com null! |
| Typeofhost | TypeofHost | 0 = Productor; 1 = Gastronomy; 2 = Business |
| CNPJ | string | Vazia inicialmente |
| LogoUrl | string | Vazia inicialmente |
| InstagranUrl | string | Vazia inicialmente; grafia atual |
| Address | string | Endereço do host |
| AddressNumber | string | Vazio inicialmente; até 20 caracteres; aceita s/n ou alfanumérico |
| AddressComplement | string | Vazio inicialmente; até 200 caracteres |
| Neighborhood | string | Bairro |
| CEP | string | Código postal |
| Location | Point? | Coordenada opcional do host; JsonIgnore |
| Phone | string | Contato |
| Name | string | Nome do estabelecimento |
| Description | string | Descrição |
| IsActive | bool | true |
| CreatedAt | DateTime | DateTime.UtcNow |
| UpdatedAt | DateTime | DateTime.UtcNow |

Todas as strings de conteúdo acima iniciam como string vazia. `null!` na navegação não carrega o usuário: apenas suprime a análise de nulidade do compilador naquele inicializador.

## 3. Programming

Uma programação pertence a um host. Endereço e preços são próprios, podendo diferir do estabelecimento.

| Propriedade | Tipo C# | Papel / padrão |
|---|---|---|
| Id | int | PK |
| HostId | int | FK do host |
| Host | Hosts | Navegação, sem inicialização no model |
| Name | string | Nome |
| Description | string | Descrição |
| IsActive | bool | true |
| StartDate / EndDate | DateTime | Intervalo do evento |
| IsFree | bool | Gratuidade; false se não definido |
| Address / Neighborhood / CEP | string | Localização específica |
| AddressNumber | string | Número específico do evento; vazio inicialmente; até 20 caracteres |
| AddressComplement | string | Complemento do evento; vazio inicialmente; até 200 caracteres |
| Location | Point? | Coordenada própria da programação; JsonIgnore |
| ImageUrl | string | Imagem informada por URL |
| TicketUrl | string | Link informado para ingressos/reserva |
| InstagranUrl | string | Link de Instagram; grafia atual |
| CreatedDate | DateTime | DateTime.UtcNow |
| UpdateDate | DateTime | DateTime.UtcNow |
| MinPrice / MaxPrice | float | Faixa de preço; zero se não definida |

As strings são inicializadas vazias. Host não inicializado pode gerar aviso de nulidade; não é garantia de que a navegação está carregada. O repositório de detalhes usa Include(p => p.Host).

Não há SourceUrl no model atual. O endereço público para compartilhar a página pode ser construído pelo frontend com o ID. Não há lista de categorias declarada diretamente em Programming; os vínculos são consultados por ProgrammingXCategory.

## 4. Category

| Propriedade | Tipo C# | Padrão / papel |
|---|---|---|
| Id | int | PK |
| Name | string | Vazio inicialmente; limite 100 no EF |
| IsActive | bool | true |

O GET público lista apenas as ativas. A consulta de categorias já vinculadas não filtra IsActive. A entidade não contém coleção de vínculos ou programações.

## 5. ProgrammingXCategory

Entidade de associação para permitir várias categorias por programação e várias programações por categoria.

| Propriedade | Tipo C# | Papel |
|---|---|---|
| Id | int | PK própria |
| ProgrammingId | int | FK obrigatória |
| Programming | Programming | Navegação |
| CategoryId | int | FK obrigatória |
| Category | Category | Navegação |

As navegações não são inicializadas no model. No create, o app service monta os vínculos usando Programming e CategoryId; o EF resolve a chave do novo evento na gravação. No edit, os vínculos novos são associados à instância existente rastreada antes do save.

O par ProgrammingId/CategoryId não é chave composta nem tem índice único no snapshot atual. Id é a chave. A leitura com Distinct não impede duplicidade física.

## 6. Persistência, validação e exposição

Location usa NetTopologySuite.Geometries.Point e é mapeada em geography(Point,4326), com índice GiST. X é longitude e Y é latitude. O serviço de geocodificação utiliza new Point(longitude, latitude) com SRID = 4326. A geocodificação automática está integrada no cadastro e na edição e depende da chave do provedor. Os registros anteriores permanecem com Location NULL.

Número e complemento foram adicionados nas duas entidades, com nomes AddressNumber e AddressComplement (grafia corrigida de Adrress). São strings, sem validações cruzadas no model; os limites 20/200 estão nos DTOs de entrada e na configuração EF. São não nulos no banco, mas aceitam vazio, preservando cadastros antigos. A migration foi aplicada sem reescrever Address. Todos os mapeamentos de criação/edição/detalhes foram atualizados.

JsonIgnore mantém o Point fora dos retornos que serializam entidades. A futura saída para o mapa pode expor latitude e longitude em DTO, mas esse contrato ainda não foi adicionado. A migration de localização já foi aplicada no banco local, com os registros preservados.

- Configurações EF limitam colunas e definem nulidade, não substituem validação de formulário.
- Strings não anuláveis podem ser vazias; isso não significa que o cadastro deva aceitar conteúdo vazio por regra de negócio.
- Regras cruzadas de datas e preços estão nos controllers, não em Validate nas entidades.
- Datas de criação são inicializadores C#; não estão documentadas como defaults SQL no snapshot.
- Desativação lógica depende dos filtros das consultas; não há filtro global em Context.
- Retornar uma entidade nos endpoints de mutação/listagem não equivale a usar o DTO de detalhes. Os formatos precisam ser revisados quando o model mudar.

## 7. Relações resumidas

```text
User (conta)
  -> Hosts (estabelecimentos)
      -> Programming (programações)
          -> ProgrammingXCategory (vínculos)
              -> Category (categoria)
```

O ID do host não é o ID do usuário. O frontend seleciona qual host será usado, mas o serviço sempre precisa verificar se o dono é o usuário do token.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

GeocodingAddress é um record interno com Street, Number, Neighborhood anulável e PostalCode; não é entidade EF nem tabela. GeocodingException diferencia endereço não resolvido de indisponibilidade do serviço. Location em Hosts e Programming é preenchida por IGeocodingService como Point(longitude, latitude), SRID 4326; permanece anulável para registros anteriores e com JsonIgnore. Não foram alteradas as entidades persistidas nesta etapa.

Veja a [configuração e os critérios da integração](README.md). Validação: build sem erros (três avisos CS8618 preexistentes), 63 verificações com HTTP/repositórios simulados e 17 testes do protótipo. Consulta HTTPS real ao Geoapify validada em 19/10/2026, com resultado building no Brasil e confiança 1. A chave foi configurada em Geoapify__ApiKey no ambiente do usuário Windows, sem inclusão nos arquivos. O fluxo completo via API/banco ainda precisa ser exercitado após reiniciar o processo que inicia a aplicação. PDFs não regenerados.


## UserXCategory — 20/10/2026

Entidade de vínculo de interesses do usuário: Id (int), UserId (string), User (navegação), CategoryId (int), Category (navegação), CreatedAt/UpdatedAt (DateTime inicializados em UTC). Cada registro liga um usuário a uma categoria. Context expõe UserXCategories e a configuração define a tabela com esse nome. A migration usa relacionamentos por convenção e FKs para Users/Categories.

As navegações User/Category e UserId ainda geram avisos CS8618 por falta de inicialização. Esta atualização não modificou a entidade. Os retornos das programações sugeridas usam a entidade Programming; o protótipo lê seus IDs e abre os detalhes públicos sem presumir propriedade do evento.

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


## Migration AddAddress corrigida — 21/10/2026

20261021193025_AddAddress foi revisada para preservar dados: Addresses é criada primeiro, AddressId começa anulável e sem default 0, os endereços/coordenadas/datas/autoria existentes são copiados e vinculados com os IDs gerados, e só depois são criadas as restrições e removidas as colunas antigas. Down devolve os endereços aos campos anteriores antes de remover a tabela; bloqueia reversão que descartaria endereços sem vínculo. Campos que excedem os novos limites interrompem a migration sem truncamento. Não foram alterados Designer, snapshot, entidades ou contratos HTTP nesta correção.

Build sem erros (sete avisos preexistentes) e 20 verificações de Up/Down no PostgreSQL com dados fictícios em schema isolado, revertido ao final. Conferência somente de leitura do banco da aplicação: 23 hosts, nove programações, colunas antigas presentes e AddAddress não aplicada. Encontrados CEPs incompatíveis em Hosts ID 12 (872878282), Programmings ID 6 (fsdfsdfsd) e ID 7 (FSDFSDFDS). Nenhum registro foi alterado; é necessário revisá-los antes de aplicar.

[Alterações completas, testes e pendências](validacoes/migration-address-correcao-2026-10-21.md). A migration continua aguardando revisão/aplicação; não foi executado Update-Database nem reiniciada a API. Nenhum PDF atualizado.

### Estado do banco após a aplicação — 21/10/2026

AddAddress foi aplicada por autorização do usuário: 23 hosts e nove programações preservados, vinculados a 32 Addresses; sem migrations pendentes. Somente os CEPs inválidos de Hosts ID 12 e Programmings IDs 6/7 foram esvaziados, com os valores anteriores preservados em backup. Campos e coordenadas foram conferidos após a transferência. Não houve mudança adicional de contrato HTTP ou de regra de validação. Consulte docs/validacoes/migration-address-correcao-2026-10-21.md para a evidência completa. PDFs preservados.

## Consulta ViaCEP — 24/10/2026
Implementado GET /api/Address/GetByCEP?cep=50030-220, com JWT obrigatório. Fluxo: AddressController -> AddressAppService -> AddressService -> IPostalCodeService/ViaCepService. Formato validado no serviço; aceita oito dígitos ou hífen após o quinto dígito. Retorno PostalAddressDTO: cep, street, neighborhood, city, state. Sem número ou complemento do imóvel.
Respostas: 200 encontrado, 400 formato inválido, 401 sem autenticação, 404 quando o ViaCEP confirma ausência e 503 por timeout, HTTP malsucedido ou resposta inválida. Timeout de oito segundos; cancelamento da requisição propagado. Consulta não grava no banco nem aciona a Geoapify. O formulário permite preencher manualmente se a consulta falhar e mantém número/complemento.
Escopo desta etapa: preenchimento assistido nos quatro formulários de criar/editar host/programação. Cidade e UF são exibidos na consulta, ainda não persistidos em Address nem enviados à geocodificação. A inclusão dessas colunas e seu uso pela Geoapify continuam pendentes de etapa própria, com revisão da migration. PostalAddress é um resultado de consulta, não uma entidade mapeada no EF. Não há migration nesta entrega.
Validações executadas: build sem erros (sete avisos CS8618 existentes), node --check, 44 testes do protótipo com API simulada e dez verificações do adaptador C# com HttpMessageHandler simulado (sucesso, ausência, resposta inválida, HTTP 429/500, falha de rede e timeout). Nenhum cadastro real foi criado nos testes. PDFs não regenerados.


## Consulta e validação de CNPJ — 25/10/2026
Integração Minha Receita nas camadas existentes: HostController -> HostAppService -> HostService -> ICompanyRegistrationService/MinhaReceitaService. ICnpjValidations/CnpjValidations normalizam e validam formato e dígitos verificadores numéricos e alfanuméricos, sem converter o identificador em número. Os DTOs de cadastro/edição exigem CNPJ e formato compatível. Nenhuma pasta nova de produção foi criada.
GET /api/Host/GetByCNPJ?cnpj=33683111000280 exige JWT e retorna CompanyRegistrationDTO: cnpj, legalName, tradeName, registrationStatus, statusDescription, checkedAt (UTC da consulta), street, number, complement, neighborhood, cep, city e state. Nenhum dado de sócios é devolvido. Consulta bem-sucedida retorna 200 inclusive para situação não ativa; o formulário informa a situação. Falhas: 400 formato/DV inválido, 404 não localizado na base consultada, 503 indisponibilidade, limite, timeout ou resposta inválida. CheckedAt não representa atualização da base oficial nem é persistido.
Criar host e alterar CNPJ exigem consulta com situacao_cadastral=2 antes de geocodificar ou salvar. Cadastro duplicado retorna 409; empresa não ativa retorna 422. Edição sem mudança do CNPJ normalizado dispensa nova consulta externa, mas valida formato/DV e duplicidade. O próprio host é excluído da busca de duplicados. Hosts inativos continuam reservando o CNPJ. Não há validação externa na desativação. Falhas da consulta não salvam o host. Registros legados não foram corrigidos ou excluídos automaticamente.
O repositório repete a verificação de duplicidade dentro da transação, sob pg_advisory_xact_lock(721904, 1), utilizado no cadastro e alteração do CNPJ. Isso serializa essas gravações entre instâncias desta API. Não existe índice único novo: gravações externas que ignorem o lock não são protegidas. Uma restrição única no banco exige auditoria/normalização dos registros legados e revisão de migration; permanece melhoria pendente. A transação existente de cadastro com role HOST foi preservada.
Protótipo: consulta automática após 500 ms ao completar o CNPJ. Resultados de consultas antigas são ignorados. Nome e endereço são sugestões aplicadas somente por botões de confirmação; não sobrescrevem o formulário automaticamente. Cidade/UF são exibidas mas seguem fora da persistência de Address. A consulta não comprova representação da empresa pelo usuário. Minha Receita é uma base secundária e pode estar desatualizada; ausência não comprova inexistência definitiva.
Validação: build sem erros (sete avisos CS8618 preexistentes), node --check, 50 testes do protótipo com API simulada e 30 verificações C# com dependências simuladas (DV, normalização, respostas inválidas, ausência, timeout, cancelamento, regras de criação/edição, situação ativa, duplicidade e propriedade). Consulta real somente de leitura pelo adaptador C# confirmou resposta válida e ativa para o exemplo público do provedor. A suíte não executou cadastros reais nem teste concorrente contra PostgreSQL. NuGet não conseguiu consultar a base de vulnerabilidades (NU1900) na execução do harness; isso não impediu a compilação/testes. PDFs não regenerados. Nenhuma migration criada por esta integração.
Fontes: https://docs.minhareceita.org/como-usar/ ; https://docs.minhareceita.org/sobre-os-dados/ ; https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf


## Favorite — 26/10/2026

Nova entidade em Domain/Model/Favorite.cs, seguindo a organização existente, com Id int, UserId string, ProgrammingId int, IsActive bool (inicialmente true), CreatedAt e UpdatedAt (UTC). Há navegações User e Programming, com FKs explícitas em FavoriteConfigurations e DbSet<Favorite> no Context.

Os nomes CreatedAt/UpdatedAt seguem o padrão existente de UserXCategory para os campos de data apresentados no desenho. O UserId é string para compatibilidade com ASP.NET Identity. A entidade representa o vínculo de um usuário com uma programação; o par é único. IsActive suporta remoção lógica e reativação. Não foi necessário adicionar coleções de navegação às entidades User/Programming.

A API retorna FavoriteResponseDTO, sem expor as navegações das entidades. O modelo EF foi validado em memória (tipos, tabela, índice único e FKs); a tabela depende da futura migration, ainda não gerada/aplicada.


## R03 — unicidade dos vínculos de categorias (26/10/2026)

Os campos de UserXCategory e ProgrammingXCategory não mudaram; seus pares usuário/categoria e programação/categoria foram configurados como únicos no modelo. Reenvio de interesse deve reaproveitar a entidade existente, preservando Id/datas; duplicidades antigas não foram removidas. Os novos índices dependem de auditoria e migration revisada.

Validação: build sem erros; 13 verificações locais de modelo/snapshots/409, 41 cenários de mapeamento e 52 testes do protótipo com dependências simuladas aprovados. Sem teste de persistência no PostgreSQL, alteração de dados, migration ou PDF. [Registro completo e pendências](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## R03 — Docker disponível, auditoria e testes reais (26/10/2026)

Os índices únicos configurados no modelo foram criados e testados somente em um banco descartável. Ambos rejeitaram inserções duplicadas diretas. O banco principal mantém o schema anterior até revisão/aplicação da migration.

As 13 verificações de integração passaram. O banco descartável foi removido; o banco principal manteve as contagens e não foi alterado. Nenhuma migration, limpeza de dados ou PDF executado. [Relatório e comando de teste](validacoes/unicidade-vinculos-categorias-2026-10-26.md).


## Bloqueio de login e stamps do Identity — 26/10/2026

User continua herdando IdentityUser. O mapeamento deixa de ignorar AccessFailedCount, LockoutEnabled, LockoutEnd e SecurityStamp; ConcurrencyStamp de User e IdentityRole é token de concorrência. LockoutEnabled tem default true no schema futuro. Os demais Ignore permanecem. DTOs não expõem esses campos. Migration do banco principal pendente de revisão.

Implementação, roteiro da migration e teste reproduzível: [revisão R01](validacoes/identity-bloqueio-login-2026-10-26.md).

## Verificação após AddFavorite — 26/10/2026

Os mapeamentos de Identity, Favorites e unicidade dos vínculos agora estão refletidos no banco após AddFavorite. A inclusão de colunas anuláveis não inicializou stamps de registros anteriores. SecurityStamp nulo causa exceção ao registrar falha de login; é necessário preencher os stamps antigos. Nenhum model de produção foi alterado nesta auditoria.

Evidências e teste reproduzível: [auditoria da migration](validacoes/validacao-migration-addfavorite-2026-10-26.md).

## Limpeza autorizada das contas antigas — 26/10/2026

A pendência de stamps dos registros anteriores foi encerrada pela exclusão autorizada das 23 contas antigas e inicialização de ConcurrencyStamp das roles ADMIN e HOST preservadas. A exclusão respeitou os relacionamentos ON DELETE CASCADE existentes. Modelos e configurações EF não foram alterados nesta limpeza.

## Edição de datas e preços decimais — 26/10/2026

Programming.MinPrice e MaxPrice agora são decimal, com precisão 12 e escala 2 configuradas no EF. DTOs de entrada/resposta/detalhes acompanham o tipo sem cast. Nenhum novo atributo de data: apenas a regra de início futuro foi restringida ao cadastro. A edição mantém as datas UTC ordenadas, aceitando eventos iniciados/encerrados.

Detalhes e teste reproduzível: [revisão de datas/preços](validacoes/programming-datas-precos-2026-10-26.md).

## Mapping de favorito para model — 26/10/2026

Adicionado FavoriteMapping.ToModel(userId, programmingId) na Application. O model Favorite mantém seus valores padrão para IsActive, CreatedAt e UpdatedAt; o mapper preenche apenas as duas chaves de vínculo. Nenhuma alteração em model, schema, DI, validação ou endpoint.

## Restauração após reorganização do backend — 26/10/2026

Restauração dos mappings na Application do backend novo não alterou models, relacionamentos ou configurações EF. Preços continuam decimal e endereços continuam convertidos por AddressMapping. Persistência e regras continuam nas camadas existentes. A única compatibilização fora dos mappings foi o validador antigo de programação que ainda usava float.IsFinite com propriedades decimal.

## Modelo auxiliar ProgrammingFilter — 26/10/2026

Criado em backend/Projetos - 4/Domain/Model/ProgrammingFilter.cs para transportar critérios de consulta. Acompanha os campos do ProgrammingFilterDTO atual: Take (10), Skip (0), CategoriesId, City, Text, StartDate, EndDate, IsFree, MinPrice, MaxPrice e HostId. Os critérios opcionais são anuláveis. Não contém métodos ou validações de entrada.

Marcado com [NotMapped], sem DbSet, navegações ou configuração de entidade. Não gera tabela nem exige migration. A criação deste modelo não implementa o filtro nem altera contratos HTTP.

Validação: conferência estática do modelo e do Context; build executado, impedido pelo erro CS1061 já presente na action Filter, pois IProgrammingAppService ainda não declara FilterAsync. Não houve execução da API, acesso ao banco ou geração de PDFs.

## Address.City para filtro — 26/10/2026

Address agora contém City (string, padrão vazio, máximo 150 no EF). AddressService normaliza cidade em endereços novos e AddressRepository inclui City na comparação de endereços equivalentes. A migration está preparada e não aplicada. ProgrammingFilter continua [NotMapped], sem tabela ou DbSet, com os mesmos 11 campos atuais.

## Objeto de filtros de host — 27/10/2026

HostFilter adicionado a Domain/Model como objeto de consulta, com Name, Types, City, HasProgrammings, Take (padrão 10) e Skip (padrão 0). Não é entidade persistida nem foi adicionado ao Context; não exige tabela ou migration. Recebe HostFilterDTO por HostFilterMapping.ToModel. Consulta de hosts ainda pendente nas demais camadas. Build bloqueado por chamada preexistente a IHostAppService.FilterAsync não implementado; nenhum teste HTTP ou banco realizado.

## Remoção de bairro dos filtros de host — 27/10/2026

Neighborhood removido de HostFilterDTO, HostFilter, HostFilterMapping e da consulta HostRepository.FilterAsync. Bairro continua opcional no endereço e nos formulários de cadastro/edição, para exibição; não participa da seleção de hosts. Proximidade permanece uma implementação futura. Nenhuma alteração no schema ou migration. O catálogo do protótipo lê o DTO atualizado; ajustada descoberta da pasta da API para aceitar a estrutura atual e a estrutura backend/Projetos - 4. PDFs preservados.

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

## categoryIds no ProgrammingResponseDTO - 27/10/2026

ProgrammingMapping.ToDTO agora preenche a lista categoryIds já adicionada pelo usuário ao DTO. IDs distintos/ordenados dos vínculos atuais, ou [] sem vínculo. Todas as consultas que alimentam ProgrammingResponseDTO carregam ProgrammingXCategories junto do endereço, sem busca por item no mapping. Cadastro, edição, listagens, filtro e carrossel incluem os IDs; os detalhes públicos preservam seu contrato Categories com nomes. Categorias vinculadas inativas não são removidas silenciosamente da lista de IDs.

Navegação de Programming ligada à FK existente; EF confirmou ausência de mudança de schema pendente. Build aprovado, 21 verificações reais em PostgreSQL descartável e 64 testes simulados do protótipo aprovados. Protótipo exibe os IDs/nomes disponíveis e reaproveita a lista na edição. Sem migration, escrita no banco principal, PDF ou reinicialização da API. [Implementação e testes](validacoes/programming-response-categorias-2026-10-27.md).


## Estatísticas implementadas em 29/10/2026

ProgrammingInteraction contém Id long, EventId Guid, ProgrammingId, Type 0 a 3, UserId opcional e CreatedAt UTC. HostStatisticsSummary, HostStatisticsDaily, HostStatisticsRanking, ProgrammingStatistics, HostStatisticsPeriod e HostStatisticsRankingFilter são modelos de consulta, sem herança e sem novas tabelas.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

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


## Unicidade de CNPJ no banco — 01/11/2026

Hosts mantém os mesmos atributos. HostConfiguration passa a declarar índice único em CNPJ (IX_Hosts_CNPJ) e CHECK CK_Hosts_CNPJ_Normalized para formato canônico: ^[A-Z0-9]{12}[0-9]{2}$. O tamanho máximo da coluna continua 18, mas valores armazenados válidos têm 14 caracteres sem máscara e letras maiúsculas. HostDTO continua aceitando máscara e caixa baixa na entrada; CnpjValidations/HostService normalizam antes da persistência. A unicidade vale também para hosts inativos. Não é um check de dígitos verificadores nem de situação cadastral. Snapshot/Designer foram gerados pelo EF, com DbContext referenciado pelo nome completo para evitar ambiguidade entre namespace e classe Context. Migration AddUniqueHostCnpj aplicada ao banco local após auditoria sem duplicidades.


## Favoritos e preferências repetidos — 01/11/2026

Favorite mantém os mesmos atributos e a mesma configuração EF. Id/CreatedAt identificam a criação original do vínculo e são preservados na reativação. IsActive alterna com favoritar/desfavoritar; UpdatedAt muda somente quando há transição efetiva, em UTC após o bloqueio transacional. Repetir favorito ativo ou desfavoritar um vínculo já inativo mantém os dados anteriores. O índice único do par usuário/programação permanece existente e não houve migration.


## Exclusão lógica de usuário — 01/11/2026

User.IsActive passa a representar também a exclusão lógica pelo endpoint existente. A entidade permanece com Id, Email/NormalizedEmail, PasswordHash, CreatedAt e vínculos Identity. UserManager.UpdateAsync mantém ConcurrencyStamp; nenhum DeletedAt ou campo novo foi criado.

Na mesma operação, Hosts.IsActive e Programming.IsActive ficam false, com suas datas de atualização; Favorite.IsActive dos vínculos próprios fica false; Subscription.Status fica Cancelled e recebe CancelledAt/UpdatedAt quando ainda não cancelada. Endereços, interações, relações de categorias e favoritos alheios são preservados. Valores já inativos/cancelados preservam suas datas anteriores. A eventual reativação somente do usuário não altera esses estados relacionados. Não há mudança no snapshot ou necessidade de migration.


## AuthenticationToken como resultado de serviço — 01/11/2026

Adicionado Domain/Model/AuthenticationToken: AccessToken (string), TokenType (string, padrão Bearer) e ExpiresAt (DateTime UTC). É um resultado tipado de IJwtTokenService, sem DbSet, configuração EF, navegação ou tabela. A classe permite que o contrato do domínio não dependa da implementação criptográfica nem de um DTO da Application. O modelo EF/snapshot continua alinhado, sem migration necessária.

Adicionada CategoryNotFoundException em Domain/Exceptions para comunicar categoria inexistente sem referência a HTTP/PostgreSQL. Recebe InnerException opcional; o repository traduz a FK conhecida e a Presentation mantém o HTTP 400. CnpjException e CategoryLinksConflictException seguem como falhas de domínio; a extensão que monta a resposta HTTP de CNPJ foi movida para Presentation/Controllers.

## Retirada da primeira implementação de roteiros IA — 04/11/2026

Por solicitação do usuário, a implementação anterior de roteiros por IA/n8n foi descartada na master para permitir a revisão dos requisitos. Retirados os arquivos de controller, AppService, services/interfaces, mappings, DTOs, modelos de integração, validações e cliente n8n, além do adaptador Geoapify de rotas que havia sido criado exclusivamente para esse fluxo. Removidos registros/imports correspondentes do Program.cs e a requisição de geração do .http. O endpoint POST /api/Itinerary/Generate não faz mais parte do código atual.

Foram retirados também os DTOs e a validação inicial de Itinerary que já estavam versionados no último commit. O histórico Git e o commit b66df5a, com correções de segurança/integridade, foram preservados; não houve reset de branch ou alteração de funcionalidades não relacionadas. Os registros de implementação da IA adicionados nesta sequência foram removidos da documentação para não apresentá-la como disponível.

Protótipo atualizado: removidos grupo/formulário/resultados de roteiros, exemplos, três testes específicos e timeout especial da antiga rota; catálogos e espera padrão preservados para as demais operações. Catálogo conferido com 37 operações restantes e sem Itinerary. O workflow externo do n8n e a variável N8n__WebhookUrl do Windows não foram alterados por esta retirada do código; a variável não é consumida pela versão atual. Processos antigos da API precisam ser recompilados/reiniciados para refletir a remoção; a API principal não foi reiniciada nesta etapa.

Próxima modelagem aprovada, ainda não implementada: agenda semanal de hosts de gastronomia/comércio por HostOpeningDay/HostOpeningPeriod e valores estimados mínimo/máximo por pessoa. A nova geração de roteiros será redesenhada após essa base. Sem modelos/colunas novos de funcionamento nesta etapa.

Verificações executadas: build isolado do backend com zero erros/nove avisos preexistentes; node --check nos três scripts do protótipo; 91 testes Node aprovados com API simulada e sem mutação de dados reais; busca de referências ativas aos contratos removidos sem ocorrências. Sem banco, migration, alteração de CORS, Expo ou exportação de PDFs. Cópia de segurança local anterior à retirada: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/old-itinerary-before-discard-2026-11-04.zip.

## Funcionamento semanal: entidades e contrato do domínio — 04/11/2026

Na branch ARTUR-DESKETOP, removido o CancellationToken de GetByHostIdAsync/EditAsync em IOpeningHoursAppService a pedido do usuário. Nenhum outro serviço teve seu parâmetro de cancelamento alterado. Criada IOpeningHoursService em Domain/Interfaces/Service, sem dependência de DTOs/Application: GetByHostIdAsync(int hostId, string userId) retorna Task<List<HostOpeningDay>>; EditAsync(List<HostOpeningDay> days, int hostId, string userId) retorna o mesmo tipo. A lista representa a semana, sem uma terceira entidade persistida para agrupá-la.

Criadas em Domain/Model as duas entidades aprovadas: HostOpeningDay (Id, HostId, Host, DayOfWeek, IsClosed, ICollection<HostOpeningPeriod> Periods iniciada vazia) e HostOpeningPeriod (Id, HostOpeningDayId, HostOpeningDay, OpeningTime/ClosingTime como TimeOnly e ClosesNextDay). Navegações obrigatórias usam null! como Hosts; campos de valor são não anuláveis no domínio. Não foram adicionados campos de preço/fuso nem regras executáveis de validação nesta etapa.

Somente tipos e interface foram preparados: implementação concreta do AppService/service, mappings, autorização, sobreposições, semana completa e persistência permanecem pendentes. Os modelos ainda não foram incluídos em DbSet, configurações EF ou navegação de Hosts. O Context foi revisado estaticamente: as novas classes não foram conectadas ao modelo persistido nesta etapa. Não houve migration, schema ou acesso ao banco; configuração de relacionamentos/índices será uma etapa posterior.

Verificação executada: build isolado aprovado com zero erros e dez avisos preexistentes. Sem testes funcionais, novas rotas, .http, DI, alteração no protótipo funcional, reinício de API, Expo ou PDFs. Documentação atualizada para refletir as assinaturas sem CancellationToken.

## Mapping de entrada e saída do funcionamento — 04/11/2026

Criados Application/Mapping/OpeningHoursMapping e Application/Mapping/Interfaces/IOpeningHoursMapping, com registro scoped junto aos mappings existentes no Program.cs, branch ARTUR-DESKETOP. ToModel(OpeningWeekDTO dto, int hostId) retorna List<HostOpeningDay>; ToDTO(int hostId, List<HostOpeningDay> days) retorna OpeningWeekResponseDTO.

ToModel usa o hostId recebido do fluxo autorizado, converte os dias e seus períodos e estabelece HostOpeningPeriod.HostOpeningDay para o objeto pai criado. IDs novos permanecem zero até a futura persistência. Não cria entidade para semana. Campos anuláveis do DTO são acessados por Value, seguindo HostMapping: o futuro AppService deve executar a validação antes da conversão. Não inventa valores para campos ausentes nem descarta períodos silenciosamente.

ToDTO copia dias e períodos para novos DTOs, ordenando dias por DayOfWeek (domingo=0 até sábado=6) e períodos por OpeningTime. Preserva IsClosed, horários locais e ClosesNextDay. Lista de dias vazia permanece vazia, indicando agenda não configurada; não completa automaticamente uma semana ausente com dias fechados. A lista de entrada não é reordenada em memória. A futura consulta deverá carregar Periods de cada dia.

Mapping somente converte dados: não consulta repository, não valida propriedade, sete dias/duplicidade, coerência fechado-períodos, duração ou sobreposições. Não foi implementado ainda o AppService/service/repository concreto e não há endpoint que utilize o contrato. Entidades continuam sem DbSet/configuração/migration.

Verificação executada: compilação isolada aprovada com zero erros e dez avisos anteriores. Sem testes funcionais, banco/HTTP, novas rotas, .http, reinício da API, Expo ou PDF. Protótipo funcional preservado por não haver alteração de contrato usado por action.

## Mapeamento EF dos dias e períodos preparado — 04/11/2026

Adicionados ao Context os DbSets HostOpeningDays e HostOpeningPeriods. Criadas Data/Configurations/HostOpeningDayConfiguration e HostOpeningPeriodConfiguration, descobertas pelo ApplyConfigurationsFromAssembly já existente. Tabelas definidas como HostOpeningDays e HostOpeningPeriods, com Id como PK e FKs obrigatórias HostId/HostOpeningDayId. Não foi necessário acrescentar coleção inversa em Hosts.

DayOfWeek é convertido para int e IsClosed é obrigatório. Índice único do par HostId/DayOfWeek protege contra duplicação do mesmo dia para um host. OpeningTime/ClosingTime usam TimeOnly com tipo PostgreSQL time without time zone obrigatório; ClosesNextDay é obrigatório. As regras de sete dias, enum válido, duração, fechado/períodos e sobreposição permanecem no domínio; esse índice não substitui essas validações e não garante ausência de sobreposição no banco.

Relacionamentos: HostOpeningDay.Host → Hosts, um host para vários dias, FK HostId, Cascade; HostOpeningPeriod.HostOpeningDay ↔ HostOpeningDay.Periods, um dia para vários períodos, FK HostOpeningDayId, Cascade. Remoção física de um dia remove seus períodos; remoção física de um host remove dias/períodos. Alterar IsActive do host não executa cascata de exclusão e preserva a agenda.

Modelo EF agora possui alterações pendentes de migration. Nenhuma migration foi gerada ou aplicada; snapshot e banco permanecem anteriores. Não houve backfill de agenda para hosts antigos. Prepare/revise a migration na etapa autorizada posterior antes de usar a nova persistência. O repository concreto ainda não foi implementado e a API principal não foi reiniciada.

Verificação: 23 verificações locais do modelo Npgsql/EF, sem abrir conexão ou SaveChanges, aprovaram entidades, PKs/FKs, ausência de propriedades sombra, unicidade, tipos obrigatórios, navegações e cascatas no ChangeTracker. SQL estrutural de criação foi apenas inspecionado em memória para conferir tabelas/índice/colunas; isso não gerou arquivo de migration nem foi executado. Build do backend sem erros/dez avisos preexistentes; builds incrementais finais dos harnesses sem erros/avisos novos. 70 regressões do service aprovadas com Identity/repositories simulados. Harnesses locais tmp/OpeningHoursEfModelCheck.cs e tmp/OpeningHoursServiceCheck.cs no workspace do protótipo, não são testes versionados no backend. Sem banco/HTTP real, Expo ou PDF.


## Hosts.OpeningDays — 04/11/2026

Adicionada ICollection<HostOpeningDay>? OpeningDays em Hosts, como navegação inversa do relacionamento existente HostOpeningDay.Host. No grafo de criação, null representa agenda omitida e uma coleção preenchida representa a semana enviada. HostMapping monta os dias pelo OpeningHoursMapping e aponta Host para o novo objeto; períodos continuam vinculados aos respectivos dias. IDs permanecem novos até a persistência.

A navegação permite salvar host/dias/períodos em uma única transação com propagação dos IDs gerados pelo EF. Não adiciona coluna ao host, nem muda os DTOs de resposta ou expõe o grafo diretamente em JSON. A edição comum não substitui essa coleção. Mapeamento EF e persistência foram exercitados nos 33 testes integrados em PostgreSQL descartável; migration principal continua pendente.


## Hosts: faixa estimada de gasto — 05/11/2026

Adicionados decimal? MinPrice e MaxPrice a Hosts, referentes ao gasto estimado por pessoa em gastronomia/comércio. Armazenamento preparado como numeric(12,2) nullable. Null significa valor desconhecido, especialmente em registros legados; zero é um valor informado. Regras condicionais por tipo, ordem, faixa e escala ficam no HostValidation da Application; o mapping apenas copia os campos.

A navegação OpeningDays existente passou a ser carregada por GetByIdAsync e convertida para OpeningWeekResponseDTO no perfil, com dias/períodos ordenados. Não foram acrescentadas novas entidades, navegações ou tabelas nesta etapa. Testes integrados em banco descartável aprovados; migration monetária pendente, sem alterações no banco principal.

## Chat: mapping e delegação do AppService — 05/11/2026

Criados ITravelChatMapping e TravelChatMapping, com ToModel(TravelChatMessageDTO) e ToDTO(TravelChatResponse). Entrada preserva ConversationId, Text e localização opcional (latitude, longitude, captura e precisão). ToModel pressupõe validação prévia dos campos obrigatórios, conforme padrão de OpeningHoursMapping. Não consulta endereço, geocodifica, infere origem ou normaliza texto. Saída preserva conversa/mensagem/perguntas, copia a lista de perguntas e reaproveita IProgrammingMapping.ToDTO/IHostMapping.ToDTO nas listas de sugestões.

Criados somente os tipos necessários no domínio: TravelChatMessage, TravelChatLocation e TravelChatResponse, sem dependência de DTO/Application. São objetos de transferência entre Application e Domain, não entidades persistidas. Criada ITravelChatService com SendMessageAsync(message, userId, cancellationToken), ainda sem implementação concreta.

TravelChatAppService recebe validação, mapping e interface do service no construtor. SendMessageAsync agora executa: Validate(dto, DateTime.UtcNow) → ToModel(dto) → await service.SendMessageAsync(message, userId, cancellationToken) → ToDTO(response). Removido o NotImplementedException do AppService. UserId continua separado da mensagem, vindo da identidade da action; cancelamento é encaminhado sem substituição. A implementação concreta do service, regras de propriedade e registro de todas as novas dependências na DI continuam pendentes. Portanto a action ainda não funciona em execução. Próximo baby step: estruturar o service de domínio da mesma action.

Sem alteração de contratos HTTP/DTO, Program.cs, DbSets, configuração EF, migration, banco, n8n ou PDFs. Protótipo preservado: aviso de implementação/registro pendentes continua aplicável.

Validações do mapping: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade. TravelChatMappingCheck.cs/.csproj no tmp do workspace do protótipo executou 17 verificações aprovadas com mapping/validação/AppService reais e ITravelChatService simulado: localização opcional/completa, dados de resposta, cópia das perguntas, mapeamento de sugestões, encaminhamento de usuário/token de cancelamento e rejeição de entrada inválida antes do service. Sem teste HTTP, banco ou n8n. git diff --check sem erros.

## Chat: coordenadas como Point no domínio — 05/11/2026

TravelChatLocation agora contém Point? Location (NetTopologySuite), substituindo os doubles Latitude/Longitude do objeto de domínio. CapturedAt e AccuracyMeters foram preservados. TravelChatMessage mantém o objeto opcional TravelChatLocation para agrupar posição e metadados; acesso espacial no domínio será message.Location?.Location. Não se trata de uma coluna ou entidade EF.

DTOs HTTP permanecem iguais: TravelChatLocationDTO recebe latitude, longitude, capturedAt e accuracyMeters. TravelChatMapping.ToModel, chamado após a validação no AppService, cria Point(longitude, latitude) com SRID 4326. Longitude corresponde a X e latitude a Y. Ausência do DTO de localização mantém o objeto de domínio nulo, sem inventar posição. O mapping de resposta não expõe Point.

Esta alteração prepara a representação espacial; não implementa busca por distância nem cálculo em metros, que dependerão da consulta espacial na Data. Nenhuma alteração em Address, DbSets, configurações EF, migrations, DI, n8n ou banco. A action permanece indisponível até a implementação concreta do service e os registros necessários. Como os contratos HTTP foram preservados, protótipo e exemplos não exigem mudanças. PDFs preservados.

Validação do Point: dotnet run --no-restore do harness TravelChatMappingCheck compilou o backend e aprovou 18 verificações, incluindo X=longitude, Y=latitude, SRID=4326, preservação de metadados, localização ausente, resposta e fluxo do AppService com service simulado. Compilação sem erros, nove avisos anteriores de nulabilidade. git diff --check sem erros. Sem HTTP, consulta espacial, banco ou n8n.

## Chat: model da conversa — 05/11/2026

Criado Domain/Model/TravelChatConversation.cs após conferir ausência de model equivalente e comparar Favorite/Subscription. Contém Id (int), User (navegação), UserId (string), IsActive (true inicialmente), CreatedAt e UpdatedAt (inicializados com DateTime.UtcNow), seguindo o padrão existente de Favorite. UserId permitirá associar a conversa ao usuário autenticado; o model não verifica propriedade por si só.

Não foram adicionadas coleção de mensagens, preferências extraídas ou estado do workflow neste passo. TravelChatMessage continua sendo o objeto de entrada do service, não uma mensagem persistida de histórico. Model User e DTOs preservados. Sem DbSet, configuração EF, migration, tabela, repository ou utilização do novo model pelo service; criação/consulta de conversas e verificação de propriedade continuam pendentes. O UserId da conversa deverá ser preenchido pelo fluxo servidor, nunca pelo DTO do aplicativo.

Próximo baby step: definir a interface do repository para criar/consultar uma conversa pertencente ao usuário, antes de implementar acesso a dados. Action SendMessage permanece sem funcionamento completo e sem registros de DI da feature. Sem alterações no protótipo, n8n, banco ou PDFs.

Validação do model: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Não foram criados testes para propriedades sem lógica. Sem teste HTTP, persistência, banco ou n8n.

## Chat: model da mensagem do histórico — 05/11/2026

Criado Domain/Model/TravelChatHistoryMessage.cs após conferir os models existentes e ausência de equivalente. Segue o padrão de navegação/chave de HostOpeningPeriod e enum no mesmo arquivo de ProgrammingInteraction.

Campos: Id (int), Conversation (TravelChatConversation), ConversationId (int), Role (TravelChatMessageRole), Text (string inicializada vazia) e CreatedAt (DateTime.UtcNow). TravelChatMessageRole define User=0 e Assistant=1. O papel deverá ser atribuído pelo servidor conforme a origem da mensagem, não recebido do aplicativo para autorizar mensagens de assistente. O usuário proprietário será obtido pela conversa, sem duplicar UserId em cada mensagem.

TravelChatMessage continua como entrada do service, com localização opcional; não foi transformado na entidade do histórico. O novo model não contém coordenadas, precisão, JWT ou instrução de sistema. Text permite armazenar perguntas do assistente e respostas do usuário; persistência estruturada de perguntas, sugestões e preferências será tratada em passos posteriores, não está implementada por este model.

Estado: somente estrutura de domínio, sem coleção acrescentada à conversa, repository de mensagens, DbSet, configuração EF, limites de coluna, índice, migration ou tabela. Nenhum histórico está sendo salvo ou consultado; service e DI permanecem incompletos. Próximo baby step: definir a interface do repository de mensagens do histórico, para adicionar mensagem e recuperar contexto da conversa, preservando a verificação de propriedade no fluxo.

Sem alteração de DTO, mapping, rota, protótipo, banco, workflow ou PDFs. Nenhum teste funcional ou de persistência foi realizado nesta etapa de propriedades sem lógica.

Validação do model de histórico: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.


## Chat: uso do model de histórico — 05/11/2026

TravelChatService prepara TravelChatHistoryMessage com ConversationId validado, Role=User e Text e o envia à interface de repository; CreatedAt é inicializado em UTC pelo model. Location não integra o histórico. Sem EF/persistência concreta; resposta de assistente e restante do fluxo continuam pendentes.

## Chat: entrada da interpretação no domínio — 05/11/2026

Criado Domain/Model/TravelChatInterpretationRequest.cs após pesquisar contratos equivalentes, sem encontrar um objeto de interpretação existente. Contém Text (mensagem atual), History (List<TravelChatHistoryMessage>, reutilizando o model existente), ReferenceTime (DateTimeOffset), TimeZone (string) e HasLocation (bool). Strings/lista inicializadas conforme o padrão do projeto. Não possui coordenadas, JWT ou UserId como campos próprios.

ReferenceTime e TimeZone deverão ser preenchidos pelo servidor para interpretar expressões relativas como “sábado”; ainda não há preenchimento, fuso escolhido ou validação implementados. HasLocation informa apenas disponibilidade de uma origem, não autorização para aplicar um raio silenciosamente nem garantia de captura atual/precisa. Point e metadados da localização continuam disponíveis ao fluxo interno de busca, sem necessidade de enviá-los ao modelo.

Este é um contrato interno do domínio, ainda não um payload HTTP serializável para envio direto. History reaproveita uma entidade com navegação Conversation/User; a futura implementação na Data deverá projetar explicitamente somente papel/texto necessários ao contexto, sem serializar a entidade/navegações, perfil ou credenciais. Configuração de histórico/retensão do n8n será tratada ao montar o workflow. A mensagem atual deve aparecer em Text e não duplicada em History.

Preferências confirmadas persistidas, catálogo permitido e resposta estruturada da interpretação continuam pendentes; não considerar que apenas as 20 mensagens recentes cobrem todo o estado da conversa. O próximo baby step é definir o objeto de saída da interpretação, incluindo perguntas e preferências extraídas; depois será definida a interface do serviço, sem implementar HTTP nesta fase.

Sem alteração de TravelChatService, DTOs da API, mapping, rota, DI, EF, banco, protótipo ou PDF. Nenhuma chamada ao n8n foi criada. Este objeto ainda não é construído/consumido pelo fluxo.

Validação da entrada de interpretação: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.

## Chat: saída da interpretação e preferências — 05/11/2026

Criados somente objetos de domínio, após conferir ProgrammingFilter/HostFilter e ausência de tipos de preferências equivalentes:

- TravelChatInterpretationResponse: Message, Questions (List<string>) e Preferences (TravelChatPreferences). A interpretação não retorna registros de hosts/programações; sugestões reais continuam responsabilidade da API.
- TravelChatPreferences: City, VisitDate (DateOnly?), HasTimeRestriction, StartTime/EndTime (TimeOnly?), EndsNextDay, Participants, HasBudgetLimit, Budget (decimal?), BudgetBasis, BudgetScope, IsFree, SearchNearby, RadiusMeters e Intents.
- TravelChatIntent: Description, IncludeProgrammings, CategoriesId e HostTypes, reutilizando Hosts.TypeofHost e IDs de categorias existentes. Intenções separam por exemplo turismo e café, sem forçar ambas em um único filtro.

Semântica inicial do contrato (não são validações implementadas): null representa informação desconhecida. HasTimeRestriction=false representa indiferença explícita de horário; true exige período coerente. HasBudgetLimit=false representa ausência explícita de teto; true exige valor, base e escopo coerentes. Enum TravelChatBudgetBasis distingue PerPerson/Group; TravelChatBudgetScope distingue Itinerary/Stop. Valores monetários desta primeira versão são BRL. Não interpretar Budget automaticamente como teto de cada evento. SearchNearby=null significa preferência desconhecida, false ausência de exigência de proximidade e true exige origem e raio confirmados. Ausência de origem exige pergunta, não uso silencioso da localização cadastral. HasLocation da entrada indica disponibilidade, não confirmação de um raio.

DateOnly/TimeOnly representam data e horários locais da visita; o fuso vem do contrato de entrada e conversões serão responsabilidade da API. EndsNextDay permite representar madrugada sem inferir virada automaticamente. Participants ausente não significa uma pessoa. IsFree permanece preferência opcional, não deriva de preço ausente. Intents vazia não implica autorização para sugerir qualquer atividade. IncludeProgrammings=false e HostTypes vazio representam intenção ainda sem destino de busca definido, exigindo validação/esclarecimento.

Restrições pendentes: apenas gastronomia/comércio como HostTypes de paradas, categorias existentes/ativas do catálogo permitido, limites numéricos, conflitos, datas/horários, semântica de orçamento e resposta inválida do workflow. A API deverá validar tudo antes de buscar. Questions não vazia representa esclarecimentos, mas nem Questions vazia nem a presença de Preferences garantem informações suficientes. Não foi adicionado ReadyToSearch como decisão soberana do modelo.

Ainda não há persistência/mesclagem de preferências confirmadas, sinalização de alterações/remoções, contrato de snapshot validado entre turnos ou inclusão de preferências na entrada. Isso precisa ser implementado antes de depender somente do histórico recente: campo ausente da saída não poderá apagar preferência anterior silenciosamente. Nenhum desses objetos está mapeado no EF, serializado para n8n ou conectado ao TravelChatService. JSON externo e validações serão definidos em passos próprios ao montar o workflow com o usuário.

DTOs públicos e TravelChatMapping preservados: TravelChatResponse continua representando a resposta final da API, distinta da interpretação. Sem endpoint novo, DI, banco, protótipo alterado ou PDF. Próximo baby step: definir ITravelChatInterpretationService com entrada e saída já preparadas, antes do transporte na Data.

Validação dos contratos de saída: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, teste HTTP, banco ou n8n.

## Escopo vigente da IA: prompt único — 05/11/2026

Por solicitação do usuário, esta primeira versão passa a ser: prompt único → n8n interpreta preferências → API filtra cadastros reais → listas de programações e hosts de gastronomia/comércio para o usuário montar roteiro. Sem localização, proximidade, perguntas/respostas, conversa ou histórico. Esta seção substitui as propostas anteriores para a entrega inicial.

Implementado neste baby step:

- TravelChatMessageDTO e TravelChatMessage contêm somente Text, obrigatório e até 4.000 caracteres na validação Application.
- TravelChatResponseDTO e TravelChatResponse contêm somente Programmings e Hosts; removidos ConversationId, Message e Questions.
- TravelChatMapping converte apenas texto e listas com mappings existentes. AppService mantém Validate → ToModel → service → ToDTO, userId separado e cancelamento.
- TravelChatService mantém IUserService.GetProfileAsync e cancelamento; removidos repositories e chamadas de conversa/histórico. Ainda termina em NotImplementedException, aguardando interpretação e filtros.
- TravelChatInterpretationRequest contém Text, ReferenceTime e TimeZone, sem History ou HasLocation. TravelChatInterpretationResponse contém apenas Preferences. Removidos SearchNearby e RadiusMeters das preferências.
- A mesma action POST /api/TravelChat/Messages mantém autenticação e identificação pelo JWT. Retirado catch específico de conversa indisponível; preservados 400/401. Sem outra action.

Entrada atual planejada:

```json
{ "text": "Quero passear no Recife no sábado e tomar um café" }
```

Saída planejada (listas vazias ilustrativas, não resposta funcional implementada):

```json
{ "programmings": [], "hosts": [] }
```

Dados ausentes não gerarão perguntas: filtros devem usar somente restrições claras/suportadas, sem inventar pessoas, horário, orçamento ou origem. Cidade escrita no prompt pode ser um filtro, sem geolocalização. A política exata para ambiguidades e limites de busca será definida na interpretação/validação, ainda pendentes. Não há cálculo de rota, persistência ou montagem automática de roteiro nesta fase.

Preservados como preparação inativa de evolução: models de conversa/histórico/localização e interfaces de repositories. Não são consumidos pelo fluxo atual e não possuem EF/DI. As verificações temporárias anteriores que dependem dos campos removidos documentam a versão anterior; o harness TravelChatMappingCheck foi atualizado ao escopo vigente.

Protótipo: catálogo real conferido com somente Text obrigatório até 4.000 caracteres e JWT; aviso de implementação pendente atualizado. Exemplo .http também simplificado. Sem formulário de localização, ConversationId ou chat neste fluxo.

Estado: contratos simplificados, sem integração funcional com n8n, filtros coordenados ou DI. Nenhuma alteração em Program.cs, banco, migrations ou PDFs. Próximo baby step: ITravelChatInterpretationService com entrada e saída já preparadas. A montagem do workflow terá assistência quando chegar à integração, em passos pequenos.

Validações executadas: backend compilado sem erros/nove avisos existentes por dotnet run --no-restore de TravelChatMappingCheck; 15 verificações aprovadas de contrato público/domínio, mapping, serialização, validação e AppService com service simulado. node --check em app.js/catalog.mjs, catálogo real e 101 testes do protótipo aprovados com API simulada. Sem teste HTTP da nova action, banco real ou chamada n8n.

## Limpeza da IA simplificada — 05/11/2026

Removidos do código os seis arquivos fora do escopo vigente: TravelChatLocationDTO, TravelChatLocation, TravelChatConversation, TravelChatHistoryMessage (incluindo TravelChatMessageRole), ITravelChatConversationRepository e ITravelChatHistoryMessageRepository. A conferência de referências mostrou apenas dependências entre os próprios arquivos removidos; o fluxo do prompt já estava desacoplado deles.

As menções anteriores a esses tipos como preparação inativa são históricas e estão substituídas por esta remoção. Não há mais models/interfaces de conversa, histórico ou localização específicos da IA. Address.Location e o restante da localização já existente do sistema foram preservados. Mantidos os contratos de interpretação/preferências/intenções necessários à próxima etapa do prompt único, além de controller, DTOs, validação, mapping, AppService e service atuais.

Sem mudança de contrato público, lógica de busca ou registros de DI. A integração n8n e os filtros continuam pendentes. Sem migração, banco, protótipo ou PDF alterados.

Validação da limpeza: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores. Busca C# no backend sem referências aos tipos removidos; git diff --check sem erros. Não foram repetidos testes funcionais: remoção apenas de tipos já desacoplados. Sem HTTP, banco ou n8n.

## IA: unificação da mensagem e entrada de interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatMessage e TravelChatInterpretationRequest. Mantido Domain/Model/TravelChatMessage.cs, agora com Text, ReferenceTime (DateTimeOffset) e TimeZone (string), e removido TravelChatInterpretationRequest.cs. Esse único objeto representará tanto a entrada do service quanto a solicitação interna de interpretação do prompt. Conferência de referências antes da remoção: o request anterior não tinha consumidores C#.

TravelChatMessageDTO continua contendo somente Text; data/fuso não passam a ser responsabilidade do aplicativo. TravelChatMapping preserva a conversão do prompt e o AppService continua chamando o mapping normalmente. O preenchimento pelo servidor de ReferenceTime/TimeZone ainda está pendente da integração com a interpretação, como já estava no objeto removido; não foi escolhido fuso fixo nem inserida configuração implícita neste passo.

Os próximos contratos de interpretação devem receber TravelChatMessage, sem recriar outro request com os mesmos campos. Restam cinco classes de model da IA: TravelChatMessage, TravelChatInterpretationResponse, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. Menções anteriores ao objeto de entrada separado são históricas e substituídas por esta unificação.

Sem alteração de DTO público, rota, autenticação, DI, banco, protótipo ou PDF. A interpretação, filtros e integração n8n continuam pendentes; action ainda não funcional em execução.

Validação da unificação: dotnet run --no-restore de TravelChatMappingCheck compilou o backend sem erros (nove avisos anteriores) e aprovou 15 verificações do fluxo simplificado com service simulado, ajustadas ao model unificado. Busca sem referências C# ao request removido; git diff --check sem erros. Sem HTTP, banco ou n8n.

## IA: preferências como retorno direto da interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatInterpretationResponse e TravelChatPreferences. Mantido TravelChatPreferences com todos os campos existentes e removido TravelChatInterpretationResponse, que possuía somente a propriedade Preferences. O contrato futuro de interpretação deverá retornar Task<TravelChatPreferences> diretamente; não será necessário acessar response.Preferences.

Antes da remoção, a busca C# confirmou ausência de consumidores do wrapper. Nenhum campo de preferência foi removido/renomeado, nem foram alterados enums, TravelChatIntent ou mapping da resposta final. Restam quatro classes de model da IA: TravelChatMessage, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. O fluxo planejado passa a ser TravelChatMessage → interpretação → TravelChatPreferences → filtros da API → TravelChatResponse.

TravelChatResponse permanece separado: contém os registros reais encontrados pela API; TravelChatPreferences contém apenas atributos extraídos do prompt. A futura resposta JSON do n8n deverá corresponder diretamente às preferências, sem envelope preferences. Como ainda não existe workflow/cliente HTTP/contrato externo implementado, não houve mudança de integração publicada.

Sem alteração de DTO público, rota, autenticação, AppService, DI, banco, protótipo ou PDF. As menções anteriores ao wrapper são históricas e substituídas por esta decisão. Interpretação n8n/filtros continuam pendentes.

Validação da unificação do retorno: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; busca C# sem referências ao wrapper removido; git diff --check sem erros. Sem testes adicionais para remoção de wrapper não consumido, HTTP, banco ou n8n.

## IA: chamada da interpretação no service — 05/11/2026

TravelChatService agora injeta ITravelChatInterpretationService e IConfiguration, usando o padrão de configuração por construtor já presente em SubscriptionService. Após mensagem não nula, cancelamento e conta disponível por IUserService.GetProfileAsync, chama InterpretAsync com um novo TravelChatMessage: Text preservado, ReferenceTime=DateTimeOffset.UtcNow e TimeZone definido pelo servidor. Datas/fuso recebidos em chamadas internas não são confiados nem alterados no objeto original. CancellationToken é encaminhado e verificado também após a interpretação; erros do intérprete não são mascarados.

Fuso: configuração TravelChat:TimeZone, equivalente à variável TravelChat__TimeZone. Ausência da chave usa America/Recife como padrão inicial explícito do projeto; valor informado é conferido por TimeZoneInfo.FindSystemTimeZoneById no construtor. Não há inferência pelo fuso da máquina ou pela cidade do prompt. O fuso representa a referência temporal usada pelo assistente nesta primeira versão; cenários de outros fusos exigem configuração/definição futura, não localização automática. Nenhum appsettings ou Program.cs foi alterado.

O retorno TravelChatPreferences é recebido, mas sua validação e uso nos filtros continuam pendentes. O fluxo ainda termina em NotImplementedException após a interpretação; não retorna lista vazia como sucesso provisório. Sem implementação n8n na Data/DI, a action permanece indisponível em execução. Nenhuma chamada externa ocorreu.

DTO público continua somente Text, resposta pública continua Programmings/Hosts, e AppService mantém as chamadas de validação/mapping. Sem perguntas, localização ou histórico. Próximo baby step proposto: validar as preferências retornadas antes de convertê-las em filtros, respeitando ausência/ambiguidade de dados sem inventar valores. Transporte HTTP e montagem do workflow serão tratados após as regras de domínio.

Sem alteração de banco, migrations, protótipo ou PDF.

Validação da chamada de interpretação: dotnet run --no-restore de TravelChatInterpretationCheck.cs/.csproj compilou o backend sem erros (nove avisos anteriores) e aprovou 16 verificações com IUserService/intérprete simulados: prompt, UTC gerado no servidor, padrão/configuração de fuso, entrada original preservada, cancelamento, usuário indisponível, mensagem nula, erro do intérprete e fuso inválido. Fluxo válido conferido até o trecho de filtros ainda pendente. git diff --check sem erros. Sem HTTP real, banco ou n8n.

## IA: remoção do fuso nomeado e configuração — 05/11/2026

Por solicitação do usuário, removidos TimeZone de TravelChatMessage, o campo _timeZone, a leitura TravelChat:TimeZone com padrão America/Recife e a chamada TimeZoneInfo.FindSystemTimeZoneById. TravelChatService não recebe mais IConfiguration no construtor. Dependências atuais: IUserService, ITravelChatInterpretationService e ITravelChatPreferencesValidations.

TravelChatMessage contém somente Text e ReferenceTime (DateTimeOffset). O service continua preenchendo ReferenceTime com DateTimeOffset.UtcNow no servidor, portanto o instante enviado usa deslocamento +00:00, sem configuração adicional. DateTimeOffset representa instante/deslocamento; não representa um fuso nomeado nem regras regionais. Não inferir automaticamente o horário local de Recife a partir deste valor UTC. Interpretação de datas relativas deve usar a referência explícita e o contrato que será montado no workflow, sem prometer conversão regional não implementada.

O DTO público permanece somente Text. Mapping, AppService, verificação de usuário por GetProfileAsync e validação de preferências preservados. Não foram modificados appsettings, Program.cs ou configuração de outros serviços. A variável TravelChat__TimeZone não é mais lida nem necessária; instruções anteriores sobre ela são históricas, substituídas por esta remoção.

Sem alteração de rota, resposta pública, banco, protótipo ou PDF. Interpretação concreta, filtros e DI ainda pendentes; o service continua terminando em NotImplementedException após validar preferências. Harnesses temporários de interpretação e mapping foram ajustados ao contrato sem TimeZone.

## Compatibilidade com o model atual de intenção — 05/11/2026

Durante a validação da remoção de TimeZone, a compilação detectou referência a IncludeProgrammings que já não existe no TravelChatIntent atual. Preservada a edição do model; removida somente a regra da validação que dependia desse campo, sem recriá-lo. Intenção agora contém Description, CategoriesId e HostTypes. Conferência de categorias/tipos e demais regras continuam preservadas; decisão de como a intenção seleciona programações deverá ser definida na conversão para filtros. Não marcar como implementada a antiga exigência de IncludeProgrammings ou destino explícito de cada intenção. A primeira tentativa de compilação falhou por essa referência e foi corrigida antes de repetir a validação.

Validação final da simplificação temporal: backend compilado sem erros (nove avisos anteriores) pelos harnesses --no-restore. TravelChatInterpretationCheck aprovou 15 verificações com dependências simuladas, cobrindo referência UTC do servidor sem alterar entrada, cancelamento, identidade e validação; TravelChatPreferencesCheck aprovou 42 verificações com catálogo simulado após compatibilização do model sem IncludeProgrammings. Busca confirmou ausência de TimeZone/IConfiguration nos tipos alterados; git diff --check sem erros. Primeira compilação falhou pela referência ao campo já ausente, corrigida antes destes resultados. Sem HTTP, banco ou n8n.

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

## IA: catálogo real de categorias na interpretação — 05/11/2026

TravelChatMessage agora possui Categories (List<Category>) além de Text/ReferenceTime. Reaproveita Category já existente, sem novo model/envelope. TravelChatService injeta ICategoryService e, após verificar conta ativa por GetProfileAsync, chama GetallCategories. Monta o objeto enviado a InterpretAsync com somente categorias IsActive=true, ordenadas por Id, preservando IDs e nomes reais. Não confia em catálogo informado no objeto de entrada; o DTO público continua apenas Text e o catálogo é obtido pelo servidor.

Objetivo: permitir que o workflow associe interesses do prompt a IDs existentes, pois o filtro de programações desta versão depende de CategoriesId e não usa Description como busca textual. Nomes de categoria são contexto de classificação, não instruções. O cliente n8n deverá receber o catálogo no JSON da mensagem sem JWT, UserId, localização ou histórico.

Validação de preferências continua reutilizando GetallCategories para conferir existência/atividade dos IDs retornados, inclusive eventual mudança após a interpretação. Não foi criada função de consulta duplicada ou mecanismo de cache. Como o contrato existente não recebe CancellationToken, cancelamento é verificado antes/depois da consulta; uma falha no catálogo impede interpretação/filtros e é propagada.

Catálogo vazio será enviado como lista vazia; a IA não deverá inventar IDs. Busca de programações sem categorias continuará sem consulta irrestrita; hosts continuam orientados por tipos existentes. Regras exatas do JSON/prompt e classificação do n8n serão definidas no próximo baby step, antes de criar o transporte na Data. Ainda não há cliente n8n nem DI da feature, portanto o endpoint não está funcional em execução.

Sem alteração de DTO público, rota, mapping de prompt/resultados, entidades Category, schema, banco, protótipo ou PDF.

Validação do catálogo: TravelChatResultsCheck --no-restore compilou o backend sem erros/nove avisos anteriores e aprovou 37 verificações com validação/mappings/AppService/service reais e dependências simuladas. Incluem categorias ativas ordenadas com IDs/nomes preservados, exclusão de inativas, nenhuma consulta para usuário indisponível, falha/cancelamento do catálogo impedindo interpretação e filtros, além das regressões de resultados/agenda/preço. git diff --check sem erros. Sem HTTP, banco ou n8n; protótipo não alterado pois contrato público permaneceu igual.

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
