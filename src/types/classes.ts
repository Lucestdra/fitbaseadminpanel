export type ClassCategory = string;

export type ClassStatus = 'aktif' | 'pasif';

export interface ClassScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ClassDefinition {
  id: string;
  name: string;
  category: ClassCategory;
  trainer: string;
  schedule: string;
  scheduleSlots?: ClassScheduleSlot[];
  capacity: number;
  averageOccupancy: number;
  status: ClassStatus;
}
