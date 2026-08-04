import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useCatalogs } from '@/context/CatalogsContext';
import { toBadgeTone, toIconName } from '@/types/settings';
import { formatRelativeDateTimeLabel } from '@/utils/date';
import type { LeadListItem } from '@/api/leads';

interface LeadListViewProps {
  leads: LeadListItem[];
  onLeadPress: (lead: LeadListItem) => void;
}

/**
 * The pipeline as a table.
 *
 * <b>The date column shows the next action, not the creation date.</b> The panel renders
 * `dateLabel` — a pre-rendered phrase like "2 gün önce" whose meaning changes per stage — so the
 * column answers a different question on every row. Here it is one question: when is somebody
 * supposed to do something, and is it already late.
 */
export function LeadListView({ leads, onLeadPress }: LeadListViewProps) {
  const { isMobile } = useResponsiveLayout();
  const { leadSources, stages } = useCatalogs();

  const toneOf = (stageId: string) =>
    toBadgeTone(stages.find((stage) => stage.id === stageId)?.tone ?? 'neutral');

  const sourceOf = (sourceId: string | null) =>
    sourceId === null ? undefined : leadSources.find((entry) => entry.id === sourceId);

  const nextActionLabel = (lead: LeadListItem) =>
    lead.nextActionAt === null ? '—' : formatRelativeDateTimeLabel(new Date(lead.nextActionAt));

  if (isMobile) {
    return (
      <View style={styles.mobileList}>
        {leads.map((lead) => {
          const source = sourceOf(lead.sourceId);

          return (
            <Pressable
              key={lead.id}
              onPress={() => onLeadPress(lead)}
              accessibilityRole="button"
              accessibilityLabel={`${lead.fullName} detayını gör`}
            >
              <Card style={styles.mobileCard}>
                <View style={styles.mobileHeaderRow}>
                  <View style={styles.mobileNameGroup}>
                    <Text style={styles.name} numberOfLines={1}>{lead.fullName}</Text>
                    {source ? (
                      <View style={styles.sourceRow}>
                        <AppIcon
                          name={toIconName(source.icon)}
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.sourceLabel}>{lead.sourceName ?? source.label}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Badge label={lead.statusLabel} tone={toneOf(lead.stageId)} />
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>İlgi</Text>
                  <Text style={styles.mobileMetaValue}>{lead.interestName ?? '—'}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Sorumlu</Text>
                  <Text style={styles.mobileMetaValue}>{lead.assignedStaffName ?? 'Atanmadı'}</Text>
                </View>
                <View style={styles.mobileMetaRow}>
                  <Text style={styles.mobileMetaLabel}>Sıradaki</Text>
                  <Text
                    style={[styles.mobileMetaValue, lead.isOverdue && styles.overdueText]}
                  >
                    {nextActionLabel(lead)}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.name]}>Ad</Text>
        <Text style={[styles.headerLabel, columnStyles.source]}>Kaynak</Text>
        <Text style={[styles.headerLabel, columnStyles.interest]}>İlgi</Text>
        <Text style={[styles.headerLabel, columnStyles.trainer]}>Sorumlu</Text>
        <Text style={[styles.headerLabel, columnStyles.stage]}>Aşama</Text>
        <Text style={[styles.headerLabel, columnStyles.date]}>Sıradaki</Text>
        <View style={columnStyles.menu} />
      </View>

      {leads.map((lead, index) => {
        const source = sourceOf(lead.sourceId);

        return (
          <Pressable
            key={lead.id}
            onPress={() => onLeadPress(lead)}
            accessibilityRole="button"
            accessibilityLabel={`${lead.fullName} detayını gör`}
            style={({ pressed }) => [styles.row, index === leads.length - 1 && styles.rowLast, pressed && styles.rowPressed]}
          >
            <Text style={[styles.name, columnStyles.name]} numberOfLines={1}>{lead.fullName}</Text>
            <View style={[styles.sourceRow, columnStyles.source]}>
              {source ? (
                <>
                  <AppIcon name={toIconName(source.icon)} size={14} color={colors.textSecondary} />
                  <Text style={styles.cellText} numberOfLines={1}>
                    {lead.sourceName ?? source.label}
                  </Text>
                </>
              ) : (
                <Text style={styles.cellText}>—</Text>
              )}
            </View>
            <Text style={[styles.cellText, columnStyles.interest]} numberOfLines={1}>
              {lead.interestName ?? '—'}
            </Text>
            <Text style={[styles.cellText, columnStyles.trainer]} numberOfLines={1}>
              {lead.assignedStaffName ?? 'Atanmadı'}
            </Text>
            <View style={columnStyles.stage}>
              <Badge label={lead.statusLabel} tone={toneOf(lead.stageId)} />
            </View>
            <Text
              style={[styles.cellText, columnStyles.date, lead.isOverdue && styles.overdueText]}
              numberOfLines={1}
            >
              {nextActionLabel(lead)}
            </Text>
            <View style={[columnStyles.menu, styles.menuButton]}>
              <AppIcon name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  name: { flex: 1.6 },
  source: { flex: 1.3 },
  interest: { flex: 1.1 },
  trainer: { flex: 1.4 },
  stage: { flex: 1.5 },
  date: { flex: 1.2 },
  menu: { width: 32, alignItems: 'center' },
});

const styles = StyleSheet.create({
  overdueText: {
    color: colors.critical,
  },
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.pageBackground,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuButton: {
    height: 32,
    borderRadius: radii.sm,
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  mobileList: {
    gap: spacing.md,
  },
  mobileCard: {
    gap: spacing.sm,
  },
  mobileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mobileNameGroup: {
    flex: 1,
    gap: 4,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mobileMetaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mobileMetaValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
});
