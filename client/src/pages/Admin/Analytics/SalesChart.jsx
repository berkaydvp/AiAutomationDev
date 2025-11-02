import './SalesChart.css';

export const SalesChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="chart-empty">Veri bulunmamaktadır</div>;
  }

  const maxValue = Math.max(...data.map(d => d.total));
  const maxHeight = 200; // px

  return (
    <div className="sales-chart">
      <div className="chart-bars">
        {data.map((item, idx) => {
          const height = maxValue > 0 ? (item.total / maxValue) * maxHeight : 0;
          
          return (
            <div key={idx} className="chart-bar-container">
              <div 
                className="chart-bar"
                style={{ height: `${height}px` }}
                title={`${item.total.toFixed(2)} TL - ${item.orderCount} sipariş`}
              >
                <span className="bar-value">
                  {item.total > 0 ? `${item.total.toFixed(0)}₺` : ''}
                </span>
              </div>
              <span className="bar-label">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
