# Arquitetura e separação entre frontend e backend

Atualização: 27/10/2026.

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

Validações adicionais em 26/10/2026: `tsc --noEmit` e `expo lint` aprovados; bundle web do Expo Router compilado; `/` e `/cadastro_host` responderam HTTP 200 no servidor local. Em 27/10/2026, a rota `/cadastro_host` foi conferida integralmente em captura responsiva: cabeçalho, marca em Fredoka, pin, paleta, cartões, campos, seleção, botões e aviso final foram renderizados corretamente.

Pendências intencionais: integrar os formulários à API, definir a URL por ambiente, implementar autenticação, armazenamento seguro do JWT, máscaras e validações completas, envio de dados e testes funcionais. Os botões de cadastro de host não fazem requisições nesta etapa.

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
