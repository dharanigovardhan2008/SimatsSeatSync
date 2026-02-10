// Neumorphic Input Component
import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#3D4852] mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-5 py-4 rounded-2xl transition-all duration-300 ease-out',
            'bg-[#E0E5EC] border-none text-[#3D4852]',
            'shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]',
            'placeholder:text-[#A0AEC0]',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6C63FF] focus:ring-offset-[#E0E5EC]',
            'focus:shadow-[inset_10px_10px_20px_rgb(163,177,198,0.7),inset_-10px_-10px_20px_rgba(255,255,255,0.6)]',
            error && 'ring-2 ring-red-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
