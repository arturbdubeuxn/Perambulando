# Perambulando: manter o painel de testes atualizado

## Documentação contínua

Mantenha os documentos Markdown afetados em `docs/` atualizados junto com cada mudança no sistema. Consulte a matriz de `docs/README.md`. Diferencie implementação, validações realizadas e pendências; atualize a data. Por solicitação do usuário, atualize ou regenere PDFs somente quando ele pedir explicitamente. Não exporte PDFs automaticamente. Essa regra se soma à manutenção do protótipo abaixo.

## Protótipo

Por solicitação do usuário, ao alterar funcionalidades desta API, atualize também o protótipo em `C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api`.

- Confira rotas, verbos HTTP, autorização, DTOs e respostas ao terminar cada alteração. Mantenha os formulários e os fluxos de autenticação/JWT e seleção de IDs coerentes com o backend.
- O painel sincroniza contratos salvos automaticamente enquanto aberto. Ainda é necessário revisar mudanças de lógica, respostas e formatos não reconhecidos pelo catálogo; ajuste o protótipo quando necessário e informe eventuais limites.
- Siga as camadas existentes. Não altere Program.cs, CORS, models ou migrações apenas para suportar a interface de testes. Use chaves em todos os ifs novos.
- Execute as verificações de compilação apropriadas. Para mudanças no protótipo, use `node --check` e `node --test` na pasta dele, com API simulada e sem alterações destrutivas no banco real.
- Painel: http://127.0.0.1:5173/. Atalho: `prototipo-api/Abrir.cmd` no outro workspace. A API e o banco devem ser iniciados normalmente pelo usuário.

## Padrão de implementação — orientação do usuário em 21/10/2026

- Siga sempre o padrão das funções, classes, interfaces, construtores, nomenclatura e camadas já existentes no sistema. Leia implementações equivalentes antes de alterar ou criar funcionalidades.
- Não crie pastas adicionais. Adapte a implementação somente às pastas que já existem no projeto.
- Preserve o modo existente de fazer mapeamentos, validações e injeção de dependências; evite introduzir novos estilos ou abstrações por iniciativa própria.
