# Entrada e chat de roteiro com IA — 27/11/2026

Atualização posterior na mesma data: o chat passou para `/roteiro_ia`, enquanto `/roteiro` recebe a timeline manual e a gestão dos cinco endpoints Roadmap. Os cards de resultados do assistente agora permitem incluir/retirar paradas do rascunho compartilhado. Consulte [roteiros e timeline](roteiros-timeline-2026-11-27.md) para a integração e suas validações. O histórico abaixo descreve a entrega inicial do chat.

## Implementação

- Botão **Montar roteiro com IA** abaixo da busca de `/explorar`, mantendo o hero azul existente e a composição de ícone, título, subtítulo e seta da referência.
- Nova rota plana `/roteiro`, com tela `TravelChatScreen.tsx`: cabeçalho Meu roteiro, boas-vindas, quatro sugestões, conversa rolável, campo de mensagem e envio. Layout creme/branco, azul e laranja do aplicativo, com acento violeta para o assistente. Não foram criadas pastas ou dependências.
- Sugestões: Um sábado em Recife, Programação gratuita, Cultura e gastronomia e Algo perto de mim. As três primeiras enviam pedidos completos; a última preenche o campo e pede a cidade, sem solicitar GPS nem alegar proximidade espacial que a rota não fornece.
- `travelChat.ts` chama somente `POST /api/TravelChat/Messages`, com `{ text }` de até 4.000 caracteres. A API é pública; JWT existente é opcional. Um 401 com token permite uma única repetição anônima sem modificar a sessão.
- Resultados usam `programmings` e `hosts` do DTO existente e abrem seus detalhes. Não há catálogo fictício embutido, resposta simulada em produção ou resultado inventado quando o serviço falha. Arrays vazios recebem orientação para mudar data/cidade/preço.
- Envio duplicado é bloqueado, há indicador de consulta, tratamento de falha/rede/limite e botão de nova tentativa. Timeout de 40 s no cliente; requisição cancelada ao desmontar. O composer permanece acessível com rolagem e KeyboardAvoidingView.
- Conversa permanece em memória ao abrir detalhes e voltar pela pilha. Voltar sem histórico direciona a Explorar. Não há persistência de mensagens entre recargas.
- Durante a conferência da entrada foi corrigido o botão de favoritar aninhado dentro do botão do card de programação em Explorar, que gerava aviso de hidratação sobre a nova tela. Foto e conteúdo agora são alvos de navegação separados, com coração independente, como nos cards de host.

## Contrato e limites

O backend atual interpreta **cada texto** e retorna opções filtradas do catálogo. Não recebe histórico/conversationId, não devolve mensagem de assistente e não monta uma sequência definitiva de paradas. A interface usa textos de apresentação próprios para os dados retornados e não promete agenda sem sobreposição, orçamento total garantido ou roteiro salvo. O botão inicia a conversa para planejar o passeio.

Respostas de IA dependem do serviço de interpretação já previsto no backend (`N8n:TravelChatWebhookUrl` e chave quando exigida) estar configurado e acessível. Nada dessa configuração foi criado ou alterado; o frontend não recebe URLs/chaves do provedor. Sem o serviço, mostra indisponibilidade recuperável.

Nenhum arquivo em `backend/`, contrato, banco, pacote ou Docker foi alterado. Nenhum PDF gerado. Como a API não mudou, não houve alteração do protótipo externo.

## Validações realizadas

- ESLint, TypeScript e exportação Expo Web aprovados.
- Cinco testes Node: contrato/deduplicação, payload público exato, JWT opcional com fallback único, validação/cancelamento e respostas de falha/limite.
- Edge/Playwright com API simulada: entrada abaixo da busca, quatro sugestões, envio por Enter, prevenção de duplicação, lista de eventos/estabelecimentos da resposta, abertura/retorno preservando a conversa.
- Resposta vazia, 503 e nova tentativa conferidos sem fallback fictício. Rota direta e largura de 320 px sem transbordamento horizontal. Capturas da entrada e do chat em 390 px revisadas.
- Console conferido após corrigir o card de programação: sem avisos de botões aninhados. O 503 esperado do cenário de falha é gerado apenas pela API simulada.

## Pendências

O provedor real de IA não foi chamado e a integração com n8n não foi validada nesta entrega. Os testes não enviaram conversas ao provedor, não gravaram roteiros/interações no banco real e não alteraram a configuração do serviço. Conferência em dispositivo móvel físico e da configuração local do provedor permanece pendente.
