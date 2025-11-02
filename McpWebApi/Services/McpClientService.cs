using Microsoft.Extensions.AI;
using Microsoft.Extensions.Hosting;
using ModelContextProtocol.Client;
using OpenAI.Chat;
using System.Text;
using ChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace McpWebApi.Services;

public class McpClientService
{
    private readonly IChatClient _chatClient;
    private readonly McpClient _mcpClient;
    private readonly IList<McpClientTool> _tools;
    private readonly ILogger<McpClientService> _logger;
    private readonly string _projectDirectory;

    private readonly List<ChatMessage> _conversationHistory = new();

    public McpClientService(IConfiguration configuration, IHostEnvironment env, ILogger<McpClientService> logger)
    {
        _logger = logger;

        try
        {
            // 🔹 Proje dizinini config'ten al; yoksa repo kökünü otomatik bul
            string currentDir = Directory.GetCurrentDirectory();
            string? configuredRoot = configuration["Project:Directory"];

            static string? TryFindRepoRoot(string startDir)
            {
                // Yukarı doğru 6 seviye tarayıp kök kriterlerini kontrol et
                string? dir = startDir;
                int depth = 0;
                while (!string.IsNullOrEmpty(dir) && depth < 6)
                {
                    bool hasSolution = File.Exists(Path.Combine(dir, "mcpWebApi.sln"))
                                       || File.Exists(Path.Combine(dir, "AiAutomationDevelopment.sln"));
                    bool hasMonorepoMarkers = Directory.Exists(Path.Combine(dir, "McpWebApi"))
                                              && Directory.Exists(Path.Combine(dir, "client"));
                    bool hasServers = Directory.Exists(Path.Combine(dir, "AiMcpServer"));

                    if (hasSolution || (hasMonorepoMarkers && hasServers))
                    {
                        return dir;
                    }

                    dir = Directory.GetParent(dir)?.FullName;
                    depth++;
                }
                return null;
            }

            string? detectedRoot = TryFindRepoRoot(currentDir);
            _projectDirectory = configuredRoot ?? detectedRoot ?? currentDir;
            _logger.LogInformation("Project directory resolved: configured={Configured} detected={Detected} used={Used}", configuredRoot, detectedRoot, _projectDirectory);

            // OpenAI API Key (config veya env'den oku, hardcode KESINLIKLE yok)
            // Öncelik: appsettings / user-secrets -> OpenAI:ApiKey (placeholder ise YOK say)
            // Alternatif: düz ortam değişkeni OPENAI_API_KEY
            static bool IsPlaceholder(string? s) =>
                string.IsNullOrWhiteSpace(s) || s.TrimStart().StartsWith("<set-via-env", StringComparison.OrdinalIgnoreCase);

            bool isDev = env.IsDevelopment();
            string envName = env.EnvironmentName ?? "Unknown";

            string? apiKeyFromConfig = configuration["OpenAI:ApiKey"];
            if (IsPlaceholder(apiKeyFromConfig)) apiKeyFromConfig = null;

            string? apiKeyFromEnv = Environment.GetEnvironmentVariable("OPENAI_API_KEY");

            // Development'ta öncelik appsettings.Development.json (config) olsun;
            // Prod'da ise önce ortam değişkeni, sonra config.
            string? apiKey = isDev
                ? (apiKeyFromConfig ?? apiKeyFromEnv)
                : (apiKeyFromEnv ?? apiKeyFromConfig);

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("OpenAI API anahtarı bulunamadı. Lütfen 'OpenAI:ApiKey' (veya env: OpenAI__ApiKey / OPENAI_API_KEY) olarak ayarlayın.");

            ChatClient openAIClient = new(model: "o3-mini", apiKey: apiKey);

            _chatClient = new ChatClientBuilder(openAIClient.AsIChatClient())
                .UseFunctionInvocation()
                .Build();

            if (isDev && apiKeyFromConfig is not null)
                _logger.LogInformation("✅ OpenAI client hazır (anahtar kaynağı: appsettings.{Env}.json)", envName);
            else if (apiKeyFromEnv is not null)
                _logger.LogInformation("✅ OpenAI client hazır (anahtar kaynağı: ortam değişkeni OPENAI_API_KEY)");
            else
                _logger.LogInformation("✅ OpenAI client hazır");

            // 🔹 MCP Client - Komut ve proje yolu konfigürasyondan gelir; yolu mutlaklaştır
            var mcpCommand = configuration["MCP:Command"] ?? "dotnet";
            var mcpProjectPathRaw = configuration["MCP:ProjectPath"]
                ?? throw new InvalidOperationException("MCP:ProjectPath not configured. Set via appsettings or env (MCP__ProjectPath).");

            // Config'teki yol göreli ise, mevcut çalışma dizinine göre mutlaklaştır
            string mcpProjectPathAbs = Path.IsPathRooted(mcpProjectPathRaw)
                ? mcpProjectPathRaw
                : Path.GetFullPath(Path.Combine(currentDir, mcpProjectPathRaw));

            // Yol bir klasör ise içindeki .csproj dosyasını bulmayı dene; değilse .csproj dosyasının kendisi olmalı
            if (Directory.Exists(mcpProjectPathAbs))
            {
                var csproj = Directory.EnumerateFiles(mcpProjectPathAbs, "*.csproj", SearchOption.TopDirectoryOnly)
                                       .FirstOrDefault();
                if (csproj is null)
                    throw new IOException($"MCP project directory does not contain a .csproj file: {mcpProjectPathAbs}");
                mcpProjectPathAbs = csproj;
            }

            if (!File.Exists(mcpProjectPathAbs) || !mcpProjectPathAbs.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase))
                throw new IOException($"MCP project path is not a valid .csproj file: {mcpProjectPathAbs}");

            var mcpWorkingDir = Path.GetDirectoryName(mcpProjectPathAbs)
                ?? currentDir;

            _logger.LogInformation("MCP server starting: command={Command}, projectPath={ProjectPath}, workingDir={WorkingDir}",
                mcpCommand, mcpProjectPathAbs, mcpWorkingDir);

            var mcpTask = McpClient.CreateAsync(
                new StdioClientTransport(new()
                {
                    Command = mcpCommand,
                    Arguments = new[]
                    {
                        "run",
                        "--project",
                        mcpProjectPathAbs,
                        "--no-build"
                    },
                    WorkingDirectory = mcpWorkingDir,
                    Name = "AI Automation MCP Server",
                }));

            _mcpClient = mcpTask.GetAwaiter().GetResult();
            _logger.LogInformation("✅ MCP client oluşturuldu ve bağlantı kuruldu");

            // 🔹 Tools al
            _tools = _mcpClient.ListToolsAsync().GetAwaiter().GetResult();
            _logger.LogInformation($"📥 MCP Server'dan {_tools.Count} tool alındı");

            foreach (var tool in _tools)
                _logger.LogInformation($"  🔧 {tool}");

            // 🔹 Proje dizinini LLM’e iletmek için system mesajı ekle
            _conversationHistory.Add(new ChatMessage(
                ChatRole.System,
                $"You are connected to a project located at: '{_projectDirectory}'. " +
                $"All file operations, code analysis invocations should assume this is the root directory."
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "McpClientService başlatılırken hata oluştu");
            throw;
        }
    }

    public async IAsyncEnumerable<string> GetStreamingResponseAsync(string userPrompt)
    {
        _conversationHistory.Add(new ChatMessage(ChatRole.User, userPrompt));

        List<ChatResponseUpdate> updates = new();

        await foreach (ChatResponseUpdate update in _chatClient.GetStreamingResponseAsync(
            _conversationHistory,
            new() { Tools = [.. _tools] }))
        {
            if (!string.IsNullOrEmpty(update.Text))
                yield return update.Text;

            updates.Add(update);
        }

        var fullResponse = new StringBuilder();
        foreach (var u in updates)
        {
            if (!string.IsNullOrEmpty(u.Text))
                fullResponse.Append(u.Text);
        }

        if (fullResponse.Length > 0)
            _conversationHistory.Add(new ChatMessage(ChatRole.Assistant, fullResponse.ToString()));
    }

    public async Task<string> GetResponseAsync(string userPrompt)
    {
        _conversationHistory.Add(new ChatMessage(ChatRole.User, userPrompt));

        StringBuilder fullResponse = new();

        await foreach (ChatResponseUpdate update in _chatClient.GetStreamingResponseAsync(
            _conversationHistory,
            new() { Tools = [.. _tools] }))
        {
            if (!string.IsNullOrEmpty(update.Text))
                fullResponse.Append(update.Text);
        }

        string responseText = fullResponse.ToString();

        if (!string.IsNullOrWhiteSpace(responseText))
            _conversationHistory.Add(new ChatMessage(ChatRole.Assistant, responseText));

        return responseText;
    }

    public IEnumerable<string> GetAvailableTools()
    {
        return _tools.Select(t => t.ToString() ?? string.Empty);
    }
}

