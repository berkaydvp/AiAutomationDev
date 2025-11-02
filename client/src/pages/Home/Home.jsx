import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Sepet ve Sipariş
  const [cart, setCart] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    address: '',
    phoneNumber: ''
  });
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData) {
      setUser(JSON.parse(userData));
      
      // Token varsa admin kontrolü yap
      if (token) {
        checkAdminStatus(token);
      }
    }
    
    // Sepeti localStorage'dan yükle
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    fetchProducts();
    fetchCategories();
  }, []);

  const checkAdminStatus = async (token) => {
    try {
      const response = await fetch('http://localhost:5029/api/auth/verify-admin', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      console.error('Admin kontrol hatası:', error);
      setIsAdmin(false);
    }
  };

  const fetchProducts = async (categoryId = null) => {
    const url = categoryId 
      ? `http://localhost:5029/api/products?categoryId=${categoryId}`
      : 'http://localhost:5029/api/products';
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    }
  };

  const fetchCategories = async () => {
    const response = await fetch('http://localhost:5029/api/categories');
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchProducts(categoryId);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
    navigate('/login');
  };

  const addToCart = (product) => {
    if (!user) {
      alert('Sipariş vermek için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Stokta yeterli ürün yok');
        return;
      }
      const newCart = cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    } else {
      const newCart = [...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.stock
      }];
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.productId !== productId);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.productId === productId);
    
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.maxStock) {
      alert('Stokta yeterli ürün yok');
      return;
    }

    const newCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (!orderForm.address || !orderForm.phoneNumber) {
      alert('Lütfen adres ve telefon bilgilerini doldurun');
      return;
    }

    if (cart.length === 0) {
      alert('Sepetiniz boş');
      return;
    }

    setOrderLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5029/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: orderForm.address,
          phoneNumber: orderForm.phoneNumber,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        })
      });

      if (response.ok) {
        alert('Sipariş talebiniz oluşturuldu! Admin onayı bekleniyor.');
        setCart([]);
        localStorage.removeItem('cart');
        setShowOrderModal(false);
        setOrderForm({ address: '', phoneNumber: '' });
        navigate('/my-orders');
      } else {
        const error = await response.text();
        alert('Hata: ' + error);
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
      alert('Sipariş oluşturulurken bir hata oluştu');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-nav-brand">
          <h1>🚐 Karavan Market</h1>
        </div>
        <div className="home-nav-menu">
          {user ? (
            <>
              <span className="welcome-text">Hoşgeldin, {user.firstName}!</span>
              <button 
                className="btn-my-orders"
                onClick={() => navigate('/my-orders')}
              >
                📦 Siparişlerim
              </button>
              {cart.length > 0 && (
                <button 
                  className="btn-cart"
                  onClick={() => setShowOrderModal(true)}
                >
                  🛒 Sepet ({cart.length})
                </button>
              )}
              {isAdmin && (
                <button 
                  className="btn-admin"
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </button>
              )}
              <button className="btn-logout" onClick={handleLogout}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-login"
                onClick={() => navigate('/login')}
              >
                Giriş Yap
              </button>
              <button 
                className="btn-register"
                onClick={() => navigate('/register')}
              >
                Kayıt Ol
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="hero">
        <h2>Karavan Yaşamınız İçin Her Şey</h2>
        <p>Kaliteli karavan malzemeleri ve aksesuarları en uygun fiyatlarla!</p>
      </div>

      <div className="home-container">
        <aside className="category-sidebar">
          <h3>Kategoriler</h3>
          <ul className="category-list">
            <li 
              className={selectedCategory === null ? 'active' : ''}
              onClick={() => handleCategoryFilter(null)}
            >
              Tümü
            </li>
            {categories.map(category => (
              <li 
                key={category.id}
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name}
                <span className="product-count">({category.products?.length || 0})</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="products-main">
          <div className="products-header">
            <h3>Ürünler</h3>
            <p>{products.length} ürün bulundu</p>
          </div>

          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div 
                  className="product-image-wrapper"
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="product-placeholder">
                      <span>🚐</span>
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h4 
                    onClick={() => navigate(`/product/${product.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {product.name}
                  </h4>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <div className="product-price">{product.price} TL</div>
                    <div className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {product.stock > 0 ? `Stokta (${product.stock})` : 'Tükendi'}
                    </div>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="btn-view-details"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      📝 Detaylar
                    </button>
                    <button 
                      className="btn-add-cart"
                      disabled={product.stock === 0 || !user}
                      onClick={() => addToCart(product)}
                    >
                      {product.stock > 0 ? '🛒 Sepete Ekle' : 'Tükendi'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty-state">
              <p>Bu kategoride henüz ürün bulunmamaktadır.</p>
            </div>
          )}
        </main>
      </div>

      <footer className="home-footer">
        <p>&copy; 2024 Karavan Market. Tüm hakları saklıdır.</p>
      </footer>

      {/* Sipariş Modalı */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛒 Sipariş Oluştur</h3>
              <button className="close-btn" onClick={() => setShowOrderModal(false)}>✕</button>
            </div>

            <div className="cart-items">
              <h4>Sepetinizdeki Ürünler:</h4>
              {cart.map(item => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-item-info">
                    <strong>{item.productName}</strong>
                    <span>{item.price} TL</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>+</button>
                    <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>
                      🗑️
                    </button>
                  </div>
                  <div className="cart-item-total">
                    {item.price * item.quantity} TL
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <strong>Toplam:</strong>
                <strong>{getTotalAmount()} TL</strong>
              </div>
            </div>

            <div className="order-form">
              <h4>Teslimat Bilgileri:</h4>
              <div className="form-group">
                <label>Adres:</label>
                <textarea
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  placeholder="Teslimat adresinizi girin..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Telefon:</label>
                <input
                  type="tel"
                  value={orderForm.phoneNumber}
                  onChange={(e) => setOrderForm({ ...orderForm, phoneNumber: e.target.value })}
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowOrderModal(false)}
                disabled={orderLoading}
              >
                İptal
              </button>
              <button 
                className="btn-confirm-order"
                onClick={handleCreateOrder}
                disabled={orderLoading}
              >
                {orderLoading ? 'Oluşturuluyor...' : 'Sipariş Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
