# Arquitetura e separação entre frontend e backend

Atualização: 28/10/2026.

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
