Public repo pre-flight checklist (secrets and safety)

Before pushing this repository as public, verify the items below:

1) Secrets are not committed
- OpenAI: ApiKey must NOT be in appsettings.json or any source file. Provide via environment variable OPENAI_API_KEY (or OpenAI__ApiKey) or .NET User Secrets.
- JWT: Jwt:Key must NOT be in git. Provide via environment variable Jwt__Key or .NET User Secrets.
- Database: ConnectionStrings:DefaultConnection should avoid inline passwords. Provide via env ConnectionStrings__DefaultConnection or User Secrets.

2) Local-only paths and PII
- appsettings MCP:ProjectPath should be relative and not contain your username/home path. Current setting uses a relative path.

3) Git hygiene
- Ensure .vs, bin, obj, and other build outputs are ignored (default .NET .gitignore). Add .DS_Store to global ignore on macOS.

4) Test after scrubbing
- Run locally with env vars:
  - export OPENAI_API_KEY="<your_key>"
  - export Jwt__Key="<min-32-char-secret>"
  - export ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=McpShopDb;User Id=sa;Password=<pwd>;TrustServerCertificate=True;Encrypt=False"
- Or use .NET User Secrets (recommended for dev):
  - dotnet user-secrets init --project McpWebApi/McpWebApi.csproj
  - dotnet user-secrets set "OpenAI:ApiKey" "<your_key>"
  - dotnet user-secrets set "Jwt:Key" "<min-32-char-secret>"
  - dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your-connection-string>"

5) Validate endpoints
- Start API and ensure Auth, Products, Categories, Orders, and Chat endpoints work with the new configuration.

If anything above isn’t clear, see appsettings.example.json for placeholders and structure.
