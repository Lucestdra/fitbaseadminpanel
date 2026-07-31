import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import type { TrialToday } from '@/types/leads';

interface TodaysTrialsCardProps {
  trials: TrialToday[];
  additionalCount: number;
}

export function TodaysTrialsCard({ trials, additionalCount }: TodaysTrialsCardProps) {
  const router = useRouter();

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Bugünkü Deneme Dersleri"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/dersler')}
      />

      <View style={styles.list}>
        {trials.map((trial) => (
          <View key={trial.id} style={styles.row}>
            <Text style={styles.time}>{trial.time}</Text>
            <Avatar initials={trial.memberName.split(' ').map((part) => part[0]).join('').slice(0, 2)} size={32} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{trial.memberName}</Text>
              <Text style={styles.meta} numberOfLines={1}>{trial.interest} · {trial.trainer}</Text>
            </View>
            <Badge label={trial.status === 'bekliyor' ? 'Bekliyor' : 'Onaylandı'} tone={trial.status === 'bekliyor' ? 'warning' : 'mint'} />
          </View>
        ))}
      </View>

      {additionalCount > 0 && (
        <Pressable
          onPress={() => router.replace('/dersler')}
          accessibilityRole="button"
          accessibilityLabel={`${additionalCount} deneme dersi daha, tümünü gör`}
          style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed]}
        >
          <Text style={styles.moreText}>+ {additionalCount} deneme dersi daha</Text>
          <AppIcon name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    width: 40,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    minHeight: 40,
  },
  moreButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  moreText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});
