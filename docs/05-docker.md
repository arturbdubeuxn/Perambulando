# Docker

> Atualização de 21/10/2026: a refatoração de Address está preparada no código e aguarda revisão **antes da migration**. O banco ainda tem o schema anterior. Consulte a [revisão dos contratos e da transferência de dados](validacoes/refatoracao-address-revisao-2026-10-21.md); as descrições antigas de endereço neste arquivo representam a versão anterior.


Perambulando | Atualização: 19/10/2026

## 1. Situação encontrada

Foram adicionados docker/postgres/Dockerfile e compose.postgis.yaml na branch Artur-Desktop. O Dockerfile parte de postgres:17-trixie e instala postgresql-17-postgis-3 e postgresql-17-postgis-3-scripts. A imagem configurada é perambulando/postgres-postgis:17.

O banco real foi identificado no container perambulando-postgres, imagem postgres:17, PostgreSQL 17.11, Debian 13. Seu volume é perambulando_pgdata, montado em /var/lib/postgresql/data, e a porta é 127.0.0.1:5432. Os pacotes PostGIS foram instalados nesse container após backup. A extensão 3.6.4 foi habilitada e a migration de localização aplicada sem recriar o volume.

## 2. Dependências reais da aplicação

| Componente | Estado confirmado no código |
|---|---|
| API | ASP.NET Core, target `net10.0` |
| Persistência | EF Core 10 com Npgsql/PostgreSQL |
| Dados espaciais | PostGIS 3.6.4 no banco local; plugin Npgsql NetTopologySuite 10.0.3 |
| Conexão | `ConnectionStrings:DefaultConnection` |
| Autenticação | JWT, com chave, emissor, audiência e expiração configuráveis |
| Migrations | Aplicadas automaticamente no startup somente em Development |
| HTTP da API | 5014 no arquivo de testes; o Compose desta etapa contém somente o banco |
| Protótipo | Servidor Node local em 127.0.0.1:5173, separado da API |

## 3. Configuração necessária se houver containerização

O Compose desta etapa contém somente o banco e reutiliza um volume externo. As configurações de API a seguir continuam sendo requisitos de uma futura containerização da API.

- Build da API com SDK compatível com .NET 10 e execução com runtime ASP.NET compatível.
- Configuração da conexão pelo ambiente: `ConnectionStrings__DefaultConnection`.
- Configurações JWT: `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` e `Jwt__ExpirationHours`.
- Escolha explícita do ambiente ASP.NET e da porta interna de escuta, com respectiva publicação no host.
- Banco persistente com volume e uma política definida para migrations, backup e restauração.
- Definição de HTTPS/redirecionamento, pois a aplicação chama `UseHttpsRedirection`.

No Compose atual: serviço database; container perambulando-postgres; imagem perambulando/postgres-postgis:17; volume externo perambulando_pgdata; porta 127.0.0.1:5434 no host para 5432 no container. O volume deve existir e já conter o cluster. Essa configuração não inicializa um banco vazio nem altera senhas de um cluster existente.

## 4. Rede: diferença entre local e container

Se API e banco forem serviços no mesmo Compose, o host da conexão deve apontar para o nome do serviço do banco. `localhost` dentro do container é o próprio container, não o computador nem outro serviço.

Se só o PostgreSQL estiver em container e a API rodar pelo Visual Studio, a API usa o endereço e a porta publicados pelo banco no computador. Esses valores precisam ser conferidos na configuração real.

O protótipo local aceita destinos de API em loopback. Publicar o frontend, mover a API para outro host ou mudar a topologia exige revisar essa integração; não há implantação por Docker desse protótipo nos arquivos encontrados.

## 5. Operação e comandos

Para validar a configuração e construir a imagem, na raiz do repositório:

```text
docker compose -f compose.postgis.yaml config --quiet
docker compose -f compose.postgis.yaml build database
```

O container atual foi criado fora desse Compose e continua em uso, com os pacotes instalados no seu filesystem. Ele não foi substituído pela imagem nova. Stop/start desse mesmo container preserva os pacotes; recriá-lo a partir de postgres:17 simples perde os pacotes. O Dockerfile permite construir a imagem que os inclui permanentemente.

Não executar compose up esperando que adote automaticamente o container existente de mesmo nome. Uma adoção futura exige novo backup, parada do container anterior, liberação do nome/porta e início de um único PostgreSQL sobre o volume. Nunca iniciar dois servidores sobre o mesmo volume, apagar o volume ou mudar a versão principal do PostgreSQL nessa operação.

Comandos de inspeção:

```text
docker version
docker ps
docker compose version
```

Foi criado backup pg_dump em formato custom antes da alteração, fora do repositório, em C:/Users/Artur/Documents/ChatGPT/Perambulando/tmp/backups/. Após a migration, as contagens foram preservadas: 11 usuários, 12 hosts, 7 programações, 12 categorias e 10 vínculos. Não foi recriado o container nem o volume. As alterações de banco afetam o ambiente compartilhado independentemente de qual branch da aplicação estiver ativa.

## 6. Quando atualizar este documento

Ao adicionar Dockerfile/Compose, registrar o local dos arquivos, contexto de build, serviços, imagens/tags, variáveis sem valores secretos, portas, redes, volumes, verificações de saúde, comando de inicialização e forma de aplicar migrations. Diferenciar containers de desenvolvimento e produção e documentar backup/restauração antes de qualquer operação sobre volumes.

## Geocodificação via Geoapify — 19/10/2026

Forneça Geoapify__ApiKey no ambiente do processo/container da aplicação, não no PostgreSQL. A API precisa de saída HTTPS para api.geoapify.com. O compose.postgis.yaml atual disponibiliza somente o banco, portanto não injeta essa variável na API. Nenhuma imagem, volume ou container foi alterado nesta etapa. Configuração local e política de falhas estão no README.

Veja a [configuração e os critérios da integração](README.md). Validação: build sem erros (três avisos CS8618 preexistentes), 63 verificações com HTTP/repositórios simulados e 17 testes do protótipo. Consulta HTTPS real ao Geoapify validada em 19/10/2026, com resultado building no Brasil e confiança 1. A chave foi configurada em Geoapify__ApiKey no ambiente do usuário Windows, sem inclusão nos arquivos. O fluxo completo via API/banco ainda precisa ser exercitado após reiniciar o processo que inicia a aplicação. PDFs não regenerados.


## Refatoração de Address — 21/10/2026

Nenhuma imagem, container ou volume foi alterado para Address. O schema novo ainda não foi criado. Não reinicie a API nova esperando compatibilidade com o banco antigo; em Development, alterações de modelo pendentes são verificadas antes de MigrateAsync. A transferência dos dados e a revisão/aplicação da migration são etapas futuras, após aprovação.

Nenhuma migration ou PDF gerado nesta etapa. [Revisão pendente](validacoes/refatoracao-address-revisao-2026-10-21.md).
# Ambiente local PostGIS em porta dedicada — 26/10/2026

Nesta máquina, a porta 5432 já pertence ao serviço nativo PostgreSQL 18 e a porta 5433 pertence a um container PostgreSQL 16 anterior. Para preservar ambos sem alterar ou excluir seus dados, o serviço `database` do projeto publica o PostgreSQL 17 com PostGIS em `127.0.0.1:5434`, mantendo a porta interna padrão 5432. A configuração local de desenvolvimento da API usa a mesma porta 5434.

O volume externo novo `perambulando_pgdata` é exclusivo do PostgreSQL 17/PostGIS deste projeto. O volume antigo `perambulando_postgres_data`, usado pelo PostgreSQL 16, não foi migrado, montado, modificado ou excluído. O PostgreSQL 18 nativo também permanece ativo. Esta escolha evita montar um cluster de uma versão principal em outra, o que não é suportado.

Implementação: imagem `perambulando/postgres-postgis:17` construída a partir do Dockerfile versionado; volume `perambulando_pgdata` criado e inicializado; Compose e configuração local alinhados na porta 5434. O container definitivo `perambulando-postgres` permanece ativo com healthcheck aprovado.

Validações: PostgreSQL 17.11; PostGIS 3.6.4 disponível e habilitado; autenticação com a configuração local aprovada; 16 migrations existentes aplicadas; 17 tabelas no schema público; API iniciada em `http://localhost:5014`; `GET /openapi/v1.json` respondeu HTTP 200. A API temporária foi encerrada após a validação. Nenhuma migration, model ou contrato HTTP foi alterado. PDFs não foram regenerados.

Pendência: o volume PostgreSQL 16 anterior foi preservado, mas seus dados não foram migrados para o banco novo. O PostGIS 17 contém o schema criado pelas migrations e inicia sem os registros do banco anterior. Qualquer transferência deve ser feita depois, por backup/restauração compatível entre versões, mediante solicitação explícita.


## Integração antiga de roteiros retirada — 04/11/2026

Cliente n8n, opções e registros HTTP exclusivos da primeira implementação de roteiros foram retirados da master. N8n__WebhookUrl permanece no ambiente do usuário Windows, mas não é lida pelo código atual. Workflow externo, containers, volumes, geocodificação Geoapify e configuração do banco preservados. Nenhuma migration ou reinício da API principal nesta etapa. Build com zero erros/nove avisos anteriores; 91 testes do protótipo com API simulada aprovados. PDFs preservados.


## Teste isolado de funcionamento semanal — 04/11/2026

Docker Desktop estava desligado e foi iniciado para validar OpeningHoursRepository. Container perambulando-postgres disponibilizou PostgreSQL em 127.0.0.1:5432. Testes usaram somente banco aleatório opening_hours_check_..., criado com EnsureCreated e removido ao finalizar; conexões ao banco principal não foram usadas pelo harness. Nenhum compose/imagem/volume foi alterado, nem migration gerada/aplicada. 23 verificações de persistência/DI passaram. API principal não reiniciada e PDFs preservados.


## IA: fuso de referência — 05/11/2026

TravelChatService lê TravelChat:TimeZone (ambiente: TravelChat__TimeZone), com padrão America/Recife se a chave não existir. Fuso deve ser reconhecido pelo runtime; validação ocorre na construção do service. Configure no processo/container da API, não no PostgreSQL. Não há alteração em compose/Dockerfile nem cliente n8n/DI nesta etapa. Endpoint continua incompleto. Sem container iniciado, banco ou PDF.

Validação da chamada de interpretação: dotnet run --no-restore de TravelChatInterpretationCheck.cs/.csproj compilou o backend sem erros (nove avisos anteriores) e aprovou 16 verificações com IUserService/intérprete simulados: prompt, UTC gerado no servidor, padrão/configuração de fuso, entrada original preservada, cancelamento, usuário indisponível, mensagem nula, erro do intérprete e fuso inválido. Fluxo válido conferido até o trecho de filtros ainda pendente. git diff --check sem erros. Sem HTTP real, banco ou n8n.

## IA: remoção do fuso nomeado e configuração — 05/11/2026

Por solicitação do usuário, removidos TimeZone de TravelChatMessage, o campo _timeZone, a leitura TravelChat:TimeZone com padrão America/Recife e a chamada TimeZoneInfo.FindSystemTimeZoneById. TravelChatService não recebe mais IConfiguration no construtor. Dependências atuais: IUserService, ITravelChatInterpretationService e ITravelChatPreferencesValidations.

TravelChatMessage contém somente Text e ReferenceTime (DateTimeOffset). O service continua preenchendo ReferenceTime com DateTimeOffset.UtcNow no servidor, portanto o instante enviado usa deslocamento +00:00, sem configuração adicional. DateTimeOffset representa instante/deslocamento; não representa um fuso nomeado nem regras regionais. Não inferir automaticamente o horário local de Recife a partir deste valor UTC. Interpretação de datas relativas deve usar a referência explícita e o contrato que será montado no workflow, sem prometer conversão regional não implementada.

O DTO público permanece somente Text. Mapping, AppService, verificação de usuário por GetProfileAsync e validação de preferências preservados. Não foram modificados appsettings, Program.cs ou configuração de outros serviços. A variável TravelChat__TimeZone não é mais lida nem necessária; instruções anteriores sobre ela são históricas, substituídas por esta remoção.

Sem alteração de rota, resposta pública, banco, protótipo ou PDF. Interpretação concreta, filtros e DI ainda pendentes; o service continua terminando em NotImplementedException após validar preferências. Harnesses temporários de interpretação e mapping foram ajustados ao contrato sem TimeZone.

Validação final da simplificação temporal: backend compilado sem erros (nove avisos anteriores) pelos harnesses --no-restore. TravelChatInterpretationCheck aprovou 15 verificações com dependências simuladas, cobrindo referência UTC do servidor sem alterar entrada, cancelamento, identidade e validação; TravelChatPreferencesCheck aprovou 42 verificações com catálogo simulado após compatibilização do model sem IncludeProgrammings. Busca confirmou ausência de TimeZone/IConfiguration nos tipos alterados; git diff --check sem erros. Primeira compilação falhou pela referência ao campo já ausente, corrigida antes destes resultados. Sem HTTP, banco ou n8n.

## IA: cliente n8n aguarda configuração de execução — 06/11/2026

Implementado N8nTravelChatInterpretationService na Data, ainda sem registro HttpClient/DI ou configuração de URL. BaseAddress deverá receber o endereço completo do Webhook; não há URL fixa no cliente. API no Windows poderá usar a porta local 5678 publicada pelo container n8n; se a API também estiver em container, endereço/rede deverão ser verificados antes da conexão. Não houve mudança de compose/container/volume nem consulta ao n8n real neste passo. Prazo do cliente: 30s; resposta até 64 KiB; alinhar timeout do protótipo (atualmente 20s) antes do teste integrado. Sem banco, migration ou PDF.

## IA: endereço local configurado por perfil — 06/11/2026

ITravelChatInterpretationService registrado como HttpClient tipado. Chave de configuração N8n:TravelChatWebhookUrl (env N8n__TravelChatWebhookUrl), com URL completa HTTP/HTTPS válida. Perfis http/https do Visual Studio/dotnet run apontam a http://localhost:5678/webhook-test/perambulando-travelchat. Não há fallback fixo fora dos perfis; ausência/endereço inválido provoca indisponibilidade 503, sem chamada externa. Timeout 30s, redirecionamentos desabilitados e logs automáticos do HttpClient removidos.

O container n8n/volumes/rede não foram alterados. API no Windows acessa a porta publicada; API em container exigirá endereço alcançável em sua rede, não assumir localhost. URL de teste depende de Listen for test event; publicação/URL de produção permanecem passos futuros. Reiniciar API para receber a variável do perfil. Reiniciar servidor do protótipo se já aberto: timeout de proxy 40s e navegador 45s. Sem banco, migration, processo reiniciado pelo assistente ou PDF nesta etapa.

## TravelChat: preparação de Header Auth — 06/11/2026

O HttpClient da interpretação lê N8n:TravelChatWebhookKey (variável de ambiente N8n__TravelChatWebhookKey) e, quando preenchida, envia X-Perambulando-Key ao webhook. Sem a configuração, mantém temporariamente o fluxo local sem esse cabeçalho, para permitir configuração em baby steps. Isso não torna o webhook autenticado por si só: a credencial Header Auth do n8n deve usar Name=X-Perambulando-Key e o mesmo Value, e ser vinculada ao Webhook depois da configuração da API.

Chave exclusiva de servidor, independente do JWT do usuário e da credencial Gemini. Não colocar em DTO, frontend/protótipo, launchSettings versionado ou appsettings versionado. Para desenvolvimento, pode ser configurada pelo recurso Manage User Secrets do projeto da API com a propriedade N8n:TravelChatWebhookKey. Em produção, usar o mecanismo de segredos do ambiente e HTTPS quando o tráfego sair do loopback local. A URL de produção e a ativação da autenticação no workflow continuam pendentes. O assistente não recebeu nem gravou a chave.

Rotas, autenticação JWT da API, DTOs e respostas permanecem iguais. Ajuda do protótipo atualizada para deixar explícito que a chave é configurada somente no servidor. Sem migração, alteração de banco, chamada à IA, edição do workflow ou exportação de PDFs.

Validação desta preparação: build --no-restore aprovado com zero erros e nove avisos de nulabilidade preexistentes; node --check public/app.js aprovado; 107 testes do protótipo aprovados com API simulada (reexecução fora da sandbox após bloqueio de loopback EACCES). git diff --check sem erros. O envio autenticado ao n8n real ainda não foi testado.
