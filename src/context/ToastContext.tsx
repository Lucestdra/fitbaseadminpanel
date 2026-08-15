import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'neutral' | 'success' | 'critical';

export interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: ToastEntry[];
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** How long a notice stays up before it retires itself. */
const DEFAULT_DURATION_MS = 3200;

/** Beyond this the stack stops being glanceable, so the oldest is dropped. */
const MAX_VISIBLE = 3;

/**
 * The one place notices live.
 *
 * <b>Screen-local toast state put the notice inside the scroll view.</b> Each screen held its own
 * `{message, visible}` and rendered `<Toast>` among its cards, so the notice was positioned against
 * the page content rather than the window — on a long list, "Takvime eklendi" appeared somewhere
 * below the fold and the person who pressed the button never saw it.
 *
 * Hoisting it here also lets a second action queue behind the first instead of overwriting it,
 * which is what happened when saving a class and its slot in quick succession.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'neutral') => {
      const trimmed = message.trim();
      if (trimmed.length === 0) return;

      const id = nextId.current++;

      setToasts((current) => [...current, { id, message: trimmed, tone }].slice(-MAX_VISIBLE));

      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          setToasts((current) => current.filter((entry) => entry.id !== id));
        }, DEFAULT_DURATION_MS),
      );
    },
    [],
  );

  // Timers outlive the tree they were started from otherwise, and each one calls setState.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toasts, show, dismiss }), [toasts, show, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Raises a notice.
 *
 * Usable from anywhere under the provider, including modals and drawers, because the notice is no
 * longer rendered by the caller.
 */
export function useToast(): { show: (message: string, tone?: ToastTone) => void } {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error('useToast must be used inside a ToastProvider.');
  }

  return { show: context.show };
}

/** Read by the viewport only. Screens use `useToast`. */
export function useToastStack(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error('useToastStack must be used inside a ToastProvider.');
  }

  return context;
}
