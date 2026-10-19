# Regras de negócio

Perambulando | Atualização: 18/10/2026

Este documento descreve o código atual de controllers, app services, serviços e repositórios. Uma pendência registrada aqui não significa que a regra já tenha sido implementada.

## 1. Responsabilidades das camadas

| Camada | Responsabilidade observada |
|---|---|
| Controller | HTTP, usuário do JWT, validação de entrada, autorização por role e conversão de resultados em status |
| Application / AppService | Mapeamento DTO-entidade, montagem dos vínculos de categorias e composição dos retornos |
| Domain / Service | Verificação de propriedade, busca de registros existentes e alteração de seus dados |
| Data / Repository | Consultas EF Core, filtros de disponibilidade e persistência |

As verificações entre campos de programação ficam no controller, conforme o padrão solicitado pelo usuário. Não há Unit of Work explícito; os repositórios de programação salvam os campos e os vínculos em uma única chamada ao contexto.

## 2. Usuário e autenticação

- O cadastro é público e cria uma conta pelo Identity. E-mail único é exigido na configuração do Identity.
- O nome informado é usado como `UserName`: também fica sujeito às regras de nome e unicidade do Identity. Não há campo independente de nome de exibição.
- Login procura pelo e-mail, exige usuário ativo e verifica a senha. O fluxo retorna JWT, não cria a sessão da aplicação por cookie.
- Perfil e edição de usuário operam sobre o ID do JWT. A edição modifica nome, e-mail e tipo e retorna um novo token.
- A exclusão de conta recebe um e-mail no corpo, encontra o usuário e compara o ID com `sub` do token. Usa `DeleteAsync`, e não `IsActive = false`. A senha do DTO não é verificada por essa action.

## 3. Propriedade dos estabelecimentos

```text
JWT.sub -> User.Id -> Hosts.UserId -> Programming.HostId
```

Uma conta pode ter vários hosts. O cadastro associa `host.UserId` ao usuário autenticado, sem aceitar o dono do frontend. Não é necessário ter programação para cadastrar um host, inclusive Gastronomia ou Comércio.

Após cadastrar, o serviço atribui a role HOST se necessário. A resposta traz JWT atualizado para que a interface possa usar as funcionalidades protegidas sem novo login.

A criação do host e a atribuição da role não formam uma operação atômica no código atual. Se o host for salvo e a role falhar, a action retorna erro informando essa situação. A role HOST deve existir previamente; não há criação dessa role no fluxo de cadastro.

## 4. Gestão do host

- Listar meus hosts retorna somente os ativos do usuário do token.
- Consultar o perfil exige login, mas não exige ser o dono. Portanto, perfil privado significa privado para visitantes; outros usuários autenticados podem consultar.
- Editar exige host ativo pertencente ao usuário. O serviço procura por ID do host e ID do dono e altera os campos editáveis, preservando dono e criação.
- Desativar altera `IsActive` e `UpdatedAt`. Um host já inativo deixa de ser encontrado por esse fluxo.
- Roles ADMIN e HOST abrem acesso às actions de gestão. Mesmo ADMIN passa pela verificação de dono atual; não há exceção administrativa de propriedade.

## 5. Cadastro de programação

O usuário precisa ter role ADMIN ou HOST e ser dono do host ativo informado na rota. Cada programação pertence a um único host. A quantidade de programações por host não tem limite de negócio implementado.

| Aspecto | Regra atual no create |
|---|---|
| Nome, descrição e endereço | Strings obrigatórias pelo DTO |
| Datas | Início posterior ao instante atual e anterior ao término |
| Preços | Não negativos; mínimo menor ou igual ao máximo |
| Gratuidade | Preços devem ser zero |
| Categorias | Lista não vazia; IDs positivos; existência garantida pela FK com erro tratado |
| Localização | Endereço próprio da programação, sem obrigação de coincidir com o host |

O app service monta cada `ProgrammingXCategory` em um foreach. O repositório adiciona a programação e os vínculos e executa um único `SaveChangesAsync`. No provedor relacional, essa gravação é transacional por padrão: uma falha na gravação impede persistência parcial daquele save.

## 6. Edição de programação

Primeiro é verificado se o host pertence ao usuário e está ativo. Depois é buscada a programação ativa desse mesmo host. A edição não aceita transferir o evento para outro dono ou host.

- O PUT recebe o conjunto completo de campos editáveis.
- Os preços precisam ser finitos, não negativos, ordenados e iguais a zero se gratuita.
- Datas precisam estar em UTC e início deve ser anterior ao término. Diferentemente do create, o edit não rejeita expressamente início no passado.
- Categorias devem ter IDs positivos, sem repetição e pelo menos um item.
- O serviço consulta `GetAllCategoriesbyProgrammingId`, calcula vínculos retirados e novos e preserva os que continuam selecionados.
- Campos e vínculos são gravados juntos no repositório; a data de atualização muda para UTC.

## 7. Desativação e acesso público

Desativar programação altera `IsActive` para false; não apaga o registro nem os vínculos. A consulta pública e as consultas internas normais exigem programação e host ativos. Desativar um host não altera cada programação, mas as torna indisponíveis nessas consultas.

Uma nova tentativa de desativação encontra o registro indisponível e retorna 404. A API não possui action de reativação atualmente.

Os detalhes de programação são públicos e incluem categorias vinculadas, dados do evento, nome e logo do host e links informados. Já o perfil do host exige autenticação.

## 8. Categorias

`GetallCategories` lista somente categorias ativas. `GetAllCategoriesbyProgrammingId` consulta a tabela de vínculo, seleciona categorias distintas e ordena por ID, sem filtrar status ativo.

O código de gravação não revalida se uma categoria está ativa. O GET de seleção facilita a interface, mas não impede o envio manual de um ID inativo. Essa é uma característica atual, não uma garantia de integridade fornecida pelo frontend.

## 9. Pendências e diferenças conhecidas

- Cadastro de host sem validação explícita de campos obrigatórios ou valor do enum no DTO.
- Create de programação sem rejeição de categorias repetidas; não existe índice único do par de vínculo no snapshot.
- `[Required]` sobre bool/float não anuláveis no create não identifica a ausência desses campos no JSON.
- Create e edit possuem diferenças nas verificações de datas e de preços finitos.
- Nenhuma busca por distância, geocodificação, limite de raio ou coordenadas foi encontrada.
- Compartilhamento pode usar a consulta pública existente, mas a página e o botão de compartilhar dependem do frontend.
- O perfil do host não inclui IDs nas programações mapeadas e não carrega suas categorias.
- Não há métricas de visualização, favoritos ou engajamento implementadas nos fluxos analisados.

## Fontes de implementação

`Presentation/Controllers`, `Application/AppServices`, `Domain/Service`, `Data/Repository` e DTOs. O estado real do banco e os fluxos completos não foram exercitados para esta documentação.
