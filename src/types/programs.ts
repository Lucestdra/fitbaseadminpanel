export interface WeeklyProgramEntry {
  week: number;
  plan: string;
}

export interface MemberProgram {
  memberId: string;
  month: string;
  entries: WeeklyProgramEntry[];
}

export interface ProgramDelivery {
  id: string;
  memberId: string;
  memberName: string;
  trainerName: string;
  month: string;
  /** Human-readable send moment, e.g. "29 Temmuz 14:05". */
  sentAtLabel: string;
  channel: 'whatsapp';
}
