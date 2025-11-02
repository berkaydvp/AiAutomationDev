using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using McpWebApi.Models;
using McpWebApi.Services;

namespace McpWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        TokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { error = "Bu email adresi zaten kullanılıyor" });
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });
            }

            var token = _tokenService.GenerateJwtToken(user);

            _logger.LogInformation($"Yeni kullanıcı kaydedildi: {user.Email}");

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsAdmin = user.IsAdmin,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kayıt işlemi sırasında hata oluştu");
            return StatusCode(500, new { error = "Bir hata oluştu" });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Unauthorized(new { error = "Email veya şifre hatalı" });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized(new { error = "Email veya şifre hatalı" });
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var token = _tokenService.GenerateJwtToken(user);

            _logger.LogInformation($"Kullanıcı giriş yaptı: {user.Email}");

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsAdmin = user.IsAdmin,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Giriş işlemi sırasında hata oluştu");
            return StatusCode(500, new { error = "Bir hata oluştu" });
        }
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                isAdmin = user.IsAdmin,
                createdAt = user.CreatedAt,
                lastLoginAt = user.LastLoginAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı bilgisi alınırken hata oluştu");
            return StatusCode(500, new { error = "Bir hata oluştu" });
        }
    }

    [HttpGet("verify-admin")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult> VerifyAdmin()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { isAdmin = false, message = "Kullanıcı bulunamadı" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new { isAdmin = false, message = "Kullanıcı bulunamadı" });
            }

            // Token'daki claim'i de kontrol et
            var isAdminClaim = User.FindFirst("IsAdmin")?.Value;

            // Hem veritabanı hem de token claim'i kontrol et
            if (user.IsAdmin && isAdminClaim == "True")
            {
                return Ok(new { isAdmin = true });
            }

            return Ok(new { isAdmin = false, message = "Admin yetkisi yok" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin doğrulama sırasında hata oluştu");
            return StatusCode(500, new { isAdmin = false, error = "Bir hata oluştu" });
        }
    }
}
