namespace McpWebApi.Models;

public class OrderItem
{
    public int Id { get; set; }

    // İlişkiler
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // Sipariş detayları
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; } // Sipariş anındaki fiyat
    public decimal TotalPrice { get; set; } // Quantity * UnitPrice
}
