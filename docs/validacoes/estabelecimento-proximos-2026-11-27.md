# Locais mais próximos no estabelecimento — 27/11/2026

## Implementação

- Acrescentada a seção **Locais mais próximos** ao final de `HostDetailsScreen`, depois de eventos anteriores. Até cinco cards verticais com imagem, nome, categoria/tipo, distância e acesso aos detalhes, seguindo o padrão visual dos detalhes de programação.
- `NearbyPlaces.tsx` resolve a localização do próprio estabelecimento; não solicita permissão nem usa a localização pessoal do visitante. Usa referências e cache já existentes e, fora deles, o mesmo geocodificador que a página de evento utilizava.
- Geocodificação extraída de programação para `addressLocation.ts`; consulta, paginação, rótulos e formatação de distância extraídos para `loadNearbyPlaces`/`formatDistance` em `nearbyPins.ts`. A página de evento reutiliza essas funções, mantendo seu comportamento de excluir a programação selecionada.
- No perfil, a lista exclui o próprio estabelecimento e suas programações, já disponíveis nas faixas acima. Elimina duplicatas e continua na página seguinte para completar cinco outros locais, quando existirem, mantendo a ordem de distância da API dentro de 20 km.
- Reutiliza `GET /api/Nearby/GetNearMe` público, com latitude/longitude do estabelecimento, e os detalhes públicos de programação para identificar host/categoria. Não depende da rota protegida `GetNearHost` e funciona sem login.
- Carregamento, lista vazia, falha e nova tentativa independem dos horários e das faixas de eventos. Requisições são canceladas ao sair; resultados antigos não atualizam outro perfil. Nova tentativa desconsidera cache HTTP para repetir a consulta.

Nenhuma mudança de backend, contrato, dependência, pasta, banco ou PDF.

## Validações realizadas

- TypeScript e ESLint aprovados.
- 21 testes Node aprovados, incluindo exclusão de host/programações próprias, paginação, deduplicação, cancelamento, reutilização na programação e localização por referência/cache.
- Edge/Playwright com respostas HTTP simuladas a partir dos registros fictícios: seção ao final, cinco locais após excluir itens da primeira página, distâncias e origem correta, ausência de login e de solicitação de localização pessoal.
- Navegação para outro estabelecimento, retorno e abertura de evento aprovadas; seção preexistente de proximidade do evento preservada. Erro permite repetir; resposta vazia não afeta horários/histórico. Captura conferida em largura de 390 px.

## Pendências e limites

Integração HTTP com a API real não foi executada neste teste de interface; as respostas foram simuladas. Endereços fora das referências/cache dependem da disponibilidade da geocodificação existente. Se ela falhar, a seção mostra falha recuperável, sem inventar um ponto ou substituir pela localização do visitante. Perfis com menos de cinco outros locais mostram somente os disponíveis.

API não alterada: protótipo externo preservado. PDFs não regenerados.
