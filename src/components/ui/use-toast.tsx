"use client";

import { useCallback, useEffect, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return {
    toast,
    toasts,
    dismiss: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
  };
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg ${
            toast.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white text-gray-900'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{toast.title}</h3>
              {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}