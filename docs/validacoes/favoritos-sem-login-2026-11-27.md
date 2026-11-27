# Favoritos nos detalhes sem login — 27/11/2026

## Implementação

- O coração da programação permite adicionar/remover sem login. No estabelecimento, o controle fica sobre o canto superior direito da foto principal, seguindo as postagens de Explorar: círculo de 38 px, afastamento de 12 px, fundo claro, sombra e coração vermelho. Foi retirado do cabeçalho por solicitação do usuário em 27/11/2026. Rótulos indicam a ação atual e o botão fica indisponível enquanto atualiza.
- `favorites.ts` reutiliza a chave existente `perambulando.exploreFavorites`, nos formatos `programming:{id}` e `host:{id}`, sem criar contas ou JWT de visitante. Explorar, Favoritos e os dois detalhes compartilham leitura/escrita, validação e deduplicação. Favoritos existentes são preservados.
- `useFavorite` mantém o coração coerente ao entrar/voltar e ao alterar a coleção em outra tela. Explorar atualiza os favoritos ao receber foco, inclusive recuperando detalhes de programações salvas fora do catálogo carregado. Alterações também notificam outras abas por `storage`.
- No Web, favoritos de visitante permanecem no localStorage após recarregar. Se o navegador bloquear a gravação, são mantidos somente na sessão com aviso, sem sobrescrever a alteração com dados antigos do armazenamento.
- Com JWT existente, programações continuam usando GET de favoritos e POST/PATCH de criação/remoção na API. Uma falha ou sessão vencida não desfaz a alteração local nem bloqueia a coleção; a interface informa quando a sincronização falhou. A lista preserva programações locais quando a sincronização individual falha.
- Estabelecimentos continuam locais porque o backend atual não oferece favoritos de host por conta. Não são enviadas chamadas fictícias de criação/remoção de favoritos de estabelecimento.

Nenhum arquivo do backend, contrato, banco, pacote ou configuração Docker foi alterado. APIs reais não receberam gravações dos testes. PDFs preservados.

## Validações realizadas

- ESLint e TypeScript aprovados; exportação Expo Web aprovada.
- 25 testes Node aprovados, incluindo chave existente, coexistência de host/programação com mesmo ID, deduplicação, remoção sem afetar outros favoritos, notificação e armazenamento bloqueado.
- Edge/Playwright com API simulada e dados de demonstração: visitante adiciona programação e estabelecimento, recarrega e mantém ambos marcados; ambos aparecem em Favoritos e Explorar. Nenhuma chamada privada de favoritos é enviada e nenhum JWT é criado.
- Remoção pelos dois detalhes atualiza a coleção, preservando o outro tipo até sua remoção. JWT de teste existente é reutilizado em POST/PATCH da programação; favoritar host não chama a API de favoritos. Sessão vencida permite salvar localmente e abrir a coleção.
- Captura do cabeçalho do estabelecimento conferida em viewport de 390 px.
- Revisão visual posterior: botão sobre a foto, dimensões/afastamento e persistência sem login ao recarregar conferidos no Edge com API simulada. Lint e TypeScript aprovados para o ajuste de apresentação.

## Limites e pendências

- Integração com uma conta real permanece pendente; os testes de navegador simularam respostas HTTP.
- Persistência local depende deste navegador/perfil/origem e não representa sincronização entre dispositivos. Sem localStorage, a persistência é somente na sessão; não foi adicionada biblioteca de armazenamento nativo.
- Não há fila durável de sincronização offline. Uma falha mantém a alteração neste navegador e mostra aviso, mas não garante atualização posterior da conta; dados de conta podem voltar a aparecer numa futura consulta se a remoção não foi confirmada no servidor.
- A sincronização automática já existente em Explorar/Favoritos continua associando programações locais à sessão quando disponível. Estabelecimentos não são sincronizados com contas.

Como a API não mudou, o protótipo externo não exigiu atualização. Nenhum PDF gerado.
