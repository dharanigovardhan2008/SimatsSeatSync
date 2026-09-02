// Premium Glassmorphism Input Component
import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="block text-sm font-semibold text-[#111111] ml-1 tracking-tight">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            // Sizing and Layout
            'w-full px-5 py-4 min-h-[56px]',
            'rounded-[20px]',
            'transition-all duration-300 ease-out',
            
            // Glassmorphism Styling
            'bg-[rgba(255,255,255,0.65)]',
            'backdrop-blur-[16px]',
            'border border-[rgba(0,0,0,0.08)]',
            
            // Typography
            'text-[#111111] font-medium',
            'placeholder:text-[#999999] placeholder:font-normal',
            
            // Focus State
            'focus:outline-none focus:bg-[rgba(255,255,255,0.95)]',
            'focus:border-[#111111] focus:ring-1 focus:ring-[#111111]',
            
            // Error State
            error && 'border-red-400 bg-[rgba(255,255,255,0.9)] focus:border-red-500 focus:ring-red-500',
            
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[13px] font-medium text-red-500 ml-1 mt-0.5 tracking-tight">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;