# Entidades e models

Perambulando | Atualização: 19/10/2026

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
