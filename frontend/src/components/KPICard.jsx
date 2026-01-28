import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = React.memo(({ title, value, icon: Icon, trend, trendValue, description, color = "blue" }) => {
  const isPositive = trend === 'up';
  const colorClasses = {
    blue: 'from-[#0052CC] to-[#0747A6]',
    green: 'from-[#00875A] to-[#006644]',
    orange: 'from-[#FF8B00] to-[#FF6F00]',
    purple: 'from-[#6554C0] to-[#5243AA]'
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
        </div>
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
          <Icon size={24} className="text-white" />
        </div>
      </div>

      {(trend || description) && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-100' : 'text-red-100'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{trendValue}</span>
            </div>
          )}
          {description && (
            <p className="text-white/70 text-xs">{description}</p>
          )}
        </div>
      )}

      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;
