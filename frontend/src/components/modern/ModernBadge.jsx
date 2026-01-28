import { motion } from "framer-motion";

export const ModernBadge = ({
  children,
  variant = "default",
  size = "md",
  icon: Icon,
  className = "",
  animate = true,
  ...props
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    primary: "bg-brand-100 text-brand-700 border border-brand-200",
    success: "bg-green-100 text-green-700 border border-green-200",
    warning: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    danger: "bg-red-100 text-red-700 border border-red-200",
    info: "bg-blue-100 text-blue-700 border border-blue-200",
    gradient: "bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0 shadow-md",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const Component = animate ? motion.span : "span";
  const animationProps = animate
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <Component
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...animationProps}
      {...props}
    >
      {Icon && <Icon size={14} />}
      {children}
    </Component>
  );
};

export default ModernBadge;
