namespace McpWebApi.Models;

public class ChatResponse
{
    public string Response { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
