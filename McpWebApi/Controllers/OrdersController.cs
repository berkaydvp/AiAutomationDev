using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using McpWebApi.Attributes;
using McpWebApi.Data;
using McpWebApi.Models;
using System.Security.Claims;

namespace McpWebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/orders - Müşteri sipariş oluşturur
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        // Ürünleri kontrol et ve fiyatları al
        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Distinct().Count())
        {
            return BadRequest("Geçersiz ürün ID'leri");
        }

        // Sipariş oluştur
        var order = new Order
        {
            UserId = userId,
            Address = request.Address,
            PhoneNumber = request.PhoneNumber,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        decimal totalAmount = 0;

        // Sipariş kalemlerini oluştur
        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                return BadRequest($"Ürün bulunamadı: {item.ProductId}");
            }

            if (product.Stock < item.Quantity)
            {
                return BadRequest($"Yetersiz stok: {product.Name}. Mevcut: {product.Stock}, İstenen: {item.Quantity}");
            }

            var orderItem = new OrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                TotalPrice = product.Price * item.Quantity
            };

            totalAmount += orderItem.TotalPrice;
            order.OrderItems.Add(orderItem);
        }

        order.TotalAmount = totalAmount;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        // İlişkili verileri yükle
        await _context.Entry(order)
            .Collection(o => o.OrderItems)
            .Query()
            .Include(oi => oi.Product)
            .LoadAsync();

        await _context.Entry(order)
            .Reference(o => o.User)
            .LoadAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    // GET: api/orders/my - Kullanıcının kendi siparişleri
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<Order>>> GetMyOrders()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized();
        }

        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders;
    }

    // GET: api/orders/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.FindFirstValue("IsAdmin") == "True";

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.User)
            .Include(o => o.ApprovedByUser)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        // Sadece kendi siparişini veya admin görebilir
        if (order.UserId != userId && !isAdmin)
        {
            return Forbid();
        }

        return order;
    }

    // GET: api/orders/admin/all - Admin: Tüm siparişler
    [HttpGet("admin/all")]
    [RequireAdmin]
    public async Task<ActionResult<IEnumerable<Order>>> GetAllOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.User)
            .Include(o => o.ApprovedByUser)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders;
    }

    // GET: api/orders/admin/pending - Admin: Bekleyen talepler
    [HttpGet("admin/pending")]
    [RequireAdmin]
    public async Task<ActionResult<IEnumerable<Order>>> GetPendingOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.User)
            .Where(o => o.Status == OrderStatus.Pending)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders;
    }

    // GET: api/orders/admin/approved - Admin: Onaylananlar
    [HttpGet("admin/approved")]
    [RequireAdmin]
    public async Task<ActionResult<IEnumerable<Order>>> GetApprovedOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.User)
            .Include(o => o.ApprovedByUser)
            .Where(o => o.Status == OrderStatus.Approved)
            .OrderByDescending(o => o.ApprovedAt)
            .ToListAsync();

        return orders;
    }

    // GET: api/orders/admin/delivered - Admin: Teslim edilenler
    [HttpGet("admin/delivered")]
    [RequireAdmin]
    public async Task<ActionResult<IEnumerable<Order>>> GetDeliveredOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Include(o => o.User)
            .Include(o => o.ApprovedByUser)
            .Where(o => o.Status == OrderStatus.Delivered)
            .OrderByDescending(o => o.DeliveredAt)
            .ToListAsync();

        return orders;
    }

    // POST: api/orders/{id}/approve - Admin: Siparişi onayla
    [HttpPost("{id}/approve")]
    [RequireAdmin]
    public async Task<IActionResult> ApproveOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        if (order.Status != OrderStatus.Pending)
        {
            return BadRequest("Sadece bekleyen siparişler onaylanabilir");
        }

        // Stok kontrolü
        foreach (var item in order.OrderItems)
        {
            if (item.Product.Stock < item.Quantity)
            {
                return BadRequest($"Yetersiz stok: {item.Product.Name}. Mevcut: {item.Product.Stock}, İstenen: {item.Quantity}");
            }
        }

        // Stokları azalt
        foreach (var item in order.OrderItems)
        {
            item.Product.Stock -= item.Quantity;
        }

        order.Status = OrderStatus.Approved;
        order.ApprovedAt = DateTime.UtcNow;
        order.ApprovedByUserId = userId;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/orders/{id}/deliver - Admin: Siparişi teslim et
    [HttpPost("{id}/deliver")]
    [RequireAdmin]
    public async Task<IActionResult> DeliverOrder(int id)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound();
        }

        if (order.Status != OrderStatus.Approved)
        {
            return BadRequest("Sadece onaylanmış siparişler teslim edilebilir");
        }

        order.Status = OrderStatus.Delivered;
        order.DeliveredAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/orders/{id} - Bekleyen siparişi iptal et
    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelOrder(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.FindFirstValue("IsAdmin") == "True";

        var order = await _context.Orders.FindAsync(id);

        if (order == null)
        {
            return NotFound();
        }

        // Sadece kendi siparişini veya admin iptal edebilir
        if (order.UserId != userId && !isAdmin)
        {
            return Forbid();
        }

        if (order.Status != OrderStatus.Pending)
        {
            return BadRequest("Sadece bekleyen siparişler iptal edilebilir");
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
