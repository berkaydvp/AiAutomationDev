namespace McpWebApi.Models;

public enum OrderStatus
{
    Pending,    // Bekleyen talep
    Approved,   // Onaylanmış
    Delivered   // Teslim edilmiş
}

public class Order
{
    public int Id { get; set; }

    // Müşteri bilgileri
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;

    // Teslimat bilgileri
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    // Sipariş durumu
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // Toplam tutar
    public decimal TotalAmount { get; set; }

    // Sipariş kalemleri
    public List<OrderItem> OrderItems { get; set; } = new();

    // Tarihler
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }

    // Admin onay bilgisi
    public string? ApprovedByUserId { get; set; }
    public ApplicationUser? ApprovedByUser { get; set; }
}
