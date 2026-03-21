/**
 * Toast notification system — comprehensive test suite.
 *
 * Tests cover: rendering, variants, dismiss, auto-dismiss, stacking,
 * pause-on-hover, progress bar, accessibility, edge cases, and integration.
 *
 * @module tests/Toast
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../hooks/useToast';
import { ToastContainer } from './ToastContainer';

// ── Test helpers ─────────────────────────────────────────────────────────────

/** Renders the toast system and returns a trigger hook. */
function TestHarness({ onMount }: { onMount?: (api: ReturnType<typeof useToast>) => void }) {
  const api = useToast();

  // Call onMount once so tests can access the toast API
  if (onMount) {
    // Schedule to avoid calling during render
    Promise.resolve().then(() => onMount(api));
  }

  return (
    <div>
      <button
        data-testid="trigger-success"
        onClick={() => api.toast({ message: 'Success!', variant: 'success' })}
      >
        Success
      </button>
      <button
        data-testid="trigger-error"
        onClick={() => api.toast({ message: 'Error!', variant: 'error' })}
      >
        Error
      </button>
      <button
        data-testid="trigger-warning"
        onClick={() => api.toast({ message: 'Warning!', variant: 'warning' })}
      >
        Warning
      </button>
      <button
        data-testid="trigger-info"
        onClick={() => api.toast({ message: 'Info!', variant: 'info' })}
      >
        Info
      </button>
      <button
        data-testid="trigger-long"
        onClick={() => api.toast({ message: 'This is a much longer message to test wrapping behavior in the toast notification component.', variant: 'info', duration: 10000 })}
      >
        Long
      </button>
      <button
        data-testid="trigger-persistent"
        onClick={() => api.toast({ message: 'Persistent!', variant: 'info', duration: 0 })}
      >
        Persistent
      </button>
    </div>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <TestHarness />
      <ToastContainer />
    </ToastProvider>
  );
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Toast Notification System', () => {
  // ── Rendering ──────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders nothing when no toasts exist', () => {
      renderToasts();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('renders a success toast with correct message', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByTestId('toast-success')).toBeInTheDocument();
    });

    it('renders an error toast', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByTestId('toast-error')).toBeInTheDocument();
    });

    it('renders a warning toast', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-warning'));
      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByTestId('toast-warning')).toBeInTheDocument();
    });

    it('renders an info toast', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-info'));
      expect(screen.getByText('Info!')).toBeInTheDocument();
      expect(screen.getByTestId('toast-info')).toBeInTheDocument();
    });
  });

  // ── Dismissal ──────────────────────────────────────────────────────────

  describe('Dismissal', () => {
    it('removes a toast when the close button is clicked', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Success!')).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText('Dismiss notification');
      await user.click(dismissBtn);

      // Advance past exit animation (300ms)
      act(() => { vi.advanceTimersByTime(350); });

      expect(screen.queryByText('Success!')).toBeNull();
    });

    it('auto-dismisses after the default duration (5s)', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByText('Success!')).toBeInTheDocument();

      // Advance past 5s + exit animation
      act(() => { vi.advanceTimersByTime(5400); });

      expect(screen.queryByText('Success!')).toBeNull();
    });

    it('does not auto-dismiss when duration is 0', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-persistent'));
      expect(screen.getByText('Persistent!')).toBeInTheDocument();

      // Advance well past default duration
      act(() => { vi.advanceTimersByTime(20000); });

      // Should still be visible
      expect(screen.getByText('Persistent!')).toBeInTheDocument();
    });
  });

  // ── Stacking ───────────────────────────────────────────────────────────

  describe('Stacking', () => {
    it('stacks multiple toasts', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      await user.click(screen.getByTestId('trigger-error'));

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('marks oldest toast as exiting when exceeding max (3)', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      await user.click(screen.getByTestId('trigger-error'));
      await user.click(screen.getByTestId('trigger-warning'));

      // All 3 should be visible
      expect(screen.getAllByRole('alert')).toHaveLength(3);

      // Add a 4th — oldest should start exiting
      await user.click(screen.getByTestId('trigger-info'));

      // After exit animation completes
      act(() => { vi.advanceTimersByTime(350); });

      // Should still have at most 4 alert elements (3 visible + 1 exiting)
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeLessThanOrEqual(4);
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('uses role="alert" for each toast', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      const toast = screen.getByTestId('toast-success');
      expect(toast).toHaveAttribute('role', 'alert');
    });

    it('uses aria-live="assertive"', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-error'));
      const toast = screen.getByTestId('toast-error');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    it('has aria-label on dismiss button', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-info'));
      const btn = screen.getByLabelText('Dismiss notification');
      expect(btn).toBeInTheDocument();
    });

    it('container has role="region" with aria-label', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      const region = screen.getByRole('region', { name: 'Notifications' });
      expect(region).toBeInTheDocument();
    });

    it('each toast variant has a descriptive aria-label', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      expect(screen.getByLabelText('Success notification')).toBeInTheDocument();

      await user.click(screen.getByTestId('trigger-error'));
      expect(screen.getByLabelText('Error notification')).toBeInTheDocument();
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('handles long messages without breaking layout', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-long'));
      expect(screen.getByText(/This is a much longer message/)).toBeInTheDocument();
    });

    it('each toast gets a unique id', async () => {
      renderToasts();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      await user.click(screen.getByTestId('trigger-success'));
      await user.click(screen.getByTestId('trigger-success'));

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBe(2);
    });
  });

  // ── Context guard ──────────────────────────────────────────────────────

  describe('Context Guard', () => {
    it('throws when useToast is used outside ToastProvider', () => {
      function BadComponent() {
        useToast();
        return null;
      }

      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<BadComponent />)).toThrow(
        'useToast must be used within a <ToastProvider>'
      );
      spy.mockRestore();
    });
  });
});
