import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon,
  className = '', 
  disabled,
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-red-500 focus:ring-primary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5",
    secondary: "bg-secondary text-white hover:bg-teal-400 focus:ring-secondary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-200",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2"
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : 20} className={children ? "mr-1" : ""} />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
