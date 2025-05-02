import React from 'react';
import { Toast } from './toast';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState extends ToastProps {
  id: string;
  open: boolean;
}

const ToastContext = React.createContext<{
  toasts: ToastState[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
} | null>(null);

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const toast = React.useCallback(({ ...props }: ToastProps) => {
    const id = genId();
    setToasts((prev) => [...prev, { ...props, id, open: true }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
          open={t.open}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const toast = (props: ToastProps) => {
  if (typeof window === 'undefined') return;
  const context = React.useContext(ToastContext);
  if (!context) {
    console.error('Toast was called outside of ToastProvider');
    return;
  }
  context.toast(props);
}; 