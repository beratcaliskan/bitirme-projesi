import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { title, description, variant = 'default', open, onOpenChange, ...props }, ref) {
    React.useEffect(() => {
      if (!open) return;
      
      const timer = setTimeout(() => {
        onOpenChange?.(false);
      }, 3000);

      return () => clearTimeout(timer);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed top-4 right-4 z-50 flex w-full max-w-sm items-center gap-4 rounded-lg border p-4 shadow-lg transition-all',
          variant === 'default' ? 'bg-white text-gray-900' : 'bg-red-600 text-white',
        )}
        {...props}
      >
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="mt-1 text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={() => onOpenChange?.(false)}
          className={cn(
            'rounded-full p-1 transition-colors',
            variant === 'default'
              ? 'text-gray-500 hover:bg-gray-100'
              : 'text-white/80 hover:bg-red-700'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
); 