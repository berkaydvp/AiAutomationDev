using Microsoft.AspNetCore.Mvc;
using McpWebApi.Models;
using McpWebApi.Services;

namespace McpWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly McpClientService _mcpService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(McpClientService mcpService, ILogger<ChatController> logger)
    {
        _mcpService = mcpService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ChatResponse>> Chat([FromBody] ChatRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
            {
                return BadRequest(new { error = "Prompt boş olamaz" });
            }

            _logger.LogInformation($"Prompt alındı: {request.Prompt}");

            var response = await _mcpService.GetResponseAsync(request.Prompt);

            return Ok(new ChatResponse
            {
                Response = response,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat işlemi sırasında hata oluştu");
            return StatusCode(500, new { error = "Bir hata oluştu: " + ex.Message });
        }
    }

    [HttpPost("stream")]
    public async Task StreamChat([FromBody] ChatRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Prompt))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Prompt boş olamaz");
                return;
            }

            _logger.LogInformation($"Streaming prompt alındı: {request.Prompt}");

            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";

            await foreach (var text in _mcpService.GetStreamingResponseAsync(request.Prompt))
            {
                await Response.WriteAsync($"data: {text}\n\n");
                await Response.Body.FlushAsync();
            }

            await Response.WriteAsync("data: [DONE]\n\n");
            await Response.Body.FlushAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Streaming chat işlemi sırasında hata oluştu");
            await Response.WriteAsync($"data: {{\"error\": \"{ex.Message}\"}}\n\n");
        }
    }

    [HttpGet("tools")]
    public ActionResult<IEnumerable<string>> GetTools()
    {
        try
        {
            var tools = _mcpService.GetAvailableTools();
            return Ok(tools);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tools alınırken hata oluştu");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
