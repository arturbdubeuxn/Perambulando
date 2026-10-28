# GetAllTuristProgrammings — revisão antes do commit

Data: 28/10/2026.

Resultado: nenhuma falha funcional encontrada no endpoint atual. Compilação com zero erros e 10 avisos preexistentes. Git diff --check aprovado após remover espaço em branco na função do service. Nenhuma regra funcional alterada nesta revisão.

## Verificações executadas

52 verificações com a API compilada da versão atual, EF Core e PostgreSQL reais, em banco descartável e porta temporária. Destas, 28 verificam regressões das respostas de programação e 24 cobrem o acesso e a consulta de turistas.

- Sem JWT, token inválido, JWT expirado e JWT sem ID: 401.
- JWT Local, sem typeofuser ou com valor textual diferente do formato numérico emitido: 403.
- Claim turista com usuário Local no banco, usuário inexistente ou turista inativo: 403.
- Turista ativo sem role HOST e sem necessidade de assinatura Pro: 200.
- Take zero ou acima de 100 e skip negativo: 400.
- Primeira e segunda páginas respeitam quantidade, ordem e skip.
- Página além do fim retorna 200 com [].
- Categorias com IDs/nomes e endereço presentes na resposta.
- Programações inativas e hosts inativos excluídos.
- Regressões de listagens, preferências, filtro, carrossel, criação, edição e detalhes aprovadas.

Protótipo: node --check public/app.js e catalog.mjs aprovados; 65 testes simulados aprovados.

## Limites e estado preservado

A verificação HTTP usou tokens assinados para contas de teste no banco temporário; não executou um novo fluxo de login da interface. O endpoint restringe acesso à listagem; a ocultação de uma seção na aplicação final precisa ser implementada pelo frontend. O protótipo de testes mantém a opção disponível para permitir testar também os retornos de acesso negado. A listagem pública geral continua pública. Não foi criada uma classificação de eventos turísticos e a consulta preserva o comportamento temporal da listagem geral.

Banco descartável removido ao final; banco principal e portas da aplicação do Visual Studio preservados. Não houve migration, reinicialização da API principal, exportação de PDFs ou commit.
