# Arquitetura e separação entre frontend e backend

Atualização: 26/10/2026.

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

Estão implementadas as interfaces de criação de evento e cadastro de host. Os formulários mantêm somente estado visual/local: não há autenticação, cliente HTTP, armazenamento de JWT, leitura de DTOs, persistência ou comunicação com a API.

### Conteúdo dos arquivos e diretórios

| Local | Responsabilidade |
|---|---|
| `App.tsx` | Interface responsiva de criação de evento, reutilizada pela rota `/` |
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

Hoje, frontend e backend podem ser iniciados separadamente, mas não trocam dados:

```text
frontend/ -> exibe as rotas / e /cadastro_host com dados somente locais

backend/  -> expõe a API e acessa o PostGIS
```

Iniciar o frontend não inicia a API ou o banco. Iniciar o backend não inicia o Expo. O Docker Compose atual inicia somente o banco `database`.

### Fluxo previsto para futuras funcionalidades

Quando a integração for solicitada, o fluxo esperado será:

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

O frontend deverá conhecer somente a URL pública da API e os contratos HTTP necessários. Ele não acessará diretamente o PostgreSQL, não executará migrations e não conterá credenciais do banco ou chaves privadas do servidor.

Respostas de sucesso e erro devem continuar seguindo os controllers e DTOs documentados. Endpoints protegidos receberão o JWT no cabeçalho `Authorization: Bearer <token>`. Erros estruturados do backend devem ser tratados a partir de `ProblemDetails` ou `ValidationProblemDetails`, conforme cada endpoint.

### URLs locais futuras

`localhost` possui significados diferentes conforme o aplicativo:

| Consumidor | Endereço local habitual da API |
|---|---|
| Navegador no mesmo Windows | `http://localhost:5014` |
| Android Emulator | `http://10.0.2.2:5014` |
| Aparelho físico na mesma rede | `http://IP_DO_COMPUTADOR:5014`, desde que a API e o firewall permitam |

Nenhuma dessas URLs foi configurada no frontend ainda. Quando houver integração, a URL deverá ser definida por ambiente, sem inserir segredos em variáveis públicas do Expo.

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

Validações adicionais em 26/10/2026: `tsc --noEmit` e `expo lint` aprovados; bundle web do Expo Router compilado; `/` e `/cadastro_host` responderam HTTP 200 no servidor local. A captura automatizada do navegador não gerou arquivo nesta execução, portanto a verificação visual final dessa rota permanece pendente no navegador do usuário.

Pendências intencionais: integrar os formulários à API, definir a URL por ambiente, implementar autenticação, armazenamento seguro do JWT, máscaras e validações completas, envio de dados e testes funcionais. Os botões de cadastro de host não fazem requisições nesta etapa.

Backend, banco, containers, contratos HTTP e PDFs foram preservados.
