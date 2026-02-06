
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-black transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none min-h-[44px]";
  
  const variants = {
    primary: "bg-[#1677FF] hover:bg-[#0958D9] text-white shadow-md shadow-brand-500/20",
    secondary: "bg-brand-50 text-brand-500 hover:bg-brand-100",
    outline: "border-[0.5px] border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    ghost: "text-[#1677FF] hover:bg-brand-50",
  };

  const sizes = {
    sm: "px-5 py-2 text-[11px] tracking-tight",
    md: "px-8 py-3 text-xs tracking-widest",
    lg: "px-10 py-4 text-sm tracking-widest",
  };

  return (
    <button
      className={`btn ${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
