import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { useCatalogs, activeOnly } from '@/context/CatalogsContext';
import * as membersApi from '@/api/members';
import { ApiError } from '@/api/problem';
import { MEMBERSHIP_STATE_LABELS } from '@/api/enums';
import { formatIsoDateLabel, fromIsoDate, toIsoDate, todayIn } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { colors, spacing, typography, radii } from '@/theme';
import type { MemberDetail, MembershipState, MembershipSummary } from '@/api/members';

interface MembershipPanelProps {
  detail: MemberDetail;
  timeZoneId: string;
  onChanged: () => Promise<void>;
  onNotify: (message: string) => void;
}

const STATE_TONES: Record<MembershipState, 'mint' | 'info' | 'neutral' | 'critical'> = {
  Active: 'mint',
  Frozen: 'info',
  Expired: 'neutral',
  Cancelled: 'critical',
  NoMembership: 'neutral',
};

type DialogId = 'sell' | 'freeze' | 'cancel' | null;

/**
 * The membership tab: what they have, and the four things that can be done to it.
 *
 * <b>Freeze is the one worth reading carefully.</b> The panel's `freeze(weeks)` extended the end
 * date by `weeks × 7` immediately, and unfreezing flipped the status back without reversing any of
 * it — so a member frozen for eight weeks who came back after two days kept 54 free days. Here the
 * end date does not move when the freeze starts. It moves when the freeze is released, by the days
 * actually frozen (ADR-0027), which is why the form asks for an expected end rather than a
 * commitment.
 */
export function MembershipPanel({ detail, timeZoneId, onChanged, onNotify }: MembershipPanelProps) {
  const [dialog, setDialog] = useState<DialogId>(null);
  const [busy, setBusy] = useState(false);

  const current = detail.current;
  const state: MembershipState = current?.state ?? 'NoMembership';

  const openFreeze = detail.freezes.find((freeze) => freeze.releasedOn === null) ?? null;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);

    try {
      await action();
      setDialog(null);
      await onChanged();
      onNotify(success);
    } catch (error) {
      onNotify(error instanceof ApiError ? error.message : 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {current ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.packageName} numberOfLines={1}>
              {current.packageName}
            </Text>
            <Badge label={MEMBERSHIP_STATE_LABELS[state]} tone={STATE_TONES[state]} />
          </View>

          <Row label="Başlangıç" value={formatIsoDateLabel(current.startsOn)} />
          <Row label="Bitiş" value={formatIsoDateLabel(current.endsOn)} />
          <Row
            label="Kalan Seans"
            value={
              current.sessionsTotal === null
                ? 'Sınırsız'
                : `${current.sessionsRemaining ?? 0} / ${current.sessionsTotal}`
            }
          />

          {/* Absent, not zero. `price` comes back null for a caller without members.financial.read,
              and rendering ₺0 would tell a coach the package was free. */}
          {formatMoney(current.price, current.currency) ? (
            <Row label="Ücret" value={formatMoney(current.price, current.currency)!} />
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>Aktif üyelik yok</Text>
          <Text style={styles.hint}>
            Paket satıldığında üyelik başlar ve seans bakiyesi buradan işler.
          </Text>
        </View>
      )}

      {openFreeze ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            {formatIsoDateLabel(openFreeze.startsOn)} tarihinden beri dondurulmuş
          </Text>
          <Text style={styles.noticeBody}>
            Beklenen bitiş {formatIsoDateLabel(openFreeze.endsOn)}. Üyelik, çözüldüğünde{' '}
            <Text style={styles.noticeStrong}>fiilen donduğu gün kadar</Text> uzatılır — sekiz
            haftalık bir dondurma iki gün sonra çözülürse iki gün eklenir.
          </Text>
          {openFreeze.reason ? (
            <Text style={styles.noticeBody}>Sebep: {openFreeze.reason}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Action label="Paket Sat" onPress={() => setDialog('sell')} disabled={busy} primary />

        {state === 'Active' ? (
          <Action label="Dondur" onPress={() => setDialog('freeze')} disabled={busy} />
        ) : null}

        {state === 'Frozen' ? (
          <Action
            label="Dondurmayı Çöz"
            onPress={() =>
              void run(() => membersApi.unfreezeMembership(detail.id), 'Üyelik tekrar aktif.')
            }
            disabled={busy}
          />
        ) : null}

        {state === 'Active' || state === 'Frozen' ? (
          <Action label="İptal Et" onPress={() => setDialog('cancel')} disabled={busy} danger />
        ) : null}
      </View>

      {detail.history.length > 0 ? (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Geçmiş Üyelikler</Text>
          {detail.history.map((entry) => (
            <HistoryRow key={entry.id} membership={entry} />
          ))}
        </View>
      ) : null}

      {detail.freezes.length > 0 ? (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Dondurma Kayıtları</Text>
          {detail.freezes.map((freeze) => (
            <View key={freeze.id} style={styles.historyRow}>
              <Text style={styles.historyPrimary}>
                {formatIsoDateLabel(freeze.startsOn)} →{' '}
                {freeze.releasedOn
                  ? formatIsoDateLabel(freeze.releasedOn)
                  : `${formatIsoDateLabel(freeze.endsOn)} (planlanan)`}
              </Text>
              <Text style={styles.historySecondary}>
                {freeze.releasedOn ? `${freeze.extendedByDays ?? 0} gün uzatıldı` : 'Devam ediyor'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {dialog === 'sell' ? (
        <SellDialog
          timeZoneId={timeZoneId}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(body) =>
            void run(() => membersApi.sellMembership(detail.id, body), 'Paket satıldı.')
          }
        />
      ) : null}

      {dialog === 'freeze' ? (
        <FreezeDialog
          timeZoneId={timeZoneId}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(body) =>
            void run(() => membersApi.freezeMembership(detail.id, body), 'Üyelik donduruldu.')
          }
        />
      ) : null}

      {dialog === 'cancel' ? (
        <CancelDialog
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(reason) =>
            void run(() => membersApi.cancelMembership(detail.id, reason), 'Üyelik iptal edildi.')
          }
        />
      ) : null}
    </View>
  );
}

/**
 * Selling a package.
 *
 * The template's terms are copied onto the membership server-side, so a price change next month
 * does not reprice this sale (ADR-0035). `priceOverride` is what the studio actually charged when
 * it differs — a discount recorded here appears in revenue; one applied by editing the template
 * afterwards silently rewrites history instead.
 */
function SellDialog({
  timeZoneId,
  busy,
  onClose,
  onSubmit,
}: {
  timeZoneId: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: {
    packageTemplateId: string;
    startsOn: string | null;
    priceOverride: number | null;
  }) => void;
}) {
  const { packages } = useCatalogs();
  const offered = activeOnly(packages);

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [startsOn, setStartsOn] = useState(todayIn(timeZoneId));
  const [override, setOverride] = useState('');
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);

  const template = offered.find((entry) => entry.id === templateId) ?? null;
  const parsedOverride = override.trim() === '' ? null : Number(override.replace(',', '.'));
  const overrideValid =
    parsedOverride === null || (Number.isFinite(parsedOverride) && parsedOverride >= 0);

  return (
    <Dialog title="Paket Sat" onClose={onClose}>
      {offered.length === 0 ? (
        <Text style={styles.hint}>
          Satılabilir paket yok. Ayarlar ekranından paket tanımlayabilirsin.
        </Text>
      ) : (
        <>
          <Text style={styles.fieldLabel}>Paket</Text>
          <DropdownSelect
            placeholder="Paket seç"
            options={offered.map((entry) => ({
              id: entry.id,
              label: entry.name,
              meta:
                entry.sessionCount === null
                  ? `Sınırsız · ${entry.durationDays} gün`
                  : `${entry.sessionCount} seans · ${entry.durationDays} gün`,
            }))}
            selectedId={templateId}
            onSelect={(id) => {
              setTemplateId(id);
              setOpen(false);
            }}
            open={open}
            onToggle={() => setOpen((current) => !current)}
          />

          <Text style={styles.fieldLabel}>Başlangıç</Text>
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel="Başlangıç tarihi"
            style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
          >
            <Text style={styles.dateText}>{formatIsoDateLabel(startsOn)}</Text>
          </Pressable>

          <Text style={styles.fieldLabel}>
            Ücret{' '}
            {template && formatMoney(template.price, template.currency)
              ? `(liste: ${formatMoney(template.price, template.currency)})`
              : ''}
          </Text>
          <TextInput
            value={override}
            onChangeText={setOverride}
            placeholder="Liste fiyatı uygulanacak"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={styles.input}
            accessibilityLabel="Ücret"
          />
          <Text style={styles.hint}>
            Boş bırakırsan paketin fiyatı uygulanır. İndirim yaptıysan buraya gerçek tutarı yaz —
            paketin fiyatını değiştirmek eski satışları da etkilerdi.
          </Text>

          <SubmitButton
            label="Sat"
            busy={busy}
            disabled={templateId === null || !overrideValid}
            onPress={() =>
              onSubmit({
                packageTemplateId: templateId!,
                startsOn,
                priceOverride: parsedOverride,
              })
            }
          />
        </>
      )}

      <SingleDatePickerModal
        visible={picking}
        title="Başlangıç Tarihi"
        initialDate={fromIsoDate(startsOn) ?? undefined}
        onClose={() => setPicking(false)}
        onSelect={(date) => {
          setStartsOn(toIsoDate(date));
          setPicking(false);
        }}
      />
    </Dialog>
  );
}

/** Freezing. The end date is a request, not a commitment — see the panel's header comment. */
function FreezeDialog({
  timeZoneId,
  busy,
  onClose,
  onSubmit,
}: {
  timeZoneId: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: { startsOn: string | null; endsOn: string; reason: string | null }) => void;
}) {
  const today = todayIn(timeZoneId);

  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [reason, setReason] = useState('');
  const [picking, setPicking] = useState<'startsOn' | 'endsOn' | null>(null);

  const valid = endsOn >= startsOn;

  return (
    <Dialog title="Üyeliği Dondur" onClose={onClose}>
      <View style={styles.dialogRow}>
        <View style={styles.dialogRowItem}>
          <Text style={styles.fieldLabel}>Başlangıç</Text>
          <Pressable
            onPress={() => setPicking('startsOn')}
            accessibilityRole="button"
            accessibilityLabel="Dondurma başlangıcı"
            style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
          >
            <Text style={styles.dateText}>{formatIsoDateLabel(startsOn)}</Text>
          </Pressable>
        </View>
        <View style={styles.dialogRowItem}>
          <Text style={styles.fieldLabel}>Beklenen Bitiş</Text>
          <Pressable
            onPress={() => setPicking('endsOn')}
            accessibilityRole="button"
            accessibilityLabel="Dondurma bitişi"
            style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
          >
            <Text style={styles.dateText}>{formatIsoDateLabel(endsOn)}</Text>
          </Pressable>
        </View>
      </View>

      {!valid ? <Text style={styles.error}>Bitiş, başlangıçtan önce olamaz.</Text> : null}

      <Text style={styles.fieldLabel}>Sebep (opsiyonel)</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Ör. sakatlık, seyahat"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        accessibilityLabel="Sebep"
      />

      <Text style={styles.hint}>
        Üyeliğin bitiş tarihi şimdi değişmez. Dondurma çözüldüğünde, fiilen donduğu gün sayısı kadar
        uzatılır.
      </Text>

      <SubmitButton
        label="Dondur"
        busy={busy}
        disabled={!valid}
        onPress={() => onSubmit({ startsOn, endsOn, reason: reason.trim() || null })}
      />

      <SingleDatePickerModal
        visible={picking !== null}
        title={picking === 'startsOn' ? 'Dondurma Başlangıcı' : 'Beklenen Bitiş'}
        initialDate={fromIsoDate(picking === 'startsOn' ? startsOn : endsOn) ?? undefined}
        onClose={() => setPicking(null)}
        onSelect={(date) => {
          const iso = toIsoDate(date);
          if (picking === 'startsOn') {
            setStartsOn(iso);
            // Carried forward, so moving the start past the end does not leave an invalid range
            // the person has to notice and fix.
            if (endsOn < iso) setEndsOn(iso);
          }
          if (picking === 'endsOn') setEndsOn(iso);
          setPicking(null);
        }}
      />
    </Dialog>
  );
}

/** Cancelling. Ends the membership; the ledger and the history stay. */
function CancelDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string | null) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog title="Üyeliği İptal Et" onClose={onClose}>
      <Text style={styles.hint}>
        Üyelik sona erer ve seans bakiyesi kullanılamaz olur. Geçmiş, ödemeler ve seans kayıtları
        silinmez.
      </Text>

      <Text style={styles.fieldLabel}>Sebep (opsiyonel)</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Ör. şehir değişikliği"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        accessibilityLabel="İptal sebebi"
      />

      <SubmitButton
        label="İptal Et"
        busy={busy}
        disabled={false}
        danger
        onPress={() => onSubmit(reason.trim() || null)}
      />
    </Dialog>
  );
}

function HistoryRow({ membership }: { membership: MembershipSummary }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyText}>
        <Text style={styles.historyPrimary} numberOfLines={1}>
          {membership.packageName}
        </Text>
        <Text style={styles.historySecondary}>
          {formatIsoDateLabel(membership.startsOn)} → {formatIsoDateLabel(membership.endsOn)}
        </Text>
      </View>
      <Badge
        label={MEMBERSHIP_STATE_LABELS[membership.state]}
        tone={STATE_TONES[membership.state]}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Action({
  label,
  onPress,
  disabled,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.action,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
        disabled && styles.actionDisabled,
        pressed && styles.actionPressed,
      ]}
    >
      <Text
        style={[
          styles.actionLabel,
          primary && styles.actionLabelPrimary,
          danger && styles.actionLabelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * The shell every one of these dialogs shares.
 *
 * Its own `Modal`, not an absolutely-positioned overlay. The drawer is already a modal with a
 * scrolling body, so an overlay inside it would be positioned against the scrolled content and
 * would scroll away with it — and `position: 'fixed'` is a web-only escape hatch that does nothing
 * on native.
 */
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.dialogPanel}>
          <Text style={styles.dialogTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function SubmitButton({
  label,
  busy,
  disabled,
  danger,
  onPress,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const blocked = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.submitButton,
        danger && styles.submitDanger,
        blocked && styles.submitDisabled,
        pressed && styles.submitPressed,
      ]}
    >
      <Text style={styles.submitLabel}>{busy ? 'İşleniyor…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  packageName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  notice: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.info,
    backgroundColor: colors.mintLight,
  },
  noticeTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  noticeBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noticeStrong: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionDanger: {
    borderColor: colors.critical,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  actionLabelPrimary: {
    color: colors.white,
  },
  actionLabelDanger: {
    color: colors.critical,
  },
  historySection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  historyPrimary: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  historySecondary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  dialogPanel: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  dialogTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dialogRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dialogRowItem: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.critical,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    ...typography.body,
    color: colors.textPrimary,
  },
  dateTrigger: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  dateTriggerPressed: {
    backgroundColor: colors.cardBackground,
  },
  dateText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  submitButton: {
    height: 44,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDanger: {
    backgroundColor: colors.critical,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});
