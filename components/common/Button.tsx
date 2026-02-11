
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
  // Use h-12 (3rem = 48px) as baseline for "md". Matches Ant Design Mobile.
  // Added flex-shrink-0 to prevent button collapse in tight layouts.
  const baseStyles = "inline-flex items-center justify-center rounded-full font-black transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none flex-shrink-0";
  
  const variants = {
    primary: "bg-[#1677FF] hover:bg-[#0958D9] text-white shadow-md shadow-brand-500/20",
    secondary: "bg-brand-50 text-brand-500 hover:bg-brand-100",
    outline: "border-[0.5px] border-gray-200 bg-white text-slate-600 hover:bg-slate-50",
    ghost: "text-[#1677FF] hover:bg-brand-50",
  };

  // Mapped sizes to rem-based heights (Ant Design Mobile standards)
  const sizes = {
    sm: "h-9 px-5 text-[0.6875rem] tracking-tight", // 36px
    md: "h-12 px-8 text-[15px] tracking-wide",      // 48px (Standard)
    lg: "h-14 px-10 text-[17px] tracking-wide",     // 56px
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
