namespace McpWebApi.Models;

public class Product
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int CategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public string? Brand { get; set; }
    public string? Images { get; set; } // JSON string array of image URLs
    public string? Features { get; set; } // JSON string array of features
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation property
    public Category? Category { get; set; }
}
