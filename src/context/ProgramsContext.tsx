import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { memberPrograms as initialPrograms } from '@/mock/programs';
import type { MemberProgram, ProgramDelivery } from '@/types/programs';

interface ProgramsContextValue {
  programs: MemberProgram[];
  deliveries: ProgramDelivery[];
  saveProgram: (program: MemberProgram) => void;
  findProgram: (memberId: string, month: string) => MemberProgram | null;
  recordDelivery: (delivery: Omit<ProgramDelivery, 'id'>) => void;
  findLatestDelivery: (memberId: string, month: string) => ProgramDelivery | null;
}

const ProgramsContext = createContext<ProgramsContextValue | null>(null);

export function ProgramsProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<MemberProgram[]>(initialPrograms);
  const [deliveries, setDeliveries] = useState<ProgramDelivery[]>([]);

  const value = useMemo<ProgramsContextValue>(
    () => ({
      programs,
      deliveries,
      saveProgram: (program) =>
        setPrograms((current) => [
          ...current.filter((item) => !(item.memberId === program.memberId && item.month === program.month)),
          program,
        ]),
      findProgram: (memberId, month) =>
        programs.find((item) => item.memberId === memberId && item.month === month) ?? null,
      recordDelivery: (delivery) =>
        setDeliveries((current) => [...current, { ...delivery, id: `delivery-${Date.now()}` }]),
      findLatestDelivery: (memberId, month) => {
        const matches = deliveries.filter((item) => item.memberId === memberId && item.month === month);
        return matches.length > 0 ? matches[matches.length - 1] : null;
      },
    }),
    [programs, deliveries]
  );

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

export function usePrograms(): ProgramsContextValue {
  const ctx = useContext(ProgramsContext);
  if (!ctx) throw new Error('usePrograms must be used within a ProgramsProvider');
  return ctx;
}
