# Perambulando: manter o painel de testes atualizado

## Documentação contínua

Por solicitação explícita do usuário, mantenha também `docs/` atualizado a cada mudança no sistema. As sete fontes oficiais são `01-controllers.md`, `02-regras-de-negocio.md`, `03-tokens.md`, `04-dtos.md`, `05-docker.md`, `06-banco-de-dados.md` e `07-entidades-models.md`; consulte a matriz em `docs/README.md` para selecionar as afetadas. Confira o comportamento implementado, diferencie pendências e atualize a data. Regenere os PDFs afetados em `docs/pdf/` usando `docs/exportar_pdfs.py` com ReportLab, respeitando as instruções de autoria de PDF disponíveis na sessão. Não documente recursos planejados como existentes nem registre testes não executados. Esta exigência se soma à manutenção do protótipo abaixo.

## Protótipo

Por solicitação do usuário, ao alterar funcionalidades desta API, atualize também o protótipo em `C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api`.

- Confira rotas, verbos HTTP, autorização, DTOs e respostas ao terminar cada alteração. Mantenha os formulários e os fluxos de autenticação/JWT e seleção de IDs coerentes com o backend.
- O painel sincroniza contratos salvos automaticamente enquanto aberto. Ainda é necessário revisar mudanças de lógica, respostas e formatos não reconhecidos pelo catálogo; ajuste o protótipo quando necessário e informe eventuais limites.
- Siga as camadas existentes. Não altere Program.cs, CORS, models ou migrações apenas para suportar a interface de testes. Use chaves em todos os ifs novos.
- Execute as verificações de compilação apropriadas. Para mudanças no protótipo, use `node --check` e `node --test` na pasta dele, com API simulada e sem alterações destrutivas no banco real.
- Painel: http://127.0.0.1:5173/. Atalho: `prototipo-api/Abrir.cmd` no outro workspace. A API e o banco devem ser iniciados normalmente pelo usuário.
