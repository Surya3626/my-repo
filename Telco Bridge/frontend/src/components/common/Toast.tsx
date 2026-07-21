import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
  };
  dismiss: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string, duration?: number) => addToast('success', title, message, duration),
    error: (title: string, message?: string, duration?: number) => addToast('error', title, message, duration),
    warning: (title: string, message?: string, duration?: number) => addToast('warning', title, message, duration),
    info: (title: string, message?: string, duration?: number) => addToast('info', title, message, duration),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Toast UI ─────────────────────────────────────────────────────────────────

const toastConfig = {
  success: {
    icon: <CheckCircle size={18} />,
    bg: 'bg-emerald-500',
    border: 'border-emerald-400/40',
    iconBg: 'bg-emerald-400/20',
    text: 'text-emerald-50',
    glow: 'shadow-emerald-500/20',
  },
  error: {
    icon: <XCircle size={18} />,
    bg: 'bg-rose-600',
    border: 'border-rose-400/40',
    iconBg: 'bg-rose-400/20',
    text: 'text-rose-50',
    glow: 'shadow-rose-600/25',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    bg: 'bg-amber-500',
    border: 'border-amber-400/40',
    iconBg: 'bg-amber-400/20',
    text: 'text-amber-50',
    glow: 'shadow-amber-500/20',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-violet-600',
    border: 'border-violet-400/40',
    iconBg: 'bg-violet-400/20',
    text: 'text-violet-50',
    glow: 'shadow-violet-600/20',
  },
};

const ToastItem: React.FC<{ toast: Toast; dismiss: (id: string) => void }> = ({ toast, dismiss }) => {
  const [visible, setVisible] = useState(false);
  const config = toastConfig[toast.type];

  useEffect(() => {
    // Slide in
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => dismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-2xl border shadow-xl ${config.glow}
        ${config.bg} ${config.border} ${config.text}
        min-w-[320px] max-w-[400px] cursor-pointer
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
      onClick={handleDismiss}
    >
      <div className={`p-1.5 rounded-lg ${config.iconBg} flex-shrink-0 mt-0.5`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs mt-1 opacity-85 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-white/30 rounded-full"
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; dismiss: (id: string) => void }> = ({ toasts, dismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto relative">
            <ToastItem toast={t} dismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
};
