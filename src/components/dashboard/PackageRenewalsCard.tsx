import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import { formatIsoDateLabel } from '@/utils/date';
import { RENEWAL_HORIZON_DAYS, useRenewals } from '@/hooks/useDashboardPanels';

const URGENT_THRESHOLD_DAYS = 7;

/** Initials from a full name, for the avatar. Two words at most; a third adds nothing. */
function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

/**
 * Who is due to renew.
 *
 * <b>`renewalDaysLeft` is computed on every read and never stored.</b> The panel wrote 30 into the
 * record when a member was created and left it there, so a member who joined in March still read
 * "30 gün kaldı" in June — the one number on this card was the one thing it could not get right.
 */
export function PackageRenewalsCard() {
  const router = useRouter();
  const { members, status } = useRenewals();

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Paket Yenilemeleri"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/uyeler')}
      />

      {status === 'loading' ? <Text style={styles.notice}>Yükleniyor…</Text> : null}
      {status === 'error' ? <Text style={styles.notice}>Üye listesi yüklenemedi.</Text> : null}

      {status === 'ready' && members.length === 0 ? (
        <Text style={styles.notice}>
          Önümüzdeki {RENEWAL_HORIZON_DAYS} gün içinde yenilenecek üyelik yok.
        </Text>
      ) : null}

      <View style={styles.list}>
        {members.map((member) => {
          const daysLeft = member.renewalDaysLeft ?? 0;
          const urgent = daysLeft <= URGENT_THRESHOLD_DAYS;

          return (
            <Pressable
              key={member.id}
              onPress={() => router.replace('/uyeler')}
              accessibilityRole="button"
              accessibilityLabel={`${member.fullName}, ${member.packageName ?? 'paket yok'}, ${daysLeft} gün kaldı`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Avatar initials={initialsOf(member.fullName)} />

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {member.fullName}
                </Text>
                <Text style={styles.packageName} numberOfLines={1}>
                  {member.packageName ?? 'Paket yok'}
                </Text>
              </View>

              <View style={styles.meta}>
                <Badge label={`${daysLeft} gün kaldı`} tone={urgent ? 'warning' : 'neutral'} />
                {member.membershipEndsOn ? (
                  <Text style={styles.date}>{formatIsoDateLabel(member.membershipEndsOn)}</Text>
                ) : null}
              </View>

              <AppIcon name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  notice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  rowPressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  packageName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
