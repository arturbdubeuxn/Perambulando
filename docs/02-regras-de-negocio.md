# Regras de negócio

Perambulando | Atualização: 19/10/2026

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
- Hosts e Programming possuem Location opcional, armazenada em geography(Point,4326), com índices GiST. A migration já foi aplicada ao banco local. Os registros existentes permanecem com Location NULL. A geocodificação via Geoapify está integrada e depende da chave configurada. O endpoint de proximidade ainda não existe.
- Compartilhamento pode usar a consulta pública existente, mas a página e o botão de compartilhar dependem do frontend.
- O perfil do host não inclui IDs nas programações mapeadas e não carrega suas categorias.
- Não há métricas de visualização, favoritos ou engajamento implementadas nos fluxos analisados.

## Fontes de implementação

A Location é interna à persistência e possui JsonIgnore nas duas entidades. O Geoapify ainda não é chamado no cadastro/edição. Foram adicionados AddressNumber e AddressComplement às entidades, DTOs e mapeamentos de create/edit/detalhes, incluindo programações no perfil do host. Os nomes AdrressNumber e AdrressComplement foram corrigidos antes da criação das colunas.

Número é string opcional de até 20 caracteres, aceitando 175A e s/n; complemento é opcional, até 200 caracteres. Os campos iniciam vazios. A edição completa substitui os valores, e a omissão no PUT os limpa. Não se extrai número automaticamente do endereço antigo. A migration AddAddressNumberAndComplement foi aplicada com preservação de registros e do texto de Address.

Presentation/Controllers, Application/AppServices, Domain/Service, Data/Repository e DTOs. A etapa de endereço teve 48 verificações offline de mapeamento/validação/propriedade e conferência do esquema real; não foram executados cadastros ou exclusões contra dados reais como teste.

Bairro (`neighborhood`) é opcional no cadastro e na edição de hosts e programações. O campo pode ser omitido, vazio ou nulo; o app service converte nulo em string vazia antes da persistência. As entidades e colunas permanecem não anuláveis, sem necessidade de migration. No PUT, omitir o bairro remove o valor anterior (salva vazio).

## Geocodificação via Geoapify — 19/10/2026

HostService e ProgrammingService usam IGeocodingService após verificar usuário/propriedade e antes de salvar. A edição geocodifica se Location é nula ou se logradouro, número, bairro ou CEP mudar; apenas complemento não exige nova consulta. O ponto é obtido antes de modificar a entidade rastreada. Falha bloqueia a gravação, preservando os dados anteriores. Critério atual do MVP: resultado brasileiro building/street/amenity, nome de logradouro compatível e mesmos três primeiros dígitos do CEP. Veja os limites de confiança e as duas tentativas na seção de tolerância abaixo. Resultados somente de bairro/cidade/CEP são recusados. O ponto de rua pode ser aproximado. Não há repetição automática nem atualização em lote dos registros existentes.

Veja a [configuração e os critérios da integração](README.md). Validação: build sem erros (três avisos CS8618 preexistentes), 63 verificações com HTTP/repositórios simulados e 17 testes do protótipo. Consulta HTTPS real ao Geoapify validada em 19/10/2026, com resultado building no Brasil e confiança 1. A chave foi configurada em Geoapify__ApiKey no ambiente do usuário Windows, sem inclusão nos arquivos. O fluxo completo via API/banco ainda precisa ser exercitado após reiniciar o processo que inicia a aplicação. PDFs não regenerados.

### Tolerância ampliada do MVP — 19/10/2026

A busca continua somente com Geoapify e aceita localização aproximada. Mantém coordenadas finitas, país brasileiro, tipo building/street/amenity, cidade/estado presentes e correspondência do nome da via. O prefixo exigido do CEP passa de cinco para três dígitos, ampliando a região possível. São priorizados o CEP completo, depois os cinco primeiros dígitos, o número do imóvel, o tipo building e a confiança. Isso não comprova cidade/UF do usuário nem garante erro máximo em metros.

Na regra geral, a confiança mínima é 0,25; abaixo de 0,7 exige também confiança de rua e de cidade >= 0,5. Com confiança geral >= 0,7, indicadores específicos ausentes não impedem aceitação. Exceção de aproximação: se o CEP completo coincide e a confiança da rua é >= 0,8, aceita pontuação geral baixa ou zero, desde que ela seja válida e todos os demais critérios de país, tipo, nome da via, cidade/estado e coordenadas passem. Isso atende resultados do provedor que reconhecem fortemente a rua mas não confirmam o imóvel. Não há conversão dessas pontuações em porcentagem garantida de acerto.

Na comparação, ignora acentos, pontuação, caixa, artigos/preposições de/da/do/das/dos e o tipo inicial da via (rua, avenida, praça, largo etc.). Reconhece abreviações Mal/Gen/Dr/Prof/Pres. Praças e largos podem ser identificados por name/address_line1 se street não vier preenchido. Não usa comparação difusa livre de nomes.

São feitas até duas consultas sequenciais, somente se a anterior não tiver candidato aceitável: primeiro com número; depois sem número. Se já não há número (vazio/s/n), a segunda usa texto com rua, bairro opcional e CEP. O modo estruturado nunca é misturado com text. Preserva número e demais dados originais no banco. Resultados somente de bairro/CEP/cidade continuam rejeitados. Falhas do provedor não provocam novas tentativas.

Limites: HttpClient de 10 s por requisição e prazo de 15 s para as duas consultas juntas, inferior ao timeout de 20 s do protótipo. Erro de endereço permanece 422 e indisponibilidade permanece 503. Não muda autenticação, rotas, DTOs, entidades ou schema. Não adiciona ViaCEP, geocodificação em lote ou mapa. O protótipo mantém o aviso de localização aproximada. PDFs não foram regenerados.

Validação da tolerância ampliada: compilação sem erros (três avisos CS8618 preexistentes), 53 verificações simuladas aprovadas e 17 testes do protótipo aprovados, com node --check em app.js e catalog.mjs. Os testes simulados cobrem os dois modos de fallback, limite de duas consultas, aceitação aproximada, rejeição de bairro/CEP/cidade, erros do provedor, coordenadas inválidas e cancelamento. Não houve gravação de registros nem alteração de schema nesta etapa.

Comparação real no Geoapify em 19/10/2026: antes 6/10 endereços de teste aceitos; depois 10/10. Conjunto: MASP, Sesc Pompeia, Pinacoteca Luz, Pinacoteca Estação, Pinacoteca Contemporânea, Museu do Amanhã, CCBB Rio, Paço do Frevo, CESAR School e Museu Oscar Niemeyer. Consultas realizadas pelo adapter .NET, sem passar pelo CRUD nem gravar no banco; aceitação do resultado não comprova precisão do imóvel. Reinicie a API para carregar a implementação nova.

### Abrangência atual — 19/10/2026

A pedido do usuário, foi retirada a restrição temporária por estado: as consultas não enviam state=Pernambuco nem incluem um estado fixo no texto. A validação por sigla/nome de Pernambuco foi removida. A busca volta a considerar todo o Brasil, mantendo o filtro countrycode:br, o prefixo de três dígitos do CEP, o nome da via, a exigência de cidade/estado identificáveis no retorno e as demais regras de aproximação e fallback. Portanto não aceita indiscriminadamente ruas homônimas distantes.

Protótipo e comentários do .http foram ajustados. Os exemplos podem continuar usando endereços de Pernambuco, mas não representam limite de cobertura. Sem alterações em DTOs, endpoints, autorização, entidades ou banco. PDFs preservados.

Validação da retirada da restrição: compilação sem erros (três avisos CS8618 preexistentes), 10 verificações simuladas aprovadas (PE/CE/SP, ausência de estado fixo nas duas modalidades de consulta e manutenção de país/CEP/estado identificável), 17 testes do protótipo aprovados e sintaxe JavaScript verificada. Nenhuma nova consulta real ao Geoapify nem gravação no banco nesta retirada.
