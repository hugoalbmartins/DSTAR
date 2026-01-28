import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export const ModernButton = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  ...props
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow hover:shadow-glow-lg hover:from-brand-500 hover:to-brand-600",
    secondary: "bg-white border-2 border-slate-200 text-slate-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50/50 hover:shadow-md",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 hover:text-brand-700",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700",
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const baseStyles = "relative overflow-hidden font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>A processar...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={18} />}
          {children}
          {Icon && iconPosition === "right" && <Icon size={18} />}
        </>
      )}
    </motion.button>
  );
};

export default ModernButton;
