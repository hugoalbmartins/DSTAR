import { motion } from "framer-motion";

export const ModernCard = ({
  children,
  title,
  subtitle,
  icon: Icon,
  variant = "default",
  hover = true,
  className = "",
  headerAction,
  ...props
}) => {
  const variants = {
    default: "bg-white border border-slate-200/60",
    gradient: "bg-gradient-to-br from-white to-slate-50 border border-slate-200/60",
    glass: "bg-white/80 backdrop-blur-xl border border-slate-200/60",
    primary: "bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0",
    dark: "bg-slate-900 text-white border-0",
  };

  const hoverStyles = hover
    ? "hover:shadow-xl hover:-translate-y-1"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl shadow-md transition-all duration-300 ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {(title || Icon || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${variant === 'primary' || variant === 'dark' ? 'bg-white/20' : 'bg-brand-100'}`}>
                <Icon size={20} className={variant === 'primary' || variant === 'dark' ? 'text-white' : 'text-brand-600'} />
              </div>
            )}
            <div>
              {title && (
                <h3 className={`font-bold text-lg ${variant === 'primary' || variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`text-sm ${variant === 'primary' || variant === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

export default ModernCard;
