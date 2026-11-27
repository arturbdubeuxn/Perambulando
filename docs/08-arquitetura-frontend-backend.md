# Arquitetura e separação entre frontend e backend

## Gestão de roteiro pelo visitante — 27/11/2026

`RoadmapScreen.tsx`, exposto em `/roteiro`, consome os cinco endpoints de Roadmap para criação, consulta, listagem, edição e desativação. `roadmap.ts` concentra contratos, estado compartilhado do rascunho, persistência no navegador e validações de horário; `RoadmapButton.tsx` é reutilizado nos cards e mapa para inclusão/remoção com feedback verde e animação. A timeline permite alterar horários e adicionar paradas com união de tipos de local e categorias de evento. Respeita os limites de autorização atuais: visitantes criam versões públicas, indexam seus IDs no `localStorage` e as consultam novamente por `Details`; a gestão remota usa JWT de proprietário. Os cards alteram o rascunho e a página Roteiro salva explicitamente.

“Meus roteiros” fica disponível nos dois modos. Sem conta, lista somente os roteiros salvos naquele navegador e não afirma propriedade remota; alterar uma versão pública anônima continua criando outra versão, pois o backend não permite PUT/PATCH sem proprietário. Com JWT, a mesma seção usa `GetAllRoadmapsByUserId` e preserva edição/exclusão. Um roteiro anônimo já presente no rascunho anterior é migrado para o índice local ao abrir a página. Falhas temporárias de consulta não apagam os IDs locais.

O chat anterior foi movido para `/roteiro_ia`, mantendo TravelChat e acrescentando inclusão na timeline. Backend, banco e dependências preservados. Cobertura de chamadas atualizada para 39/51 endpoints, com 12 sem uso identificado. ESLint e TypeScript foram aprovados; os 12 testes específicos de roteiro passaram, incluindo listagem anônima local e seleção automática do fluxo JWT. Detalhes da implementação, validações e pendências em [roteiros e timeline](validacoes/roteiros-timeline-2026-11-27.md). As seções de auditoria/chat abaixo registram o estado anterior a essa integração.

## Auditoria das integrações — 27/11/2026

O inventário estático atual identificou 51 endpoints de negócio: 34 têm chamadas no aplicativo e 17 não. Entre os não consumidos estão os cinco de Roadmap, três de galeria de host, desativação de host, edição/exclusão de conta, duas consultas específicas de proximidade e quatro consultas de programação. O chat utiliza TravelChat, enquanto os locais próximos utilizam GetNearMe; esses fluxos não integram automaticamente Roadmap/GetNearHost/GetNearProgramming. Consulte [rotas, evidências e limitações da auditoria](validacoes/cobertura-endpoints-frontend-2026-11-27.md). Não houve alteração de implementação nem testes de execução nesta análise.

## Chat para planejar o passeio — 27/11/2026

`/explorar` oferece Montar roteiro com IA abaixo da busca e abre a rota plana `/roteiro_ia`, cuja interface fica em `TravelChatScreen.tsx`. `travelChat.ts` envia `{ text }` a `POST /api/TravelChat/Messages`, público, com JWT opcional e fallback anônimo único em 401. A resposta existente contém programações e hosts, apresentados em cards de detalhes. Não há histórico enviado ao modelo, sequência definitiva, garantia de horários compatíveis ou persistência de roteiro nesta etapa. As mensagens da sessão permanecem na pilha ao abrir e voltar dos detalhes.

A integração depende do serviço de interpretação configurado no backend; URL/chave do provedor permanecem no servidor. Sem configuração/disponibilidade, o chat mostra erro e nova tentativa. Nenhum backend, banco ou pacote alterado. Cinco testes Node e fluxo no Edge com API simulada validados; provedor real e dispositivo físico pendentes. Foi corrigido também o aninhamento do botão de favorito nos cards de programação da entrada. Consulte [contrato, validações e limites](validacoes/chat-roteiro-2026-11-27.md). PDFs preservados.

Padronização visual de 27/11/2026: `HostDetailsScreen` posiciona o coração sobre a foto principal, seguindo dimensões, cores, sombra e afastamento das postagens de Explorar. O cabeçalho mantém voltar e marca. `useFavorite`, armazenamento local e integração existente permanecem iguais. Lint, TypeScript e conferência de posição/clique no Edge com API simulada aprovados; backend e banco preservados. Detalhes em [favoritos sem login](validacoes/favoritos-sem-login-2026-11-27.md).

## Favoritos de visitante nos detalhes — 27/11/2026

`favorites.ts` centraliza o armazenamento já utilizado (`perambulando.exploreFavorites`) e notificações entre telas/abas; `useFavorite` é compartilhado por programação e estabelecimento. Visitantes adicionam/removem sem login e mantêm a coleção neste navegador. Explorar/Favoritos reutilizam as funções, atualizam corações e preservam dados locais quando a API não responde. Com JWT existente, programações continuam usando o FavoriteController; não há emissão de JWT de visitante nem chamada de favorito de host, que o backend não oferece. Falhas de sincronização são informadas, mantendo a alteração local. Não foi criada fila offline durável. Backend, contratos e banco preservados. Validações e limitações em [favoritos sem login](validacoes/favoritos-sem-login-2026-11-27.md); integração com conta real pendente. PDFs preservados.

## Proximidade ao final do perfil de estabelecimento — 27/11/2026

`HostDetailsScreen` acrescenta `NearbyPlaces` depois do histórico. Os cinco outros locais são consultados pelo endpoint público `Nearby/GetNearMe`, com origem no endereço do host, sem pedir a localização do usuário. A lista exclui o host atual e suas programações e completa os resultados por paginação, sem duplicatas. A localização foi extraída da programação para `addressLocation.ts`, enquanto `loadNearbyPlaces` e `formatDistance` em `nearbyPins.ts` são reutilizados pelas duas páginas. Há carregamento, vazio, erro, nova tentativa e cancelamento ao sair. Sem backend, banco ou pacote novo. Lint, TypeScript, 21 testes Node e navegação no Edge com API simulada aprovados; integração real pendente. Consulte [implementação e validações](validacoes/estabelecimento-proximos-2026-11-27.md).

## Categorias do mapa por união — 27/11/2026

`/perto_de_voce` mantém todos os IDs em `CategoriesId`, usando a união já existente na API. Ao filtrar, busca todas as páginas, consolida tipo/ID e avança o cursor pelos registros originais. `resolveNearbyPins` preserva o host correspondente a eventos futuros filtrados, com pin azul, e mantém a troca temporal pelo evento durante a duração. A seleção mostra uma legenda de soma; controles ignoram respostas antigas após trocar categorias. Sem filtro, permanece a paginação manual. Backend, contratos e banco não alterados. Lint, TypeScript, testes Node e cenários no Edge com API simulada validados; integração real pendente. Detalhes em [categorias combinadas](validacoes/categorias-mapa-2026-11-27.md).

## Pins por horário e mapa do evento — 27/11/2026

O usuário manteve a restrição de não alterar o backend. `nearbyPins.ts` consulta os detalhes públicos para reconstituir hosts que a API oculta por terem eventos futuros, usando o ponto retornado pelo Nearby no mesmo AddressId. No mapa, gastronomia/comércio recebem pin azul antes/depois e pin de evento durante `início <= agora < término`; o timer acompanha as transições. Paginação usa os registros originais, antes da consolidação. Filtros de categoria não introduzem hosts fora do filtro; produtores e eventos em outros endereços preservam seus resultados.

`NearbyMap.tsx` passou a ser reutilizado pelos detalhes da programação. As 75 referências de endereço da carga foram conferidas com OSM e limites de bairros municipais e guardadas em `frontend/assets/enderecos-demonstracao-recife.json`. Correspondência exata do endereço permite usar o mesmo ponto do PostGIS sem geocodificar novamente o lote, incluindo eventos passados. Para outros endereços, o cache de geocodificação passou a considerar todos os campos e a busca deixou de usar somente CEP. A proximidade continua usando os endpoints existentes, com origem no evento selecionado. Sem novas dependências ou pastas.

Lint, TypeScript, 16 testes Node e exportação Web aprovados. Edge com retrato do banco e respostas HTTP simuladas verificou histórico/agenda, origem da consulta de proximidade, pins clicáveis e troca automática por horário. API de aplicação não estava ativa e não foi iniciada; integração HTTP real permanece pendente. Fontes, backup e limites em [agenda e localização](validacoes/agenda-enderecos-2026-11-27.md). PDFs preservados.

Atualização: 03/11/2026.

## Objetivo da separação

O Perambulando é mantido como um **único repositório Git**, com duas áreas de código independentes:

- `backend/`: API, regras de negócio, persistência e integrações de servidor em .NET/C#.
- `frontend/`: aplicativo React Native com Expo e TypeScript.

Essa organização permite versionar no mesmo commit uma futura mudança de contrato da API e sua adaptação no aplicativo, sem misturar dependências, processos de build ou responsabilidades. Não existem repositórios `.git` aninhados dentro de `backend/` ou `frontend/`.

## Estrutura geral

```text
Perambulando/
|-- backend/
|   |-- Projetos - 4.slnx
|   `-- Projetos - 4/
|       |-- Application/
|       |-- Data/
|       |-- Domain/
|       |-- Presentation/
|       |-- Properties/
|       |-- Projetos - 4.csproj
|       `-- Projetos - 4.http
|-- frontend/
|   |-- assets/
|   |-- src/
|   |   `-- app/
|   |       |-- _layout.tsx
|   |       |-- index.tsx
|   |       `-- cadastro_host.tsx
|   |-- App.tsx
|   |-- app.json
|   |-- package.json
|   |-- package-lock.json
|   `-- tsconfig.json
|-- docker/
|-- docs/
|-- compose.postgis.yaml
|-- AGENTS.md
|-- .gitignore
`-- README.md
```

`docs/`, `docker/` e `compose.postgis.yaml` permanecem na raiz porque documentam ou operam o produto como um todo, e não somente uma das aplicações.

## Backend

### Identificação e tecnologia

- Solução: `backend/Projetos - 4.slnx`.
- Projeto: `backend/Projetos - 4/Projetos - 4.csproj`.
- Nome e namespaces existentes: preservados como `Projetos - 4` e `Projetos___4`.
- Runtime: .NET 10 e ASP.NET Core.
- Persistência: Entity Framework Core e PostgreSQL 17 com PostGIS.
- Autenticação: ASP.NET Core Identity e JWT Bearer.
- Contrato de desenvolvimento: OpenAPI.

### Conteúdo dos diretórios

| Local | Responsabilidade |
|---|---|
| `Application/DTO` | Objetos de entrada e saída da API, sem expor diretamente as entidades persistidas |
| `Application/AppServices` | Coordena validações, serviços de domínio e mapeamentos para DTOs |
| `Application/Interfaces` | Contratos dos AppServices |
| `Application/Validations` | Validações de entrada dos DTOs |
| `Domain/Model` | Entidades e objetos do domínio |
| `Domain/Service` | Regras e operações de negócio |
| `Domain/Interfaces` | Contratos de serviços e repositórios |
| `Domain/Validations` | Validações de domínio compartilhadas entre consumidores |
| `Domain/Exceptions` | Erros específicos tratados pela API |
| `Data/Context` | `DbContext` do Entity Framework Core |
| `Data/Configurations` | Mapeamentos das entidades para o PostgreSQL |
| `Data/Repository` | Consultas e gravações no banco |
| `Data/Migrations` | Histórico versionado do schema |
| `Data/Services` | Integrações de infraestrutura, como Geoapify, ViaCEP e Minha Receita |
| `Presentation/Controllers` | Endpoints HTTP e conversão de resultados em respostas HTTP |
| `Presentation/Program.cs` | Configuração, injeção de dependências, autenticação e inicialização |
| `Properties/launchSettings.json` | Perfis e URLs locais de inicialização |
| `Projetos - 4.http` | Requisições manuais para testar os contratos da API |
| `appsettings*.json` | Configurações locais e por ambiente; segredos reais devem permanecer fora de arquivos compartilhados |

### Fluxo interno do backend

```text
Requisição HTTP
    |
    v
Controller -> AppService -> Service de domínio -> Repository -> EF Core -> PostGIS
                    |                 |
                    |                 `-> regras de negócio
                    `-> validações e mapeamento de DTOs
```

Quando necessário, os serviços também consultam provedores externos. Essas integrações e suas chaves pertencem exclusivamente ao backend; o aplicativo não deve receber chaves do Geoapify ou de outros provedores.

### Execução local

O banco do projeto é publicado em `127.0.0.1:5434`; dentro do container, o PostgreSQL continua na porta 5432.

```powershell
docker compose -f compose.postgis.yaml up -d database
dotnet run --project ".\backend\Projetos - 4\Projetos - 4.csproj" --launch-profile http
```

Com o perfil HTTP, a API atende em `http://localhost:5014`. Em desenvolvimento, o documento OpenAPI fica em:

```text
http://localhost:5014/openapi/v1.json
```

O arquivo `Projetos - 4.http` pode ser executado pelo Visual Studio ou por uma extensão HTTP compatível no editor.

## Frontend

### Estado atual e tecnologia

O diretório `frontend/` contém o aplicativo web responsivo baseado em React Native:

- Expo SDK 58.
- React Native 0.88.
- React 19.3.
- TypeScript 6.
- Expo Router 58 para rotas web e navegação universal.
- Fredoka para a assinatura textual da marca Perambulando.
- Dependências travadas em `package-lock.json`.

Estão implementadas as interfaces integradas de criação de evento e cadastro de host. O cadastro de host valida e mascara os dados, registra o usuário host, autentica-o, consulta o CNPJ e envia o `HostDTO` à API. No navegador, o JWT e o host recém-criado ficam em `sessionStorage`, somente durante a sessão da aba, para a rota `/` carregar os hosts do usuário e publicar uma programação.

### Conteúdo dos arquivos e diretórios

| Local | Responsabilidade |
|---|---|
| `App.tsx` | Exportação compatível da tela de criação de evento |
| `src/CreateEventScreen.tsx` | Formulário responsivo e integração de criação de programação |
| `src/app/_layout.tsx` | Layout raiz do Expo Router, sem cabeçalho nativo |
| `src/app/index.tsx` | Rota `/`, que apresenta a tela de criação de evento |
| `src/app/cadastro_host.tsx` | Rota `/cadastro_host`, com o formulário visual e scrollável de cadastro de host |
| `app.json` | Metadados, esquema `perambulando`, plugin do Expo Router e assets do aplicativo |
| `assets/` | Marca Perambulando, ícone, favicon e imagens de inicialização |
| `package.json` | Dependências e scripts npm |
| `package-lock.json` | Versões resolvidas das dependências para instalações reproduzíveis |
| `tsconfig.json` | Configuração do compilador TypeScript |
| `.gitignore` | Artefatos locais que não devem ser versionados |
| `AGENTS.md` | Orientações do template para futuras alterações assistidas |
| `node_modules/` | Dependências instaladas localmente; é gerado pelo npm e não é versionado |

### Execução local

```powershell
cd frontend
npm install
npm start
```

Scripts disponíveis:

```powershell
npm run android
npm run ios
npm run web
```

O simulador iOS requer macOS. No Windows, o desenvolvimento móvel pode usar Android Emulator ou um aparelho compatível com o fluxo do Expo.

## Dinâmica entre frontend, backend e banco

### Funcionamento atual

Frontend e backend são iniciados separadamente. As rotas de cadastro de host e criação de evento trocam dados com a API quando os dois processos e o banco estão disponíveis:

```text
frontend/ -> /cadastro_host chama Register, Login, GetByCNPJ e Host/Create
          -> guarda JWT/hostId na sessão web
          -> / carrega Category/GetallCategories e Host/GetAllHostsbyUserId
          -> / publica em Programming/{hostId}/Create

backend/  -> valida os contratos, aplica as regras e acessa o PostGIS
```

Iniciar o frontend não inicia a API ou o banco. Iniciar o backend não inicia o Expo. O Docker Compose atual inicia somente o banco `database`.

### Fluxo de integração

O fluxo utilizado pelo cadastro de host e previsto para as demais funcionalidades é:

```text
Aplicativo React Native
    |
    | HTTPS/JSON, DTOs e Bearer JWT
    v
API ASP.NET Core
    |
    | EF Core / Npgsql
    v
PostgreSQL 17 + PostGIS

API ASP.NET Core -> provedores externos autorizados
```

O frontend conhece somente a URL pública da API e os contratos HTTP necessários. Ele não acessa diretamente o PostgreSQL, não executa migrations e não contém credenciais do banco ou chaves privadas do servidor.

Respostas de sucesso e erro devem continuar seguindo os controllers e DTOs documentados. Endpoints protegidos receberão o JWT no cabeçalho `Authorization: Bearer <token>`. Erros estruturados do backend devem ser tratados a partir de `ProblemDetails` ou `ValidationProblemDetails`, conforme cada endpoint.

### URLs locais

`localhost` possui significados diferentes conforme o aplicativo:

| Consumidor | Endereço local habitual da API |
|---|---|
| Navegador no mesmo Windows | `http://localhost:5014` |
| Android Emulator | `http://10.0.2.2:5014` |
| Aparelho físico na mesma rede | `http://IP_DO_COMPUTADOR:5014`, desde que a API e o firewall permitam |

O cadastro de host lê `EXPO_PUBLIC_API_URL` e usa `http://localhost:5014` como fallback no navegador local. A variável deve ser definida por ambiente; por ser pública no bundle do Expo, não pode conter segredos.

## Ordem recomendada para desenvolvimento

1. Iniciar e conferir o PostGIS.
2. Iniciar a API e aguardar a aplicação das migrations existentes.
3. Conferir `http://localhost:5014/openapi/v1.json` ou uma requisição segura no arquivo `.http`.
4. Iniciar o Expo dentro de `frontend/`.
5. Quando existirem funcionalidades no aplicativo, testar o fluxo completo sem executar operações destrutivas no banco real.

## Regras de evolução conjunta

- Mudanças de rota, verbo, autenticação, DTO ou resposta no backend devem ser refletidas no frontend consumidor e nos documentos da matriz de `docs/README.md`.
- Regras de negócio e segredos permanecem no backend; o frontend cuida da experiência, estado da interface e consumo dos contratos.
- Migrations pertencem ao backend e não devem ser geradas ou executadas pelo frontend.
- Dependências .NET são restauradas pelo NuGet; dependências React Native são restauradas pelo npm.
- `bin/`, `obj/`, `node_modules/`, `.expo/` e outros artefatos gerados não devem ser usados como fonte versionada.
- PDFs de documentação somente são regenerados mediante solicitação explícita.

## Validações e pendências desta documentação

Validações realizadas: estrutura real dos diretórios conferida; solução e projeto .NET localizados; scripts e versões do `package.json` conferidos; configuração Expo conferida; comandos e portas comparados com a configuração atual do repositório.

Validações adicionais em 26/10/2026: `tsc --noEmit` e `expo lint` aprovados; bundle web do Expo Router compilado; `/` e `/cadastro_host` responderam HTTP 200 no servidor local. Em 27/10/2026, a rota `/cadastro_host` foi conferida integralmente em captura responsiva: cabeçalho, marca em Fredoka, pin, paleta, cartões, campos, seleção, botões e aviso final foram renderizados corretamente.

### Comércio reutiliza a página de perfil — 17/11/2026

Os atalhos “Comércio” das barras inferiores do painel, de “Meus eventos” e da criação de evento abrem `/comercio`. Essa rota reutiliza diretamente o componente de `/perfil`, exibindo os mesmos dados cadastrais da conta, plano, estados de autenticação e identidade visual, sem manter uma cópia divergente da tela. Alteração exclusiva do frontend.

### Valores estimados no formulário de host — 17/11/2026

O cadastro e a edição de host exibem `Valor mínimo` e `Valor máximo` após a seleção de Gastronomia ou Comércio. Os campos aceitam valor decimal com até duas casas, validam preenchimento obrigatório e impedem mínimo maior que máximo; para Produtor de eventos, ficam ocultos e o payload envia ambos como nulos. A edição carrega os valores já registrados. Alteração exclusiva do frontend, reutilizando o contrato atual da API.

Pendências intencionais: implementar uma tela completa de login e armazenamento multiplataforma seguro da sessão, configurar a URL definitiva por ambiente, disponibilizar upload de imagens e implementar rascunhos quando existirem contratos correspondentes no backend. A sessão atual usa `sessionStorage` apenas no Expo Web e termina ao fechar a aba. A criação de evento depende de categorias ativas no banco.

## Integração da criação de evento — 28/10/2026

A rota `/` foi alinhada a `ProgrammingDTO` e ao endpoint autenticado `POST /api/Programming/{hostId}/Create`. O formulário captura nome, descrição, URLs, início/término, gratuidade, preços mínimo/máximo, categorias por ID e endereço estruturado; datas locais são convertidas para UTC com sufixo `Z`, CEP e preços são normalizados, e as regras principais do backend são antecipadas no cliente.

Categorias são carregadas de `GET /api/Category/GetallCategories`, e hosts ativos do usuário são carregados de `GET /api/Host/GetAllHostsbyUserId` com o JWT recebido no fluxo de cadastro de host. O botão de rascunho permanece desabilitado porque não existe contrato de rascunho. A imagem é informada por URL porque `ProgrammingDTO` possui `ImageUrl` e a API não oferece upload de arquivo.

Validações realizadas: `tsc --noEmit` e ESLint direto nos quatro arquivos envolvidos aprovados; `/` e o bundle web do Expo Router responderam HTTP 200, com a nova tela incluída. O wrapper `expo lint` foi iniciado duas vezes, mas permaneceu sem saída por mais de 90 segundos e foi interrompido; a execução direta do mesmo ESLint concluiu sem diagnóstico. A primeira consulta de categorias retornou `[]`; em seguida, o catálogo local foi preenchido com 12 categorias ativas e o mesmo endpoint passou a responder 200 com todas elas. Não houve POST de programação, mudança de backend ou regeneração de PDF.

## CORS do frontend web local — 27/10/2026

O backend aplica globalmente aos controllers a política nomeada `FrontendCors`. Ela permite requisições originadas pelo Expo Web em `http://localhost:8081` e `http://localhost:8082`, com os métodos e cabeçalhos necessários, incluindo `Content-Type` e `Authorization`. A política é executada antes da autenticação e da autorização.

A permissão está restrita a essas duas origens; não foi usado `AllowAnyOrigin`. CORS apenas libera a comunicação no navegador e não substitui JWT, autorização ou validações da API. Quando o frontend for publicado, sua origem real deverá ser incluída explicitamente na política.

Implementação: somente `Presentation/Program.cs` foi alterado. Rotas, verbos, DTOs, regras de negócio, models, migrations, banco, containers e PDFs foram preservados. Validação: compilação do backend; o teste funcional pelo navegador depende de API, banco e frontend iniciados simultaneamente.

## Autopreenchimento no cadastro de host — 03/11/2026

A rota `/cadastro_host` consulta automaticamente `GET /api/Host/GetByCNPJ` ao completar um CNPJ válido e `GET /api/Address/GetByCEP` ao completar oito dígitos de CEP. O CNPJ ativo preenche razão social, nome fantasia e um endereço sugerido; o CEP preenche cidade, UF visual, logradouro e bairro sem substituir número e complemento. Identificadores de requisição impedem que respostas antigas sobrescrevam valores mais recentes.

Esses dois GETs de leitura receberam `AllowAnonymous`, pois o formulário ainda não possui JWT antes de registrar e autenticar a conta. A API continua revalidando CNPJ ativo e geocodificando o endereço na criação autenticada do host. A UF exibida não é enviada no `HostDTO`, pois `AddressCreateDTO` não possui esse campo; cidade já faz parte do contrato. A exposição pública encaminha tráfego aos provedores Minha Receita e ViaCEP, portanto rate limiting permanece pendente antes de publicar a aplicação fora do ambiente local.

Validações realizadas: TypeScript e ESLint direto da tela aprovados; backend compilado em saída temporária porque a API aberta bloqueava seus binários normais. O teste HTTP temporário não concluiu no ambiente isolado por falta de permissão do logger do Event Log. O wrapper `expo lint` permaneceu sem saída e foi interrompido. O protótipo externo não estava disponível no caminho configurado. PDFs não foram regenerados.

## CEP primeiro e sugestão de endereço no evento — 03/11/2026

Na seção “Onde acontece” da rota `/`, o CEP passou a ser o primeiro campo. Quando existe JWT de host no `sessionStorage`, a tela usa o endereço incluído em `GET /api/Host/GetAllHostsbyUserId` para preencher imediatamente CEP, cidade, logradouro, número, complemento e bairro do host selecionado como sugestão. Em seguida chama `GET /api/Address/GetByCEP` com o cabeçalho Bearer para completar a UF. Trocar o host atualiza a sugestão; editar o CEP executa novamente a consulta e pode sugerir cidade, UF, logradouro e bairro, preservando número/complemento. Todos os campos persistidos continuam editáveis e respostas de consultas anteriores são descartadas quando o CEP ou host muda.

Sem sessão, a tela não carrega hosts nem chama o provedor e informa que o login de host é necessário para o autopreenchimento. A UF é somente auxiliar e não integra o JSON enviado, pois `AddressCreateDTO` não possui `State`; o payload de criação permanece com city, street, number, complement, neighborhood e cep. Nenhuma rota, autorização, DTO, regra do backend, migration ou banco foi alterado nesta etapa.

Validações realizadas: `tsc --noEmit`, ESLint direto de `CreateEventScreen.tsx` e `git diff --check` aprovados. Não houve publicação de evento, consulta real ao ViaCEP, alteração do protótipo externo ou regeneração de PDFs.

## Autocomplete de logradouro cadastrado — 03/11/2026

Ao editar o Logradouro em “Onde acontece”, a tela aguarda 300 ms e, com pelo menos seis letras/dígitos, chama o endpoint autenticado `GET /api/Address/GetAllAddress?search=...`. Até dez resultados são apresentados com número, bairro, cidade e CEP. A troca do texto invalida respostas anteriores.

Escolher uma sugestão preenche os campos e guarda `addressId`; a publicação envia somente esse ID para reutilizar o endereço existente. Qualquer alteração posterior em CEP, cidade, logradouro, número, complemento ou bairro remove a seleção e restaura o envio do objeto `address`. O endereço sugerido inicialmente pelo host também conserva seu ID. TypeScript, ESLint direto e `git diff --check` aprovados; sem mudança de backend, migration, banco, protótipo ou PDF.

## Nomenclatura Comércio no frontend — 03/11/2026

O rótulo visual `Empresa` foi substituído por `Comércio` na opção de tipo de host e na navegação inferior da criação de evento. O valor `2` do enum `TypeofHost` foi preservado; não houve mudança de DTO, serialização, regra do backend ou banco. Os textos genéricos sobre dados empresariais permanecem inalterados.

## US20 — Painel de gestão do host no frontend — 13/11/2026

Implementação: criada a rota Expo Router `/meus_eventos`, acessível pelo item “Meus eventos” da navegação inferior da criação de evento. Nessa rota, o item fica selecionado com fundo, ícone e rótulo em laranja; o botão central de criação permanece como atalho, mas perde o destaque de página ativa. A tela exige o JWT mantido pela sessão web atual antes de consultar dados e apresenta estados próprios para carregamento, sessão ausente/expirada, erro da API e usuário sem estabelecimento.

O painel consome, sem mudança de contrato, `GET /api/Host/GetAllHostsbyUserId` e `GET /api/Host/Details/{hostId}`. Exibe os estabelecimentos ativos vinculados ao usuário, permite alternar entre eles e conserva o ID selecionado no `sessionStorage`. Para o estabelecimento atual, apresenta a quantidade de programações ativas retornadas pela API, futuras e encerradas conforme as datas, além da listagem com situação e dos atalhos para criar ou administrar programações. Usuários sem estabelecimento recebem uma chamada para o cadastro.

Validações realizadas: TypeScript com `tsc --noEmit`, ESLint direto da nova rota e da tela de criação e `git diff --check` aprovados. A validação usou análise estática; não houve login real, requisição HTTP, gravação no banco ou alteração do backend. O armazenamento de sessão continua restrito ao Expo Web, conforme a pendência já documentada. O protótipo externo não foi alterado porque não houve mudança de funcionalidade da API. PDFs não foram regenerados.

## Edição de programação pelo painel — 13/11/2026

Implementação: os cards de “Administrar eventos” em `/meus_eventos` passaram a abrir `/editar_evento` com `programmingId` e `hostId`. A rota reutiliza o formulário de criação em modo de edição, consulta `GET /api/Programming/Details/{programmingId}`, converte início e término UTC para os campos locais de data/hora e preenche texto, categorias, gratuidade, preços, links e endereço já registrados. O estabelecimento responsável é exibido, mas não pode ser trocado durante a edição; a tela também verifica se a programação pertence a um host ativo retornado para a conta autenticada.

Ao salvar, o frontend envia o mesmo contrato `ProgrammingDTO` para `PUT /api/Programming/{hostId}/Edit/{programmingId}`. Endereço existente continua sendo enviado por `addressId`; ao editar seus campos, o comportamento anterior volta a enviar um novo objeto de endereço. “Restaurar dados” repõe a resposta originalmente carregada. Após sucesso, a tela oferece retorno a “Meus eventos”, que recarrega o painel. No modo de edição, a navegação destaca “Meus eventos” e deixa “Criar evento” apenas como atalho.

Validações realizadas: TypeScript e ESLint direto nos três arquivos envolvidos aprovados. A rota web respondeu HTTP 200 no servidor Expo local. Uma leitura real de `GET /api/Programming/Details/2` confirmou a programação “festa na arvore”, seu host 10, endereço 11, quatro categorias e data de início, sem alterar dados. Não foi executado PUT real nem houve gravação no banco; a propriedade e as regras finais continuam validadas pelo backend. Nenhuma rota, DTO, regra, migration ou código da API foi alterado. O protótipo externo e os PDFs foram preservados.

## Cadastro de múltiplos hosts pela mesma conta — 13/11/2026

Implementação: o seletor horizontal de estabelecimentos em `/meus_eventos` inclui, após os perfis existentes, um card tracejado e destacado “Novo host” com símbolo `+`. O componente permanece dentro do `ScrollView` horizontal, permitindo crescimento do número de perfis sem comprimir os cards. Ao acioná-lo, abre `/cadastro_host?novoHost=1`.

Com uma sessão web válida, o cadastro adicional reutiliza o JWT e não exibe nem envia um novo cadastro/login de usuário. A tela carrega `GET /api/Host/GetAllHostsbyUserId` antes de liberar o CNPJ. CNPJ novo mantém o autopreenchimento atual. Quando o CNPJ já pertence a outro host da mesma conta, razão social e nome empresarial continuam disponíveis, mas todos os campos de localização são limpos; CEP, cidade, logradouro, número e bairro precisam ser informados novamente, enquanto complemento permanece opcional. Depois do POST, o token atualizado e o novo `hostId` são armazenados, e há retorno direto ao painel.

O backend permite CNPJ repetido somente entre hosts do mesmo proprietário e mantém conflito para outro `UserId`. A role `HOST` é atribuída apenas se ainda não existir. TypeScript, ESLint e build .NET em saída temporária foram aprovados; não houve criação real de host nem alteração do banco. A API aberta precisa ser reiniciada. Protótipo externo indisponível no caminho obrigatório; PDFs preservados.

### Correção: CNPJ fixo no cadastro adicional — 13/11/2026

O card “Novo host” agora envia também `sourceHostId`, correspondente ao perfil selecionado no painel. Em `/cadastro_host?novoHost=1`, o frontend carrega os hosts da conta, localiza a origem e preenche seu CNPJ em um campo desabilitado. Não existe opção visual para digitar outro CNPJ. O formulário informa de qual perfil ele foi herdado e continua limpando toda a localidade para receber os dados do novo estabelecimento.

O backend reforça a mesma regra: depois do primeiro host, `HostService` aceita na criação somente um CNPJ já pertencente aos hosts ativos do usuário. Assim, manipular o HTML ou chamar a API diretamente não permite cadastrar outro identificador. TypeScript, ESLint e build .NET aprovados; nenhum host real foi criado. A API precisa ser reiniciada, o protótipo externo permanece indisponível e os PDFs não foram regenerados.

## Exclusão de programação pelo painel — 13/11/2026

Implementação: cada card de programação em `/meus_eventos` ganhou uma lixeira vermelha no canto inferior direito, separada da área que abre a edição. Ao acioná-la, um modal bloqueante identifica a programação e pergunta “Tem certeza que deseja excluir essa programação?”. “Cancelar” fecha o modal sem alteração; “Sim, excluir” usa o JWT da sessão em `PATCH /api/Programming/{hostId}/Delete/{programmingId}`.

Enquanto a requisição está em andamento, os botões do modal ficam desabilitados. Em caso de erro, o ProblemDetails da API é exibido no próprio modal. Com sucesso 204, a programação é removida do estado local do host e os totais do painel são recalculados. A operação continua sendo uma desativação lógica no backend; nenhuma exclusão física, rota nova ou mudança de contrato foi introduzida.

Validações realizadas: TypeScript e ESLint direto de `meus_eventos.tsx` aprovados; rota web preservada. Não foi executado PATCH real para evitar desativar uma programação do banco do usuário. Backend, protótipo externo e PDFs não foram alterados nesta etapa.

## Edição do host selecionado pelo painel — 13/11/2026

Implementação: o botão “Administrar” do resumo do perfil em `/meus_eventos` abre `/cadastro_host?editarHost=1&hostId={id}` para o host atualmente selecionado. O formulário reutilizado carrega `GET /api/Host/GetAllHostsbyUserId`, confirma que o ID pertence à conta autenticada e preenche tipo, nome, telefone, descrição, logo, Instagram e endereço. O CNPJ é exibido desabilitado e identificado como dado apenas para consulta.

Ao salvar, o frontend envia o `HostDTO` para `PUT /api/Host/{hostId}/Edit` com o JWT atual. Nome, tipo, contatos, descrição e localidade podem ser alterados; o endereço preenchido é enviado como objeto para a resolução e deduplicação já existentes. Em sucesso, a tela informa a atualização e oferece retorno ao painel.

Validações realizadas: `tsc --noEmit` e ESLint direto de `cadastro_host.tsx` e `meus_eventos.tsx` aprovados. O backend também rejeita mudança do CNPJ antes de resolver o endereço. Não foi executado PUT real nem houve gravação no banco. O protótipo externo permanece pendente porque o caminho obrigatório não existe neste computador; PDFs não foram regenerados.

### Rolagem horizontal do seletor de hosts — 13/11/2026

O seletor de estabelecimentos em `/meus_eventos` mantém todos os cards em uma faixa horizontal. No mobile, aceita o gesto nativo lateral mesmo dentro da rolagem vertical da página; o indicador horizontal fica visível e a interface informa que é possível arrastar para encontrar os demais perfis. No Expo Web, os eventos de gesto acrescentam arraste horizontal por mouse sem alterar o toque simples usado para selecionar um host. Esta alteração é exclusiva do frontend; contratos e arquivos do backend não foram modificados nesta etapa.

## Perfil do usuário no frontend — 13/11/2026

O avatar circular do cabeçalho nas telas de criação/edição de evento e no painel `/meus_eventos` passou a ser um botão acessível que abre `/perfil`. A nova rota exige o JWT da sessão web e consome o contrato existente `GET /api/User/Profile`, sem mudanças na API.

A tela apresenta nome, e-mail, perfil de uso, situação da assinatura, data de cadastro e identificador da conta, além de estados para carregamento, sessão ausente e falha da API. A inicial do nome substitui o “A” estático dentro da página. A senha não é exibida porque não integra `UserProfileDTO` nem a resposta da API. TypeScript, ESLint dos três arquivos envolvidos e `git diff --check` foram aprovados; `/perfil` respondeu HTTP 200 no servidor Expo local. Não foi realizada consulta autenticada com dados reais. Esta implementação alterou exclusivamente o frontend; backend, rotas, DTOs, migrations e PDFs foram preservados.

## Ordem dos dados empresariais no cadastro — 16/11/2026

Na seção “Dados empresariais” de `/cadastro_host`, o CNPJ passou a ser o primeiro campo. A razão social e o nome fantasia aparecem depois da validação visual do CNPJ, preservando máscaras, consulta automática, preenchimento sugerido, mensagens e regras dos modos de criação e edição. Alteração exclusiva de apresentação no frontend; backend e contratos não foram modificados.

## Painel demonstrativo do host — 16/11/2026

A implementação visual de `PaginaProHost` foi portada para a rota Expo Router `/painel`. A tela apresenta visão geral, períodos ilustrativos, métricas, gráfico, programações em foco, ideias de divulgação, planos propostos, estados demonstrativos de assinatura e modais de simulação. Os números, estabelecimentos, planos, pagamentos e assinaturas mostrados são explicitamente fictícios; nenhuma ação gera cobrança ou grava dados.

O item “Painel” da navegação inferior em criação/edição de evento e em `/meus_eventos` abre a nova rota e recebe o estado visual ativo dentro dela. A adaptação para esta branch também conectou “Meus eventos” à rota existente e o avatar ao perfil já implementado. TypeScript, ESLint dos quatro arquivos envolvidos e `git diff --check` foram aprovados; `/painel` respondeu HTTP 200 em uma instância Expo temporária, encerrada após a verificação. Esta mudança é exclusiva do frontend e não altera contratos nem arquivos do backend.
Backend, banco, containers, contratos HTTP e PDFs foram preservados.


## Estatísticas implementadas em 29/10/2026

Fluxo de coleta: Controller → AppService → mapping → Service → Repository. Consulta agrega no PostgreSQL. Frontend permanece pendente para gatilhos de interação e painel; GET de detalhes não registra visualização automaticamente.

[Contratos, regras, validação e pendências](validacoes/estatisticas-implementacao-2026-10-29.md). Esta seção registra o estado atual e prevalece sobre propostas anteriores de estatísticas. PDFs não regenerados.


## Separação das consultas de estatísticas — 29/10/2026

Resumo, gráfico e ranking possuem endpoints, DTOs e mappings independentes, sem herança. HostStatisticsAccessService reutiliza a validação de usuário, dono e Pro; filtros e agregações permanecem no banco. A rota única anterior foi removida. Consulte os [contratos atuais, exemplos JSON e pendência de concorrência da coleta](validacoes/estatisticas-implementacao-2026-10-29.md). Nenhuma alteração de schema nesta refatoração; migration da coleta ainda não aplicada ao banco real. Protótipo externo ausente neste computador; PDFs preservados.

## US17 — Coleta somente no ambiente de testes — 30/10/2026

Por decisão explícita do usuário, esta etapa foi feita em prototipo-api e não no frontend Expo. O painel oferece opt-in para registrar aberturas de detalhes, cliques no carrossel, ingresso e simulação identificada de origem Perto de mim. Sem opt-in, consultas continuam sem coleta. Histórico, renderização, estatísticas e prefill de edição não geram eventos. Não foi criada busca real por proximidade.

UUID novo por ação; falhas transitórias oferecem reenvio manual com o mesmo UUID, tipo, programação, API e JWT originais. Fila limitada a 50 em memória, limpa no logout/exclusão de conta e perdida ao recarregar. Coleta não bloqueia navegação e não substitui a resposta principal. Services/repositories/contratos/backend permanecem inalterados; o envio utiliza a idempotência já implementada.

Sintaxe JS e 83 testes com API simulada aprovados. Nenhum dado real alterado ou teste contra API principal nesta etapa; frontend/ confirmado sem alterações, nenhuma migration/PDF ou reinicialização de backend/Expo. Recarregar o protótipo para receber a interface. Coleta e painel do frontend definitivo continuam pendentes. [Fluxos, regras, limites e testes](validacoes/us17-coleta-prototipo-2026-10-30.md).


## Redução de dependências no backend — 01/11/2026

As camadas continuam como pastas no mesmo projeto .NET. Nesta etapa foram removidas referências não utilizadas do Domain à Application e do ProgrammingRepository a DTOs. A regra pretendida é: Presentation consome contratos e traduz HTTP; Application coordena DTOs/mappings; Domain contém modelos, regras e interfaces; Data implementa persistência e integrações técnicas. O composition root Program.cs liga interfaces e implementações.

- JWT: Presentation -> IJwtTokenService (Domain); Data/Services/JwtTokenService implementa o contrato e retorna AuthenticationToken. Domain não contém mais o emissor criptográfico concreto.
- Categorias: Data identifica a FK/índice específico -> lança exceção de Domain -> Presentation converte para 400/409. ProgrammingController não importa EF/Npgsql.
- CNPJ: Domain conserva CnpjFailure/CnpjException; Presentation/Controllers/CnpjExceptionExtensions converte em ProblemDetails. O domínio não referencia MVC para construir respostas.

As pastas existentes foram reutilizadas. Nenhuma mudança no Expo, endpoints, autorização, regras de negócio ou banco. Permanecem dependências do domínio com Identity e configurações em outros serviços; isto não constitui isolamento completo de Clean Architecture por assemblies. Verificação: 46 testes específicos, 37 regressões de autenticação e 91 testes simulados do protótipo aprovados. Sem nova migration ou exportação de PDF.


## Chat: contrato interno de interpretação — 05/11/2026

Criado TravelChatInterpretationRequest no domínio: mensagem atual, histórico recente, instante de referência, fuso e indicação de localização disponível. Ainda sem interface, preenchimento no service ou transporte n8n. O futuro adaptador Data deverá projetar o histórico para papel/texto, sem serializar navegações ou coordenadas. Preferências persistidas e saída estruturada continuam pendentes; API pública e frontend preservados.

Validação da entrada de interpretação: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, HTTP, banco ou n8n.


## Chat: saída da interpretação preparada — 05/11/2026

Adicionados TravelChatInterpretationResponse, TravelChatPreferences e TravelChatIntent no domínio, com perguntas e preferências, sem sugestões inventadas de registros. Base/escopo do orçamento e restrição espacial são separados. Ainda sem transporte, validação de saída, persistência/mesclagem de preferências ou conexão ao service. API pública preservada.

Validação dos contratos de saída: build --no-restore com saída isolada aprovado, zero erros e nove avisos de nulabilidade anteriores; git diff --check sem erros. Sem testes automatizados para propriedades sem lógica, teste HTTP, banco ou n8n.

## Escopo vigente da IA: prompt único — 05/11/2026

Por solicitação do usuário, esta primeira versão passa a ser: prompt único → n8n interpreta preferências → API filtra cadastros reais → listas de programações e hosts de gastronomia/comércio para o usuário montar roteiro. Sem localização, proximidade, perguntas/respostas, conversa ou histórico. Esta seção substitui as propostas anteriores para a entrega inicial.

Implementado neste baby step:

- TravelChatMessageDTO e TravelChatMessage contêm somente Text, obrigatório e até 4.000 caracteres na validação Application.
- TravelChatResponseDTO e TravelChatResponse contêm somente Programmings e Hosts; removidos ConversationId, Message e Questions.
- TravelChatMapping converte apenas texto e listas com mappings existentes. AppService mantém Validate → ToModel → service → ToDTO, userId separado e cancelamento.
- TravelChatService mantém IUserService.GetProfileAsync e cancelamento; removidos repositories e chamadas de conversa/histórico. Ainda termina em NotImplementedException, aguardando interpretação e filtros.
- TravelChatInterpretationRequest contém Text, ReferenceTime e TimeZone, sem History ou HasLocation. TravelChatInterpretationResponse contém apenas Preferences. Removidos SearchNearby e RadiusMeters das preferências.
- A mesma action POST /api/TravelChat/Messages mantém autenticação e identificação pelo JWT. Retirado catch específico de conversa indisponível; preservados 400/401. Sem outra action.

Entrada atual planejada:

```json
{ "text": "Quero passear no Recife no sábado e tomar um café" }
```

Saída planejada (listas vazias ilustrativas, não resposta funcional implementada):

```json
{ "programmings": [], "hosts": [] }
```

Dados ausentes não gerarão perguntas: filtros devem usar somente restrições claras/suportadas, sem inventar pessoas, horário, orçamento ou origem. Cidade escrita no prompt pode ser um filtro, sem geolocalização. A política exata para ambiguidades e limites de busca será definida na interpretação/validação, ainda pendentes. Não há cálculo de rota, persistência ou montagem automática de roteiro nesta fase.

Preservados como preparação inativa de evolução: models de conversa/histórico/localização e interfaces de repositories. Não são consumidos pelo fluxo atual e não possuem EF/DI. As verificações temporárias anteriores que dependem dos campos removidos documentam a versão anterior; o harness TravelChatMappingCheck foi atualizado ao escopo vigente.

Protótipo: catálogo real conferido com somente Text obrigatório até 4.000 caracteres e JWT; aviso de implementação pendente atualizado. Exemplo .http também simplificado. Sem formulário de localização, ConversationId ou chat neste fluxo.

Estado: contratos simplificados, sem integração funcional com n8n, filtros coordenados ou DI. Nenhuma alteração em Program.cs, banco, migrations ou PDFs. Próximo baby step: ITravelChatInterpretationService com entrada e saída já preparadas. A montagem do workflow terá assistência quando chegar à integração, em passos pequenos.

Validações executadas: backend compilado sem erros/nove avisos existentes por dotnet run --no-restore de TravelChatMappingCheck; 15 verificações aprovadas de contrato público/domínio, mapping, serialização, validação e AppService com service simulado. node --check em app.js/catalog.mjs, catálogo real e 101 testes do protótipo aprovados com API simulada. Sem teste HTTP da nova action, banco real ou chamada n8n.

## Limpeza da IA simplificada — 05/11/2026

Removidos do código os seis arquivos fora do escopo vigente: TravelChatLocationDTO, TravelChatLocation, TravelChatConversation, TravelChatHistoryMessage (incluindo TravelChatMessageRole), ITravelChatConversationRepository e ITravelChatHistoryMessageRepository. A conferência de referências mostrou apenas dependências entre os próprios arquivos removidos; o fluxo do prompt já estava desacoplado deles.

As menções anteriores a esses tipos como preparação inativa são históricas e estão substituídas por esta remoção. Não há mais models/interfaces de conversa, histórico ou localização específicos da IA. Address.Location e o restante da localização já existente do sistema foram preservados. Mantidos os contratos de interpretação/preferências/intenções necessários à próxima etapa do prompt único, além de controller, DTOs, validação, mapping, AppService e service atuais.

Sem mudança de contrato público, lógica de busca ou registros de DI. A integração n8n e os filtros continuam pendentes. Sem migração, banco, protótipo ou PDF alterados.

Validação da limpeza: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores. Busca C# no backend sem referências aos tipos removidos; git diff --check sem erros. Não foram repetidos testes funcionais: remoção apenas de tipos já desacoplados. Sem HTTP, banco ou n8n.

## IA: unificação da mensagem e entrada de interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatMessage e TravelChatInterpretationRequest. Mantido Domain/Model/TravelChatMessage.cs, agora com Text, ReferenceTime (DateTimeOffset) e TimeZone (string), e removido TravelChatInterpretationRequest.cs. Esse único objeto representará tanto a entrada do service quanto a solicitação interna de interpretação do prompt. Conferência de referências antes da remoção: o request anterior não tinha consumidores C#.

TravelChatMessageDTO continua contendo somente Text; data/fuso não passam a ser responsabilidade do aplicativo. TravelChatMapping preserva a conversão do prompt e o AppService continua chamando o mapping normalmente. O preenchimento pelo servidor de ReferenceTime/TimeZone ainda está pendente da integração com a interpretação, como já estava no objeto removido; não foi escolhido fuso fixo nem inserida configuração implícita neste passo.

Os próximos contratos de interpretação devem receber TravelChatMessage, sem recriar outro request com os mesmos campos. Restam cinco classes de model da IA: TravelChatMessage, TravelChatInterpretationResponse, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. Menções anteriores ao objeto de entrada separado são históricas e substituídas por esta unificação.

Sem alteração de DTO público, rota, autenticação, DI, banco, protótipo ou PDF. A interpretação, filtros e integração n8n continuam pendentes; action ainda não funcional em execução.

Validação da unificação: dotnet run --no-restore de TravelChatMappingCheck compilou o backend sem erros (nove avisos anteriores) e aprovou 15 verificações do fluxo simplificado com service simulado, ajustadas ao model unificado. Busca sem referências C# ao request removido; git diff --check sem erros. Sem HTTP, banco ou n8n.

## IA: preferências como retorno direto da interpretação — 05/11/2026

Por solicitação do usuário, unificados TravelChatInterpretationResponse e TravelChatPreferences. Mantido TravelChatPreferences com todos os campos existentes e removido TravelChatInterpretationResponse, que possuía somente a propriedade Preferences. O contrato futuro de interpretação deverá retornar Task<TravelChatPreferences> diretamente; não será necessário acessar response.Preferences.

Antes da remoção, a busca C# confirmou ausência de consumidores do wrapper. Nenhum campo de preferência foi removido/renomeado, nem foram alterados enums, TravelChatIntent ou mapping da resposta final. Restam quatro classes de model da IA: TravelChatMessage, TravelChatPreferences, TravelChatIntent e TravelChatResponse, além dos dois enums de orçamento. O fluxo planejado passa a ser TravelChatMessage → interpretação → TravelChatPreferences → filtros da API → TravelChatResponse.

TravelChatResponse permanece separado: contém os registros reais encontrados pela API; TravelChatPreferences contém apenas atributos extraídos do prompt. A futura resposta JSON do n8n deverá corresponder diretamente às preferências, sem envelope preferences. Como ainda não existe workflow/cliente HTTP/contrato externo implementado, não houve mudança de integração publicada.

Sem alteração de DTO público, rota, autenticação, AppService, DI, banco, protótipo ou PDF. As menções anteriores ao wrapper são históricas e substituídas por esta decisão. Interpretação n8n/filtros continuam pendentes.

Validação da unificação do retorno: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; busca C# sem referências ao wrapper removido; git diff --check sem erros. Sem testes adicionais para remoção de wrapper não consumido, HTTP, banco ou n8n.

## IA: interface de interpretação do prompt — 05/11/2026

Criada Domain/Interfaces/Service/ITravelChatInterpretationService.cs após pesquisar serviços equivalentes e comparar IGeocodingService/ICompanyRegistrationService. Contém somente:

```csharp
Task<TravelChatPreferences> InterpretAsync(TravelChatMessage message, CancellationToken cancellationToken = default);
```

Recebe diretamente o model unificado da mensagem, com Text, ReferenceTime e TimeZone, e retorna diretamente as preferências. Não recria envelopes de entrada/saída removidos anteriormente. Não recebe userId ou JWT: o service coordenador mantém a verificação de conta por IUserService.GetProfileAsync. Não retorna registros de programação/host, pois esses virão de filtros da API. A interface não depende de n8n/HTTP/configuração na assinatura; implementação do provedor ficará na Data.

Somente contrato neste passo: não criado cliente HTTP, registro DI, prompt de workflow, validação das preferências, preenchimento de data/fuso ou chamada no TravelChatService. A rota continua incompleta. Próximo baby step proposto: injetar e chamar esta interface no TravelChatService, preenchendo a referência temporal pelo servidor e definindo explicitamente a origem do fuso, com interpretação simulada para validação. Filtros e transporte externo continuarão em passos posteriores.

Sem alteração de DTO, mapping, rota, models, banco, protótipo ou PDF.

Validação da interface de interpretação: build --no-restore com saída isolada aprovado, zero erros e nove avisos anteriores de nulabilidade; git diff --check sem erros. Sem testes para interface sem implementação, HTTP, banco ou n8n.

## IA: chamada da interpretação no service — 05/11/2026

TravelChatService agora injeta ITravelChatInterpretationService e IConfiguration, usando o padrão de configuração por construtor já presente em SubscriptionService. Após mensagem não nula, cancelamento e conta disponível por IUserService.GetProfileAsync, chama InterpretAsync com um novo TravelChatMessage: Text preservado, ReferenceTime=DateTimeOffset.UtcNow e TimeZone definido pelo servidor. Datas/fuso recebidos em chamadas internas não são confiados nem alterados no objeto original. CancellationToken é encaminhado e verificado também após a interpretação; erros do intérprete não são mascarados.

Fuso: configuração TravelChat:TimeZone, equivalente à variável TravelChat__TimeZone. Ausência da chave usa America/Recife como padrão inicial explícito do projeto; valor informado é conferido por TimeZoneInfo.FindSystemTimeZoneById no construtor. Não há inferência pelo fuso da máquina ou pela cidade do prompt. O fuso representa a referência temporal usada pelo assistente nesta primeira versão; cenários de outros fusos exigem configuração/definição futura, não localização automática. Nenhum appsettings ou Program.cs foi alterado.

O retorno TravelChatPreferences é recebido, mas sua validação e uso nos filtros continuam pendentes. O fluxo ainda termina em NotImplementedException após a interpretação; não retorna lista vazia como sucesso provisório. Sem implementação n8n na Data/DI, a action permanece indisponível em execução. Nenhuma chamada externa ocorreu.

DTO público continua somente Text, resposta pública continua Programmings/Hosts, e AppService mantém as chamadas de validação/mapping. Sem perguntas, localização ou histórico. Próximo baby step proposto: validar as preferências retornadas antes de convertê-las em filtros, respeitando ausência/ambiguidade de dados sem inventar valores. Transporte HTTP e montagem do workflow serão tratados após as regras de domínio.

Sem alteração de banco, migrations, protótipo ou PDF.

Validação da chamada de interpretação: dotnet run --no-restore de TravelChatInterpretationCheck.cs/.csproj compilou o backend sem erros (nove avisos anteriores) e aprovou 16 verificações com IUserService/intérprete simulados: prompt, UTC gerado no servidor, padrão/configuração de fuso, entrada original preservada, cancelamento, usuário indisponível, mensagem nula, erro do intérprete e fuso inválido. Fluxo válido conferido até o trecho de filtros ainda pendente. git diff --check sem erros. Sem HTTP real, banco ou n8n.

## IA: remoção do fuso nomeado e configuração — 05/11/2026

Por solicitação do usuário, removidos TimeZone de TravelChatMessage, o campo _timeZone, a leitura TravelChat:TimeZone com padrão America/Recife e a chamada TimeZoneInfo.FindSystemTimeZoneById. TravelChatService não recebe mais IConfiguration no construtor. Dependências atuais: IUserService, ITravelChatInterpretationService e ITravelChatPreferencesValidations.

TravelChatMessage contém somente Text e ReferenceTime (DateTimeOffset). O service continua preenchendo ReferenceTime com DateTimeOffset.UtcNow no servidor, portanto o instante enviado usa deslocamento +00:00, sem configuração adicional. DateTimeOffset representa instante/deslocamento; não representa um fuso nomeado nem regras regionais. Não inferir automaticamente o horário local de Recife a partir deste valor UTC. Interpretação de datas relativas deve usar a referência explícita e o contrato que será montado no workflow, sem prometer conversão regional não implementada.

O DTO público permanece somente Text. Mapping, AppService, verificação de usuário por GetProfileAsync e validação de preferências preservados. Não foram modificados appsettings, Program.cs ou configuração de outros serviços. A variável TravelChat__TimeZone não é mais lida nem necessária; instruções anteriores sobre ela são históricas, substituídas por esta remoção.

Sem alteração de rota, resposta pública, banco, protótipo ou PDF. Interpretação concreta, filtros e DI ainda pendentes; o service continua terminando em NotImplementedException após validar preferências. Harnesses temporários de interpretação e mapping foram ajustados ao contrato sem TimeZone.

Validação final da simplificação temporal: backend compilado sem erros (nove avisos anteriores) pelos harnesses --no-restore. TravelChatInterpretationCheck aprovou 15 verificações com dependências simuladas, cobrindo referência UTC do servidor sem alterar entrada, cancelamento, identidade e validação; TravelChatPreferencesCheck aprovou 42 verificações com catálogo simulado após compatibilização do model sem IncludeProgrammings. Busca confirmou ausência de TimeZone/IConfiguration nos tipos alterados; git diff --check sem erros. Primeira compilação falhou pela referência ao campo já ausente, corrigida antes destes resultados. Sem HTTP, banco ou n8n.

## IA: busca de hosts e resposta combinada — 05/11/2026

TravelChatService agora injeta IHostService e chama FilterHostsAsync após o filtro de programações. Reutiliza IHostService.FilterAsync(HostFilter) existente: consulta somente intenções com HostTypes informados, transfere City e tipos distintos, mantendo Take=10/Skip=0. Não impõe HasProgrammings: host pode ser sugerido sem evento. Não transforma Description em Name, pois uma intenção como “tomar café” não é nome de estabelecimento. Sem tipos de host extraídos, não faz busca genérica de hosts.

Validação de preferências continua restringindo tipos a Gastronomy/Business. HostFilter existente já consulta hosts ativos. O helper remove duplicados por Id, ordena por Name/Id e limita o conjunto a dez hosts. Programações continuam com categorias, deduplicação, StartDate/Id e limite dez. Não houve mudança de query/repository/filtro público.

Retirado NotImplementedException de SendMessageAsync: após conta ativa, interpretação, validação e ambas as buscas, retorna TravelChatResponse com Programmings e Hosts. AppService usa TravelChatMapping.ToDTO para converter ambas as listas pelos mappings existentes. Nenhuma montagem/persistência automática de roteiro é executada; são opções para seleção posterior.

Limites desta entrega: HostFilter não contém gasto nem agenda, então preço, data/horário de funcionamento e especialidade gastronômica (por exemplo cafeteria) não são garantidos na lista de hosts. Não foi feita filtragem depois da paginação para simular suporte inexistente. Pedido de café mapeado para Gastronomy pode incluir outros estabelecimentos desse tipo. Categorias de programação não são atribuídas a hosts. Nome/cidade/tipo são campos existentes; nesta feature somente cidade/tipo são usados. Orçamento total/grupo e custo combinado continuam sem garantia. Sem localização, perguntas ou histórico.

Cancelamento conferido antes/depois das consultas e entre as etapas; contratos existentes de FilterAsync permanecem sem token, portanto não cancelam o SQL em andamento. Falha de uma busca é propagada, não convertida em resposta parcial de sucesso. As duas listas vazias são resultado válido quando não houver registros ou intenções aplicáveis.

Estado: fluxo de domínio/Application verificado com interpretação/filtros simulados; ainda não há implementação HTTP do n8n nem registros da feature na DI. Por isso a rota real continua indisponível em execução. Não afirmar que a API foi executada ou que houve integração real do workflow.

Protótipo: resposta combinada agora tem duas seções, com cartões existentes de programação/host, preservando seleção/reuso de IDs dos cartões e JSON bruto. Mensagens separadas para listas vazias; aviso do formulário explica integração pendente e limites do filtro de hosts. Exemplo .http atualizado para retirar filtros da lista de etapas ainda ausentes.

Próximo baby step: fechar o JSON de entrada/saída do workflow com os models atuais antes de implementar o cliente n8n na Data. Nenhuma alteração em Program.cs, banco, migrations ou PDFs.

Validações executadas: TravelChatResultsCheck.cs/.csproj compilou backend sem erros/nove avisos anteriores e aprovou 27 verificações com service/AppService/mappings/validações reais e intérprete/filtros/catálogo simulados: listas combinadas, cidade/tipos, intenções sem busca genérica, deduplicação/ordem/limites, retorno via mapping, rejeição de produtor, usuário indisponível, falhas sem resposta parcial e cancelamento. node --check em app.js/catalog.mjs aprovados; 103 testes do protótipo aprovados com API simulada, incluindo duas novas verificações da exibição combinada e listas vazias. Sem HTTP real da action, banco ou n8n.

## Hosts: filtros de preço/funcionamento e validação separada — 05/11/2026

GET /api/Host/HostFilter mantém autenticação, paginação e resposta List<HostResponseDTO>. HostFilterDTO, HostFilter e HostFilterMapping agora incluem:

| Campo | Tipo/uso |
|---|---|
| MinPrice / MaxPrice | decimal?; limites opcionais de faixa estimada de gasto por pessoa |
| DayOfWeek | DayOfWeek?; 0=domingo até 6=sábado |
| StartTime / EndTime | TimeOnly?; intervalo opcional em horário semanal do estabelecimento |
| EndsNextDay | bool, padrão false; término do intervalo solicitado no dia seguinte |

Preço usa interseção inclusiva: host.MaxPrice >= MinPrice solicitado e host.MinPrice <= MaxPrice solicitado. Limite ausente não restringe; faixa desconhecida não é tratada como zero/gratuidade e não satisfaz comparação com limite conhecido. Trata-se de estimativa por pessoa, não garantia de valor exato ou de toda a faixa caber no orçamento.

Funcionamento usa qualquer sobreposição positiva, conforme escolha explícita do usuário. Apenas DayOfWeek busca qualquer abertura no dia, incluindo cauda de intervalo iniciado no dia anterior. Com período, dia/início/término são exigidos; deve durar mais de zero e até 24 horas. Horários iguais exigem EndsNextDay=true (24h). Tocar exatamente na abertura/fechamento sem tempo em comum não conta. A consulta considera dias/períodos ativos da agenda (IsClosed=false), múltiplos intervalos, madrugada e semana cíclica (sábado/domingo e domingo/segunda). Agenda ausente não significa aberto. Dia marcado fechado não elimina a cauda de um intervalo válido iniciado no dia anterior. Sem filtro de agenda, hosts sem agenda continuam elegíveis.

Repository aplica preços e Any de dias/períodos diretamente no IQueryable, antes de OrderBy/Skip/Take. Não há carregamento de toda a tabela ou filtro após paginação. Busca preserva nome, cidade, tipos, HasProgrammings e atividade do host. Não altera entities Hosts/HostOpeningDay/HostOpeningPeriod, schema ou migrações: usa campos já existentes.

Por solicitação do usuário, todas as validações do filtro (nulo, Take/Skip, Types, preços não negativos/duas casas/ordem dos limites, dia da semana, campos necessários e duração) foram extraídas para Domain/Validations/Validations/HostFilterValidations, com IHostFilterValidations. HostService recebe a interface pelo construtor e executa Validate(filter) antes do repository. Mensagens/exceções preservadas. Registro scoped acrescentado em Presentation/Program.cs ao lado das validações existentes; alteração necessária à injeção desta funcionalidade, não para suportar o protótipo. Controller continua traduzindo ArgumentException para ProblemDetails 400; DataAnnotations continuam as restrições estruturais no DTO.

Integração com IA: quando VisitDate existir, TravelChatService passa seu DayOfWeek; com período completo confirmado, passa início/fim/virada. Orçamento confirmado por pessoa/por parada vira MaxPrice; não inventa MinPrice, que não existe nas preferências atuais. Orçamento total/grupo permanece sem conversão. Sem data, não aplica horário semanal isolado. Os horários do filtro são horários da agenda, sem novo fuso nomeado ou conversão automática de localização. Client n8n/DI da IA ainda pendentes; a busca pública de hosts reutiliza os services existentes. Especialidade como cafeteria ainda não é distinguida por tipo de host.

Protótipo: catálogo reconhece preços numéricos, horários e seleção de dia da semana com domingo=0; formulários/query mantêm JWT e filtros opcionais, sem herdar preços de um host selecionado. Ajuda explica sobreposição e preços estimados. Exemplo .http atualizado com período normal, madrugada, dia inteiro e entrada inválida. Mudanças de catálogo também tipam DayOfWeek em DTOs já existentes; testes de regressão preservados.

Sem alteração de banco principal, entidades persistidas, configurações EF, migrations, CORS, emissão JWT ou PDF. A API não foi reiniciada.

Validação concluída dos filtros e extração: build do backend aprovado sem erros/nove avisos anteriores; HostFilterHoursCheck executou 197 verificações com EF/PostgreSQL reais em banco local descartável (intervalos/limites, múltiplos períodos, virada de dia/semana, agenda ausente/fechada, faixa monetária, legado nulo, paginação posterior aos filtros, mapping e rejeições de validação). Inclui 147 comparações de intervalos semanais contra um oráculo independente e sete consultas por dia sem período. Banco descartável removido em finally; banco principal preservado. A primeira conexão tentou porta 5434 do Development e foi recusada; teste passou com configuração base da porta 5432 já ativa, sem alteração de config/container/volume. Harness emitiu um aviso CS8602 próprio, separado dos nove avisos do backend.

TravelChatResultsCheck executou 29 verificações simuladas do fluxo combinado, incluindo transferência de dia/período/virada/MaxPrice para HostFilter. node --check de app.js/catalog.mjs e arquivos de teste aprovado; catálogo real conferido; 105 testes do protótipo aprovados com API simulada. Primeira execução da nova fixture de UI falhou por aguardar incorretamente a sincronização inicial; fixture corrigida antes do resultado final. Sem teste HTTP real, API reiniciada, n8n ou PDF. Os exemplos .http foram atualizados, mas não executados contra dados reais. git diff --check sem erros.

## IA: catálogo real de categorias na interpretação — 05/11/2026

TravelChatMessage agora possui Categories (List<Category>) além de Text/ReferenceTime. Reaproveita Category já existente, sem novo model/envelope. TravelChatService injeta ICategoryService e, após verificar conta ativa por GetProfileAsync, chama GetallCategories. Monta o objeto enviado a InterpretAsync com somente categorias IsActive=true, ordenadas por Id, preservando IDs e nomes reais. Não confia em catálogo informado no objeto de entrada; o DTO público continua apenas Text e o catálogo é obtido pelo servidor.

Objetivo: permitir que o workflow associe interesses do prompt a IDs existentes, pois o filtro de programações desta versão depende de CategoriesId e não usa Description como busca textual. Nomes de categoria são contexto de classificação, não instruções. O cliente n8n deverá receber o catálogo no JSON da mensagem sem JWT, UserId, localização ou histórico.

Validação de preferências continua reutilizando GetallCategories para conferir existência/atividade dos IDs retornados, inclusive eventual mudança após a interpretação. Não foi criada função de consulta duplicada ou mecanismo de cache. Como o contrato existente não recebe CancellationToken, cancelamento é verificado antes/depois da consulta; uma falha no catálogo impede interpretação/filtros e é propagada.

Catálogo vazio será enviado como lista vazia; a IA não deverá inventar IDs. Busca de programações sem categorias continuará sem consulta irrestrita; hosts continuam orientados por tipos existentes. Regras exatas do JSON/prompt e classificação do n8n serão definidas no próximo baby step, antes de criar o transporte na Data. Ainda não há cliente n8n nem DI da feature, portanto o endpoint não está funcional em execução.

Sem alteração de DTO público, rota, mapping de prompt/resultados, entidades Category, schema, banco, protótipo ou PDF.

Validação do catálogo: TravelChatResultsCheck --no-restore compilou o backend sem erros/nove avisos anteriores e aprovou 37 verificações com validação/mappings/AppService/service reais e dependências simuladas. Incluem categorias ativas ordenadas com IDs/nomes preservados, exclusão de inativas, nenhuma consulta para usuário indisponível, falha/cancelamento do catálogo impedindo interpretação e filtros, além das regressões de resultados/agenda/preço. git diff --check sem erros. Sem HTTP, banco ou n8n; protótipo não alterado pois contrato público permaneceu igual.

## IA: contrato JSON e prompt do workflow preparados — 05/11/2026

Criados arquivos reutilizáveis, sem alteração de código funcional ou criação de workflow:

| Arquivo em docs/ | Uso |
|---|---|
| n8n-travelchat-entrada.schema.json | JSON Schema da mensagem text/referenceTime/categories enviada pela API |
| n8n-travelchat-saida.schema.json | JSON Schema direto de TravelChatPreferences para o Structured Output Parser |
| n8n-travelchat-exemplos.json | Sete pares de entrada/saída esperada com catálogo fictício e ambiguidades |
| n8n-travelchat-prompt.md | Prompt System para copiar, expressão de entrada, esqueleto futuro e limites |

Contrato externo proposto: camelCase, único objeto JSON, sem envelopes preferences/output/data. Entrada segue TravelChatMessage unificado; saída segue TravelChatPreferences diretamente. Campos desconhecidos são null e listas não são nulas; todas as chaves de saída são exigidas pelo schema. Enums são números: budgetBasis 0=pessoa/1=grupo, budgetScope 0=roteiro/1=parada, hostTypes somente 1=gastronomia/2=comércio. Data AAAA-MM-DD e horário HH:mm:ss. Catálogo limita IDs válidos para aquela chamada; schema não faz sozinho a associação dinâmica ao catálogo ou validação de regra cruzada.

Prompt não permite perguntas, memória, localização ou geração de registros fictícios. Mantém desconhecidos sem inferir pessoas, orçamento por parada, origem ou horários de manhã/tarde. Data relativa usa explicitamente a referência UTC atual. Faixa mínima de gasto ainda não tem campo em TravelChatPreferences, apesar de existir no filtro público de host; não acrescenta campo externo inexistente para simular suporte. Teto só será usado pela API quando base/escopo forem compatíveis. Sem categoria segura, não inventa ID e a busca de programações continua sem consulta irrestrita.

Esqueleto para o próximo passo: Webhook → Basic LLM Chain, com Chat Model e Structured Output Parser → Respond to Webhook. Configuração detalhada, credenciais, segredo do webhook, tratamento de erros, timeout, validação efetiva no workflow e cliente HTTP da Data continuam pendentes. Modelo/provedor ainda não selecionado. Documentação oficial consultada e vinculada no arquivo do prompt; schemas manuais não usam $ref. Nenhum workflow foi importado/criado/ativado e nenhuma IA ou serviço pago foi chamado.

Validação de schemas executada com AJV 8.20.0 e ajv-formats já instalados no container n8n: 50 verificações em memória aprovadas, incluindo sete exemplos, envelopes/propriedades extras/tipos/enums/datas inválidos, catálogo e valores desconhecidos. Usado multipleOfPrecision=8 no harness para comparação decimal numérica. Isso valida JSON Schema, não comprova comportamento do parser/LLM num workflow real. O container foi utilizado somente para executar a biblioteca de validação em memória; sem acessar credenciais ou alterar estado de workflows.

Nenhuma alteração de DTO público, rota, models, service, DI, banco, protótipo ou PDF. Próximo baby step: montar apenas o nó Webhook e conferir sua entrada; não ativar o fluxo completo como se a interpretação já estivesse pronta.

Complemento da validação do contrato: TravelChatContractCheck.cs/.csproj executado com --no-restore aprovou 41 verificações de compatibilidade entre os schemas e propriedades dos models, desserialização dos sete exemplos, referência UTC, serialização camelCase, datas/horários/decimal preservados e validação de preferências com catálogo simulado. Inclui rejeição de ID inventado, orçamento contraditório e envelope inesperado no harness estrito. Não significa que a futura implementação Data já aplica esse modo estrito: cliente ainda não existe. Backend/harness compilados com êxito. Sem banco, workflow, LLM ou PDF. git diff --check sem erros.

## IA: cliente HTTP n8n implementado na Data — 06/11/2026

Criado Data/Services/N8nTravelChatInterpretationService.cs implementando ITravelChatInterpretationService, seguindo os serviços externos ViaCep/MinhaReceita e o tratamento de prazo do Geoapify. Recebe somente HttpClient; BaseAddress deverá ser a URL completa do Webhook, configurada no registro do cliente. Sem URL fixa, credenciais versionadas, novo model ou outro endpoint.

InterpretAsync envia POST application/json com TravelChatMessage em camelCase (text, referenceTime, categories) e Accept application/json. Não recebe HttpContext/JWT/userId nem encaminha o token do usuário. Usa prazo total de 30 segundos por chamada, incluindo leitura do corpo, e limite de 64 KiB de resposta (ContentLength conhecido e buffering limitado quando não houver tamanho). Sem retry automático, inclusive em HTTP 429, evitando repetir chamadas ao modelo.

Resposta esperada é diretamente TravelChatPreferences. JSON inválido, raiz não objeto, envelope output/preferences, resposta inicial Workflow got started, campos ausentes ou repetidos, arrays nulos, objetos de intenção incompletos, propriedades extras e números enviados como string são rejeitados. Todas as chaves do contrato são exigidas; campos escalares desconhecidos permanecem null. Nomes camelCase são conferidos sem correspondência indiferente a maiúsculas. Deserialize usa JsonNumberHandling.Strict e JsonUnmappedMemberHandling.Disallow. Regras cruzadas e catálogo permanecem na ITravelChatPreferencesValidations existente, sem duplicação na Data.

Criada TravelChatInterpretationException no domínio, no padrão de GeocodingException, com ServiceUnavailable. TravelChatController traduz resposta inválida para ProblemDetails 502 e indisponibilidade para 503. Falha HTTP não-2xx/rede/stream, configuração ausente ou timeout viram indisponibilidade; corpo inválido ou acima do limite vira resposta inválida. Mensagens fixas não expõem resposta bruta, URL, prompt ou segredo. Cancelamento solicitado pelo chamador continua OperationCanceledException, sem ser convertido em timeout 503.

TravelChatService agora converte ArgumentException/ArgumentNullException da validação das preferências retornadas em TravelChatInterpretationException de resposta inválida (502). Isso impede atribuir ao usuário um erro de dados produzidos pela interpretação, como ID de categoria inventado. A validação do DTO recebido pelo aplicativo continua 400; autenticação/conta permanecem 401. Falhas não relacionadas do catálogo/banco não foram convertidas em erros do n8n indiscriminadamente. Mapping da Application permanece no fluxo Validate → ToModel → service → ToDTO.

Estado: cliente concluído e testado com HttpMessageHandler simulado, ainda sem registro de DI/URL/configuração do cliente. A action real permanece indisponível enquanto não forem registrados AppService, service, mappings, validações e cliente da feature. Nenhuma chamada de API para o n8n real foi feita nesta etapa e nenhuma credencial Gemini foi usada. O usuário já demonstrou manualmente que seu Webhook retorna um objeto de preferências sem envelope; esse relato não é um teste automatizado de integração API/n8n.

No próximo baby step, registrar o HttpClient/dependências e configurar URL completa, prazo/headers/autenticação de serviço, bloqueio de redirecionamentos e remoção de logs do cliente conforme os provedores existentes. O handler de redirecionamento ainda não foi configurado: não afirmar que há garantia de bloqueio apenas porque o cliente trata um status 3xx recebido. A URL de teste do n8n depende do listener ativo; produção dependerá do workflow publicado. O proxy do protótipo tem timeout próprio de 20 segundos, menor que o prazo máximo de 30 do cliente: alinhar os limites antes do teste integrado, sem apresentar timeout local como garantia de encerramento da chamada no servidor.

Protótipo: aviso de implementação atualizado para cliente pronto/DI e URL pendentes. Tratamento genérico de ProblemDetails preserva 502/503 como respostas da API, diferenciado de falhas locais do proxy. Dois novos testes de transporte cobrem esses status. Exemplo .http atualizado quanto às pendências; DTOs e caminho POST /api/TravelChat/Messages preservados.

Validações realizadas: build isolado --no-restore aprovado com zero erros e nove avisos de nulabilidade anteriores. N8nClientCheck.cs/.csproj aprovou 198 verificações com HttpMessageHandler, usuário, catálogo e filtros simulados, incluindo sete exemplos, POST/URL/JSON sem JWT, chaves/tipos/datas, corpo com e sem ContentLength, limite de tamanho, falhas sem retry, cancelamento, preferência inválida impedindo filtros e mapeamento de 502/503 pela action com UserManager simulado. Primeira execução do harness falhou numa asserção de privacidade para corpo vazio (toda string contém string vazia); fixture corrigida, sem alterar a regra de produção por essa falha.

node --check em app.js/catalog.mjs/proxy.test.mjs aprovado; 107 testes do protótipo aprovados com API simulada. Primeira execução dos dois novos testes usou objeto onde o proxy exige corpo JSON como string; fixture corrigida antes do resultado final. Sem teste de timeout real de 30 segundos, teste HTTP do middleware JWT, banco, LLM ou workflow reais. Sem Program.cs/DI, migrations ou PDF alterados neste passo.

## IA: DI e URL do Webhook configuradas — 06/11/2026

Registradas em Presentation/Program.cs as dependências da única action SendMessage: ITravelChatAppService/TravelChatAppService, ITravelChatService/TravelChatService, ITravelChatMapping/TravelChatMapping, IValidation<TravelChatMessageDTO>/TravelChatMessageValidation e ITravelChatPreferencesValidations/TravelChatPreferencesValidations como scoped. Interfaces de usuários, catálogo, hosts, programações e mappings existentes continuam reutilizadas, sem novos repositories ou estilos de DI.

ITravelChatInterpretationService agora usa AddHttpClient com N8nTravelChatInterpretationService. A URL completa é lida de N8n:TravelChatWebhookUrl, equivalente à variável N8n__TravelChatWebhookUrl. Somente endereço absoluto HTTP/HTTPS sem credenciais embutidas ou fragmento é configurado. Ausência/valor inválido deixa BaseAddress vazio, permitindo ao cliente responder com indisponibilidade 503 em vez de quebrar a inicialização de toda a API. Timeout do HttpClient=30s, AllowAutoRedirect=false e RemoveAllLoggers(), seguindo o padrão do cliente Geoapify. O cliente mantém seu próprio prazo total incluindo leitura do corpo.

Perfis http/https de Properties/launchSettings.json agora definem N8n__TravelChatWebhookUrl=http://localhost:5678/webhook-test/perambulando-travelchat, URL de teste já fornecida/testada manualmente pelo usuário. Essa configuração é local ao lançamento por esses perfis; não estabelece uma URL padrão em outros ambientes e não altera appsettings, banco ou containers. Para API em container, a URL deve ser configurada conforme a rede real; localhost do container não aponta ao Windows/n8n externo. Endpoint de produção requer escolha/configuração própria e workflow publicado; não foi publicado nesta etapa.

Após reiniciar a API, o fluxo passa a poder resolver suas dependências. O Webhook de teste precisa estar em Listen for test event antes de cada chamada de integração. Não usar o ID fictício 101 no corpo da API: o aplicativo envia somente Text, e o catálogo real é preenchido pelo servidor. O usuário já demonstrou uma resposta manual n8n de preferências; não foi feita chamada automática ao modelo/Gemini ou teste API→n8n real neste passo. JWT da API continua necessário; nenhum token é encaminhado ao n8n. O Webhook local permanece com a autenticação configurada manualmente pelo usuário; credencial Gemini fica no n8n. Não foram criadas credenciais/chaves novas.

Protótipo: timeout padrão do proxy alterado de 20s para 40s, mensagem de timeout usa o valor efetivamente configurado, espera principal do navegador alterada de 25s para 45s e ajuda de envio indica 40s. Checagens rápidas/interações/autocompletes mantêm seus prazos próprios. Aviso da action agora informa DI/URL de teste configuradas e necessidade de reiniciar API/ativar listener. Se o servidor do protótipo já estava executando, também precisa ser reiniciado para carregar a mudança de server.mjs; só recarregar a página não altera o timeout do processo existente.

Exemplo .http atualizado, sem mudar DTO, rota, autorização, respostas, classes de domínio ou regras de filtro. Program.cs foi alterado para DI/configuração necessárias à feature, não para contornar o protótipo; CORS, migrations e banco preservados. A API/servidor do protótipo não foram reiniciados automaticamente, evitando executar as migrations de inicialização ou interferir no ambiente aberto pelo usuário.

Validações: build --no-restore com saída isolada aprovado com zero erros e nove avisos anteriores. N8nDiCheck.cs/.csproj executou o bloco efetivo de registros TravelChat extraído do Program.cs (sem iniciar o Program/host) e aprovou 38 verificações com HTTP, usuário, catálogo e filtros simulados: resolução/scopes das dependências, fluxo AppService/mappings/cliente, URL completa, timeout 30s, ausência de JWT, categorias reais, redirecionamento bloqueado, logs HTTP suprimidos, configuração inválida virando 503 sem envio e ambos os perfis locais. Primeira compilação do harness tinha conflito de nome na classe de logger; fixture corrigida, sem alteração de produção por esse erro.

node --check em app.js/server.mjs/catalog.mjs aprovado; 107 testes do protótipo aprovados com API simulada, inclusive timeout sobrescrito nos testes. Sem espera real de 30/40/45 segundos, teste HTTP do middleware JWT, banco, n8n/LLM reais ou PDF. Próximo baby step: reiniciar o ambiente pelo usuário e testar uma única chamada autenticada da API com o Webhook ouvindo, conferindo categoria real e retorno combinado antes de avançar.

## Execução integrada em containers — 17/11/2026

O Compose da raiz agora representa o fluxo completo `frontend -> backend -> database`. O navegador acessa o Expo Web em `localhost:8081`; o frontend usa a URL pública `http://localhost:5014` para a API; dentro da rede do Compose, o backend acessa PostgreSQL pelo nome de serviço `database` e porta 5432. A porta 5434 continua sendo apenas a publicação do banco para o Windows.

Backend e frontend possuem Dockerfiles próprios fora do código funcional da API. O backend é publicado em imagem .NET 10 e o frontend inicia o Metro/Expo Web em CI na porta 8081. O banco, seu volume externo e os dados existentes foram preservados. O ambiente do backend no container é Production para impedir a aplicação automática de migrations enquanto os CNPJs duplicados do banco não forem auditados. Isso também significa que o OpenAPI condicionado a Development não é exposto nessa execução.

Validação em 17/11/2026: os três serviços permaneceram ativos, a rota pública de categorias e a página inicial do frontend responderam HTTP 200. Não houve alteração de rota, DTO, regra de negócio, schema, migration ou arquivo da pasta `backend/`; o protótipo externo e os PDFs não foram alterados.

## Padronização visual e navegação do Painel — 17/11/2026

A rota `/painel` foi alinhada às telas de criação de evento e gestão de programações. O shell mobile passou a compartilhar largura, bordas e contenção visual; cabeçalho, espaçamentos, tipografia, cartões, botões e estados pressionados seguem os mesmos valores usados no restante do frontend.

A barra inferior agora reutiliza o comportamento visual das demais páginas: a aba Painel apresenta fundo laranja claro, ícone e rótulo laranja, além de `accessibilityState.selected=true`; o botão central Criar evento permanece azul enquanto outra página está ativa. Meus eventos, Criar evento, perfil e Comércio mantêm navegação pelo Expo Router. Explorar continua somente visual, pois ainda não há rota implementada.

Validações: ESLint em `src` e TypeScript com `--noEmit` aprovados sem erros; imagem Docker do frontend reconstruída; somente o container frontend foi recriado; `GET http://localhost:8081/painel` respondeu HTTP 200. Backend, banco, contratos HTTP, protótipo externo e PDFs foram preservados.

### Distribuição dos benefícios demonstrativos — 17/11/2026

O benefício “Resumo de visitas e cliques” foi retirado do plano gratuito Essencial e passou a ser exibido explicitamente nos planos pagos Impulso e Destaque. A mudança afeta somente a apresentação demonstrativa do frontend; não cria cobrança, assinatura ou regra de autorização no backend.

## Entrada simplificada de data e horário — 17/11/2026

O cartão “Quando e quanto” do cadastro e da edição de programação passou a aplicar máscaras durante a digitação. Datas aceitam no máximo oito algarismos e inserem automaticamente as barras no formato `dd/mm/aaaa` (2 dígitos para dia, 2 para mês e 4 para ano); horários aceitam no máximo quatro algarismos e inserem `:` no formato `HH:mm`.

Cada campo possui um botão integrado. O botão de data usa um ícone próprio de calendário, com cabeçalho e grade de dias nas cores do aplicativo, em vez do símbolo quadrado genérico. Os campos de data expandem um calendário mensal dentro do mesmo cartão, com navegação entre meses e seleção direta do dia; a seleção preenche o campo e recolhe o calendário. Os campos de horário expandem um painel que separa a escolha das 24 horas e dos minutos `00`, `15`, `30` e `45`, com confirmação explícita. Minutos diferentes continuam disponíveis pela digitação mascarada.

Os seletores mantêm os valores textuais já consumidos por `parseLocalDateTime`; payload, formato ISO enviado à API e validações de início futuro/término posterior não mudaram. Os controles expõem estados expandido/selecionado para acessibilidade. ESLint e TypeScript foram aprovados, a imagem do frontend foi reconstruída e a rota de criação respondeu HTTP 200 no Docker. Nenhum arquivo do backend, contrato, banco, protótipo externo ou PDF foi alterado.

## US16 — Explorar programações — 23/11/2026

A nova rota `/explorar` implementa a experiência inicial do usuário comum com o cabeçalho e a paleta vigentes do Perambulando. `GET /api/Category/GetallCategories` alimenta “Qual é a sua vibe?” com até seis categorias ativas registradas no banco; tocar novamente na categoria selecionada remove o filtro. A busca textual e a categoria escolhida são enviadas a `GET /api/Programming/Filter`, com `take=20` e `skip=0`.

Os cards exibem imagem ou fallback da marca, data, preço/gratuidade, endereço e até duas categorias associadas à programação pelo host. Estados de carregamento, ausência de resultados, erro da API e falha de imagem foram tratados. A barra inferior da página segue o fluxo do usuário comum e destaca Explorar; Buscar foca o campo e Perfil abre a rota existente. Os atalhos Explorar das telas de gestão também passaram a abrir a nova rota.

Validações realizadas: ESLint nos quatro arquivos envolvidos, TypeScript com `--noEmit` e `git diff --check`, todos sem erros. A implementação alterou somente o frontend e a documentação; backend, endpoints, contratos, banco, protótipo externo e PDFs foram preservados. Perto de você e Favoritos permanecem visuais/inativos até suas histórias específicas.

## Detalhes da programação e proximidade — 23/11/2026

Os cards de `/explorar` passaram a abrir `/programacao/[programmingId]`. A tela consulta o endpoint público `GET /api/Programming/Details/{id}` e apresenta, na ordem vertical da experiência mobile: imagem e identificação da programação, data e endereço, descrição/categorias, mapa, locais próximos, host responsável e ação de ingresso. Compartilhamento, favorito e interações reutilizam os contratos existentes; favoritos vinculados à conta dependem do JWT da sessão.

Como o `AddressDetailsDTO` atual não expõe as coordenadas persistidas, o mapa do frontend geocodifica os dados registrados pelo host, guarda o resultado na sessão e exibe um mapa interativo do OpenStreetMap com marcador. Para evitar falha por complemento ou bairro divergente, a resolução tenta progressivamente logradouro/número/cidade/CEP, CEP, logradouro/número/cidade e logradouro/cidade, respeitando intervalo entre tentativas e sem recuar para o centro genérico da cidade. Também é disponibilizado um link de pesquisa direta no Google Maps. Falha ou ausência de correspondência possui estado explícito; nenhuma chave de geocodificação do backend é enviada ao navegador.

Em 24/11/2026, a seção visual foi renomeada de “Eventos próximos” para “Locais próximos” e passou a consumir o `GET /api/Nearby/GetNearMe` público usando a coordenada resolvida do evento, raio de 20 km e paginação existente. O frontend exclui a própria programação, mantém os cinco primeiros resultados pela ordem de `DistanceMeters` e aceita tanto `Programming` quanto `Host`. Para programações, consulta os detalhes públicos e mostra a primeira categoria; hosts recebem o rótulo “Estabelecimento”. Cards de programação abrem seus detalhes e cards de host direcionam à listagem de Comércio.

Validações: ESLint nos dois arquivos da jornada e TypeScript com `--noEmit` aprovados. Nenhum arquivo de backend, contrato, banco, protótipo externo ou PDF foi alterado. A correspondência visual do mapa depende da qualidade do endereço cadastrado e do serviço cartográfico; expor diretamente a coordenada persistida exigiria futura ampliação do DTO no backend, fora do escopo desta entrega.

## Localização do usuário e Perto de você — 23/11/2026

Criada a rota `/perto_de_voce`, acessível pela aba correspondente de Explorar e dos detalhes da programação. A permissão de localização somente é solicitada após a ação explícita “Usar minha localização”. O módulo `expo-location` atende Web, Android e iOS; o `app.json` declara a explicação exibida pelo sistema para o acesso durante o uso.

Depois da permissão, latitude e longitude atuais são enviadas somente como query string autenticada para `GET /api/Nearby/GetNearMe`. A tela permite as quatro faixas já aceitas pelo backend (até 2 km, 2–5 km, 5–10 km e 10–20 km), conserva a ordenação por `DistanceMeters`, pagina de dez em dez e diferencia programações de estabelecimentos. Programções abrem seus detalhes; o contrato atual não fornece uma rota de detalhe de host ao item de proximidade, portanto o card de estabelecimento permanece informativo.

Foram tratados: sessão ausente, serviço de localização desligado, permissão recusada, consulta em andamento, lista vazia e falha da API. As coordenadas não são gravadas no armazenamento do navegador pelo frontend. A área “Locais próximos” dentro de uma programação usa a coordenada resolvida do próprio evento, conforme seu objetivo distinto.

Validações: ESLint e TypeScript aprovados. Nenhum arquivo do backend, banco, endpoint ou PDF foi alterado. Na Web em produção, o navegador exige contexto seguro HTTPS para liberar geolocalização; `localhost` continua apropriado para desenvolvimento.

## Estabelecimentos na página Explorar — 23/11/2026

`/explorar` passou a consultar publicamente `GET /api/Host/HostFilter?Types=1&Types=2&City=Recife&Take=100&Skip=0` e exibir Gastronomia e Comércio em uma lista horizontal com imagem, tipo, nome e endereço. O limite 100 evita ocultar os oito hosts demonstrativos quando coexistirem com cadastros anteriores; a API retornou 13 no ambiente atual. Produtores continuam representados por suas programações, conforme a regra existente do filtro de hosts.

O endpoint `HostFilter` foi tornado anônimo somente para essa leitura de descoberta. Operações de gestão continuam protegidas. ESLint, TypeScript, build isolado e consulta HTTP 200 foram aprovados. PDFs preservados.

## Favoritos anônimos em Explorar — 23/11/2026

Os cards de programação e de estabelecimento em `/explorar` passaram a exibir o mesmo controle de favorito. O coração é apenas contornado quando o item não está salvo e fica preenchido em vermelho após o toque; tocar novamente remove o item. A ação interrompe a propagação do card, portanto favoritar uma programação não abre seus detalhes acidentalmente.

Esta etapa atende também visitantes sem login. As chaves `programming:{id}` e `host:{id}` são preservadas no armazenamento local do navegador em `perambulando.exploreFavorites`, sem enviar dados pessoais ou exigir JWT. Quando ao menos um dos itens salvos ainda existe nas listagens públicas carregadas, a página apresenta a seção horizontal “Seus favoritos”. A aba Favoritos da barra inferior rola a tela até essa seção; ao remover o último item, a seção volta a ficar oculta.

A persistência anônima é local ao navegador/dispositivo e não sincroniza favoritos entre dispositivos ou com a conta autenticada. Essa sincronização poderá reutilizar posteriormente os endpoints autenticados de favoritos, mas não foi presumida nesta entrega. ESLint e TypeScript com `--noEmit` foram aprovados. Nenhum arquivo do backend, endpoint, contrato, banco, protótipo externo ou PDF foi alterado por esta funcionalidade.
## Mapa de proximidade público — 24/11/2026

A rota `/perto_de_voce` deixou de substituir os resultados por uma lista vertical e agora apresenta um mapa OpenStreetMap/Leaflet com a posição autorizada do dispositivo e os resultados retornados por `Nearby/GetNearMe`. Cada resultado recebe um marcador com sua imagem pública acima do pino; quando não existe imagem, usa a inicial do nome. O enquadramento inclui o usuário e os itens carregados.

Ao selecionar um marcador, o iframe envia somente a chave pública do item ao componente React. Um cartão sobreposto no canto inferior do mapa apresenta imagem, tipo, nome, descrição, endereço e distância. O botão `×` fecha o cartão e devolve a área completa ao mapa; programações oferecem acesso à tela de detalhes. A paginação continua permitindo adicionar resultados ao mapa.

O frontend solicita a localização somente após a ação explícita do visitante. `Authorization` é enviado quando existe JWT na sessão e omitido caso contrário. A API tornou apenas `GetNearMe` anônimo e ampliou seu item de resposta com descrição/endereço; banco, migrations, CORS e `Program.cs` foram preservados. O mapa interativo implementado atende o alvo Expo Web atual; fora da Web, a tela informa a indisponibilidade do mapa até a adoção de um componente cartográfico nativo.

Validações: build isolado do backend aprovado sem erros (23 avisos anteriores), ESLint e TypeScript aprovados. Uma instância isolada em Production, sem migrations, respondeu HTTP 200 sem JWT e retornou dez itens reais com os novos campos. O protótipo externo configurado em `C:/Users/Artur/Documents/ChatGPT/Perambulando/prototipo-api` não existe nesta máquina; PDFs não foram regenerados.
### Marcador alinhado à marca Perambulando — 24/11/2026

O marcador dos resultados do mapa passou a reproduzir a linguagem visual da marca: corpo de pin em degradê laranja, aro branco, ponta inferior, base oval e três raios laterais. A imagem do evento ou estabelecimento ocupa o núcleo circular do pin; na ausência de imagem, permanece o fallback com a inicial em azul-marinho. Interação, coordenadas, card inferior e contrato da API foram preservados. Mudança somente no frontend; backend, banco e PDFs não foram alterados nesta etapa.
## Controle deslizante de distância — 24/11/2026

Os quatro botões fixos de distância em `/perto_de_voce` foram substituídos por uma régua deslizante semelhante a um controle de volume. O valor inicial é 1 km, o limite é 20 km e o valor corrente fica visível em uma etiqueta. Na Web, o controle aceita arraste, toque e teclado; no fallback nativo atual, botões de menos/mais percorrem os mesmos valores.

Após 300 ms sem nova movimentação, o frontend consulta `GetNearMe` com `MaxDistanceKm`, reduzindo chamadas enquanto o visitante arrasta. O mapa e os marcadores são substituídos somente pela resposta mais recente do controle. O backend converte o valor para metros e aplica o raio de zero até o limite escolhido; `DistanceRange` foi preservado como fallback compatível. Sem alteração de banco, migration, CORS ou `Program.cs`.

Validações: ESLint e TypeScript aprovados; build isolado do backend aprovado sem erros e com 23 avisos anteriores. Teste HTTP sem JWT aprovou 1 km e 20 km com status 200 e rejeitou 0,5 km com status 400. A instância isolada foi encerrada; PDFs não foram regenerados.
## Cinco resultados mais perto de mim — 24/11/2026

Abaixo da paginação do mapa, `/perto_de_voce` passou a exibir “Mais perto de mim” com até cinco resultados, independentemente de serem programações ou estabelecimentos. A lista conserva a ordenação crescente por `distanceMeters` e apresenta posição, imagem/fallback, tipo, nome e distância.

Ao tocar em um item, a tela rola de volta para a seção do mapa, o Leaflet centraliza e aproxima o marcador correspondente e o mesmo card inferior de detalhes é aberto. A seleção usa a chave composta por tipo e ID, evitando colisão entre um host e uma programação com o mesmo número.

A primeira carga continua paginada, mas, quando a página inicial possui somente um tipo, o frontend busca páginas adicionais até encontrar programações e estabelecimentos disponíveis no raio, atingir o fim ou acumular cinquenta itens. Os itens permanecem ordenados pela API e `Carregar mais` continua disponível quando ainda houver resultados. Assim o mapa representa ambos os tipos sem alterar o repository, o contrato ou a regra espacial. ESLint e TypeScript aprovados; backend, banco, migrations e PDFs não foram alterados nesta etapa.
## Correção dos estabelecimentos no mapa — 24/11/2026

O mapa e “Mais perto de mim” continuam consumindo um único resultado misto e ordenado. A origem dos itens de tipo `Host` foi refinada no repository: somente estabelecimentos de Gastronomia/Comércio sem programação ativa/futura sediada no mesmo `AddressId` são unidos às programações. Isso evita duplicar um local como estabelecimento e evento, sem esconder uma sede quando seu responsável promove evento em outro endereço.

Build isolado do backend, ESLint e TypeScript aprovados. Teste HTTP real sem JWT em 1 km retornou 19 programações e 5 estabelecimentos independentes; a instância isolada foi encerrada. Sem migration, mudança de schema ou PDF.
### Altura compacta do mapa mobile — 24/11/2026

O mapa de `/perto_de_voce` voltou à camada padrão do OpenStreetMap existente antes das tentativas de remoção de símbolos e customização de paleta. Somente a altura do quadro foi reduzida de 455 para 360 pixels, liberando espaço vertical para `Carregar mais` e `Mais perto de mim` em telas de celular. Pins, card inferior, zoom, foco, consulta e backend foram preservados. ESLint e TypeScript aprovados; PDFs não foram regenerados.

No ajuste mobile seguinte, a altura foi reduzida novamente, de 360 para 285 pixels. A alteração afeta somente o quadro visual; controles do Leaflet, marcadores e seleção continuam dentro da mesma área responsiva.
### Cabeçalho de localização compacto — 24/11/2026

O bloco inicial de `/perto_de_voce` teve padding vertical, tamanho/altura de linha do título, descrição e margem do botão reduzidos para liberar espaço em telas de celular. O botão passou de altura mínima 48 para 42 pixels, e seu rótulo é mantido em uma linha. Texto, ação de permissão e estados foram preservados. Mudança somente visual no frontend; backend, banco e PDFs não foram alterados.

Em um segundo ajuste, o conteúdo foi condensado para evitar que título, explicação e chamada do botão quebrem em muitas linhas. O bloco passou a usar 12 pixels de padding vertical, título de 20 pixels e botão de 36 pixels de altura mínima. A finalidade da mensagem e a solicitação de localização permanecem as mesmas.

## Integração dos fluxos restantes do frontend — 24/11/2026

A aba Comércio deixou de reutilizar a tela de perfil e passou a consultar publicamente `GET /api/Host/HostFilter`, com busca por nome e filtros de Gastronomia/Comércio. Ao expandir um estabelecimento, contatos, endereço e faixa estimada são exibidos a partir do contrato existente; `GET /api/Programming/Filter?HostId=...` carrega suas programações, inclusive o estado válido de estabelecimento sem eventos.

O Painel passou a usar o JWT da sessão para carregar `GetAllHostsbyUserId`, `User/Profile`, `Subscription/MySubscription` e, por host/período, `Statistics/Summary`, `Statistics/Daily` e `Statistics/Ranking`. Respostas reais alimentam cards, gráfico e ranking. Um `403` de estatísticas, esperado quando o plano não concede acesso, apresenta explicação e mantém a demonstração explicitamente identificada; falhas de assinatura não impedem a carga dos estabelecimentos. Ativação e cancelamento somente são enviados após a ação do usuário.

Em Explorar, visitantes continuam usando favoritos locais. Com JWT, programações favoritas são sincronizadas por `Favorite/GetAllByUserId`, `Favorite/{id}/Create` e `Favorite/{id}/Delete`; favoritos de estabelecimentos permanecem locais porque o backend não oferece esse contrato. As categorias completas alimentam a nova edição de até três preferências por `GetUserCategoriesPreferences`, `AddCategoryToUser` e `EditCategoryToUser`, enquanto “Qual é a sua vibe?” continua limitada visualmente a seis categorias.

Nenhum controller, DTO, service, banco, migration, CORS ou `Program.cs` foi alterado nesta integração. ESLint e TypeScript foram aprovados; PDFs não foram regenerados.

### Destaques da semana com navegação horizontal — 24/11/2026

A listagem de programações em destaque de `/explorar` passou de coluna vertical para `ScrollView` horizontal. Os cards possuem largura mobile fixa, deixam parte do próximo item visível e usam desaceleração com encaixe por card para indicar e facilitar drag/toque lateral. Favorito, abertura de detalhes, filtros e dados vindos de `Programming/Filter` foram preservados. Mudança somente no frontend; backend, banco e PDFs não foram alterados.

### Mais próximos de você em Explorar — 24/11/2026

Entre Favoritos e as categorias de `/explorar`, foi criada uma faixa horizontal alimentada por `GET /api/Nearby/GetNearMe`. Quando a permissão já existe, a tela reutiliza a localização sem novo aviso; caso contrário, o visitante decide pelo botão “Usar minha localização”. Latitude/longitude não são persistidas pelo frontend.

Os resultados misturam programações e estabelecimentos cadastrados, conservam a ordem de `distanceMeters` fornecida pela API e mostram cinco cards inicialmente. “Mostrar mais” revela cinco itens já recebidos ou busca a página seguinte por `Skip`, repetindo o incremento até o fim dos resultados em 20 km. Os cards mantêm scroll lateral; programações abrem seus detalhes e estabelecimentos direcionam para a aba Comércio. Estados de permissão, carregamento, vazio e erro foram tratados. Nenhuma mudança de backend, banco ou PDF.

### Bullets de categorias no mapa — 24/11/2026

Logo após o título “Mais próximos primeiro”, `/perto_de_voce` consulta `Category/GetallCategories` e monta bullets para todas as categorias ativas. “Todas” limpa a seleção; os demais bullets aceitam seleção múltipla. Cada mudança repete a consulta espacial com `CategoriesId` repetido e atualiza mapa, pins, card selecionado, paginação e lista dos cinco mais próximos.

O backend recebeu somente o campo de filtro em DTO/model/mapping/validação e a condição no repository. Sem categoria, hosts e programações continuam como antes; com categoria, apenas programações que atendam a qualquer seleção são retornadas. Build isolado do backend, ESLint e TypeScript aprovados. Testes HTTP reais confirmaram seleção simples, combinação e rejeição de ID inválido. O protótipo externo configurado não foi localizado nesta máquina; PDFs não foram regenerados.

## Página de favoritos do usuário — 24/11/2026

A rota Expo `/favoritos` reúne programações e estabelecimentos marcados pelo coração em uma única lista vertical. Cada card abre o fluxo correspondente e o coração preenchido permite remover o item; a aba Favoritos permanece destacada na navegação inferior. Visitantes leem os identificadores salvos em `perambulando.exploreFavorites`. Usuários autenticados também consultam `GET /api/Favorite/GetAllByUserId` e sincronizam favoritos locais de programação por `POST /api/Favorite/{programmingId}/Create`; a remoção autenticada de programação usa `PATCH /api/Favorite/{programmingId}/Delete`. Os detalhes de programação vêm de `GET /api/Programming/Details/{programmingId}` e os estabelecimentos locais são resolvidos pela listagem paginada de `GET /api/Host/HostFilter`.

O backend ainda não oferece persistência de favoritos de host vinculada à conta; por isso estabelecimentos permanecem no armazenamento local, inclusive durante uma sessão autenticada. A interface não apresenta essa limitação como sincronização entre dispositivos.

Implementação exclusiva do frontend. ESLint, TypeScript e a consulta HTTP pública de hosts foram aprovados; a navegação para `/favoritos` foi conectada em Explorar, Perto de você, Comércio e detalhes da programação. A integração autenticada em navegador com JWT real permanece pendente; nenhum contrato, banco, protótipo externo ou PDF foi alterado.

Correção na mesma data: os detalhes públicos de programação não incluem `isActive`; a rota já responde somente quando o item está disponível. A página deixou de exigir essa propriedade ausente antes de montar os cards, evitando descartar todas as programações favoritas enquanto os estabelecimentos apareciam normalmente. A resposta real de `Programming/Details` foi conferida sem alterar o contrato.

## Retorno dos detalhes ao ponto selecionado no mapa — 24/11/2026

Em `/perto_de_voce`, o card flutuante de uma programação passou a abrir seus detalhes tanto pelo card inteiro quanto pelo botão “Ver programação”. A navegação envia `origin=nearby-map` com `router.push`, mantendo a instância do mapa na pilha; assim, o botão voltar dos detalhes recupera o mesmo marcador e card selecionados, raio, categorias e posição de rolagem. Se a página de detalhes for aberta sem histórico de navegação, o fallback usa `/perto_de_voce` quando a origem informada for o mapa e `/explorar` nos demais casos.

Mudança exclusiva do frontend, sem novo endpoint ou alteração de contrato. ESLint e TypeScript foram aprovados; backend, banco, protótipo externo e PDFs foram preservados.

## Execução local — 25/11/2026

Por solicitação do usuário, comandos para somente banco no Docker e API/frontend em dois terminais foram salvos em [rodar-local.md](rodar-local.md). Guia usa o banco existente na porta 5434 e mantém a precaução do Compose atual contra migrations automáticas. Conferência estática e inspeção dos containers realizadas; execução integrada pendente. Nenhum serviço iniciado, configuração do backend ou dado do banco alterado. PDFs preservados.
## Marcadores de estabelecimentos em azul — 25/11/2026

Implementação: mapa Web em `frontend/src/app/perto_de_voce.tsx` mantém o tipo Host/Programming no payload dos marcadores. Hosts recebem classe host-marker e pin azul (corpo, contorno, raios e base); programações mantêm o pin laranja. Foto e comportamento de seleção/centralização preservados. A localização do usuário continua como círculo azul, distinto do pin de estabelecimento.

Validação: revisão do seletor condicionado a Host realizada; lint e TypeScript aprovados nesta entrega. Conferência visual no navegador pendente. Sem alteração de backend, banco, contratos ou PDFs. O bloqueio de tiles OpenStreetMap mostrado na captura é independente da cor dos marcadores e não foi alterado neste pedido.
## Formulário de funcionamento do host — 25/11/2026

A tela de cadastro/edição agora inclui semana de funcionamento para gastronomia/comércio, com dias abertos/fechados, intervalos, repetição de segunda para terça–sexta e fechamento no dia seguinte. Criação envia OpeningWeek no HostDTO existente; edição usa GET/PUT OpeningHours com JWT. Oferece salvar somente horários e recuperação de falha parcial sem reenviar dados empresariais. Validação de sete dias e sobreposição semanal, lint, TypeScript, sete testes, build web e cenários no Edge com API simulada aprovados. Nenhum arquivo do backend, banco ou pacote do projeto alterado. Detalhes em [formulário de funcionamento](validacoes/formulario-funcionamento-2026-11-25.md). Teste com conta real pendente; PDFs preservados.
## Comércio no fluxo de gestão — 25/11/2026

Corrigidas entradas de Comércio em Criar evento, Painel e Meus eventos para `/comercio?gestao=1`, com navbar do host, listagem autorizada dos próprios estabelecimentos e ações de edição/horários e gestão de eventos. Cadastro/edição iniciados ali retornam à mesma gestão. O catálogo público `/comercio` mantém o fluxo de descoberta. Sem fallback público em erros de sessão. Lint, TypeScript, exportação Web e navegação no Edge com API simulada validados; teste real pendente. Detalhes em [fluxo de Comércio do host](validacoes/fluxo-comercio-host-2026-11-25.md). Backend, banco e PDFs preservados.
## Fundo do mapa sem bloqueio OSM — 25/11/2026

Corrigido o fundo Access blocked/403 do mapa Perto de você: a camada raster foi substituída por OpenFreeMap vetorial com MapLibre integrado ao Leaflet. Preservados isolamento do iframe, pins, cores, fotos e seleção; créditos visíveis e mensagem de falha com nova tentativa. Nenhuma chave de backend exposta. Lint, TypeScript, build web e renderização/recuperação no Edge verificados com API/localização simuladas e mapa real da área visível. Backend e banco preservados. Detalhes e limites em [correção do mapa](validacoes/mapa-403-2026-11-25.md). PDFs preservados.

## Detalhes clicáveis dos estabelecimentos — 25/11/2026

Nova rota `/estabelecimento?hostId={id}` conectada aos cards do mapa, Explorar, Favoritos, Comércio e organizador de programação. Exibe descrição integral, endereço/contato, dias e intervalos de funcionamento e duas faixas horizontais independentes com descrições dos eventos próximos e anteriores. Reutiliza `GET /api/Host/Details/{id}` e o retorno de programações ativas. Preserva retorno ao pin selecionado e contexto de gestão do host. Na revisão autorizada de 25/11/2026, a consulta passou a ser pública: visitante acessa sem token e sessão existente envia JWT opcional. Banco e contratos de dados preservados; gestão continua protegida.

ESLint, TypeScript, dez testes Node, exportação Web e fluxos no Edge com API simulada aprovados, incluindo horários, faixas, abertura/retorno de evento e mapa. Após a liberação pública, lint/TypeScript e fluxos no Edge foram repetidos, incluindo visitante em 320 px. Build backend e sete verificações HTTP isoladas confirmaram acesso público e manutenção das proteções de gestão. Teste integrado com banco real e atualização do protótipo externo (não localizado) pendentes; reinicie a API para carregar a mudança. PDFs preservados. Contratos, implementação e limites em [detalhes dos estabelecimentos](validacoes/estabelecimento-detalhes-2026-11-25.md).

## Entrada pública em `/home` — 27/11/2026

A rota Expo `/home` é uma landing independente de dados da API. Ela encaminha para `/login`, `/cadastro`, `/explorar` e `/meus_eventos`; portanto, visitante pode explorar sem JWT e o fluxo de host continua responsável por tratar a ausência de sessão. Login retorna à home pelo botão voltar e redireciona autenticação bem-sucedida para Explorar. Cadastro também retorna à home. `/` permanece dedicado ao formulário de programação, mantendo compatibilidade com a navbar e os atalhos do painel do host.

Implementação restrita ao frontend. Backend, contratos, banco, migrations e PDFs foram preservados. ESLint, TypeScript e `git diff --check` aprovados; conferência visual permanece pendente.

Os atalhos Participante e Host leem a sessão pelo helper `getToken`, que também descarta JWT expirado. Com sessão, encaminham respectivamente a `/explorar` e `/meus_eventos`; sem sessão, encaminham a `/cadastro` e `/cadastro_host`. Não há login separado por perfil no frontend ou no contrato atual, por isso o botão principal mantém `/login` como entrada compartilhada.

O parâmetro `origem` de `/cadastro_host` passou a controlar um fluxo fechado de retorno: `home` → `/home`, `cadastro` → `/cadastro`, `criar_evento` → `/`, `painel` → `/painel`, `meus_eventos` → `/meus_eventos`, `perfil` → `/perfil` e `comercio` → `/comercio?gestao=1`. Sem origem, o fallback é `/home` sem sessão e `/meus_eventos` em manutenção autenticada. Os pontos que abrem cadastro, novo host ou edição de host agora enviam a origem correspondente. Nenhum contrato de API foi modificado.

Em `/explorar`, o componente completo de categorias “Qual é a sua vibe?” e seu bloco reativo de resultados foram reposicionados antes da faixa “Estabelecimentos no Recife”. A mudança não altera `Category/GetallCategories`, o limite visual de seis itens, `selectedCategoryId` nem o filtro que alimenta “Destaques da semana” ou a categoria selecionada.
