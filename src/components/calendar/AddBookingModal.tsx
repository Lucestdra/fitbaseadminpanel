import { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SearchInput } from '@/components/ui/SearchInput';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { useMemberList } from '@/hooks/useMemberList';
import * as schedulingApi from '@/api/scheduling';
import type { CalendarSession } from '@/api/scheduling';

interface AddBookingModalProps {
  visible: boolean;
  session: CalendarSession;
  onClose: () => void;
  onBooked: (receipt: schedulingApi.BookingReceipt, memberName: string) => void;
  onError: (message: string) => void;
}

/**
 * Puts a member on a session.
 *
 * <b>The balance comes from the list, and the decision comes from the server.</b> The remaining
 * credits shown beside each name are what the member list already reports; they are there so a
 * receptionist can see who is about to run out, not so this screen can decide. The seat is claimed
 * by one conditional UPDATE server-side, and a member with no credits is refused there — which is
 * the only place that can be right, because the last seat and the last credit can both go between
 * this list rendering and the button being pressed.
 *
 * So the button is never disabled on a balance. Disabling it would move a decision the server owns
 * onto a screen that is, by construction, out of date.
 */
export function AddBookingModal({
  visible,
  session,
  onClose,
  onBooked,
  onError,
}: AddBookingModalProps) {
  const [search, setSearch] = useState('');
  const [booking, setBooking] = useState<string | null>(null);

  // Active and frozen alike. A frozen membership is refused server-side with a code this screen
  // shows as a message — better than hiding the member and leaving the studio wondering where they
  // went, which is what filtering here would do.
  const { items, status } = useMemberList({ search: search.trim() || undefined, limit: 20 });

  const full = session.bookedCount >= session.capacity;

  const book = (memberId: string, memberName: string) => {
    if (booking) return;

    setBooking(memberId);

    void (async () => {
      try {
        const receipt = await schedulingApi.bookSeat(session.id, memberId);
        onBooked(receipt, memberName);
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Üye derse eklenemedi.');
      } finally {
        setBooking(null);
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Derse Üye Ekle</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {session.title} · {session.bookedCount}/{session.capacity} dolu
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
            >
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {full ? (
            <View style={styles.warning}>
              <AppIcon name="alert-circle-outline" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Kontenjan dolu. Yine de deneyebilirsin — bu arada bir iptal olmuş olabilir.
              </Text>
            </View>
          ) : null}

          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Üye ara (ad, telefon...)"
          />

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {status === 'loading' ? (
              <ActivityIndicator style={styles.loading} color={colors.primary} />
            ) : items.length === 0 ? (
              <Text style={styles.empty}>Eşleşen üye yok.</Text>
            ) : (
              items.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => book(member.id, member.fullName)}
                  disabled={booking !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.fullName} üyesini derse ekle`}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.fullName}
                    </Text>
                    <Text style={styles.memberMeta}>{describeBalance(member)}</Text>
                  </View>

                  {booking === member.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <AppIcon name="add" size={18} color={colors.primary} />
                  )}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * What the member has left.
 *
 * `null` is unlimited and says so — a number there would be a lie rather than a large value, which
 * is why the server sends null in the first place.
 */
function describeBalance(member: { sessionsRemaining: number | null; membershipState: string }): string {
  if (member.membershipState === 'NoMembership') return 'Üyeliği yok';
  if (member.membershipState === 'Expired') return 'Üyeliği bitmiş';
  if (member.membershipState === 'Frozen') return 'Üyeliği dondurulmuş';
  if (member.sessionsRemaining === null) return 'Sınırsız';

  return `${member.sessionsRemaining} seans kaldı`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.warningLight,
  },
  warningText: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  list: {
    maxHeight: 320,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.pageBackground,
  },
  rowText: {
    flexShrink: 1,
    gap: 2,
  },
  memberName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
