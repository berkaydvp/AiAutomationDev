import './TopProductsChart.css';

export const TopProductsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="chart-empty">Henüz satış verisi bulunmamaktadır</div>;
  }

  const maxQuantity = Math.max(...data.map(d => d.quantity));
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  return (
    <div className="top-products-chart">
      {data.map((product, idx) => (
        <div key={idx} className="product-row">
          <div className="product-info">
            <span className="product-rank">#{idx + 1}</span>
            <div className="product-details">
              <span className="product-name">{product.name}</span>
              <span className="product-stats">
                {product.quantity} adet - {product.revenue.toFixed(2)} TL
              </span>
            </div>
          </div>
          <div className="product-bar">
            <div 
              className="product-bar-fill"
              style={{ 
                width: `${(product.quantity / maxQuantity) * 100}%`,
                background: colors[idx % colors.length]
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
