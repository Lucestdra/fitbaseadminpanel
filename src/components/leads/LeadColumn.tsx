import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { LeadCard } from './LeadCard';
import { colors, spacing, typography, radii } from '@/theme';
import { toBadgeTone } from '@/types/settings';
import type { LeadBoardColumn, LeadListItem } from '@/api/leads';

interface LeadColumnProps {
  column: LeadBoardColumn;
  onDragStart: () => void;
  onDragMove: (lead: LeadListItem, absoluteX: number, absoluteY: number) => void;
  onDragRelease: (lead: LeadListItem, absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
  onShowMore: () => void;
  onLeadPress: (lead: LeadListItem) => void;
}

/**
 * One column of the pipeline.
 *
 * <b>`column.total` is the server's count, not `leads.length`.</b> A column returns its first page
 * — up to fifty — and the heading has to say how many there really are, or a studio with two
 * hundred new leads sees "50" and believes it.
 */
export function LeadColumn({
  column,
  onDragStart,
  onDragMove,
  onDragRelease,
  onDragEnd,
  onShowMore,
  onLeadPress,
}: LeadColumnProps) {
  const hidden = column.total - column.leads.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{column.title}</Text>
          <Text style={styles.count}>{column.total}</Text>
        </View>
        <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
      </View>

      <View style={styles.list}>
        {column.leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            tone={toBadgeTone(column.tone)}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragRelease={onDragRelease}
            onDragEnd={onDragEnd}
            onPress={onLeadPress}
          />
        ))}
      </View>

      {hidden > 0 && (
        <Pressable
          onPress={onShowMore}
          accessibilityRole="button"
          accessibilityLabel={`${hidden} adet daha, listede gör`}
          style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed]}
        >
          <Text style={styles.moreText}>+ {hidden} adet daha</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: spacing.sm,
  },
  moreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: radii.sm,
  },
  moreButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  moreText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});
