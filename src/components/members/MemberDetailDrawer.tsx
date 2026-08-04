import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppIcon } from '@/components/ui/AppIcon';
import { MembershipPanel } from '@/components/members/MembershipPanel';
import { SessionLedgerPanel } from '@/components/members/SessionLedgerPanel';
import { GiftsPanel } from '@/components/members/GiftsPanel';
import { PaymentsPanel } from '@/components/members/PaymentsPanel';
import { MemberFormModal } from '@/components/members/MemberFormModal';
import { useAuth } from '@/context/AuthContext';
import { useCatalogs } from '@/context/CatalogsContext';
import { useStaffRoster, nameOf } from '@/hooks/useStaffRoster';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import * as membersApi from '@/api/members';
import { ApiError } from '@/api/problem';
import { MEMBERSHIP_STATE_LABELS } from '@/api/enums';
import { formatIsoDateLabel } from '@/utils/date';
import { initialsOf } from '@/utils/name';
import { colors, spacing, typography, radii } from '@/theme';
import type { MemberBody, MemberDetail } from '@/api/members';

interface MemberDetailDrawerProps {
  memberId: string;
  timeZoneId: string;
  /** Called after anything that changes the list or the counters above it. */
  onChanged: () => void;
  onClose: () => void;
  /** Shows a confirmation somewhere the drawer is not covering. */
  onNotify: (message: string) => void;
}

type TabId = 'profile' | 'membership' | 'sessions' | 'payments' | 'gifts';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profil' },
  { id: 'membership', label: 'Üyelik' },
  { id: 'sessions', label: 'Seans Geçmişi' },
  { id: 'payments', label: 'Ödemeler' },
  { id: 'gifts', label: 'Hediyeler' },
];

/**
 * One member, in five tabs.
 *
 * <b>"Ödemeler" is the fifth, and it was deliberately absent until now.</b> It needs the finance
 * module, and a tab opening onto "yakında" would have been worse than one that was not there — it
 * would have looked like a feature that was broken rather than one that had not been built. The
 * module shipped in Phase 2.5, so the tab did too.
 *
 * <b>It is hidden without `finance.payments.read`.</b> Rendering it and letting the panel 403 would
 * show a coach a tab that never loads; the matrix says what a coach may see and the drawer agrees
 * with it rather than discovering it.
 *
 * <b>The status dropdown is gone.</b> The panel let somebody set a member's status by picking from
 * a list, which is how an 8-week freeze released after 2 days ends up gifting 54 free days: the
 * status was the thing being edited, and the dates were adjusted to match. State is derived from
 * memberships here, and every way of changing it is a named command with rules behind it —
 * Dondur, Çöz, Sat, İptal.
 */
export function MemberDetailDrawer({
  memberId,
  timeZoneId,
  onChanged,
  onClose,
  onNotify,
}: MemberDetailDrawerProps) {
  const { isMobile } = useResponsiveLayout();
  const { permissions } = useAuth();
  const { interests } = useCatalogs();
  const { roster } = useStaffRoster();

  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<TabId>('profile');

  // Hidden rather than rendered-and-refused. A coach holds no finance permission, and a tab that
  // opened onto a 403 would read as a broken screen rather than as one that is not theirs.
  const canSeeFinance = permissions['finance.payments.read'] !== undefined;
  const visibleTabs = canSeeFinance ? TABS : TABS.filter((entry) => entry.id !== 'payments');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const generation = useRef(0);

  const load = useCallback(async () => {
    const current = ++generation.current;
    const next = await fetchDetail(memberId);

    if (generation.current !== current) return;

    if (next === null) {
      setStatus('error');
      return;
    }

    setDetail(next);
    setStatus('ready');
  }, [memberId]);

  useEffect(() => {
    // Wrapped rather than `void load()`, so no state is set before an await. React's lint rule
    // reads a direct call as a synchronous setState and refuses it — and it is right to: a
    // cascading render on open is exactly what makes a drawer feel like it stutters.
    void (async () => {
      const current = ++generation.current;
      const next = await fetchDetail(memberId);

      if (generation.current !== current) return;

      if (next === null) {
        setStatus('error');
        return;
      }

      setDetail(next);
      setStatus('ready');
    })();
  }, [memberId]);

  /**
   * Re-reads the member and tells the list to re-read too.
   *
   * Both, always. A freeze changes the badge on the row behind the drawer and the "Dondurulmuş"
   * counter above it, and a drawer that refreshed only itself would leave the list describing the
   * member as they were before the studio touched them.
   */
  const refresh = useCallback(async () => {
    await load();
    onChanged();
  }, [load, onChanged]);

  const saveProfile = async (body: MemberBody) => {
    setSaving(true);
    setSaveError(null);

    try {
      await membersApi.updateMember(memberId, body);
      setEditing(false);
      await refresh();
      onNotify('Üye bilgileri güncellendi.');
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : 'Üye kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArchived = async () => {
    if (!detail) return;

    const archiving = !detail.isArchived;

    try {
      await membersApi.setMemberArchived(memberId, archiving);
      await refresh();
      onNotify(archiving ? 'Üye arşivlendi.' : 'Üye tekrar aktif listede.');
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'İşlem tamamlanamadı.');
    }
  };

  const state = detail?.current?.state ?? 'NoMembership';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, isMobile && styles.overlayMobile]}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />

        <View style={[styles.panel, isMobile && styles.panelMobile]}>
          {status === 'loading' ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : status === 'error' || !detail ? (
            <View style={styles.centered}>
              <Text style={styles.emptyTitle}>Üye yüklenemedi</Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel="Tekrar dene"
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
              >
                <Text style={styles.retryLabel}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Avatar initials={initialsOf(detail.fullName)} size={44} />
                <View style={styles.headerText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {detail.fullName}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {detail.current
                      ? `${detail.current.packageName} · ${MEMBERSHIP_STATE_LABELS[state]}`
                      : MEMBERSHIP_STATE_LABELS.NoMembership}
                  </Text>
                </View>
                {detail.isArchived ? <Badge label="Arşivde" tone="neutral" /> : null}
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Kapat"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.tabRow}>
                {visibleTabs.map((entry) => {
                  const active = entry.id === tab;
                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() => setTab(entry.id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={entry.label}
                      style={[styles.tab, active && styles.tabActive]}
                    >
                      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                        {entry.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                keyboardShouldPersistTaps="handled"
              >
                {tab === 'profile' ? (
                  <ProfileTab
                    detail={detail}
                    coachName={nameOf(roster, detail.primaryCoachStaffMemberId)}
                    interestLabels={detail.interestIds
                      .map((id) => interests.find((entry) => entry.id === id)?.label)
                      .filter((label): label is string => label !== undefined)}
                    onEdit={() => {
                      setSaveError(null);
                      setEditing(true);
                    }}
                    onToggleArchived={() => void toggleArchived()}
                  />
                ) : null}

                {tab === 'membership' ? (
                  <MembershipPanel
                    detail={detail}
                    timeZoneId={timeZoneId}
                    onChanged={refresh}
                    onNotify={onNotify}
                  />
                ) : null}

                {tab === 'sessions' ? (
                  <SessionLedgerPanel
                    memberId={memberId}
                    initialEntries={detail.recentSessions}
                    canAdjust={detail.current !== null}
                    onChanged={refresh}
                    onNotify={onNotify}
                  />
                ) : null}

                {tab === 'payments' ? (
                  <PaymentsPanel memberId={memberId} timeZoneId={timeZoneId} />
                ) : null}

                {tab === 'gifts' ? (
                  <GiftsPanel
                    memberId={memberId}
                    gifts={detail.gifts}
                    onChanged={refresh}
                    onNotify={onNotify}
                  />
                ) : null}
              </ScrollView>
            </>
          )}
        </View>
      </View>

      {editing && detail ? (
        <MemberFormModal
          visible
          editing={detail}
          timeZoneId={timeZoneId}
          onSubmit={saveProfile}
          onClose={() => setEditing(false)}
          busy={saving}
          error={saveError}
        />
      ) : null}
    </Modal>
  );
}

/** Fetches, reporting failure as a value so no caller sets state before an await. */
async function fetchDetail(memberId: string): Promise<MemberDetail | null> {
  try {
    return await membersApi.getMember(memberId);
  } catch {
    return null;
  }
}

/** The profile tab: what the studio knows about the person, and the two commands about them. */
function ProfileTab({
  detail,
  coachName,
  interestLabels,
  onEdit,
  onToggleArchived,
}: {
  detail: MemberDetail;
  coachName: string | null;
  interestLabels: string[];
  onEdit: () => void;
  onToggleArchived: () => void;
}) {
  return (
    <View style={styles.section}>
      <Field label="Telefon" value={detail.phoneNumber} />
      <Field label="E-posta" value={detail.email} />
      <Field
        label="Doğum Tarihi"
        value={detail.birthDate ? formatIsoDateLabel(detail.birthDate) : null}
      />
      <Field label="Katılım" value={formatIsoDateLabel(detail.joinedOn)} />
      <Field label="Sorumlu Eğitmen" value={coachName} />
      <Field
        label="İlgi Alanları"
        value={interestLabels.length > 0 ? interestLabels.join(', ') : null}
      />
      <Field label="Not" value={detail.notes} />

      <View style={styles.actionRow}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Üyeyi düzenle"
          style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
        >
          <Text style={styles.primaryActionLabel}>Düzenle</Text>
        </Pressable>

        <Pressable
          onPress={onToggleArchived}
          accessibilityRole="button"
          accessibilityLabel={detail.isArchived ? 'Arşivden çıkar' : 'Arşivle'}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryActionLabel}>
            {detail.isArchived ? 'Arşivden Çıkar' : 'Arşivle'}
          </Text>
        </Pressable>
      </View>

      {/* Said out loud because "Arşivle" reads like a delete, and somebody hesitating over it
          deserves to know it is not one. */}
      <Text style={styles.hint}>
        Arşivlemek üyeyi listeden çıkarır, kaydını silmez. Üyelikleri, seans geçmişi ve ödemeleri
        olduğu gibi kalır.
      </Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={[styles.fieldValue, !value && styles.fieldEmpty]}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayMobile: {
    justifyContent: 'center',
    padding: spacing.md,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    height: '100%',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  panelMobile: {
    height: '92%',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  retryButton: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryPressed: {
    backgroundColor: colors.pageBackground,
  },
  retryLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  fieldEmpty: {
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryAction: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryActionLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryAction: {
    height: 40,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    backgroundColor: colors.pageBackground,
  },
  secondaryActionLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
