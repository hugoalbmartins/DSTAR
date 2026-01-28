import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = React.memo(({ title, value, icon: Icon, trend, trendValue, description, color = "blue", loading = false }) => {
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral' || !trend;

  const colorClasses = {
    blue: 'from-brand-600 to-brand-700',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    slate: 'from-slate-600 to-slate-700',
  };

  const getTrendIcon = () => {
    if (isNeutral) return <Minus size={16} />;
    return isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 text-white shadow-xl`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-white/90 text-sm font-medium mb-2">{title}</p>
            {loading ? (
              <div className="h-9 w-32 bg-white/20 animate-pulse rounded-lg"></div>
            ) : (
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-4xl font-bold tracking-tight"
              >
                {value}
              </motion.h3>
            )}
          </div>
          {Icon && (
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-lg"
            >
              <Icon size={24} className="text-white drop-shadow-sm" />
            </motion.div>
          )}
        </div>

        {(trend || description) && !loading && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center gap-1.5 text-sm font-semibold ${
                  isNeutral ? 'text-white/80' : isPositive ? 'text-green-100' : 'text-red-100'
                }`}
              >
                {getTrendIcon()}
                <span>{trendValue}</span>
              </motion.div>
            )}
            {description && (
              <p className="text-white/70 text-xs font-medium">{description}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;
