# Perambulando

O repositório organiza o backend e o frontend em pastas independentes, mantendo a infraestrutura e a documentação compartilhadas na raiz.

A descrição completa dos diretórios, responsabilidades e do fluxo entre aplicativo, API e banco está em [Arquitetura frontend e backend](docs/08-arquitetura-frontend-backend.md).

```text
Perambulando/
|-- backend/
|   |-- Projetos - 4.slnx
|   `-- Projetos - 4/
|-- frontend/
|-- docker/
|-- docs/
`-- compose.postgis.yaml
```

## Backend

O nome da solução, do projeto e os namespaces existentes foram preservados.

```powershell
dotnet build ".\backend\Projetos - 4.slnx"
dotnet run --project ".\backend\Projetos - 4\Projetos - 4.csproj"
```

## Frontend

O frontend é o projeto base do Expo com React Native e TypeScript. Nenhuma funcionalidade ou integração com a API foi implementada.

```powershell
cd frontend
npm install
npm start
```

Os scripts `npm run android`, `npm run ios` e `npm run web` também estão disponíveis. O simulador de iOS requer macOS.

