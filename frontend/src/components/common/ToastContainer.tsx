/**
 * ToastContainer — Portal-rendered toast stack.
 *
 * Renders in a fixed position at the top-right of the viewport.
 * Uses React portal so it sits above all other content.
 * Max 3 toasts visible at once — oldest auto-exits when overflow.
 *
 * @module components/common/ToastContainer
 */
import { createPortal } from 'react-dom';
import { useToast } from '../../hooks/useToast';
import { ToastItem } from './Toast';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  // Don't render anything if no toasts
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none"
      aria-label="Notifications"
      role="region"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}
