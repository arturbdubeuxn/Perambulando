# Refatoração de endereços — revisão antes da migration

Data: 21/10/2026. Branch: Artur-Desktop.

**Situação: código preparado e compilado; nenhuma migration foi gerada ou aplicada. O banco permanece com as colunas antigas. A API com o modelo novo ainda não deve ser usada contra esse banco.**

## Estrutura para revisar

A entidade `Address` será persistida na tabela `Addresses`. `Hosts` e `Programming` deixam de armazenar os campos de endereço e passam a ter `AddressId` obrigatório e navegação `Address`. As FKs usam Restrict: remover um vínculo/host/programação não remove o endereço compartilhado. Não foi criado endpoint para editar ou excluir um endereço; trocar os dados do local significa selecionar/criar outro registro.

| Campo de Address | Regra |
|---|---|
| Id | PK inteira gerada pelo banco |
| Street | Logradouro completo, até 300 caracteres; inclui Rua/Avenida etc. |
| Number | Até 20 caracteres; obrigatório no novo cadastro; aceita s/n |
| Complement | Opcional na entrada; salvo vazio; até 200 caracteres |
| Neighborhood | Opcional na entrada; salvo vazio; até 150 caracteres |
| CEP | Oito dígitos; entrada aceita com ou sem hífen |
| Location | Point em geography(Point,4326), índice GiST; calculado pelo sistema e omitido do JSON |
| CreatedByUserId | Autoria para busca privada; FK anulável com SetNull ao excluir o usuário, preservando o endereço |
| NormalizedKey | Hash SHA-256 dos componentes normalizados, com índice; omitido do JSON |
| SearchStreet | Logradouro sem acentos, em maiúsculas e com espaços normalizados; omitido do JSON |
| CreatedAt | Data UTC de criação |

Location permanece anulável para preservar endereços antigos que ainda não possuem coordenadas. Ao reutilizar por ID um endereço sem localização, o sistema calcula as coordenadas antes de salvar o vínculo. Os textos dos endereços existentes não são alterados. O novo cadastro sempre passa pela geocodificação, salvo quando encontra equivalente acessível com coordenadas.

## Contratos HTTP

Nova rota autenticada, sem role específica:

```http
GET /api/Address/GetAllAddress?search=Cais&limit=10
Authorization: Bearer <jwt>
```

- Retorna 200 com array de AddressDetailsDTO (Id, Street, Number, Complement, Neighborhood, CEP, DisplayName).
- Sem busca ou com menos de três letras/dígitos úteis: 200 com []; não consulta o banco. Espaços e pontuação não completam os três caracteres.
- Busca por logradouro ignora caixa e acentos; CEP é comparado sem hífen. Correspondência parcial no banco, com ordenação por logradouro, número e ID.
- Limite padrão 10, permitido de 1 a 20. Busca de mais de 300 caracteres ou limite inválido: 400. JWT ausente/inválido: 401.
- Visibilidade: endereços criados pelo usuário, ligados aos seus hosts (inclusive inativos) ou usados em programações ativas de hosts ativos. Não abre os endereços privados de outros usuários.

HostRegisterDTO, HostEditDTO, ProgrammingCreateDTO e ProgrammingEditDTO agora recebem **exatamente uma** alternativa:

```json
{ "addressId": 12 }
```

ou

```json
{
  "address": {
    "street": "Avenida Cais do Apolo",
    "number": "77",
    "complement": "",
    "neighborhood": "Bairro do Recife",
    "cep": "50030-220"
  }
}
```

Os exemplos mostram apenas a parte do endereço; os demais campos obrigatórios de cada action continuam necessários. Enviar ambos ou nenhum retorna 400. ID positivo inexistente/inacessível retorna 404. Campos do objeto novo seguem validação de DTO. Geocodificação insuficiente permanece 422, indisponibilidade permanece 503. Propriedade do host/programação é conferida antes da resolução/geocodificação.

HostDetailsDTO e ProgrammingDetailsDTO retornam AddressId e objeto Address aninhado. ProgrammingDetailsDTO também tem Id serializável e HostId para reaproveitar a seleção correta no edit. A criação do host inclui AddressId em host, preservando auth/accessToken. São mudanças de contrato: o antigo campo Address string e os campos AddressNumber/AddressComplement/Neighborhood/CEP na raiz não devem mais ser enviados.

## Persistência e reaproveitamento

AppService mapeia DTO -> entidade. HostService/ProgrammingService verificam acesso e chamam AddressService. Este procura um equivalente acessível usando todos os componentes normalizados, incluindo número, complemento, bairro e CEP; nunca só pelo CEP. Se encontrar coordenadas, reutiliza o registro sem chamada externa. Abreviações diferentes não são consideradas automaticamente o mesmo endereço no cache.

AddressService não chama SaveChanges. Um novo endereço é incluído pelo grafo do host/programação e salvo no mesmo SaveChanges dos dados principais (e dos vínculos de categorias da programação). A edição muda o AddressId; o endereço anterior permanece. A atribuição da role HOST continua no fluxo existente posterior à gravação do host; essa atribuição não passou a fazer parte da transação do endereço.

O índice de NormalizedKey não é único: duas requisições simultâneas ainda podem cadastrar equivalentes. Não há fusão automática de registros preexistentes ou compartilhamento irrestrito de endereços privados.

## Protótipo e arquivo .http

Formulários começam sem endereço selecionado. Selecionar endereço existente apresenta autocomplete vazio, consulta após três caracteres e 300 ms sem nova digitação, limita a dez resultados e ignora respostas antigas. Cadastrar novo endereço abre os campos, mesmo sem resultado de busca. O envio inclui somente AddressId ou somente Address. A busca utiliza JWT; seleção não cria ou altera dados por si só.

O catálogo reconhece query strings e os DTOs novos. O proxy aceita parâmetros de consulta mantendo a restrição de origem/API local. O .http tem exemplos adaptados para endereço aninhado, busca por rua/CEP, busca vazia e criação com endereço existente. A interface mostra aviso de revisão pendente: não representa um teste da API nova com o banco antigo.

## Plano da migration — ainda NÃO executado

Após sua aprovação, a migration precisa ser preparada com transferência dos dados, em vez de aceitar apenas o scaffold automático que removeria as colunas antigas:

1. Fazer backup e inventariar quantidades, tamanhos de textos, CEPs inválidos/vazios e coordenadas nulas existentes.
2. Criar Addresses e adicionar AddressId inicialmente anulável às tabelas existentes.
3. Transferir cada endereço de host e programação, mantendo número, complemento, bairro, CEP e Point/SRID atuais. Derivar a autoria do host ou do host da programação. Não consultar Geoapify durante a transferência.
4. Preencher SearchStreet e NormalizedKey usando a mesma normalização do código. Conferir casos históricos fora dos limites antes de truncar ou descartar qualquer conteúdo. Endereços históricos sem número/coordenadas não devem ser descartados.
5. Preencher as FKs e comparar todos os vínculos e coordenadas com os dados originais. Preservar inicialmente registros com coordenadas diferentes, mesmo quando os textos coincidem; nenhuma fusão silenciosa.
6. Só após a conferência tornar AddressId obrigatório, criar FKs/índices e remover as colunas antigas e seus índices GiST.
7. Revisar o SQL e a estratégia de reversão antes de aplicar ao banco. Ao reverter, reconstruir os campos antigos pelos vínculos; preservar/coletar endereços históricos sem vínculo em vez de apagá-los silenciosamente.

Até a aprovação, `Data/Migrations/` e o snapshot permanecem intactos. O Program registra as dependências novas e bloqueia a execução automática de MigrateAsync em Development quando há diferenças entre modelo e snapshot. Não iniciei a API nova nem executei comandos EF de geração/aplicação.

## Validações realizadas nesta etapa

- Build GeoLocation: zero erros; sete avisos CS8618 preexistentes.
- 48 verificações .NET temporárias: normalização, equivalência, modos exclusivos, acesso indisponível, geocodificação simulada e falhas, DTOs, isolamento dos campos privados, relações/índices do modelo EF, tradução do filtro de acesso em SQL, estados de rastreamento EF de novo endereço + entidade principal e preservação do endereço anterior. Inclui os edits de host/programação e retornos da controller de endereços.
- 38 testes Node com API simulada: contratos/catálogo, JWT, query string, debounce, seleção/novo endereço, resposta atrasada, edição preservando AddressId e regressões dos fluxos anteriores.
- node --check em app.js, catalog.mjs e server.mjs; catálogo real reconhece 20 actions e os quatro DTOs de host/programação com AddressId/Address.
- Não houve escrita no banco, alteração do schema, migration gerada/aplicada, consulta real ao Geoapify nem exportação de PDF. O teste com PostgreSQL do modelo novo fica para depois da revisão e migration.
