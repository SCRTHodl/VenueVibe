import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    const variants = {
      default: 'bg-blue-500 text-white hover:bg-blue-600',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      destructive: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'hover:bg-gray-100',
      link: 'text-blue-500 hover:text-blue-600 underline'
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
