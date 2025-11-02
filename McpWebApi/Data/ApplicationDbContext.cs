using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace McpWebApi.Data;

public class ApplicationDbContext : IdentityDbContext<Models.ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Models.Product> Products { get; set; }
    public DbSet<Models.Category> Categories { get; set; }
    public DbSet<Models.Order> Orders { get; set; }
    public DbSet<Models.OrderItem> OrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize table names if needed test
        builder.Entity<Models.ApplicationUser>().ToTable("Users");

        // Configure Product entity
        builder.Entity<Models.Product>()
            .Property(p => p.Price)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Models.Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure Order entity
        builder.Entity<Models.Order>()
            .Property(o => o.TotalAmount)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Models.Order>()
            .HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Models.Order>()
            .HasOne(o => o.ApprovedByUser)
            .WithMany()
            .HasForeignKey(o => o.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure OrderItem entity
        builder.Entity<Models.OrderItem>()
            .Property(oi => oi.UnitPrice)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Models.OrderItem>()
            .Property(oi => oi.TotalPrice)
            .HasColumnType("decimal(18,2)");

        builder.Entity<Models.OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.OrderItems)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Models.OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
