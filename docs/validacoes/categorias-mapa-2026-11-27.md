# Categorias combinadas no mapa — 27/11/2026

## Implementação

Selecionar Música, Feiras e Oficinas representa a união: resultados de qualquer uma das categorias, sem exigir que um evento pertença às três. O backend já utiliza essa regra com `Any/Contains`; não foi alterado.

O frontend enviava todos os IDs, mas carregava apenas a primeira página quando havia filtro e descartava eventos futuros de gastronomia/comércio ao resolver os pins. Agora:

- A consulta filtrada percorre todas as páginas e consolida resultados por tipo/ID antes de montar o mapa. O cursor avança pelos registros originais da API, independentemente da consolidação.
- Eventos futuros de gastronomia/comércio no endereço do host aparecem pelo estabelecimento em azul; durante a duração, o evento selecionado assume o pin. Assim, o filtro não elimina um local só porque sua programação ainda não começou.
- Resultados comuns a duas categorias não se duplicam. Desmarcar uma categoria conserva as demais; Todas limpa a seleção. A legenda explicita a soma e a regra de qualquer categoria selecionada.
- Respostas atrasadas de uma seleção ou paginação anterior são ignoradas. Localização é disponibilizada antes da consulta para permitir trocar categorias durante o primeiro carregamento.

O mapa sem filtro mantém a paginação manual existente. Em qualquer filtro, o raio de distância continua valendo. A consolidação pode produzir menos pins que eventos, pois vários eventos futuros podem representar o mesmo estabelecimento.

## Validações realizadas

- ESLint e TypeScript aprovados; cinco testes Node da resolução de pins aprovados, incluindo preservação de estabelecimentos futuros em categorias combinadas.
- Edge/Playwright com API simulada: Música 13 → Música + Feiras 15 → Música + Feiras + Oficinas 17 resultados. Segunda página consultada; evento com duas categorias apresentado uma vez; quatro estabelecimentos com programação futura preservados.
- Desmarcar Música mantém os cinco resultados de Feiras + Oficinas. Todas recupera o conjunto sem filtro. Resposta atrasada de Música não substitui a combinação mais recente.
- Fundo real do mapa carregado e captura conferida em viewport de 390 px. Nenhuma escrita no banco, alteração de backend ou exportação de PDF.

## Limites e pendências

A validação do navegador simulou as respostas HTTP; a consulta real da API foi conferida no código, sem modificar sua regra. A execução integrada com os dados locais permanece para conferência do usuário. Consultas filtradas com muitos resultados exigem mais páginas e consultas de detalhes; o estado de carregamento permanece visível até terminar.
