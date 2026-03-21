/**
 * useToast — Toast notification context and hook.
 *
 * Provides a global toast system via React context + useReducer.
 * Toasts slide in from the top-right, stack (max 3), and auto-dismiss.
 *
 * Usage:
 *   const { toast, dismiss } = useToast();
 *   toast({ message: 'Saved!', variant: 'success' });
 *
 * @module hooks/useToast
 */
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { Toast, ToastAction, ToastOptions } from '../types/toast';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 300;

// ── Reducer ──────────────────────────────────────────────────────────────────

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD': {
      // If at max, mark the oldest as exiting (it will be removed after animation)
      const next = [...state, action.toast];
      if (next.length > MAX_VISIBLE) {
        const oldest = next[0];
        return next.map(t => (t.id === oldest.id ? { ...t, exiting: true } : t));
      }
      return next;
    }
    case 'MARK_EXITING':
      return state.map(t => (t.id === action.id ? { ...t, exiting: true } : t));
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    case 'DISMISS':
      // Mark as exiting first — actual removal happens after animation
      return state.map(t => (t.id === action.id ? { ...t, exiting: true } : t));
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemoval = useCallback((id: string) => {
    // After exit animation, actually remove from DOM
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE', id });
      timersRef.current.delete(id);
    }, EXIT_ANIMATION_MS);
    timersRef.current.set(id + '-remove', timer);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      // Clear auto-dismiss timer if still pending
      const autoTimer = timersRef.current.get(id);
      if (autoTimer) {
        clearTimeout(autoTimer);
        timersRef.current.delete(id);
      }

      dispatch({ type: 'DISMISS', id });
      scheduleRemoval(id);
    },
    [scheduleRemoval]
  );

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = 'toast-' + Date.now() + '-' + ++idCounter;
      const duration = options.duration ?? DEFAULT_DURATION;

      const newToast: Toast = {
        id,
        message: options.message,
        variant: options.variant ?? 'info',
        duration,
        createdAt: Date.now(),
        exiting: false,
      };

      dispatch({ type: 'ADD', toast: newToast });

      // Auto-dismiss after duration (if not 0)
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
