# Documentação do Perambulando

Atualização: 18/10/2026. Base: código salvo no repositório, não inspeção do banco em execução. Os documentos descrevem o comportamento atual e identificam separadamente limitações e melhorias pendentes.

| Documento | Conteúdo |
|---|---|
| [01 - Controllers](01-controllers.md) | Todas as rotas atuais, autorização, entrada, exemplos e respostas |
| [02 - Regras de negócio](02-regras-de-negocio.md) | Propriedade, fluxos de cadastro, edição, desativação e categorias |
| [03 - Tokens](03-tokens.md) | Emissão, claims, validação, expiração, atualização e logout |
| [04 - DTOs](04-dtos.md) | Campos, tipos, validações, uso e diferenças de mapeamento |
| [05 - Docker](05-docker.md) | Situação encontrada, configuração necessária e operação futura |
| [06 - Banco de dados](06-banco-de-dados.md) | PostgreSQL, EF Core, tabelas, relacionamentos, índices e migrations |
| [07 - Entidades e models](07-entidades-models.md) | Classes do domínio, propriedades, padrões e navegações |

As versões PDF ficam em `pdf/`. As fontes Markdown são a base editável. Para regenerar todos os PDFs, execute `python exportar_pdfs.py` nesta pasta com Python e ReportLab disponíveis. No ambiente Codex, prefira o Python do runtime disponibilizado pela ferramenta de dependências. A exportação não atualiza o conteúdo técnico automaticamente: confira os documentos afetados antes de exportar.

## Manutenção a cada mudança

| Alteração no sistema | Documentos a revisar |
|---|---|
| Rota, verbo, status, autenticação ou contrato HTTP | Controllers; DTOs; Tokens quando aplicável |
| Regra de propriedade, disponibilidade ou validação | Regras de negócio; Controllers; DTOs |
| Claims, roles, login, expiração ou renovação | Tokens; Controllers; Regras de negócio |
| Campo ou mapeamento de entrada/saída | DTOs; Controllers; Entidades e BD se persistido |
| Entidade, configuração EF, índice ou migration | Entidades; BD; Regras de negócio |
| Container, imagem, rede, volume ou variável de ambiente | Docker; BD; Tokens conforme a variável |

Atualize a data dos documentos alterados e regenere seus PDFs. Confira também o protótipo e o arquivo `.http` quando houver alteração funcional. Não marque testes de execução como realizados quando a análise tiver sido apenas estática.

## Estado importante desta edição

Há 15 endpoints nos controllers. A requisição `GetAllProgrammingsbyHostId` presente no `.http` não corresponde a uma action atual; o método interno continua sendo usado pelo perfil de host. Não há arquivos Dockerfile/Compose nos repositórios consultados. Não foram criadas novas funcionalidades ao preparar esta documentação.
