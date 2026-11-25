# Detalhes do estabelecimento — 25/11/2026

## Implementação

- Nova rota Expo `/estabelecimento?hostId={id}` com tela em `frontend/src/HostDetailsScreen.tsx`, seguindo as cores, marca, cards e navegação existentes. Sem novas dependências ou pastas.
- O card selecionado no mapa, a lista de próximos, os cards de Explorar, Favoritos, Comércio e o estabelecimento organizador/relacionado nos detalhes de programação abrem o estabelecimento correspondente. O botão de fechar do card do mapa permanece separado do botão de abrir.
- Perfil apresenta foto, nome, endereço, contato, estimativa de preço quando informada, descrição integral e semana de funcionamento. Reutiliza nomes/ordem dos dias de `openingHours.ts`, mostra intervalos, dias fechados e fechamento no dia seguinte. Horários ausentes têm aviso; produtores seguem atendimento conforme os eventos.
- Duas faixas com rolagem horizontal independente: próximos eventos (incluindo os em andamento) e eventos anteriores. Cada card contém imagem, nome, datas de início/fim, situação, preço e descrição integral, além de abrir o evento. Setas e indicação de deslizar tornam a navegação explícita.
- Separação/ordenação em `hostDetails.ts`: término menor ou igual ao instante atual significa evento anterior; próximos seguem início crescente, anteriores seguem término decrescente. Datas inválidas recebem “Data a confirmar”, sem criação de histórico fictício.
- A navegação preserva a pilha e permite retornar ao mesmo pin/card selecionado. Origem `comercio-gestao` conserva a navbar do host e os atalhos de edição de evento. Listas públicas continuam no contexto de descoberta.

## Contrato existente e limites

Usa exclusivamente `GET /api/Host/Details/{hostId}`. Após autorização expressa do usuário em 25/11/2026, a action passou de `Authorize` para `AllowAnonymous`. A tela consulta sem token para visitantes e envia JWT somente quando já existe sessão. Não exige login para exibir dados, horários ou eventos. Trata falha de rede, resposta inválida e nova tentativa. A consulta não cria JWT de visitante nem registra interações automaticamente.

`HostDetailsDTO` fornece descrição, endereço, `openingWeek.days[].periods[]` e `programmings`. O backend retorna somente programações ativas vinculadas ao host; a faixa de anteriores contém os eventos encerrados que ainda são retornados pelo contrato, não inclui programações excluídas/desativadas. Nenhuma busca adicional inventa ou completa um histórico ausente.

Na entrega inicial, o backend foi preservado. Na revisão autorizada, foram alterados somente a autorização da action de detalhes e os exemplos públicos correspondentes no `.http`; DTOs, services, entidades, banco, migrations, Docker e pacotes permanecem preservados. O protótipo externo `C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api` não existe nesta máquina e não pôde ser atualizado. PDFs preservados.

## Validações realizadas

- ESLint, TypeScript (`tsc --noEmit`) e exportação Expo Web aprovados.
- Dez testes Node aprovados: três da separação/ordenação dos eventos, incluindo término exato, meia-noite, preservação das descrições e datas inválidas; sete de regressão dos horários.
- Edge/Playwright com API e localização simuladas: descrição integral, sete dias, fechado, múltiplos intervalos e dia seguinte; duas faixas com rolagem independente; ausência de transbordamento horizontal em viewport de 390 px; abertura de evento e retorno ao estabelecimento.
- Navegação pelo pin azul e card do mapa validada com bibliotecas públicas reais do mapa e API simulada; retorno preserva o estabelecimento selecionado.
- Comércio de gestão mantém contexto e ação de edição; erro 404 permite repetir; horários/histórico vazios têm mensagens adequadas. Após a liberação, o teste no Edge foi atualizado e aprovado: visitante sem JWT consulta o endpoint público e visualiza descrição, horários e eventos em viewport de 320 px; sessão autenticada continua enviando seu JWT.
- Backend compilado com zero erros e 23 avisos preexistentes de nulabilidade. Sete verificações HTTP em servidor temporário com controller real e serviços/autenticação simulados: detalhes sem sessão 200, ID inexistente 404 e ID zero 400; GET/PUT de horários, cadastro e listagem dos próprios hosts continuam 401 sem sessão. Nenhum acesso ao banco real.
- Inspeção visual de capturas da página em tela estreita. Nenhuma gravação no banco real nos testes.

## Pendências

- Conferência integrada com sessão real do usuário, fotos e registros do banco local; os testes de interface utilizaram respostas simuladas.
- O histórico fica limitado ao que o backend atual retorna; não inclui eventos desativados.
- Reiniciar a API local para carregar a autorização atualizada; a instância em execução não foi interrompida. Atualização do protótipo externo depende de disponibilizar o workspace indicado.
