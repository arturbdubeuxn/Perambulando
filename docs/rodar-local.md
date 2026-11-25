# Banco no Docker e aplicação em dois terminais

Atualização: 25/11/2026. Abra dois PowerShells na raiz `Perambulando`. Requer Docker Desktop aberto, SDK .NET 10 e Node.js/npm no Windows.

## Terminal 1 — banco e backend

```powershell
docker stop perambulando-dev-backend-1 perambulando-dev-frontend-1
docker start perambulando-dev-database-1
docker exec perambulando-dev-database-1 pg_isready -h 127.0.0.1 -p 5432
```

Espere `accepting connections`. Os containers parados acima são apenas a API e o frontend antigos; o banco e seus dados são preservados.

Importe as configurações do arquivo local existente, sem exibir credenciais, e adapte a conexão para a porta do Windows:

```powershell
foreach ($linha in Get-Content -LiteralPath .env.dev.backend) {
    if ($linha -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
$env:ConnectionStrings__DefaultConnection = $env:ConnectionStrings__DefaultConnection -replace '(?i)Host=database(?=;|$)', 'Host=127.0.0.1' -replace '(?i)Port=5432(?=;|$)', 'Port=5434'
$env:ASPNETCORE_ENVIRONMENT = 'Production'
dotnet run --project ".\backend\Projetos - 4\Projetos - 4.csproj" --no-launch-profile --urls http://localhost:5014
```

Deixe o terminal aberto. A API atende em http://localhost:5014. O modo Production mantém a execução sem migrations automáticas. Em 25/11/2026, o banco foi atualizado às 29 migrations e os CNPJs fictícios foram corrigidos; não há migrations pendentes nesta branch no estado validado. Development continua chamando MigrateAsync e exige nova revisão após mudanças de branch/modelo. OpenAPI exclusivo de Development não fica disponível em Production. Consulte [o registro da atualização](validacoes/atualizacao-modelo-2026-11-25.md).

`.env.dev.backend` não é carregado automaticamente pelo dotnet; a importação acima fornece conexão, JWT e integrações existentes. Se estiver ausente, configure esses valores antes de executar. O banco acessado pelo Windows usa `127.0.0.1:5434`; `database:5432` só funciona entre containers. Não publique esse arquivo no Git. Para geocodificação, preencha `Geoapify__ApiKey` localmente antes da importação; nunca coloque a chave no frontend.

## Terminal 2 — frontend

```powershell
cd frontend
$env:EXPO_PUBLIC_API_URL = 'http://localhost:5014'
npm run web
```

Se ainda não houver dependências instaladas no Windows, execute `npm ci` antes de `npm run web`. Dependências do container não substituem as locais. Abra http://localhost:8081 ou o endereço informado pelo Expo.

## Encerrar

Ctrl+C em cada terminal encerra backend e frontend. Para parar somente o banco, sem apagar dados:

```powershell
docker stop perambulando-dev-database-1
```

## Executável bloqueado durante o build — 25/11/2026

Se aparecer MSB3027/MSB3021 indicando que `Projetos - 4.exe` está em uso, outra instância da API continua aberta. Encerre-a com Ctrl+C no terminal onde ela roda. Se esse terminal não existir mais, identifique somente o processo deste projeto antes de encerrar:

```powershell
$apiExe = Join-Path (Get-Location) 'backend\Projetos - 4\bin\Debug\net10.0\Projetos - 4.exe'
Get-Process -Name 'Projetos - 4' -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -eq $apiExe } |
    Stop-Process
```

Execute na raiz do repositório e repita o comando de `dotnet run` do Terminal 1, mantendo as variáveis já configuradas. Não é necessário limpar o banco, alterar o código ou reinstalar o SDK.

Validação realizada em 25/11/2026: o PID 30464 foi confirmado como executável deste projeto e encerrado; o build padrão passou com zero erros e zero avisos. A API não foi reiniciada por esta correção, para que seja iniciada no terminal do usuário.

## Validação e pendências

Comandos conferidos com containers existentes, portas, projeto e scripts atuais. O Compose deste checkout referencia outro volume; este guia reutiliza o container `perambulando-dev-database-1` que existe nesta máquina. Não usar `compose up` sem selecionar serviço para este fluxo, pois também iniciaria API/frontend em containers.

Guia salvo sem iniciar serviços, executar migrations ou modificar backend/banco. Execução integrada e testes funcionais permanecem pendentes. Nenhum PDF gerado.
