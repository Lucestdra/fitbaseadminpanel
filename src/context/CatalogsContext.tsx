import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  leadSourceOptions as initialLeadSources,
  interestOptions as initialInterests,
  responsibleOptions as initialResponsibles,
  leadStageOptions as initialStages,
  classCategoryOptions as initialClassCategories,
} from '@/mock/settings';
import type { LeadSourceOption, LeadStageOption } from '@/types/settings';

interface CatalogsContextValue {
  leadSources: LeadSourceOption[];
  interests: string[];
  responsibles: string[];
  stages: LeadStageOption[];
  classCategories: string[];
  addLeadSource: (label: string) => void;
  removeLeadSource: (id: string) => void;
  addInterest: (label: string) => void;
  removeInterest: (label: string) => void;
  addResponsible: (label: string) => void;
  removeResponsible: (label: string) => void;
  addStage: (title: string) => void;
  removeStage: (id: string) => void;
  addClassCategory: (label: string) => void;
  removeClassCategory: (label: string) => void;
}

const CatalogsContext = createContext<CatalogsContextValue | null>(null);

function slugify(label: string): string {
  return `${label
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${Date.now()}`;
}

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>(initialLeadSources);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [responsibles, setResponsibles] = useState<string[]>(initialResponsibles);
  const [stages, setStages] = useState<LeadStageOption[]>(initialStages);
  const [classCategories, setClassCategories] = useState<string[]>(initialClassCategories);

  const value = useMemo<CatalogsContextValue>(
    () => ({
      leadSources,
      interests,
      responsibles,
      stages,
      classCategories,
      addLeadSource: (label) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        setLeadSources((current) => [...current, { id: slugify(trimmed), label: trimmed, icon: 'pricetag-outline' }]);
      },
      removeLeadSource: (id) => setLeadSources((current) => current.filter((item) => item.id !== id)),
      addInterest: (label) => {
        const trimmed = label.trim();
        if (!trimmed || interests.includes(trimmed)) return;
        setInterests((current) => [...current, trimmed]);
      },
      removeInterest: (label) => setInterests((current) => current.filter((item) => item !== label)),
      addResponsible: (label) => {
        const trimmed = label.trim();
        if (!trimmed || responsibles.includes(trimmed)) return;
        setResponsibles((current) => [...current, trimmed]);
      },
      removeResponsible: (label) => setResponsibles((current) => current.filter((item) => item !== label)),
      addStage: (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        setStages((current) => [...current, { id: slugify(trimmed), title: trimmed, statusLabel: trimmed, tone: 'mint' }]);
      },
      removeStage: (id) => setStages((current) => current.filter((item) => item.id !== id)),
      addClassCategory: (label) => {
        const trimmed = label.trim();
        if (!trimmed || classCategories.includes(trimmed)) return;
        setClassCategories((current) => [...current, trimmed]);
      },
      removeClassCategory: (label) => setClassCategories((current) => current.filter((item) => item !== label)),
    }),
    [leadSources, interests, responsibles, stages, classCategories]
  );

  return <CatalogsContext.Provider value={value}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs(): CatalogsContextValue {
  const ctx = useContext(CatalogsContext);
  if (!ctx) throw new Error('useCatalogs must be used within a CatalogsProvider');
  return ctx;
}
