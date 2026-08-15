import { useState } from 'react';
import { View, Text, Pressable, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/context/ToastContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MemberProgramModal } from '@/components/trainers/MemberProgramModal';
import { useAuth } from '@/context/AuthContext';
import { usePrograms } from '@/hooks/usePrograms';
import * as programsApi from '@/api/programs';
import { MAX_WEEKS, type ProgramRosterEntry } from '@/api/programs';
import { buildWhatsAppUrl, formatProgramMonth, shiftProgramMonth } from '@/utils/programs';
import { formatInstantIn } from '@/utils/instants';
import { initialsOf } from '@/utils/name';
import { colors, spacing, typography, radii } from '@/theme';

/**
 * The month's programmes, and the record of passing them on.
 *
 * <b>The month is the studio's, not the device's.</b> It arrives from the server, resolved in the
 * organization's time zone. The panel built `'Temmuz 2026'` from `new Date()` on the laptop and used
 * the label as the programme's storage key — so a coach travelling, or working past midnight on the
 * first, wrote into a different month than the studio was in.
 *
 * <b>The roster is server-scoped.</b> A coach sees their assigned members because their staff-member
 * id comes from the token; a manager reading the same endpoint sees the studio, and that is the
 * oversight view. The panel filtered `member.assignedTrainer === user.name` in the browser.
 */
export default function TrainerProgramScreen() {
  const { isMobile } = useResponsiveLayout();
  const { timeZoneId, permissions } = useAuth();
  const { show } = useToast();

  // Null means "the studio's current month", answered by the server. Stepping away from it produces
  // an explicit month; stepping back to it does not restore the null, and that is fine — the
  // explicit month is the same month.
  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [editing, setEditing] = useState<ProgramRosterEntry | null>(null);
  const [pendingSend, setPendingSend] = useState<string | null>(null);

  const roster = usePrograms(month);
  const canManage = permissions['programs.manage'] !== undefined;

  const monthLabel = roster.month === null ? '' : formatProgramMonth(roster.month);

  const step = (delta: number) =>
    setMonth((current) =>
      shiftProgramMonth(current ?? roster.month ?? { year: 2026, month: 1 }, delta),
    );

  /**
   * Opens a conversation. Composes nothing.
   *
   * The panel prefilled the message with `?text=`, which sends a business message from the coach's
   * own account outside every Cloud API rule this product obeys, while looking to everyone as though
   * the platform sent it (ADR-0054). The text is on screen in the editor to copy.
   */
  const openConversation = (item: ProgramRosterEntry) => {
    if (item.phoneNumber === null || item.phoneNumber.length === 0) {
      show(`${item.memberName} için kayıtlı telefon numarası yok.`);
      return;
    }

    setPendingSend(item.memberId);

    Linking.openURL(buildWhatsAppUrl(item.phoneNumber)).catch(() =>
      show('WhatsApp açılamadı. Numarayı kontrol et.'),
    );
  };

  const confirmSent = (item: ProgramRosterEntry) => {
    void (async () => {
      try {
        await programsApi.recordDelivery(item.memberId, {
          year: roster.month?.year ?? null,
          month: roster.month?.month ?? null,
          channel: 'WhatsApp',

          // The only value the server accepts today, and the honest one: the platform observed
          // nothing. It is excluded from every delivery-rate metric.
          evidence: 'SelfReported',
        });

        setPendingSend(null);
        show(`${item.memberName} için gönderildi olarak işaretlendi.`);
        roster.reload();
      } catch (error) {
        show(error instanceof Error ? error.message : 'Kayıt alınamadı.');
      }
    })();
  };

  return (
    <AppShell activeId="program">
      <View style={styles.header}>
        <Text style={styles.title}>Program</Text>
        <Text style={styles.subtitle}>
          {roster.scope === 'All'
            ? `Stüdyodaki üyelerin ${monthLabel} programları.`
            : `Sana atanan üyelerin ${monthLabel} programlarını yaz ve gönder.`}
        </Text>
      </View>

      <View style={styles.monthRow}>
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppIcon name="chevron-back-outline" size={16} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.monthLabelGroup}>
          <Text style={styles.monthLabel}>{monthLabel || '—'}</Text>
          {roster.isCurrentMonth ? <Badge label="Bu ay" tone="mint" /> : null}
        </View>

        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
        >
          <AppIcon name="chevron-forward-outline" size={16} color={colors.textPrimary} />
        </Pressable>

        {/* Counted server-side over the same rows the list shows, so narrowing the scope moves
            them. The panel had no equivalent — it could not say how much of the month was done. */}
        <Text style={styles.counters}>
          {roster.counters.withProgram}/{roster.counters.members} yazıldı ·{' '}
          {roster.counters.delivered} gönderildi
        </Text>
      </View>

      {roster.status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : roster.status === 'error' ? (
        <Card>
          <Text style={styles.emptyText}>Bilgiler alınamadı. Sayfayı yenile.</Text>
        </Card>
      ) : roster.items.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>
            {roster.scope === 'All'
              ? 'Stüdyoda aktif üye yok.'
              : 'Henüz sana atanmış bir üye yok.'}
          </Text>
        </Card>
      ) : (
        roster.items.map((item) => {
          const delivery = item.latestDelivery;
          const isPending = pendingSend === item.memberId;
          const canSend = item.weeksWritten > 0 && (item.phoneNumber?.length ?? 0) > 0;

          return (
            <Card key={item.memberId} style={styles.memberCard}>
              <View style={[styles.memberRow, isMobile && styles.memberRowMobile]}>
                <View style={styles.memberInfo}>
                  <Avatar initials={initialsOf(item.memberName)} size={40} />
                  <View style={styles.memberTextGroup}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {item.memberName}
                    </Text>
                    <Text style={styles.memberMeta} numberOfLines={1}>
                      {item.phoneNumber ?? 'Telefon yok'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusGroup}>
                  {item.weeksWritten > 0 ? (
                    <Badge label={`${item.weeksWritten}/${MAX_WEEKS} hafta yazıldı`} tone="mint" />
                  ) : (
                    <Badge label="Program yok" tone="neutral" />
                  )}

                  {delivery ? (
                    <Badge
                      label={`Gönderildi · ${formatInstantIn(delivery.deliveredAt, timeZoneId)}`}
                      tone="info"
                    />
                  ) : null}

                  {/* The distinction the metric is built on, shown where the claim is. Nothing
                      observed this; a coach said so (ADR-0054). */}
                  {delivery?.evidence === 'SelfReported' ? (
                    <Badge label="Kendisi bildirdi" tone="neutral" />
                  ) : null}

                  {item.isStaleSinceDelivery ? (
                    <Badge label="Gönderildikten sonra düzenlendi" tone="warning" />
                  ) : null}
                </View>

                <View style={styles.actionsGroup}>
                  {canManage ? (
                    <Pressable
                      onPress={() => setEditing(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.memberName} programını düzenle`}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.secondaryButtonPressed,
                      ]}
                    >
                      <AppIcon name="create-outline" size={15} color={colors.textPrimary} />
                      <Text style={styles.secondaryLabel}>
                        {item.weeksWritten > 0 ? 'Programı Düzenle' : 'Program Yaz'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {canManage ? (
                    <Pressable
                      onPress={() => openConversation(item)}
                      disabled={!canSend}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.memberName} ile WhatsApp'ta konuş`}
                      style={({ pressed }) => [
                        styles.whatsappButton,
                        !canSend && styles.whatsappButtonDisabled,
                        pressed && canSend && styles.whatsappButtonPressed,
                      ]}
                    >
                      <AppIcon name="logo-whatsapp" size={15} color={colors.white} />

                      {/* "WhatsApp ile Gönder" would be a claim the button cannot keep: it opens a
                          conversation, and the coach sends the message. */}
                      <Text style={styles.whatsappLabel}>WhatsApp&apos;ta Aç</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {isPending ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText}>
                    WhatsApp açıldı. Programı yapıştırıp gönderdiysen aşağıdan işaretle — bu kayıt
                    senin beyanın olarak saklanır.
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={() => setPendingSend(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Vazgeç"
                      hitSlop={8}
                    >
                      <Text style={styles.cancelLink}>Vazgeç</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmSent(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.memberName} için gönderildi olarak işaretle`}
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.confirmButtonPressed,
                      ]}
                    >
                      <AppIcon name="checkmark-done-outline" size={15} color={colors.white} />
                      <Text style={styles.confirmButtonLabel}>Gönderildi Olarak İşaretle</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })
      )}

      <MemberProgramModal
        key={editing?.memberId ?? 'none'}
        visible={editing !== null}
        memberId={editing?.memberId ?? null}
        memberName={editing?.memberName ?? ''}
        month={roster.month}
        onClose={() => setEditing(null)}
        onSaved={(text) => {
          show(text);
          roster.reload();
        }}
        onError={show}
      />

    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  monthLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 160,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  counters: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  memberCard: {
    gap: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  memberRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 180,
  },
  memberTextGroup: {
    flex: 1,
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
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  secondaryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primaryDark,
  },
  whatsappButtonPressed: {
    backgroundColor: colors.primary,
  },
  whatsappButtonDisabled: {
    backgroundColor: colors.border,
  },
  whatsappLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
  confirmRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  confirmText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  confirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  cancelLink: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmButtonLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
});
