import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 bg-[#111827] text-white rounded-xl shadow-xl shadow-black/10 border border-white/10 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />}
          {toast.type === 'alert' && <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />}
          {(!toast.type || toast.type === 'info') && <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />}
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-wide text-white">{toast.title}</p>
            <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
