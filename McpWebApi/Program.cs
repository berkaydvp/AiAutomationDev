using McpWebApi.Services;
using McpWebApi.Data;
using McpWebApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Add Database Context
// Program.cs içinde AddDbContext kısmı

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    // 1) Öncelik: Ortam değişkeni
    var envConn = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

    // 2) Yedek: appsettings ConnectionStrings:DefaultConnection
    var cfgConn = builder.Configuration.GetConnectionString("DefaultConnection");

    // Bazı ortamlar appsettings.Development.json içinde "<set-via-env: ...>" gibi
    // yer tutucular kullanıyor. Bunları da "boş" kabul edelim.
    bool IsPlaceholder(string? s) =>
        string.IsNullOrWhiteSpace(s) || s.TrimStart().StartsWith("<set-via-env", StringComparison.OrdinalIgnoreCase);

    string? connectionString = null;

    if (!IsPlaceholder(envConn))
    {
        connectionString = envConn;
        Console.WriteLine("BILGI: Veritabanı bağlantısı ortam değişkeninden alındı (ConnectionStrings__DefaultConnection)");
    }
    else if (!IsPlaceholder(cfgConn))
    {
        connectionString = cfgConn;
        Console.WriteLine("BILGI: Veritabanı bağlantısı appsettings.* dosyalarından alındı");
    }

    if (IsPlaceholder(connectionString))
    {
        throw new InvalidOperationException(
            "Veritabanı bağlantı dizesi bulunamadı. Lütfen ConnectionStrings__DefaultConnection ortam değişkenini ayarlayın veya appsettings.json içinde geçerli bir ConnectionStrings:DefaultConnection tanımlayın.");
    }

    options.UseSqlServer(connectionString!);
});

// Add Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Add CORS policy (configurable via Cors:AllowedOrigins)
var allowedOriginsCsv = builder.Configuration["Cors:AllowedOrigins"];
builder.Services.AddCors(options =>
{
    if (!string.IsNullOrWhiteSpace(allowedOriginsCsv))
    {
        var origins = allowedOriginsCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        options.AddPolicy("ConfiguredOrigins", policy =>
        {
            policy.WithOrigins(origins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
    else
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
});

// Register Services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<McpClientService>();
builder.Services.AddScoped<TokenService>();

var app = builder.Build();

// Seed Admin User
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DbInitializer.SeedAdminUser(services);
        await DbSeeder.SeedSampleData(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabanı başlatma hatası");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// IMPORTANT: UseDefaultFiles MUST come before UseStaticFiles
app.UseDefaultFiles();
app.UseStaticFiles();

// Enable CORS
app.UseCors(!string.IsNullOrWhiteSpace(allowedOriginsCsv) ? "ConfiguredOrigins" : "AllowAll");

app.UseHttpsRedirection();

// Add Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply pending EF Core migrations on startup
try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
    }
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "An error occurred while migrating the database on startup.");
    throw;
}

app.Run();
