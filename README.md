# AiAutomatedDev

Full-stack project consisting of:
- Backend: ASP.NET Core Web API (McpWebApi)
- MCP Server: .NET console project (AiMcpServer)
- Frontend: React + Vite (client)

This repository is prepared for public use: secrets are removed, and configuration is environment-driven.

## Quick start

### Prerequisites
- .NET 9 SDK
- Node.js 18+ and npm
- SQL Server (local or remote) if you use the default EF Core SQL Server provider

### Configure environment
Create your environment variables (recommended) or user-secrets. Minimal required:

- OpenAI__ApiKey = your-openai-key
- Jwt__Key = a-random-32+chars-secret
- ConnectionStrings__DefaultConnection = your-sqlserver-connection-string
- MCP__ProjectPath = absolute path to `AiMcpServer/AiMcpServer/AiMcpServer.csproj`
- MCP__Command = dotnet (default)

Alternatively, copy `McpWebApi/appsettings.example.json` values to your local `appsettings.Development.json` (not tracked) and fill in secrets.

### Run backend
From `McpWebApi/`:

```bash
# install EF tooling if needed (optional)
dotnet restore

# run app
dotnet run
```

The API will run on the port configured by `launchSettings.json` (e.g., 5029). It applies pending EF Core migrations on startup and seeds demo data.

### Run frontend
From `client/`:

```bash
npm install
npm run dev
```

Vite dev server runs at http://localhost:3000 and proxies `/api` to the backend during development.

## Configuration
- `McpWebApi/appsettings.json` contains non-secret defaults and placeholders. Override via environment variables or `appsettings.Development.json` (ignored by git).
- `McpWebApi/appsettings.example.json` documents all required settings.
- Frontend env: create `client/.env` based on `client/.env.example` if you need custom values (e.g., API base URL in production hosting).

## Security & CORS
The default CORS policy allows all origins for local development. For production, set a restricted list via configuration (see `Program.cs` notes) or reverse proxy.

## License
MIT — see `LICENSE`.
