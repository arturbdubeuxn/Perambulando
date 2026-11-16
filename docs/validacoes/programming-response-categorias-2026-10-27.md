# Categorias no retorno de programação - 27/10/2026

O usuário já havia adicionado List<int> categoryIds a ProgrammingResponseDTO. A implementação preenche esse campo em ProgrammingMapping.ToDTO usando os vínculos ProgrammingXCategory, com IDs distintos e ordenados. Não foi adicionado outro campo duplicado de categorias ou alterada a nomenclatura já utilizada no DTO.

Programming ganhou a navegação inicializada ProgrammingXCategories, ligada explicitamente à FK ProgrammingId existente na configuração dos vínculos. As consultas do ProgrammingRepository incluem essa coleção com o endereço: paginação geral, por host, por ID, por interesses, filtro e carrossel. O mapping continua síncrono, sem acesso ao banco ou consulta individual por item.

Cadastro e edição obtêm os vínculos da relação rastreada pelo EF. IDs removidos na edição não permanecem na resposta. Sem vínculos, retorna categoryIds: []. A resposta inclui os vínculos existentes, inclusive IDs de categorias inativas, preservando a semântica da consulta atual de categorias por programação. O filtro de busca por categoria mantém suas regras próprias e não limita o retorno somente ao ID que encontrou a programação.

O protótipo exibe os IDs como categorias nas respostas de programação, utiliza nomes já carregados quando disponíveis e usa Categoria #ID como alternativa, sem chamada extra. Carregar uma programação para edição reaproveita categoryIds. Detalhes públicos continuam com sua lista Categories/CategoryResponseDTO e nomes já existentes.

## Validação

- Build aprovado: zero erros/dez avisos existentes.
- EF Database.HasPendingModelChanges=false: relacionamento reutiliza o schema; não é necessária migration nesta alteração.
- 21 verificações em PostgreSQL descartável usando repository/mapping reais e API completa: listagem geral/por host/interesses, lista vazia, categorias inativas vinculadas, ausência de rastreamento na leitura, paginação sem duplicação, filtro com todos os IDs, carrossel, cadastro, edição com remoção e reconsulta.
- node --check em app.js/catalog.mjs e 64 testes do protótipo com API simulada aprovados, incluindo exibição e seleção de categorias para edição.

Verificador local: C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/ProgrammingCategoriesFlowCheck.csproj e .cs. Schema de teste criado somente no banco com prefixo programming_categories_. API isolada em Production/porta livre; sem acesso aos provedores de geocodificação/CNPJ. Banco e processo temporários removidos; banco principal preservado.

Nenhuma migration, PDF ou reinicialização da API do Visual Studio realizada nesta etapa.
