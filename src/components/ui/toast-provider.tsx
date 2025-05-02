'use client';

import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'destructive';

interface ToastProps {
  title?: string;
  description: string;
  variant?: ToastType;
  onClose: () => void;
  duration?: number;
}

interface ToastContextType {
  toast: (props: { title?: string; description: string; variant?: ToastType }) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function Toast({ title, description, variant = 'info', onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseStyles = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out";
  const variants = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-indigo-500 text-white",
    destructive: "bg-red-500 text-white"
  };

  return createPortal(
    <div
      className={cn(
        baseStyles,
        variants[variant],
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {variant === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {(variant === 'error' || variant === 'destructive') && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {variant === 'info' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div>
          {title && <p className="font-medium">{title}</p>}
          <p className={cn(title ? "text-sm" : "")}>{description}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; title?: string; description: string; variant?: ToastType }>>([]);
  const [counter, setCounter] = useState(0);

  const toast = ({ title, description, variant = 'info' }: { title?: string; description: string; variant?: ToastType }) => {
    const id = counter;
    setCounter(prev => prev + 1);
    setToasts(prev => [...prev, { id, title, description, variant }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
} 