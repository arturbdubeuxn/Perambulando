# Arquitetura e separação entre frontend e backend

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
