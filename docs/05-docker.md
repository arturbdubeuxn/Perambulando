# Docker

Perambulando | Atualização: 18/10/2026

## 1. Situação encontrada

Não foram encontrados Dockerfile, `.dockerignore` ou arquivos Docker Compose nos repositórios de backend e protótipo consultados. Portanto, não há infraestrutura versionada suficiente para documentar um fluxo Docker existente.

Isso não demonstra que o computador não tenha um PostgreSQL em container. O estado do Docker Desktop, containers externos, imagens e volumes em execução não foi consultado nesta análise.

## 2. Dependências reais da aplicação

| Componente | Estado confirmado no código |
|---|---|
| API | ASP.NET Core, target `net10.0` |
| Persistência | EF Core 10 com Npgsql/PostgreSQL |
| Conexão | `ConnectionStrings:DefaultConnection` |
| Autenticação | JWT, com chave, emissor, audiência e expiração configuráveis |
| Migrations | Aplicadas automaticamente no startup somente em Development |
| HTTP | A porta 5014 é usada no arquivo de testes local; não é um mapeamento Docker confirmado |
| Protótipo | Servidor Node local em 127.0.0.1:5173, separado da API |

## 3. Configuração necessária se houver containerização

Esta seção descreve requisitos futuros, não arquivos já implementados.

- Build da API com SDK compatível com .NET 10 e execução com runtime ASP.NET compatível.
- Configuração da conexão pelo ambiente: `ConnectionStrings__DefaultConnection`.
- Configurações JWT: `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience` e `Jwt__ExpirationHours`.
- Escolha explícita do ambiente ASP.NET e da porta interna de escuta, com respectiva publicação no host.
- Banco persistente com volume e uma política definida para migrations, backup e restauração.
- Definição de HTTPS/redirecionamento, pois a aplicação chama `UseHttpsRedirection`.

Não há, neste estado, nome oficial de serviço, imagem PostgreSQL, tag de imagem, nome de volume ou porta publicada que possa ser informado como parte do projeto.

## 4. Rede: diferença entre local e container

Se API e banco forem serviços no mesmo Compose, o host da conexão deve apontar para o nome do serviço do banco. `localhost` dentro do container é o próprio container, não o computador nem outro serviço.

Se só o PostgreSQL estiver em container e a API rodar pelo Visual Studio, a API usa o endereço e a porta publicados pelo banco no computador. Esses valores precisam ser conferidos na configuração real.

O protótipo local aceita destinos de API em loopback. Publicar o frontend, mover a API para outro host ou mudar a topologia exige revisar essa integração; não há implantação por Docker desse protótipo nos arquivos encontrados.

## 5. Operação e comandos

Não existe um comando `docker compose up` específico e reproduzível para este repositório sem adicionar/configurar os arquivos ausentes. Comandos de inspeção que não alteram dados podem ajudar a identificar um ambiente externo:

```text
docker version
docker ps
docker compose version
```

Não foram executados comandos de Docker, criados containers ou alterados volumes para produzir esta documentação. Não foi implementada containerização nesta tarefa.

## 6. Quando atualizar este documento

Ao adicionar Dockerfile/Compose, registrar o local dos arquivos, contexto de build, serviços, imagens/tags, variáveis sem valores secretos, portas, redes, volumes, verificações de saúde, comando de inicialização e forma de aplicar migrations. Diferenciar containers de desenvolvimento e produção e documentar backup/restauração antes de qualquer operação sobre volumes.
