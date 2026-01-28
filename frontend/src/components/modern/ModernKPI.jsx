import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const ModernKPI = ({
  title,
  value,
  change,
  changeLabel = "vs. período anterior",
  icon: Icon,
  variant = "primary",
  loading = false,
  className = "",
}) => {
  const variants = {
    primary: "bg-gradient-to-br from-brand-600 to-brand-700 text-white",
    secondary: "bg-gradient-to-br from-slate-700 to-slate-800 text-white",
    success: "bg-gradient-to-br from-green-500 to-green-600 text-white",
    warning: "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
    info: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    white: "bg-white border border-slate-200/60 text-slate-900",
  };

  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus size={16} />;
    return change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const getTrendColor = () => {
    if (!change || change === 0) return "opacity-60";
    if (variant === "white") {
      return change > 0 ? "text-green-600" : "text-red-600";
    }
    return "text-white";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-6 shadow-lg relative overflow-hidden ${variants[variant]} ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-sm font-medium ${variant === 'white' ? 'text-slate-600' : 'text-white/80'}`}>
              {title}
            </p>
            {loading ? (
              <div className="mt-2 h-8 w-32 bg-white/20 animate-pulse rounded"></div>
            ) : (
              <p className={`text-3xl font-bold mt-1 ${variant === 'white' ? 'text-slate-900' : 'text-white'}`}>
                {value}
              </p>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${variant === 'white' ? 'bg-brand-100' : 'bg-white/20'}`}>
              <Icon size={24} className={variant === 'white' ? 'text-brand-600' : 'text-white'} />
            </div>
          )}
        </div>

        {change !== undefined && !loading && (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className={`text-xs ${variant === 'white' ? 'text-slate-500' : 'text-white/60'}`}>
              {changeLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ModernKPI;
