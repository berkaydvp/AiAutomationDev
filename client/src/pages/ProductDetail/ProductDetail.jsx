import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5029/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        setLoading(false);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Ürün yüklenirken hata:', error);
      navigate('/');
    }
  };

  const addToCart = () => {
    if (!user) {
      alert('Sipariş vermek için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    if (quantity > product.stock) {
      alert('Stokta yeterli ürün yok');
      return;
    }

    // LocalStorage'dan mevcut sepeti al
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existingItemIndex = existingCart.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex > -1) {
      // Ürün zaten sepette varsa miktarı güncelle
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      // Yeni ürün ekle
      existingCart.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        maxStock: product.stock
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    alert(`${quantity} adet "${product.name}" sepete eklendi!`);
    navigate('/');
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const getImages = () => {
    if (!product) return [];
    
    try {
      const images = product.images ? JSON.parse(product.images) : [];
      if (images.length > 0) return images;
    } catch (e) {
      console.error('Images parse error:', e);
    }
    
    // Fallback to ImageUrl or placeholder
    return product.imageUrl ? [product.imageUrl] : [];
  };

  const getFeatures = () => {
    if (!product || !product.features) return [];
    try {
      return JSON.parse(product.features);
    } catch (e) {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Ürün yükleniyor...</p>
      </div>
    );
  }

  if (!product) {
    return <div className="product-detail-error">Ürün bulunamadı</div>;
  }

  const images = getImages();
  const features = getFeatures();

  return (
    <div className="product-detail-page">
      <nav className="product-detail-nav">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Ana Sayfaya Dön
        </button>
        <h2>🚐 Karavan Market</h2>
      </nav>

      <div className="product-detail-container">
        <div className="product-gallery">
          <div className="main-image">
            {images.length > 0 ? (
              <img src={images[selectedImage]} alt={product.name} />
            ) : (
              <div className="placeholder-image">
                <span>🚐</span>
                <p>Görsel Yok</p>
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="thumbnail-gallery">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-info-section">
          <div className="product-header">
            <div className="category-badge">{product.category?.name || 'Kategori'}</div>
            {product.brand && <div className="brand-badge">🏷️ {product.brand}</div>}
          </div>

          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-price-section">
            <div className="price">{product.price.toFixed(2)} TL</div>
            <div className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {product.stock > 0 ? (
                <>
                  <span className="stock-icon">✓</span>
                  <span>Stokta ({product.stock} adet)</span>
                </>
              ) : (
                <>
                  <span className="stock-icon">✕</span>
                  <span>Stokta Yok</span>
                </>
              )}
            </div>
          </div>

          <div className="product-description">
            <h3>Ürün Açıklaması</h3>
            <p>{product.description || 'Açıklama bulunmamaktadır.'}</p>
          </div>

          {features.length > 0 && (
            <div className="product-features">
              <h3>Özellikler</h3>
              <ul>
                {features.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">Kategori:</span>
              <span className="meta-value">{product.category?.name || '-'}</span>
            </div>
            {product.brand && (
              <div className="meta-item">
                <span className="meta-label">Marka:</span>
                <span className="meta-value">{product.brand}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Ürün Kodu:</span>
              <span className="meta-value">#{product.id}</span>
            </div>
          </div>

          {product.stock > 0 && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label>Miktar:</label>
                <div className="quantity-controls">
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button className="add-to-cart-btn" onClick={addToCart}>
                🛒 Sepete Ekle ({(product.price * quantity).toFixed(2)} TL)
              </button>
            </div>
          )}

          {product.stock === 0 && (
            <div className="out-of-stock-message">
              <p>⚠️ Bu ürün şu anda stokta bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
