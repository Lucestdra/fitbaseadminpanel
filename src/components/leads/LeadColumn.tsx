import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { LeadCard } from './LeadCard';
import { colors, spacing, typography, radii } from '@/theme';
import type { Lead, LeadColumnDef } from '@/types/leads';

interface LeadColumnProps {
  column: LeadColumnDef;
  leads: Lead[];
  additionalCount: number;
  onDragStart: () => void;
  onDragMove: (lead: Lead, absoluteX: number, absoluteY: number) => void;
  onDragRelease: (lead: Lead, absoluteX: number, absoluteY: number) => void;
  onDragEnd: () => void;
  onShowMore: () => void;
  onLeadPress: (lead: Lead) => void;
}

export function LeadColumn({
  column,
  leads,
  additionalCount,
  onDragStart,
  onDragMove,
  onDragRelease,
  onDragEnd,
  onShowMore,
  onLeadPress,
}: LeadColumnProps) {
  const totalCount = leads.length + additionalCount;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{column.title}</Text>
          <Text style={styles.count}>{totalCount}</Text>
        </View>
        <AppIcon name="ellipsis-vertical" size={16} color={colors.textSecondary} />
      </View>

      <View style={styles.list}>
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragRelease={onDragRelease}
            onDragEnd={onDragEnd}
            onPress={onLeadPress}
          />
        ))}
      </View>

      {additionalCount > 0 && (
        <Pressable
          onPress={onShowMore}
          accessibilityRole="button"
          accessibilityLabel={`${additionalCount} adet daha, listede gör`}
          style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed]}
        >
          <Text style={styles.moreText}>+ {additionalCount} adet daha</Text>
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
