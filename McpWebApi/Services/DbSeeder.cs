using McpWebApi.Data;
using McpWebApi.Models;
using Microsoft.EntityFrameworkCore;

namespace McpWebApi.Services;

public static class DbSeeder
{
    public static async Task SeedSampleData(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Check if we already have categories
        if (await context.Categories.AnyAsync())
        {
            Console.WriteLine("✅ Örnek veriler zaten mevcut, atlanıyor...");
            return;
        }

        // Create categories
        var categories = new List<Category>
        {
            new Category
            {
                Name = "Elektrik ve Aydınlatma",
                Description = "Karavan elektrik sistemleri, LED lambalar, invertörler"
            },
            new Category
            {
                Name = "Su Sistemleri",
                Description = "Su tankları, pompalar, filtreler ve bağlantı elemanları"
            },
            new Category
            {
                Name = "Isıtma ve Soğutma",
                Description = "Kalorifer, klima, soğutucu sistemleri"
            },
            new Category
            {
                Name = "Mobilya ve İç Dekorasyon",
                Description = "Oturma grupları, masalar, yatak takımları"
            },
            new Category
            {
                Name = "Güvenlik Sistemleri",
                Description = "Alarm sistemleri, kameralar, kilitleme sistemleri"
            }
        };

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();

        // Create products
        var products = new List<Product>
        {
            // Elektrik ve Aydınlatma
            new Product
            {
                Name = "12V LED Tavan Lambası",
                Description = "Enerji tasarruflu 12V LED tavan aydınlatma sistemi. 3000K sıcak beyaz ışık.",
                Price = 350,
                Stock = 15,
                CategoryId = categories[0].Id,
                ImageUrl = "https://images.unsplash.com/photo-1565894087191-2338ec5e5e38?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "1000W Saf Sinüs İnvertör",
                Description = "12V DC giriş 220V AC çıkış. Dizüstü bilgisayar ve hassas cihazlar için ideal.",
                Price = 1500,
                Stock = 8,
                CategoryId = categories[0].Id,
                ImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "Güneş Paneli 100W",
                Description = "Monokristal güneş paneli. %22 verimlilik oranı.",
                Price = 1200,
                Stock = 12,
                CategoryId = categories[0].Id,
                ImageUrl = "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400",
                IsActive = true
            },

            // Su Sistemleri
            new Product
            {
                Name = "100L Su Tankı",
                Description = "Gıdaya uygun plastik malzeme. Kolay montaj.",
                Price = 850,
                Stock = 10,
                CategoryId = categories[1].Id,
                ImageUrl = "https://images.unsplash.com/photo-1582735689030-f1e8401368fe?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "12V Su Pompası",
                Description = "Sessiz çalışma. 10L/dakika kapasiteli.",
                Price = 450,
                Stock = 20,
                CategoryId = categories[1].Id,
                ImageUrl = "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400",
                IsActive = true
            },

            // Isıtma ve Soğutma
            new Product
            {
                Name = "Dizel Kalorifer 2kW",
                Description = "Düşük yakıt tüketimi. Otomatik termostat kontrolü.",
                Price = 3500,
                Stock = 5,
                CategoryId = categories[2].Id,
                ImageUrl = "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "12V Kompresörlü Buzdolabı 40L",
                Description = "Enerji verimli kompresörlü sistem. -18°C derin dondurucu.",
                Price = 5500,
                Stock = 6,
                CategoryId = categories[2].Id,
                ImageUrl = "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400",
                IsActive = true
            },

            // Mobilya ve İç Dekorasyon
            new Product
            {
                Name = "Katlanır Masa",
                Description = "60x80cm ebadında katlanabilir yemek masası.",
                Price = 750,
                Stock = 12,
                CategoryId = categories[3].Id,
                ImageUrl = "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "Ortopedik Yatak 190x140",
                Description = "Yüksek yoğunluklu sünger. Çıkarılabilir kılıf.",
                Price = 2200,
                Stock = 8,
                CategoryId = categories[3].Id,
                ImageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400",
                IsActive = true
            },

            // Güvenlik Sistemleri
            new Product
            {
                Name = "Kablosuz Alarm Sistemi",
                Description = "4 sensörlü alarm sistemi. Mobil bildirim özelliği.",
                Price = 1800,
                Stock = 10,
                CategoryId = categories[4].Id,
                ImageUrl = "https://images.unsplash.com/photo-1558002038-1055907df827?w=400",
                IsActive = true
            },
            new Product
            {
                Name = "Gece Görüşlü Kamera",
                Description = "Full HD kayıt. 15m gece görüş mesafesi.",
                Price = 950,
                Stock = 15,
                CategoryId = categories[4].Id,
                ImageUrl = "https://images.unsplash.com/photo-1557597774-9d475d8a9ee8?w=400",
                IsActive = true
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        Console.WriteLine("✅ Örnek veriler başarıyla eklendi!");
        Console.WriteLine($"   - {categories.Count} kategori");
        Console.WriteLine($"   - {products.Count} ürün");
    }
}
