// Premium Glassmorphism Card Component
import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = true,
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        // Base structure & spacing
        'rounded-[32px] p-6 md:p-8 transition-all duration-300 ease-out',
        
        // Glassmorphism effects
        'bg-[rgba(255,255,255,0.60)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.70)]',
        
        // Premium subtle shadow
        'shadow-[0_10px_40px_rgba(0,0,0,0.06)]',
        
        // Hover interactions
        hover && 'hover:-translate-y-1 hover:shadow-[0_15px_50px_rgba(0,0,0,0.08)] hover:bg-[rgba(255,255,255,0.65)]',
        
        // Clickability
        onClick && 'cursor-pointer active:scale-[0.99] active:shadow-[0_5px_20px_rgba(0,0,0,0.04)]',
        
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;