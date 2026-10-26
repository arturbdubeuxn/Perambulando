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
