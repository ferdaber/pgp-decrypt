import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastVariant = 'info' | 'error';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastApi {
  info: (message: string) => void;
  error: (message: string) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_TTL_MS = 3000;
const MAX_VISIBLE = 3;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = nextId++;
    setToasts((curr) => [...curr.slice(-(MAX_VISIBLE - 1)), { id, variant, message }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const info = useCallback((msg: string) => push('info', msg), [push]);
  const error = useCallback((msg: string) => push('error', msg), [push]);

  const api: ToastApi = { info, error, toasts, dismiss };

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
