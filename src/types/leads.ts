export type LeadStage = string;

export type LeadSource = string;

export interface LeadNote {
  id: string;
  text: string;
  dateLabel: string;
}

export type CallOutcome = 'ulasilamadi' | 'mesgul' | 'konustu';

export interface CallLogEntry {
  id: string;
  outcome: CallOutcome;
  dateLabel: string;
  followUpLabel?: string;
}

export interface Lead {
  id: string;
  name: string;
  source: LeadSource;
  interest: string;
  assignedTrainer: string;
  stage: LeadStage;
  statusLabel: string;
  dateLabel: string;
  phone?: string;
  email?: string;
  notes?: LeadNote[];
  callLogs?: CallLogEntry[];
}

export interface LeadColumnDef {
  stage: LeadStage;
  title: string;
}

export type TrialStatus = 'bekliyor' | 'onaylandi';

export interface TrialToday {
  id: string;
  time: string;
  memberName: string;
  interest: string;
  trainer: string;
  status: TrialStatus;
}
