# Mapeamentos dos AppServices — verificação de 26/10/2026

## Objetivo

Preservar conversões e contratos ao extrair mappers com interfaces, conforme o padrão já utilizado em ProgrammingMapping.

## Execução

- Build MappingCheck: zero erros, sete avisos CS8618 preexistentes.
- Comparação antes/depois: 41 cenários JSON idênticos, incluindo entradas enviadas aos serviços e respostas montadas pelos AppServices. Fixtures com timestamps fixos evitam diferenças artificiais em respostas persistidas; datas geradas na construção de novas entidades não são comparadas como prova de persistência.
- Resolução por DI dos oito AppServices, mappers e suas interfaces com ValidateOnBuild/ValidateScopes habilitados. Os serviços e Identity são simulados; os mappers são reais.
- Host: entrada de criação com endereço novo, edição com endereço existente, retorno reduzido de criação, edição, exclusão, perfil com programações, ausência, lista e consulta de CNPJ.
- Programming: entrada/saída de criação e edição, IDs de rota, identidade das referências dos vínculos, exclusão, listas por host/interesses, detalhes com categorias e ausência.
- User: cadastro sem Trim, edição com Trim, perfil e ausência; não inclui teste novo de política de senha/autorização.
- Address: consulta postal encontrada/ausente, detalhes, lista e lista vazia.
- Category: detalhes e listas.
- Favorite: três campos do DTO atual em adição, remoção e lista.
- Vínculos: programação/categoria e adição/edição dos interesses do usuário com deduplicação e ordem preservada.
- node --check em public/app.js e catalog.mjs; 52 testes do protótipo aprovados, todos com API simulada.

## Limites

Não houve acesso ao banco, chamada de provedor, requisição HTTP autenticada real ou execução de migrations. A comparação substitui validações por stubs e testa a extração dos mapeamentos, não regras de negócio. Nenhum PDF foi exportado. A linha incompleta encontrada em ProgrammingAppService foi removida para permitir compilar. Nenhuma nova pasta foi criada.

Harness local utilizado: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/viacep-check/MappingContracts.csproj. O baseline foi capturado antes da extração. Execução de comparação: dotnet run --project <caminho do projeto> --configuration MappingCheck -p:UseAppHost=false -p:NuGetAudit=false --no-restore --no-launch-profile.


## Verificação após encapsular CreateProgrammingLinks — 26/10/2026

A mesma comparação de 41 cenários voltou a passar após mover o foreach para ProgrammingXCategoryAppService.CreateProgrammingLinks. A referência dos vínculos à entidade, ordem de categorias e entradas de criação/edição permanecem idênticas à baseline. Build MappingCheck e 52 testes do protótipo aprovados. O método apenas monta a lista; não salva durante o foreach. Nenhum teste com banco real ou migration executado.
