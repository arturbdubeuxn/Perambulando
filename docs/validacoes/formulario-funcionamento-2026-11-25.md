# Funcionamento semanal no cadastro e edição do host

Atualização: 25/11/2026.

## Implementação

A tela `frontend/src/app/cadastro_host.tsx` passou a apresentar a seção Funcionamento para gastronomia e comércio. Usa o mesmo padrão de cards, cores, tipografia, campos e numeração do formulário. Produtores não recebem essa seção, conforme a restrição do OpeningHoursService existente.

`frontend/src/HostOpeningHours.tsx` organiza a semana de segunda a domingo. Cada dia tem controle Aberto/Fechado, abertura e fechamento por intervalo, opção de fechar no dia seguinte, adição/remoção de intervalos e atalho para repetir segunda de terça a sexta. Ao remover o último intervalo, o dia fica fechado. Ao abrir um dia, são sugeridos 09h–18h, visíveis e editáveis antes de salvar. A semana inicial vem toda fechada, com aviso explícito; não se inventa atendimento sem ação do usuário. Todos os dias fechados são permitidos pela validação atual do backend.

`frontend/src/openingHours.ts` trata a semana e o payload. Verifica sete dias distintos, horários HH:mm ou HH:mm:ss válidos, períodos positivos até 24h e ausência de sobreposições, inclusive na virada sábado/domingo. Aceita segundos existentes sem arredondá-los para minutos. Não utiliza Date/UTC para os horários locais. A mensagem identifica o dia com problema. Dados retornados em segundos zero são apresentados em HH:mm; o envio usa TimeOnly com segundos.

## Integração com contratos existentes

- Criação: envia `openingWeek: { days: [...] }` dentro do POST `/api/Host/Create`, conforme HostDTO e HostMapping existentes. Cada dia envia `dayOfWeek`, `isClosed` e `periods`; cada período envia `openingTime`, `closingTime`, `closesNextDay`. Nenhum ID de linha do servidor é reaproveitado. A semana participa do fluxo de criação do host no backend, sem segunda chamada para gravar horários após criar.
- Edição: carrega GET `/api/Host/{hostId}/OpeningHours` com Bearer JWT da sessão. Não permite salvar gastronomia/comércio enquanto a semana existente não tiver sido carregada; falha de leitura apresenta nova tentativa, sem substituir horários por defaults. Resposta com semana vazia permite preenchimento inicial.
- Salvar alterações: mantém o PUT de edição do host e, para tipos elegíveis, salva a semana com PUT `/api/Host/{hostId}/OpeningHours`. São operações distintas no backend. Se apenas os horários falharem, informa que os dados empresariais foram salvos e permite repetir somente o PUT de funcionamento, mantendo os dados do host bloqueados para toque durante a recuperação.
- Salvar apenas funcionamento: disponível na edição de um host originalmente elegível, salva somente a semana sem exigir alterações ou revalidação do cadastro empresarial/endereço. O texto de sucesso esclarece que os demais dados não foram alterados.
- Proteção contra envios simultâneos e controles desabilitados durante salvamento. Requisições de leitura iniciadas pelo efeito são canceladas ao sair/trocar de contexto.
- Tipos alterados de produtor para gastronomia/comércio começam com semana a preencher e são salvos primeiro como host elegível, depois recebem o PUT de horários. Para mudança inversa, não é enviado horário de funcionamento; não foi inventado endpoint de exclusão dos horários anteriores.

## Validações realizadas

- `npm run lint`: aprovado.
- `tsc --noEmit`: aprovado.
- `node --test src/openingHours.test.mjs`: sete testes aprovados. Cobrem payload, segundos, almoço, horários consecutivos, limites, virada de dia/semana, sobreposição, dias incompletos/fechados e carregamento de TimeOnly.
- `expo export --platform web`: aprovado; artefato gerado em pasta temporária, fora do repositório.
- Edge headless com Playwright temporário e TODAS as chamadas `/api/` interceptadas: carregamento com falha/nova tentativa; bloqueio do botão principal antes de carregar; horários existentes; repetição de dias; segundo intervalo; PUT isolado com JWT e sete dias; falha parcial da edição e recuperação sem segundo PUT de dados empresariais; criação com semana dentro do POST, sem PUT extra; produtor sem seção; sexta-feira 18h–02h com fechamento no dia seguinte.
- Captura de tela e inspeção visual em viewport 390×844, sem transbordamento horizontal. O teste de navegador não criou contas, hosts ou horários no banco real.
- Nenhum arquivo do backend alterado. Sem nova dependência no package.json/lockfile. Nenhuma migration ou mudança de banco aplicada nesta entrega.

## Pendências e limites

Teste com conta real autenticada no ambiente do usuário ainda não executado; a integração de interface foi validada com API simulada. As regras foram conferidas no controller, DTOs, mappings, services e validador reais. Persistência entre recargas do navegador de uma tentativa parcial não é implementada; a recuperação direta funciona enquanto o formulário permanece aberto e, após recarga, a edição recarrega a semana gravada no servidor.

O frontend existente ainda mascara/valida CNPJ como numérico no formulário empresarial completo, apesar de o backend aceitar alfanumérico; não foi ampliado esse fluxo neste pedido. A opção Salvar apenas funcionamento permite editar horários sem passar pela validação empresarial completa. A autorização por proprietário/admin do endpoint permanece inalterada.

Como não há alteração de funcionalidade ou contrato da API, não foi necessário alterar o protótipo externo. PDFs preservados.
