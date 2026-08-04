import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { AttendanceSheet } from '@/components/calendar/AttendanceSheet';
import { AddBookingModal } from '@/components/calendar/AddBookingModal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import * as schedulingApi from '@/api/scheduling';
import { formatDayLabel, formatTimeRangeIn } from '@/utils/calendar';
import { colors, spacing, typography, radii } from '@/theme';
import type { SessionDetail } from '@/api/scheduling';

interface SessionDetailDrawerProps {
  sessionId: string;
  timeZoneId: string;
  /** Whether this caller may take the register. Server-enforced too; this only hides the tab. */
  canMarkAttendance: boolean;
  canManageBookings: boolean;
  canManageSessions: boolean;
  /** Called after anything that changes the calendar behind the drawer. */
  onChanged: () => void;
  onClose: () => void;
  onNotify: (message: string) => void;
}

type TabId = 'register' | 'details';

/**
 * One session: who is on it, whether they came, and calling it off.
 *
 * <b>Three things the panel could not do at all.</b> Its calendar had no dates, so there was no
 * single occurrence to open; `booked` was never mutated, so there was no register; and cancelling
 * one Tuesday was not expressible, because a Tuesday was a template rather than a date.
 *
 * Every mutation goes back to the server and the drawer re-reads the session rather than adjusting
 * a number locally. Seats and credits move together in one transaction server-side, and a client
 * that decremented a counter itself would show a state that is briefly — and sometimes permanently
 * — not the one the database is in.
 */
export function SessionDetailDrawer({
  sessionId,
  timeZoneId,
  canMarkAttendance,
  canManageBookings,
  canManageSessions,
  onChanged,
  onClose,
  onNotify,
}: SessionDetailDrawerProps) {
  const { isMobile } = useResponsiveLayout();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<TabId>(canMarkAttendance ? 'register' : 'details');
  const [booking, setBooking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Reload after a mutation. Named separately from the mount effect below because that one must
  // not set state before an await — see the comment there.
  const load = useCallback(async () => {
    const next = await fetchSession(sessionId);

    if (next === null) {
      setStatus('error');
      return;
    }

    setDetail(next);
    setStatus('ready');
  }, [sessionId]);

  useEffect(() => {
    // Wrapped rather than `void load()`, so no state is set before an await. React's lint rule
    // reads a direct call as a synchronous setState and refuses it — and it is right to: a
    // cascading render on open is exactly what makes a drawer feel like it stutters.
    void (async () => {
      const next = await fetchSession(sessionId);

      if (next === null) {
        setStatus('error');
        return;
      }

      setDetail(next);
      setStatus('ready');
    })();
  }, [sessionId]);

  const cancelSession = () => {
    if (busy) return;

    setBusy(true);

    void (async () => {
      try {
        const result = await schedulingApi.cancelSession(sessionId, reason.trim() || null);

        // The two numbers differ, and saying both is the honest report: members on unlimited
        // packages lose a seat without a credit coming back, because none was spent.
        onNotify(
          result.seatsReleased === 0
            ? 'Ders iptal edildi.'
            : `Ders iptal edildi. ${result.seatsReleased} kayıt kaldırıldı, ` +
              `${result.creditsRefunded} seans hakkı iade edildi.`,
        );

        setCancelling(false);
        onChanged();
        onClose();
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Ders iptal edilemedi.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const removeBooking = (bookingId: string, memberName: string | null) => {
    if (busy) return;

    setBusy(true);

    void (async () => {
      try {
        const receipt = await schedulingApi.cancelBooking(bookingId);

        // `refunded` is the server's answer, not a rule this screen re-implements. The cutoff is a
        // policy that will move, and a client that computed it would disagree with the ledger the
        // first time it did.
        onNotify(
          receipt.refunded
            ? `${memberName ?? 'Üye'} çıkarıldı, seans hakkı iade edildi.`
            : `${memberName ?? 'Üye'} çıkarıldı. Geç iptal olduğu için seans hakkı iade edilmedi.`,
        );

        await load();
        onChanged();
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'Üye çıkarılamadı.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const session = detail?.session;
  const cancelled = session?.state === 'Cancelled';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityLabel="Kapat" />

        <View style={[styles.drawer, isMobile ? styles.drawerMobile : styles.drawerWide]}>
          {status === 'loading' ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : status === 'error' || !detail || !session ? (
            <View style={styles.loading}>
              <Text style={styles.errorText}>Ders yüklenemedi.</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title} numberOfLines={2}>
                    {session.title}
                  </Text>
                  <Text style={styles.subtitle}>
                    {formatDayLabel(session.occursOn)} ·{' '}
                    {formatTimeRangeIn(session.startsAt, session.endsAt, timeZoneId)}
                  </Text>
                  <View style={styles.badgeRow}>
                    {cancelled ? <Badge label="İptal edildi" tone="critical" /> : null}
                    <Text style={styles.meta}>
                      {session.coachName ?? 'Eğitmen atanmadı'} · {session.bookedCount}/
                      {session.capacity} dolu
                    </Text>
                  </View>
                </View>

                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
                  <AppIcon name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              {canMarkAttendance ? (
                <View style={styles.tabRow}>
                  {(
                    [
                      { id: 'register' as const, label: 'Yoklama' },
                      { id: 'details' as const, label: 'Kayıtlar' },
                    ]
                  ).map((entry) => (
                    <Pressable
                      key={entry.id}
                      onPress={() => setTab(entry.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: tab === entry.id }}
                      style={[styles.tab, tab === entry.id && styles.tabActive]}
                    >
                      <Text style={[styles.tabLabel, tab === entry.id && styles.tabLabelActive]}>
                        {entry.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {canMarkAttendance && tab === 'register' ? (
                  <AttendanceSheet
                    detail={detail}
                    onSaved={(summary) => {
                      onNotify(
                        `Yoklama kaydedildi: ${summary.attended} geldi, ${summary.noShow} gelmedi.`,
                      );
                      void load();
                      onChanged();
                    }}
                    onError={onNotify}
                  />
                ) : (
                  <View style={styles.seatList}>
                    {detail.seats.length === 0 ? (
                      <Text style={styles.emptyText}>Bu derse henüz kimse kayıtlı değil.</Text>
                    ) : (
                      detail.seats.map((seat) => (
                        <View key={seat.bookingId} style={styles.seatRow}>
                          <View style={styles.seatText}>
                            <Text
                              style={[
                                styles.seatName,
                                seat.state === 'Cancelled' && styles.seatNameCancelled,
                              ]}
                              numberOfLines={1}
                            >
                              {seat.memberName ?? 'Bilinmeyen üye'}
                            </Text>
                            <Text style={styles.seatMeta}>
                              {seat.state === 'Cancelled' ? 'İptal etti' : describeMark(seat.attendance)}
                            </Text>
                          </View>

                          {canManageBookings && seat.state === 'Booked' && !cancelled ? (
                            <Pressable
                              onPress={() => removeBooking(seat.bookingId, seat.memberName)}
                              disabled={busy}
                              accessibilityRole="button"
                              accessibilityLabel={`${seat.memberName ?? 'Üye'} kaydını iptal et`}
                              hitSlop={8}
                            >
                              <AppIcon name="close" size={16} color={colors.critical} />
                            </Pressable>
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>

              {cancelled ? null : (
                <View style={styles.actions}>
                  {canManageBookings ? (
                    <Pressable
                      onPress={() => setBooking(true)}
                      accessibilityRole="button"
                      style={styles.primaryButton}
                    >
                      <AppIcon name="add" size={16} color={colors.white} />
                      <Text style={styles.primaryLabel}>Üye Ekle</Text>
                    </Pressable>
                  ) : null}

                  {canManageSessions ? (
                    <Pressable
                      onPress={() => setCancelling(true)}
                      accessibilityRole="button"
                      style={styles.dangerButton}
                    >
                      <Text style={styles.dangerLabel}>Dersi İptal Et</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              {booking ? (
                <AddBookingModal
                  visible
                  session={session}
                  onClose={() => setBooking(false)}
                  onBooked={(receipt, memberName) => {
                    onNotify(
                      receipt.creditsRemaining === null
                        ? `${memberName} derse eklendi.`
                        : `${memberName} derse eklendi. ${receipt.creditsRemaining} seans hakkı kaldı.`,
                    );
                    void load();
                    onChanged();
                  }}
                  onError={onNotify}
                />
              ) : null}

              {/*
                Nested Modal rather than an absolutely-positioned overlay: this dialog lives inside
                a drawer that scrolls, and an overlay would scroll away from the button that opened
                it.
              */}
              <Modal
                visible={cancelling}
                transparent
                animationType="fade"
                onRequestClose={() => setCancelling(false)}
              >
                <View style={styles.dialogBackdrop}>
                  <View style={styles.dialog}>
                    <Text style={styles.dialogTitle}>Dersi iptal et</Text>
                    <Text style={styles.dialogBody}>
                      {detail.attendance.booked === 0
                        ? 'Bu derse kayıtlı kimse yok.'
                        : `${detail.attendance.booked} üyenin kaydı kaldırılacak ve seans hakları ` +
                          'iade edilecek. Bu işlem geri alınamaz.'}
                    </Text>

                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="İptal nedeni (isteğe bağlı)"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                    />

                    <View style={styles.dialogActions}>
                      <Pressable
                        onPress={() => setCancelling(false)}
                        accessibilityRole="button"
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryLabel}>Vazgeç</Text>
                      </Pressable>
                      <Pressable
                        onPress={cancelSession}
                        disabled={busy}
                        accessibilityRole="button"
                        style={[styles.dangerButton, busy && styles.disabled]}
                      >
                        <Text style={styles.dangerLabel}>Dersi İptal Et</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Null on failure, so the effect can branch without a try/catch straddling a setState. */
async function fetchSession(sessionId: string): Promise<SessionDetail | null> {
  try {
    return await schedulingApi.getSession(sessionId);
  } catch {
    return null;
  }
}

function describeMark(mark: SessionDetail['seats'][number]['attendance']): string {
  if (mark === 'Attended') return 'Geldi';
  if (mark === 'NoShow') return 'Gelmedi';
  if (mark === 'Excused') return 'Mazeretli';

  // Not "gelmedi". A register nobody took is missing information, and calling it an absence is
  // exactly the conflation that would turn every occupancy figure into an attendance figure.
  return 'İşaretlenmedi';
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdropFill: {
    flex: 1,
  },
  drawer: {
    backgroundColor: colors.white,
    height: '100%',
  },
  drawerWide: {
    width: 480,
  },
  drawerMobile: {
    flex: 1,
  },
  loading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flexShrink: 1,
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
  },
  seatList: {
    gap: spacing.xs,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seatText: {
    flexShrink: 1,
    gap: 2,
  },
  seatName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  seatNameCancelled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  seatMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  dangerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.critical,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dangerLabel: {
    ...typography.button,
    color: colors.critical,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dialogTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  dialogBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
