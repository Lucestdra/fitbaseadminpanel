import type { BadgeTone } from '@/components/ui/Badge';
import type { IconName } from '@/types/dashboard';
import {
  toBadgeTone,
  toIconName,
  type LeadSourceOption,
  type LeadStageOption,
} from '@/types/settings';

/**
 * The label and icon for a lead's source.
 *
 * Falls back to the raw id rather than throwing when nothing resolves, and that case is real: a
 * catalog entry can be deleted while a lead still names it, because there is no foreign key across
 * module schemas (backend ADR-0017). The honest render is the id in neutral styling — not a blank
 * cell, which reads as missing data, and not a crash.
 */
export function getLeadSourceMeta(
  sources: LeadSourceOption[],
  sourceId: string,
): { label: string; icon: IconName } {
  const match = sources.find((source) => source.id === sourceId);

  return match
    ? { label: match.label, icon: toIconName(match.icon) }
    : { label: sourceId, icon: 'pricetag-outline' };
}

export function getStageMeta(
  stages: LeadStageOption[],
  stageId: string,
): { title: string; tone: BadgeTone } {
  const match = stages.find((stage) => stage.id === stageId);

  return match
    ? { title: match.title, tone: toBadgeTone(match.tone) }
    : { title: stageId, tone: 'neutral' };
}
