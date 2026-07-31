import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { getLeadSourceMeta, getStageMeta } from '@/utils/leads';
import type { Lead } from '@/types/leads';

interface LeadCardGhostProps {
  lead: Lead;
  x: number;
  y: number;
  width: number;
}

export function LeadCardGhost({ lead, x, y, width }: LeadCardGhostProps) {
  const { leadSources, stages } = useCatalogs();
  const source = getLeadSourceMeta(leadSources, lead.source);
  const stageTone = getStageMeta(stages, lead.stage).tone;

  return (
    <View pointerEvents="none" style={[styles.card, { left: x - width / 2, top: y - 40, width }]}>
      <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
      <View style={styles.metaRow}>
        <AppIcon name={source.icon} size={13} color={colors.textSecondary} />
        <Text style={styles.metaText}>{source.label}</Text>
      </View>
      <Text style={styles.detailText} numberOfLines={1}>İlgi: {lead.interest}</Text>
      <Text style={styles.detailText} numberOfLines={1}>Sorumlu: {lead.assignedTrainer}</Text>
      <View style={styles.footerRow}>
        <Badge label={lead.statusLabel} tone={stageTone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    gap: 6,
    zIndex: 999,
    elevation: 10,
    ...cardShadow,
    boxShadow: '0 8px 24px rgba(32, 35, 33, 0.22)',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
