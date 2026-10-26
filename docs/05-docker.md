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
