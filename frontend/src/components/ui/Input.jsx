import React from 'react';
import { AlertCircle } from 'lucide-react';

const Input = React.forwardRef(({ label, icon: Icon, error, className = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border bg-white/50 backdrop-blur-sm px-4 py-2.5 text-sm transition-all duration-200 outline-none
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-primary' 
              : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 hover:border-gray-300'
            }
            ${props.disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          `}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
            <AlertCircle size={18} />
          </div>
        )}
      </div>
      {error && <span className="text-xs text-primary font-medium mt-0.5">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
