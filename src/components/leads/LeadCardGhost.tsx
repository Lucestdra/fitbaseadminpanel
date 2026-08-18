import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { toIconName } from '@/types/settings';
import type { LeadListItem } from '@/api/leads';

interface LeadCardGhostProps {
  lead: LeadListItem;
  tone: BadgeTone;
  x: number;
  y: number;
  width: number;
}

/** The card that follows the finger. Renders the same resolved names as the real one. */
export function LeadCardGhost({ lead, tone, x, y, width }: LeadCardGhostProps) {
  const { leadSources } = useCatalogs();
  const source = leadSources.find((entry) => entry.id === lead.sourceId);

  return (
    <View style={[styles.card, { left: x - width / 2, top: y - 40, width }]}>
      <Text style={styles.name} numberOfLines={1}>{lead.fullName}</Text>
      {source ? (
        <View style={styles.metaRow}>
          <AppIcon name={toIconName(source.icon)} size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}>{lead.sourceName ?? source.label}</Text>
        </View>
      ) : null}
      <Text style={styles.detailText} numberOfLines={1}>İlgi: {lead.interestName ?? '—'}</Text>
      <Text style={styles.detailText} numberOfLines={1}>
        Sorumlu: {lead.assignedStaffName ?? 'Atanmadı'}
      </Text>
      <View style={styles.footerRow}>
        <Badge label={lead.statusLabel} tone={tone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Decoration that follows the pointer; it must never be a drop target itself.
    pointerEvents: 'none',
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
