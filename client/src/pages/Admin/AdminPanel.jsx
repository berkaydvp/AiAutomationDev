import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import { Analytics } from './Analytics';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderTab, setOrderTab] = useState('pending'); // pending, approved, delivered
  const [orderCounts, setOrderCounts] = useState({ pending: 0, approved: 0, delivered: 0 }); // Sipariş sayaçları
  const [expandedOrderId, setExpandedOrderId] = useState(null); // Açık sipariş ID'si
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); // Kategori filtresi
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // AI Chat Modal state
  const [showAiChat, setShowAiChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Backend'den admin doğrulaması yap
    verifyAdminAccess(token, parsedUser);
  }, [navigate]);

  const verifyAdminAccess = async (token, userData) => {
    try {
      const response = await fetch('http://localhost:5029/api/auth/verify-admin', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Yetkilendirme hatası');
      }

      const data = await response.json();
      
      if (!data.isAdmin) {
        alert('Bu sayfaya erişim yetkiniz yok!');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      // Admin doğrulandı, devam et
      setUser(userData);
      fetchProducts();
      fetchCategories();
      fetchOrders();
    } catch (error) {
      console.error('Admin doğrulama hatası:', error);
      alert('Yetki doğrulaması yapılamadı. Lütfen tekrar giriş yapın.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5029/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5029/api/categories', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filtrelenmiş ürünleri getir
  const getFilteredProducts = () => {
    if (selectedCategoryFilter === null) {
      return products;
    }
    return products.filter(product => product.categoryId === selectedCategoryFilter);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    
    // Images array'ini hazırla
    const imagesInput = formData.get('images');
    const imagesArray = imagesInput ? imagesInput.split('\n').map(url => url.trim()).filter(url => url) : [];
    
    // Features array'ini hazırla
    const featuresInput = formData.get('features');
    const featuresArray = featuresInput ? featuresInput.split('\n').map(f => f.trim()).filter(f => f) : [];
    
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')),
      categoryId: parseInt(formData.get('categoryId')),
      imageUrl: formData.get('imageUrl'),
      brand: formData.get('brand') || null,
      images: imagesArray.length > 0 ? JSON.stringify(imagesArray) : null,
      features: featuresArray.length > 0 ? JSON.stringify(featuresArray) : null,
      isActive: formData.get('isActive') === 'on'
    };

    const url = editingProduct 
      ? `http://localhost:5029/api/products/${editingProduct.id}`
      : 'http://localhost:5029/api/products';
    
    const method = editingProduct ? 'PUT' : 'POST';

    if (editingProduct) {
      productData.id = editingProduct.id;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      fetchProducts();
      setShowProductForm(false);
      setEditingProduct(null);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData(e.target);
    
    const categoryData = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    const url = editingCategory 
      ? `http://localhost:5029/api/categories/${editingCategory.id}`
      : 'http://localhost:5029/api/categories';
    
    const method = editingCategory ? 'PUT' : 'POST';

    if (editingCategory) {
      categoryData.id = editingCategory.id;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });

    if (response.ok) {
      fetchCategories();
      setShowCategoryForm(false);
      setEditingCategory(null);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5029/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      fetchProducts();
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5029/api/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      fetchCategories();
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5029/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: currentMessage })
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sipariş fonksiyonları
  const fetchOrderCounts = async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Tüm sipariş tiplerinin sayısını paralel olarak al
      const [pendingRes, approvedRes, deliveredRes] = await Promise.all([
        fetch('http://localhost:5029/api/orders/admin/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5029/api/orders/admin/approved', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5029/api/orders/admin/delivered', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [pendingData, approvedData, deliveredData] = await Promise.all([
        pendingRes.ok ? pendingRes.json() : [],
        approvedRes.ok ? approvedRes.json() : [],
        deliveredRes.ok ? deliveredRes.json() : []
      ]);

      setOrderCounts({
        pending: pendingData.length || 0,
        approved: approvedData.length || 0,
        delivered: deliveredData.length || 0
      });
    } catch (error) {
      console.error('Sipariş sayıları yüklenirken hata:', error);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    let endpoint = 'http://localhost:5029/api/orders/admin/';
    
    switch (orderTab) {
      case 'pending':
        endpoint += 'pending';
        break;
      case 'approved':
        endpoint += 'approved';
        break;
      case 'delivered':
        endpoint += 'delivered';
        break;
      default:
        endpoint += 'all';
    }

    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
      fetchOrderCounts(); // Sayaçları da güncelle
    }
  }, [activeTab, orderTab, user]);

  const handleApproveOrder = async (orderId) => {
    if (!confirm('Bu siparişi onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5029/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Sipariş onaylandı!');
        fetchOrders();
        fetchOrderCounts(); // Sayaçları güncelle
      } else {
        const error = await response.text();
        alert('Hata: ' + error);
      }
    } catch (error) {
      console.error('Onaylama hatası:', error);
      alert('Sipariş onaylanırken bir hata oluştu');
    }
  };

  const handleDeliverOrder = async (orderId) => {
    if (!confirm('Bu siparişi teslim edildi olarak işaretlemek istediğinizden emin misiniz?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5029/api/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Sipariş teslim edildi olarak işaretlendi!');
        fetchOrders();
        fetchOrderCounts(); // Sayaçları güncelle
      } else {
        const error = await response.text();
        alert('Hata: ' + error);
      }
    } catch (error) {
      console.error('Teslim hatası:', error);
      alert('İşlem sırasında bir hata oluştu');
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 0: return 'Beklemede';
      case 1: return 'Onaylandı';
      case 2: return 'Teslim Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const toggleOrderDetail = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!user) return <div>Yükleniyor...</div>;

  return (
    <div className="admin-panel">
      <nav className="admin-nav">
        <div className="admin-nav-brand">
          <h2>🚐 Karavan Market Admin</h2>
          <span className="admin-badge">Admin</span>
        </div>
        <div className="admin-nav-user">
          <span>Hoşgeldin, {user.firstName}!</span>
          <button onClick={handleLogout} className="btn-logout">Çıkış</button>
        </div>
      </nav>

      <div className="admin-container">
        <aside className="admin-sidebar">
          <ul className="admin-menu">
            <li 
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              📊 Analiz
            </li>
            <li 
              className={activeTab === 'products' ? 'active' : ''}
              onClick={() => setActiveTab('products')}
            >
              📦 Ürünler
            </li>
            <li 
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
            >
              🏷️ Kategoriler
            </li>
            <li 
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              🛒 Siparişler
            </li>
            <li 
              className={activeTab === 'offers' ? 'active' : ''}
              onClick={() => setActiveTab('offers')}
            >
              📝 Teklifler
            </li>
          </ul>
          
          <button 
            className="mcp-toggle-btn"
            onClick={() => setShowAiChat(true)}
          >
            🤖 AI Chat
          </button>
        </aside>

        <main className="admin-content">
          {activeTab === 'analytics' && (
            <Analytics />
          )}

          {activeTab === 'products' && (
            <div className="products-section">
              <div className="section-header">
                <h3>Ürünler</h3>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductForm(true);
                  }}
                >
                  + Yeni Ürün
                </button>
              </div>

              {/* Kategori Filtresi */}
              <div className="category-filter">
                <label>Kategori Filtresi:</label>
                <div className="filter-buttons">
                  <button 
                    className={selectedCategoryFilter === null ? 'active' : ''}
                    onClick={() => setSelectedCategoryFilter(null)}
                  >
                    Tümü ({products.length})
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={selectedCategoryFilter === category.id ? 'active' : ''}
                      onClick={() => setSelectedCategoryFilter(category.id)}
                    >
                      {category.name} ({products.filter(p => p.categoryId === category.id).length})
                    </button>
                  ))}
                </div>
              </div>

              {showProductForm && (
                <div className="modal-overlay" onClick={() => setShowProductForm(false)}>
                  <div className="modal-content product-form-modal" onClick={e => e.stopPropagation()}>
                    <h4>{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h4>
                    <form onSubmit={handleProductSubmit}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Ürün Adı *</label>
                          <input name="name" placeholder="Ürün Adı" defaultValue={editingProduct?.name} required />
                        </div>
                        <div className="form-group">
                          <label>Marka</label>
                          <input 
                            name="brand" 
                            placeholder="Örn: Bosch, Dometic" 
                            defaultValue={editingProduct?.brand || ''} 
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Açıklama</label>
                        <textarea name="description" placeholder="Ürün açıklaması" defaultValue={editingProduct?.description} rows="3" />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Fiyat *</label>
                          <input name="price" type="number" step="0.01" placeholder="0.00" defaultValue={editingProduct?.price} required />
                        </div>
                        <div className="form-group">
                          <label>Stok *</label>
                          <input name="stock" type="number" placeholder="0" defaultValue={editingProduct?.stock} required />
                        </div>
                        <div className="form-group">
                          <label>Kategori *</label>
                          <select name="categoryId" defaultValue={editingProduct?.categoryId} required>
                            <option value="">Kategori Seçin</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Ana Görsel URL</label>
                        <input name="imageUrl" placeholder="https://..." defaultValue={editingProduct?.imageUrl} />
                      </div>
                      
                      <div className="form-group">
                        <label>Ek Görseller (Her satıra bir URL)</label>
                        <textarea 
                          name="images" 
                          placeholder="https://image1.jpg\nhttps://image2.jpg\nhttps://image3.jpg" 
                          defaultValue={editingProduct?.images ? JSON.parse(editingProduct.images).join('\n') : ''} 
                          rows="4"
                        />
                        <small className="form-hint">Her satıra bir görsel URL'si yazın</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Özellikler (Her satıra bir özellik)</label>
                        <textarea 
                          name="features" 
                          placeholder="Su geçirmez\n12V enerji\nHafif tasarım" 
                          defaultValue={editingProduct?.features ? JSON.parse(editingProduct.features).join('\n') : ''} 
                          rows="5"
                        />
                        <small className="form-hint">Her satıra bir özellik yazın</small>
                      </div>
                      
                      <label className="checkbox-label">
                        <input name="isActive" type="checkbox" defaultChecked={editingProduct?.isActive ?? true} />
                        <span>Aktif</span>
                      </label>
                      
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">💾 Kaydet</button>
                        <button type="button" className="btn-secondary" onClick={() => setShowProductForm(false)}>❌ İptal</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="products-grid">
                {getFilteredProducts().map(product => (
                  <div key={product.id} className="product-card">
                    {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
                    <h4>{product.name}</h4>
                    <p className="product-price">{product.price} TL</p>
                    <p className="product-stock">Stok: {product.stock}</p>
                    <p className="product-category">{product.category?.name}</p>
                    <div className="product-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => {
                          setEditingProduct(product);
                          setShowProductForm(true);
                        }}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="categories-section">
              <div className="section-header">
                <h3>Kategoriler</h3>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryForm(true);
                  }}
                >
                  + Yeni Kategori
                </button>
              </div>

              {showCategoryForm && (
                <div className="modal-overlay" onClick={() => setShowCategoryForm(false)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h4>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</h4>
                    <form onSubmit={handleCategorySubmit}>
                      <input name="name" placeholder="Kategori Adı" defaultValue={editingCategory?.name} required />
                      <textarea name="description" placeholder="Açıklama" defaultValue={editingCategory?.description} />
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">Kaydet</button>
                        <button type="button" className="btn-secondary" onClick={() => setShowCategoryForm(false)}>İptal</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <table className="categories-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Kategori Adı</th>
                    <th>Açıklama</th>
                    <th>Ürün Sayısı</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.name}</td>
                      <td>{category.description}</td>
                      <td>{category.products?.length || 0}</td>
                      <td>
                        <button 
                          className="btn-edit"
                          onClick={() => {
                            setEditingCategory(category);
                            setShowCategoryForm(true);
                          }}
                        >
                          Düzenle
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-section">
              <div className="section-header">
                <h3>Siparişler</h3>
              </div>

              <div className="order-tabs">
                <button 
                  className={orderTab === 'pending' ? 'active' : ''}
                  onClick={() => setOrderTab('pending')}
                >
                  📋 Talepler ({orderCounts.pending})
                </button>
                <button 
                  className={orderTab === 'approved' ? 'active' : ''}
                  onClick={() => setOrderTab('approved')}
                >
                  ✅ Onaylananlar ({orderCounts.approved})
                </button>
                <button 
                  className={orderTab === 'delivered' ? 'active' : ''}
                  onClick={() => setOrderTab('delivered')}
                >
                  📦 Teslim Edilenler ({orderCounts.delivered})
                </button>
              </div>

              <div className="orders-list">
                {orders.length === 0 ? (
                  <div className="empty-state">
                    <p>Bu kategoride sipariş bulunmamaktadır.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className={`order-card-admin ${expandedOrderId === order.id ? 'expanded' : ''}`}>
                      <div 
                        className="order-card-header" 
                        onClick={() => toggleOrderDetail(order.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <h4>
                            <span className="expand-icon">{expandedOrderId === order.id ? '▼' : '▶'}</span>
                            Sipariş #{order.id}
                          </h4>
                          <p>Müşteri: {order.user?.firstName} {order.user?.lastName}</p>
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <span className={`order-status status-${order.status}`}>
                            {getOrderStatusText(order.status)}
                          </span>
                          <span className="order-total-badge">
                            {order.totalAmount} TL
                          </span>
                        </div>
                      </div>

                      {expandedOrderId === order.id && (
                        <div className="order-card-body">
                          <div className="order-info-grid">
                            <div>
                              <strong>📍 Adres:</strong>
                              <p>{order.address}</p>
                            </div>
                            <div>
                              <strong>📞 Telefon:</strong>
                              <p>{order.phoneNumber}</p>
                            </div>
                            <div>
                              <strong>✉️ Email:</strong>
                              <p>{order.user?.email}</p>
                            </div>
                          </div>

                          <div className="order-items-table">
                            <h5>Ürünler:</h5>
                            <table>
                              <thead>
                                <tr>
                                  <th>Ürün</th>
                                  <th>Miktar</th>
                                  <th>Birim Fiyat</th>
                                  <th>Toplam</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderItems?.map(item => (
                                  <tr key={item.id}>
                                    <td>{item.product?.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.unitPrice} TL</td>
                                    <td><strong>{item.totalPrice} TL</strong></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="order-total-admin">
                            <strong>Toplam Tutar:</strong>
                            <strong className="total-amount">{order.totalAmount} TL</strong>
                          </div>

                          {order.status === 0 && (
                            <div className="order-actions">
                              <button 
                                className="btn-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveOrder(order.id);
                                }}
                              >
                                ✅ Onayla
                              </button>
                            </div>
                          )}

                          {order.status === 1 && (
                            <div className="order-actions">
                              <button 
                                className="btn-deliver"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeliverOrder(order.id);
                                }}
                              >
                                📦 Teslim Edildi
                              </button>
                              {order.approvedAt && (
                                <p className="status-info">
                                  ✓ {new Date(order.approvedAt).toLocaleDateString('tr-TR')} tarihinde onaylandı
                                </p>
                              )}
                            </div>
                          )}

                          {order.status === 2 && order.deliveredAt && (
                            <p className="status-info delivered">
                              ✓ {new Date(order.deliveredAt).toLocaleDateString('tr-TR')} tarihinde teslim edildi
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="offers-section">
              <div className="section-header">
                <h3>Teklifler</h3>
              </div>
              <p>Bu alanda teklifler ile ilgili işlemler gelecektir.</p>
            </div>
          )}
        </main>
      </div>

      {/* AI Chat Modal */}
      {showAiChat && (
        <div className="modal-overlay" onClick={() => setShowAiChat(false)}>
          <div className="ai-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="ai-chat-header">
              <h3>🤖 AI Asistan</h3>
              <button className="close-btn" onClick={() => setShowAiChat(false)}>✕</button>
            </div>
            
            <div className="ai-chat-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <h4>👋 Merhaba!</h4>
                  <p>Size nasıl yardımcı olabilirim?</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`chat-message ${message.role}`}>
                    <div className="message-header">
                      <strong>{message.role === 'user' ? 'Sen' : 'AI'}</strong>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="loading-indicator">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="ai-chat-input">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Mesajınızı yazın..."
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isLoading || !currentMessage.trim()}
                className="send-btn"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
