import './StatCards.css';

export const StatCards = ({ data, timeRange }) => {
  const getTimeRangeLabel = () => {
    if (timeRange === 'weekly') return 'Bu Haftaki';
    if (timeRange === 'monthly') return 'Bu Ayki';
    if (timeRange === 'yearly') return 'Bu Yılki';
    return 'Bu Ayki';
  };
  
  const getCurrentTotal = () => {
    if (timeRange === 'weekly') return data.weeklyTotal || 0;
    if (timeRange === 'monthly') return data.monthlyTotal || 0;
    if (timeRange === 'yearly') return data.yearlyTotal || 0;
    return data.monthlyTotal || 0;
  };

  const cards = [
    {
      title: `${getTimeRangeLabel()} Satış`,
      value: `${getCurrentTotal().toFixed(2)} TL`,
      icon: '📅',
      color: '#667eea',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Bu Yılki Satış',
      value: `${(data.yearlyTotal || 0).toFixed(2)} TL`,
      icon: '📆',
      color: '#11998e',
      bgColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      title: 'Toplam Sipariş',
      value: data.totalOrders || 0,
      icon: '📦',
      color: '#f093fb',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Bekleyen Sipariş',
      value: data.pendingOrders || 0,
      icon: '⏳',
      color: '#ffc107',
      bgColor: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'
    }
  ];

  return (
    <div className="stat-cards">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="stat-card"
          style={{ background: card.bgColor }}
        >
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-content">
            <p className="stat-title">{card.title}</p>
            <h3 className="stat-value">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};
