import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5029/api/orders/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Beklemede';
      case 1: return 'Onaylandı';
      case 2: return 'Teslim Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 0: return 'status-pending';
      case 1: return 'status-approved';
      case 2: return 'status-delivered';
      default: return '';
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5029/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Sipariş iptal edildi');
        fetchOrders();
      } else {
        const error = await response.text();
        alert('Hata: ' + error);
      }
    } catch (error) {
      console.error('Sipariş iptal hatası:', error);
      alert('Sipariş iptal edilirken bir hata oluştu');
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="my-orders">
      <div className="orders-header">
        <h2>Siparişlerim</h2>
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Ana Sayfa
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <h3>Henüz siparişiniz yok</h3>
          <button className="btn-shop" onClick={() => navigate('/')}>
            Alışverişe Başla
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Sipariş #{order.id}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="order-details">
                <div className="order-info">
                  <p><strong>Adres:</strong> {order.address}</p>
                  <p><strong>Telefon:</strong> {order.phoneNumber}</p>
                </div>

                <div className="order-items">
                  <h4>Ürünler:</h4>
                  {order.orderItems.map(item => (
                    <div key={item.id} className="order-item">
                      <span>{item.product.name}</span>
                      <span>{item.quantity} adet × {item.unitPrice} TL</span>
                      <span className="item-total">{item.totalPrice} TL</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Toplam:</strong>
                  <strong>{order.totalAmount} TL</strong>
                </div>

                {order.status === 0 && (
                  <button 
                    className="btn-cancel"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Siparişi İptal Et
                  </button>
                )}

                {order.status === 1 && order.approvedAt && (
                  <p className="approval-info">
                    ✓ {new Date(order.approvedAt).toLocaleDateString('tr-TR')} tarihinde onaylandı
                  </p>
                )}

                {order.status === 2 && order.deliveredAt && (
                  <p className="delivery-info">
                    ✓ {new Date(order.deliveredAt).toLocaleDateString('tr-TR')} tarihinde teslim edildi
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
