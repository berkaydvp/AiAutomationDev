import { useState, useEffect } from 'react';
import './Analytics.css';
import { SalesChart } from './SalesChart';
import { TopProductsChart } from './TopProductsChart';
import { StatCards } from './StatCards';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    monthlyTotal: 0,
    yearlyTotal: 0,
    weeklyTotal: 0,
    totalOrders: 0,
    pendingOrders: 0,
    topProducts: [],
    allProductsSales: [],
    monthlySales: [],
    categorySales: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly'); // weekly, monthly, yearly

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Tüm siparişleri al
      const [ordersRes, productsRes] = await Promise.all([
        fetch('http://localhost:5029/api/orders/admin/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5029/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (ordersRes.ok && productsRes.ok) {
        const orders = await ordersRes.json();
        const products = await productsRes.json();
        
        const analytics = calculateAnalytics(orders, products);
        setAnalyticsData(analytics);
      }
    } catch (error) {
      console.error('Analiz verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (orders, products) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Bu haftanın başlangıcı (Pazar)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    // Tamamlanmış siparişler (Onaylanan + Teslim edilen)
    const completedOrders = orders.filter(o => o.status === 1 || o.status === 2);
    
    // Bu ayki siparişler
    const monthlyOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    // Bu yılki siparişler
    const yearlyOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === currentYear;
    });
    
    // Bu haftaki siparişler
    const weeklyOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= currentWeekStart;
    });

    // Toplam satışlar
    const monthlyTotal = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const yearlyTotal = yearlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const weeklyTotal = weeklyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Zaman aralığına göre filtreleme
    let filteredOrders = completedOrders;
    if (timeRange === 'weekly') {
      filteredOrders = weeklyOrders;
    } else if (timeRange === 'monthly') {
      filteredOrders = monthlyOrders;
    } else if (timeRange === 'yearly') {
      filteredOrders = yearlyOrders;
    }

    // Ürün satış istatistikleri (seçili zaman aralığı için)
    const productSales = {};
    filteredOrders.forEach(order => {
      order.orderItems?.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.totalPrice;
        } else {
          productSales[item.productId] = {
            productId: item.productId,
            name: item.product?.name || 'Bilinmeyen Ürün',
            quantity: item.quantity,
            revenue: item.totalPrice
          };
        }
      });
    });
    
    // Tüm ürünlerin satış verileri
    const allProductsSales = products.map(product => {
      const sales = productSales[product.id] || {
        productId: product.id,
        name: product.name,
        quantity: 0,
        revenue: 0
      };
      return {
        ...sales,
        currentStock: product.stock
      };
    }).sort((a, b) => b.quantity - a.quantity);

    // En çok satılan ürünler (Miktar bazında)
    const topProducts = allProductsSales.slice(0, 5);

    // Aylık satış trendi (Son 12 ay)
    const monthlySales = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const monthName = month.toLocaleDateString('tr-TR', { month: 'short' });
      
      const monthOrders = completedOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === month.getMonth() && 
               orderDate.getFullYear() === month.getFullYear();
      });
      
      const total = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      monthlySales.push({ month: monthName, total, orderCount: monthOrders.length });
    }

    // Kategori bazlı satışlar (seçili zaman aralığı için)
    const categorySales = {};
    filteredOrders.forEach(order => {
      order.orderItems?.forEach(item => {
        const categoryName = item.product?.category?.name || 'Diğer';
        if (categorySales[categoryName]) {
          categorySales[categoryName] += item.totalPrice;
        } else {
          categorySales[categoryName] = item.totalPrice;
        }
      });
    });

    const categoryData = Object.entries(categorySales).map(([name, value]) => ({
      name,
      value
    }));

    // Bekleyen sipariş sayısı
    const pendingOrders = orders.filter(o => o.status === 0).length;

    return {
      monthlyTotal,
      yearlyTotal,
      weeklyTotal,
      totalOrders: completedOrders.length,
      pendingOrders,
      topProducts,
      allProductsSales,
      monthlySales,
      categorySales: categoryData
    };
  };

  if (loading) {
    return <div className="analytics-loading">Analiz verileri yükleniyor...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>📊 Satış Analizleri</h3>
        <div className="analytics-controls">
          <div className="time-range-selector">
            <button 
              className={`time-range-btn ${timeRange === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeRange('weekly')}
            >
              📅 Haftalık
            </button>
            <button 
              className={`time-range-btn ${timeRange === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeRange('monthly')}
            >
              📆 Aylık
            </button>
            <button 
              className={`time-range-btn ${timeRange === 'yearly' ? 'active' : ''}`}
              onClick={() => setTimeRange('yearly')}
            >
              📊 Yıllık
            </button>
          </div>
          <button className="btn-refresh" onClick={fetchAnalytics}>
            🔄 Yenile
          </button>
        </div>
      </div>

      <StatCards data={analyticsData} timeRange={timeRange} />

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>📈 Aylık Satış Trendi (Son 12 Ay)</h4>
          <SalesChart data={analyticsData.monthlySales} />
        </div>

        <div className="analytics-card">
          <h4>🏆 En Çok Satılan Ürünler ({timeRange === 'weekly' ? 'Bu Hafta' : timeRange === 'monthly' ? 'Bu Ay' : 'Bu Yıl'})</h4>
          <TopProductsChart data={analyticsData.topProducts} />
        </div>

        <div className="analytics-card">
          <h4>📊 Kategori Bazlı Satışlar ({timeRange === 'weekly' ? 'Bu Hafta' : timeRange === 'monthly' ? 'Bu Ay' : 'Bu Yıl'})</h4>
          <div className="category-sales">
            {analyticsData.categorySales.map((cat, idx) => (
              <div key={idx} className="category-bar">
                <div className="category-info">
                  <span>{cat.name}</span>
                  <span className="category-value">{cat.value.toFixed(2)} TL</span>
                </div>
                <div className="category-progress">
                  <div 
                    className="category-progress-fill"
                    style={{ 
                      width: `${(cat.value / Math.max(...analyticsData.categorySales.map(c => c.value))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="analytics-card full-width">
          <h4>📦 Tüm Ürünlerin Satış Detayları ({timeRange === 'weekly' ? 'Bu Hafta' : timeRange === 'monthly' ? 'Bu Ay' : 'Bu Yıl'})</h4>
          <div className="products-table-container">
            <table className="products-sales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ürün Adı</th>
                  <th>Satılan Miktar</th>
                  <th>Toplam Gelir</th>
                  <th>Mevcut Stok</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.allProductsSales.map((product, index) => (
                  <tr key={product.productId} className={product.quantity > 0 ? 'has-sales' : 'no-sales'}>
                    <td>{index + 1}</td>
                    <td className="product-name">{product.name}</td>
                    <td className="quantity">
                      {product.quantity > 0 ? (
                        <span className="quantity-badge">{product.quantity} adet</span>
                      ) : (
                        <span className="no-sales-text">-</span>
                      )}
                    </td>
                    <td className="revenue">
                      {product.revenue > 0 ? (
                        <span className="revenue-amount">{product.revenue.toFixed(2)} TL</span>
                      ) : (
                        <span className="no-sales-text">-</span>
                      )}
                    </td>
                    <td className="stock">
                      <span className={`stock-badge ${product.currentStock < 10 ? 'low-stock' : ''}`}>
                        {product.currentStock} adet
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
