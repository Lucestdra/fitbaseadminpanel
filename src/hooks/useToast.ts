import { useCallback, useRef, useState } from 'react';

export function useToast(durationMs = 2400) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(text);
      setVisible(true);
      timeoutRef.current = setTimeout(() => setVisible(false), durationMs);
    },
    [durationMs]
  );

  return { message, visible, show };
}
