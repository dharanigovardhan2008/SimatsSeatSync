// Neumorphic Card Component
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
        'rounded-[32px] p-8 bg-[#E0E5EC] transition-all duration-300 ease-out',
        'shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]',
        hover && 'hover:-translate-y-1 hover:shadow-[12px_12px_20px_rgb(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
