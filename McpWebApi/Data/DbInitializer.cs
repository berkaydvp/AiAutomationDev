using Microsoft.AspNetCore.Identity;
using McpWebApi.Models;

namespace McpWebApi.Data;

public static class DbInitializer
{
    public static async Task SeedAdminUser(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        // Admin kullanıcısı var mı kontrol et
        var adminEmail = "admin@karavanmarket.com";
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);

        if (existingAdmin == null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                IsAdmin = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");

            if (result.Succeeded)
            {
                Console.WriteLine("✅ Admin kullanıcısı oluşturuldu:");
                Console.WriteLine($"   Email: {adminEmail}");
                Console.WriteLine($"   Şifre: Admin123!");
            }
            else
            {
                Console.WriteLine("❌ Admin kullanıcısı oluşturulamadı:");
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($"   - {error.Description}");
                }
            }
        }
        else
        {
            // Mevcut kullanıcının admin yetkisini güncelle
            if (!existingAdmin.IsAdmin)
            {
                existingAdmin.IsAdmin = true;
                await userManager.UpdateAsync(existingAdmin);
                Console.WriteLine("✅ Mevcut kullanıcı admin yapıldı");
            }
            else
            {
                Console.WriteLine("ℹ️  Admin kullanıcısı zaten mevcut");
            }
        }
    }
}
