/**
 * Toast — Individual toast notification component.
 *
 * Renders a single toast with variant-based styling, close button,
 * and animated progress bar for auto-dismiss countdown.
 *
 * @module components/common/Toast
 */
import { useEffect, useState } from 'react';
import type { Toast as ToastType, ToastVariant } from '../../types/toast';

// ── Variant configuration ────────────────────────────────────────────────────

interface VariantConfig {
  icon: ReactNode;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  progressColor: string;
  label: string;
}

import type { ReactNode } from 'react';

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

const VARIANT_CONFIG: Record<ToastVariant, VariantConfig> = {
  success: {
    icon: <CheckIcon />,
    borderColor: 'border-accent-green/30',
    bgColor: 'bg-accent-green/5',
    iconBg: 'bg-accent-green/15 text-accent-green',
    progressColor: 'bg-accent-green',
    label: 'Success',
  },
  error: {
    icon: <XCircleIcon />,
    borderColor: 'border-accent-red/30',
    bgColor: 'bg-accent-red/5',
    iconBg: 'bg-accent-red/15 text-accent-red',
    progressColor: 'bg-accent-red',
    label: 'Error',
  },
  warning: {
    icon: <WarningIcon />,
    borderColor: 'border-accent-gold/30',
    bgColor: 'bg-accent-gold/5',
    iconBg: 'bg-accent-gold/15 text-accent-gold',
    progressColor: 'bg-accent-gold',
    label: 'Warning',
  },
  info: {
    icon: <InfoIcon />,
    borderColor: 'border-accent-blue/30',
    bgColor: 'bg-accent-blue/5',
    iconBg: 'bg-accent-blue/15 text-accent-blue',
    progressColor: 'bg-accent-blue',
    label: 'Info',
  },
};

// ── Close button SVG ─────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = VARIANT_CONFIG[toast.variant];
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Animate the progress bar countdown
  useEffect(() => {
    if (toast.duration === 0 || isPaused) return;

    const startTime = Date.now();
    const remaining = (toast.duration * progress) / 100;

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.max(0, progress - (elapsed / remaining) * progress);
      setProgress(newProgress);

      if (newProgress > 0) {
        rafId = requestAnimationFrame(frame);
      }
    };

    let rafId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafId);
  }, [toast.duration, isPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={
        'relative w-80 overflow-hidden rounded-lg border shadow-lg shadow-black/20 backdrop-blur-sm ' +
        config.borderColor + ' ' + config.bgColor + ' bg-surface-50/95 ' +
        (toast.exiting ? 'animate-toast-out' : 'animate-toast-in')
      }
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={config.label + ' notification'}
      data-testid={'toast-' + toast.variant}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Content row */}
      <div className="flex items-start gap-3 p-3.5">
        {/* Variant icon */}
        <div
          className={'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md ' + config.iconBg}
          aria-hidden="true"
        >
          {config.icon}
        </div>

        {/* Message */}
        <p className="flex-1 text-sm text-gray-200 leading-snug pt-0.5 break-words">
          {toast.message}
        </p>

        {/* Close button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 -mt-0.5 -mr-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={'h-full transition-none ' + config.progressColor + ' opacity-60'}
            style={{ width: progress + '%' }}
          />
        </div>
      )}
    </div>
  );
}
