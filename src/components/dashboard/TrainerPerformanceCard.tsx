import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography } from '@/theme';
import { trainerPerformance } from '@/mock/dashboard';

export function TrainerPerformanceCard() {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Antrenör Performansı" actionLabel="Bu Ay" actionIcon="chevron-down" variant="pill" />

      <View style={styles.headerRow}>
        <Text style={[styles.columnLabel, styles.nameColumn]}>Antrenör</Text>
        <Text style={[styles.columnLabel, styles.attendanceColumn]}>Katılım</Text>
        <Text style={[styles.columnLabel, styles.ratingColumn]}>Ortalama Puan</Text>
      </View>

      <View style={styles.list}>
        {trainerPerformance.map((trainer) => (
          <View
            key={trainer.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${trainer.name}, katılım yüzde ${trainer.attendanceRate}, puan ${trainer.rating}`}
          >
            <View style={[styles.nameCell, styles.nameColumn]}>
              <Avatar initials={trainer.avatarInitials} size={32} />
              <Text style={styles.name} numberOfLines={1}>{trainer.name}</Text>
            </View>
            <Text style={[styles.attendance, styles.attendanceColumn]}>%{trainer.attendanceRate}</Text>
            <View style={[styles.ratingCell, styles.ratingColumn]}>
              <AppIcon name="star" size={14} color={colors.warning} />
              <Text style={styles.rating}>{trainer.rating.toFixed(1)}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  columnLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nameColumn: {
    flex: 1.6,
  },
  attendanceColumn: {
    flex: 1,
  },
  ratingColumn: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  attendance: {
    ...typography.body,
    color: colors.textPrimary,
  },
  ratingCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
