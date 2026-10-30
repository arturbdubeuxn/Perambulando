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
