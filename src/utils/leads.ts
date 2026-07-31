import type { LeadSourceOption, LeadStageOption } from '@/types/settings';

export function getLeadSourceMeta(sources: LeadSourceOption[], sourceId: string): { label: string; icon: LeadSourceOption['icon'] } {
  const match = sources.find((source) => source.id === sourceId);
  return match ?? { label: sourceId, icon: 'pricetag-outline' };
}

export function getStageMeta(stages: LeadStageOption[], stageId: string): { title: string; tone: LeadStageOption['tone'] } {
  const match = stages.find((stage) => stage.id === stageId);
  return match ? { title: match.title, tone: match.tone } : { title: stageId, tone: 'neutral' };
}
