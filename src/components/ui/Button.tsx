// Premium Glassmorphism Button Component
import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon'; // Added 'icon' for the circular button requirement
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  // Base styles: pill shape (rounded-full), layout, active scale, transition
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 ease-out rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    // Premium Black Button
    primary: 
      'text-white bg-[#111111] border border-[#111111] hover:-translate-y-[1px] hover:shadow-[0_12px_25px_rgba(0,0,0,0.15)] focus:ring-[#111111]',
    
    // Glassmorphism Button
    secondary: 
      'text-[#111111] bg-[rgba(255,255,255,0.60)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.7)] shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:bg-[rgba(255,255,255,0.85)] hover:-translate-y-[1px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] focus:ring-[#111111]',
    
    // Modern Flat Danger Button (Fallback for destructive actions)
    danger: 
      'text-white bg-red-500 hover:bg-red-600 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(239,68,68,0.25)] focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-5 py-2.5 text-sm min-h-[40px]',
    md: 'px-7 py-3.5 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]', // 56px hits the 52-60px requirement perfectly
    icon: 'w-[52px] h-[52px] p-0 shrink-0' // 52px perfect circle for icon buttons
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;