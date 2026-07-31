import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { weekSchedule as initialSessions } from '@/mock/calendar';
import type { CalendarSession } from '@/types/calendar';

interface CalendarContextValue {
  sessions: CalendarSession[];
  addSession: (session: CalendarSession) => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<CalendarSession[]>(initialSessions);

  const value = useMemo<CalendarContextValue>(
    () => ({
      sessions,
      addSession: (session) => setSessions((current) => [...current, session]),
    }),
    [sessions]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within a CalendarProvider');
  return ctx;
}
