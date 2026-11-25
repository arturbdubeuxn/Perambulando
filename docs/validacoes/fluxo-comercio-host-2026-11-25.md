# Comércio no contexto de gestão do host

Atualização: 25/11/2026.

## Problema e implementação

Os itens Comércio de Criar evento, Painel e Meus eventos abriam `/comercio`, um catálogo público com navbar de descoberta (Explorar, Buscar, Perto de você e Favoritos). Isso tirava o proprietário do fluxo de gestão.

Esses três pontos agora abrem `/comercio?gestao=1`. A mesma página reconhece explicitamente o contexto e apresenta Meus estabelecimentos com navbar de host: Painel, Meus eventos, Criar evento, Explorar e Comércio ativo. Explorar continua sendo uma escolha explícita para acessar a descoberta pública; entrar em Comércio não realiza mais essa troca silenciosa. O botão do cabeçalho da gestão volta ao Painel.

Nesse contexto, a lista vem somente de GET `/api/Host/GetAllHostsbyUserId`, com o JWT existente da sessão. São exibidos os perfis ativos de gastronomia/comércio da conta, com busca e filtro locais. Não é usado HostFilter público como fallback. Erros de autenticação/conexão são apresentados sem substituir a lista por estabelecimentos de outros proprietários. O parâmetro de navegação não concede permissões: a API continua responsável pela autenticação e propriedade dos dados.

Cada estabelecimento permite editar dados/horários ou gerenciar seus eventos. A seleção mantém `perambulando.hostId`, compatível com Meus eventos. Expandir informações na gestão usa GET `/api/Host/Details/{id}` com JWT; clicar em uma programação abre `/editar_evento` com os IDs de evento e host, mantendo a navegação de gestão. Falhas ao carregar programações são informadas e podem ser repetidas fechando/abrindo o card.

Editar e cadastrar a partir dessa lista passam `origem=comercio` ao formulário. Voltar ou concluir e usar o botão de retorno abre novamente `/comercio?gestao=1`. A origem é reconhecida por uma condição fixa, sem redirecionamento livre fornecido pela URL. Os fluxos existentes sem essa origem continuam retornando aos destinos anteriores.

`/comercio` sem parâmetro continua sendo o catálogo público, inclusive quando uma conta host decide acessá-lo pela exploração. Mantém HostFilter, navegação de visitante e detalhes públicos de programação; não mostra ações de edição de estabelecimentos. Não foram modificados os pontos de entrada de Explorar, Favoritos e detalhes públicos.

Cards passaram a usar View como contêiner, com ações separadas para evitar botões aninhados no DOM Web. A expansão usa o botão explícito Ver/Ocultar informações. Aparência segue as cores, marca e cards existentes.

## Arquivos envolvidos

- `frontend/src/CreateEventScreen.tsx`, `DashboardScreen.tsx` e `app/meus_eventos.tsx`: destino de Comércio da navbar host.
- `frontend/src/app/comercio.tsx`: contexto, consulta autorizada, ações e navbar de gestão, mantendo catálogo público.
- `frontend/src/app/cadastro_host.tsx`: origem e retorno ao comércio de gestão.

## Validação

- Lint e TypeScript aprovados.
- Exportação Web aprovada; artefato temporário fora do repositório.
- Edge headless com API inteiramente simulada: entradas dos três menus host; navbar correta; dados próprios sem mistura com catálogo; envio de JWT somente nas consultas privadas; edição/salvamento isolado de horários e retorno; cancelamento de cadastro e retorno; seleção de host para eventos; acesso à edição de programação; catálogo público preservado; erro 401 sem fallback público.
- Captura e inspeção visual em viewport 390×844, incluindo a correção de botões aninhados.
- Nenhuma gravação no banco real durante os testes de interface.

## Limites

Teste manual com conta real permanece pendente. Não foram alterados autenticação, contratos, código do backend, banco ou cadastro de usuários. Fluxos de perfil e descoberta fora desse caminho mantêm o comportamento anterior. Não foram adicionadas dependências ao projeto. Protótipo externo e PDFs preservados, pois não houve mudança de funcionalidade da API.
