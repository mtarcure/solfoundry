/**
 * Toast notification system types.
 * @module types/toast
 */

/** Visual variant for a toast notification. */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Configuration for creating a new toast. */
export interface ToastOptions {
  /** The message to display. */
  message: string;
  /** Visual variant — determines icon and accent color. */
  variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds. Set to 0 to disable. Default: 5000. */
  duration?: number;
}

/** Internal toast state with generated fields. */
export interface Toast {
  /** Unique identifier. */
  id: string;
  /** The message to display. */
  message: string;
  /** Visual variant. */
  variant: ToastVariant;
  /** Auto-dismiss duration in ms. */
  duration: number;
  /** Timestamp when the toast was created. */
  createdAt: number;
  /** Whether the toast is currently exiting (for slide-out animation). */
  exiting: boolean;
}

/** Actions dispatched to the toast reducer. */
export type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'DISMISS'; id: string }
  | { type: 'MARK_EXITING'; id: string }
  | { type: 'REMOVE'; id: string };
