import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { SingleDatePickerModal } from '@/components/ui/SingleDatePickerModal';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { useCatalogs } from '@/context/CatalogsContext';
import * as leadsApi from '@/api/leads';
import {
  CALL_OUTCOME_LABELS,
  LEAD_LOSS_REASON_LABELS,
  LEAD_MEETING_KIND_LABELS,
} from '@/api/enums';
import { toBadgeTone } from '@/types/settings';
import { colors, spacing, typography, radii } from '@/theme';
import { generateTimeOptions, toIsoDate, fromIsoDate, formatRelativeDateTimeLabel } from '@/utils/date';
import { formatDayLabel, toInstant } from '@/utils/calendar';
import { initialsOf } from '@/utils/name';
import type { CallOutcome, LeadDetail, LeadLossReason, LeadMeetingKind } from '@/api/leads';
import type { IconName } from '@/types/dashboard';

interface LeadDetailDrawerProps {
  leadId: string;
  timeZoneId: string;
  /** Whether this caller may turn the lead into a member. Server-enforced too; this hides the action. */
  canConvert: boolean;
  onChanged: () => void;
  onClose: () => void;
  onNotify: (message: string) => void;
}

type TabId = 'activity' | 'history';

const TIME_OPTIONS = generateTimeOptions();

const OUTCOME_META: Record<CallOutcome, { icon: IconName; color: string }> = {
  Unreachable: { icon: 'call-outline', color: colors.warning },
  Busy: { icon: 'time-outline', color: colors.warning },
  Spoke: { icon: 'checkmark-circle-outline', color: colors.primaryDark },
};

/** How long from now to schedule a callback. Hours, because a follow-up is a same-week thing. */
const FOLLOW_UP_OPTIONS = [
  { id: '1', label: '1 Saat Sonra' },
  { id: '3', label: '3 Saat Sonra' },
  { id: '24', label: 'Yarın Bu Saatte' },
  { id: '48', label: '2 Gün Sonra' },
];

type Panel = 'call' | 'meeting' | 'close' | null;

/**
 * One lead, everything that has happened to them, and what to do next.
 *
 * <b>Nothing here decides the pipeline.</b> Logging a call sends the outcome and the server decides
 * whether the lead moves — resolving stages by semantic role and comparing `sortOrder`. The version
 * this replaces made that decision on the client with `indexOf('ilgileniyor')` over the catalog
 * array, so renaming or reordering a column broke the rule silently: the comparison still ran, it
 * just compared the wrong things.
 *
 * <b>The history tab is new.</b> It renders `lead_stage_transition`, which nothing in the product
 * has ever had — the panel overwrites a `stage` string, so a lead that converted keeps no trace of
 * the three weeks it spent unreachable first.
 */
export function LeadDetailDrawer({
  leadId,
  timeZoneId,
  canConvert,
  onChanged,
  onClose,
  onNotify,
}: LeadDetailDrawerProps) {
  const { isMobile } = useResponsiveLayout();
  const { stages } = useCatalogs();
  const { roster } = useStaffRoster();

  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tab, setTab] = useState<TabId>('activity');
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);

  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState<CallOutcome>('Spoke');
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [callNote, setCallNote] = useState('');
  const [meetingKind, setMeetingKind] = useState<LeadMeetingKind>('Consultation');
  const [meetingDate, setMeetingDate] = useState(() => toIsoDate(new Date()));
  const [meetingTime, setMeetingTime] = useState('10:00');
  const [meetingCoach, setMeetingCoach] = useState<string | null>(null);
  const [lossReason, setLossReason] = useState<NonNullable<LeadLossReason>>('NoResponse');
  const [lossNote, setLossNote] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [pickingDate, setPickingDate] = useState(false);

  const reload = useCallback(async () => {
    const next = await fetchLead(leadId);

    if (next === null) {
      setStatus('error');
      return;
    }

    setDetail(next);
    setStatus('ready');
  }, [leadId]);

  useEffect(() => {
    // Wrapped rather than a direct call, so no state is set before an await — React's lint rule
    // reads that as a synchronous setState in an effect, and it is right to: a cascading render on
    // open is what makes a drawer feel like it stutters.
    void (async () => {
      const next = await fetchLead(leadId);

      if (next === null) {
        setStatus('error');
        return;
      }

      setDetail(next);
      setStatus('ready');
    })();
  }, [leadId]);

  const run = (work: () => Promise<string>) => {
    if (busy) return;

    setBusy(true);

    void (async () => {
      try {
        onNotify(await work());
        setPanel(null);
        await reload();
        onChanged();
      } catch (error) {
        onNotify(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const addNote = () =>
    run(async () => {
      await leadsApi.addLeadNote(leadId, note.trim());
      setNote('');
      return 'Not eklendi.';
    });

  const logCall = () =>
    run(async () => {
      // `followUpAt` only travels with an outcome that did not reach the lead — the server refuses
      // it alongside `Spoke`, because a call that finished the conversation has nothing to follow
      // up and scheduling one keeps a dealt-with lead on the call list forever.
      const hours = outcome === 'Spoke' ? null : followUp;

      const result = await leadsApi.logLeadCall(leadId, {
        outcome,
        followUpAt: hours === null ? null : hoursFromNow(Number(hours)),
        note: callNote.trim() || null,
      });

      setCallNote('');
      setFollowUp(null);

      // Reported from the response rather than assumed. Whether the lead moved is the server's
      // decision, and saying "moved to X" when it did not is worse than saying nothing.
      return `Arama kaydedildi. Aşama: ${result.lead.stageTitle}.`;
    });

  const scheduleMeeting = () =>
    run(async () => {
      await leadsApi.scheduleLeadMeeting(leadId, {
        kind: meetingKind,
        startsAt: toInstant(meetingDate, meetingTime, timeZoneId),
        durationMinutes: meetingKind === 'TrialSession' ? 50 : 30,
        coachStaffMemberId: meetingCoach,
      });

      return `${LEAD_MEETING_KIND_LABELS[meetingKind]} takvime eklendi.`;
    });

  const convert = () =>
    run(async () => {
      const result = await leadsApi.convertLead(leadId);

      // "Converted" and "linked to somebody already on the roster" are different outcomes, and the
      // studio should be told which happened — the second means no new member was created.
      return result.alreadyExisted
        ? 'Bu kişi zaten üye kayıtlıydı; aday mevcut üyeye bağlandı.'
        : 'Aday üyeliğe dönüştürüldü.';
    });

  const close = () =>
    run(async () => {
      await leadsApi.closeLead(leadId, { reason: lossReason, note: lossNote.trim() || null });
      setLossNote('');
      return 'Aday kapatıldı.';
    });

  const reopen = () =>
    run(async () => {
      await leadsApi.reopenLead(leadId);
      return 'Aday yeniden açıldı.';
    });

  const lead = detail?.lead;
  const closed = lead?.convertedMemberId !== null || lead?.lossReason !== null;
  const converted = lead?.convertedMemberId !== null && lead?.convertedMemberId !== undefined;

  const tone = lead
    ? toBadgeTone(stages.find((stage) => stage.id === lead.stageId)?.tone ?? 'neutral')
    : 'neutral';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} accessibilityLabel="Kapat" />

        <View style={[styles.drawer, isMobile ? styles.drawerMobile : styles.drawerWide]}>
          {status === 'loading' ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : status === 'error' || !detail || !lead ? (
            <View style={styles.loading}>
              <Text style={styles.errorText}>Aday yüklenemedi.</Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Avatar initials={initialsOf(lead.fullName)} size={44} />
                <View style={styles.headerText}>
                  <Text style={styles.title} numberOfLines={1}>
                    {lead.fullName}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={lead.statusLabel} tone={tone} />
                    {lead.isOverdue ? <Badge label="Gecikmiş" tone="critical" /> : null}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[lead.phoneNumber, lead.email, lead.sourceName].filter(Boolean).join(' · ') ||
                      'İletişim bilgisi yok'}
                  </Text>
                </View>

                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
                  <AppIcon name="close" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.tabRow}>
                {(
                  [
                    { id: 'activity' as const, label: 'Etkinlik' },
                    { id: 'history' as const, label: 'Geçmiş' },
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

              <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {tab === 'history' ? (
                  <View style={styles.timeline}>
                    {detail.transitions.map((entry) => (
                      <View key={entry.id} style={styles.timelineRow}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineText}>
                          <Text style={styles.timelineTitle}>
                            {entry.fromStageTitle
                              ? `${entry.fromStageTitle} → ${entry.toStageTitle}`
                              : entry.toStageTitle}
                          </Text>
                          <Text style={styles.timelineMeta}>
                            {formatRelativeDateTimeLabel(new Date(entry.occurredAt))}
                            {entry.movedByName ? ` · ${entry.movedByName}` : ''}
                          </Text>
                          {entry.reason ? (
                            <Text style={styles.timelineMeta}>{entry.reason}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <>
                    {closed ? (
                      <View style={styles.closedNotice}>
                        <AppIcon
                          name={converted ? 'checkmark-circle-outline' : 'close-circle-outline'}
                          size={16}
                          color={converted ? colors.primaryDark : colors.textSecondary}
                        />
                        <Text style={styles.closedText}>
                          {converted
                            ? 'Bu aday üye oldu.'
                            : `Kapatıldı: ${
                                lead.lossReason ? LEAD_LOSS_REASON_LABELS[lead.lossReason] : ''
                              }`}
                        </Text>
                      </View>
                    ) : null}

                    <Text style={styles.sectionTitle}>Notlar</Text>

                    <View style={styles.noteRow}>
                      <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Not ekle..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.input, styles.noteInput]}
                        multiline
                      />
                      <Pressable
                        onPress={addNote}
                        disabled={busy || note.trim().length === 0}
                        accessibilityRole="button"
                        accessibilityLabel="Notu kaydet"
                        style={[
                          styles.iconButton,
                          (busy || note.trim().length === 0) && styles.disabled,
                        ]}
                      >
                        <AppIcon name="add" size={18} color={colors.white} />
                      </Pressable>
                    </View>

                    {detail.notes.length === 0 ? (
                      <Text style={styles.hint}>Henüz not yok.</Text>
                    ) : (
                      detail.notes.map((entry) => (
                        <View key={entry.id} style={styles.entry}>
                          <Text style={styles.entryText}>{entry.text}</Text>
                          <Text style={styles.entryMeta}>
                            {formatRelativeDateTimeLabel(new Date(entry.createdAt))}
                            {entry.authorName ? ` · ${entry.authorName}` : ''}
                          </Text>
                        </View>
                      ))
                    )}

                    <Text style={styles.sectionTitle}>Aramalar</Text>

                    {detail.calls.length === 0 ? (
                      <Text style={styles.hint}>Henüz arama kaydı yok.</Text>
                    ) : (
                      detail.calls.map((entry) => (
                        <View key={entry.id} style={styles.entry}>
                          <View style={styles.entryHeader}>
                            <AppIcon
                              name={OUTCOME_META[entry.outcome].icon}
                              size={14}
                              color={OUTCOME_META[entry.outcome].color}
                            />
                            <Text style={styles.entryText}>{CALL_OUTCOME_LABELS[entry.outcome]}</Text>
                          </View>
                          {entry.note ? <Text style={styles.entryText}>{entry.note}</Text> : null}
                          <Text style={styles.entryMeta}>
                            {formatRelativeDateTimeLabel(new Date(entry.occurredAt))}
                            {entry.callerName ? ` · ${entry.callerName}` : ''}
                            {entry.followUpAt
                              ? ` · Tekrar: ${formatRelativeDateTimeLabel(new Date(entry.followUpAt))}`
                              : ''}
                          </Text>
                        </View>
                      ))
                    )}
                  </>
                )}
              </ScrollView>

              {closed ? (
                <View style={styles.actions}>
                  {converted ? null : (
                    <Pressable
                      onPress={reopen}
                      disabled={busy}
                      accessibilityRole="button"
                      style={[styles.secondaryButton, busy && styles.disabled]}
                    >
                      <Text style={styles.secondaryLabel}>Yeniden Aç</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => setPanel('call')}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                  >
                    <AppIcon name="call-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.secondaryLabel}>Arama</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setPanel('meeting')}
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                  >
                    <AppIcon name="calendar-outline" size={16} color={colors.textPrimary} />
                    <Text style={styles.secondaryLabel}>Randevu</Text>
                  </Pressable>

                  {canConvert ? (
                    <Pressable
                      onPress={convert}
                      disabled={busy}
                      accessibilityRole="button"
                      style={[styles.primaryButton, busy && styles.disabled]}
                    >
                      <Text style={styles.primaryLabel}>Üye Yap</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={() => setPanel('close')}
                    accessibilityRole="button"
                    style={styles.dangerButton}
                  >
                    <Text style={styles.dangerLabel}>Kapat</Text>
                  </Pressable>
                </View>
              )}

              {/*
                Nested Modals rather than absolutely-positioned overlays: these panels live inside a
                drawer that scrolls, and an overlay would scroll away from the button that opened it.
              */}
              <Modal visible={panel === 'call'} transparent animationType="fade" onRequestClose={() => setPanel(null)}>
                <View style={styles.dialogBackdrop}>
                  <View style={styles.dialog}>
                    <Text style={styles.dialogTitle}>Arama Kaydet</Text>

                    <View style={styles.chipRow}>
                      {(Object.keys(CALL_OUTCOME_LABELS) as CallOutcome[]).map((value) => (
                        <Pressable
                          key={value}
                          onPress={() => setOutcome(value)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: outcome === value }}
                          style={[styles.chip, outcome === value && styles.chipSelected]}
                        >
                          <Text
                            style={[styles.chipLabel, outcome === value && styles.chipLabelSelected]}
                          >
                            {CALL_OUTCOME_LABELS[value]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/*
                      Offered only when the call did not reach them. The server refuses a follow-up
                      alongside "Konuştu", so showing the control there would be offering something
                      that comes back as an error.
                    */}
                    {outcome === 'Spoke' ? (
                      <Text style={styles.hint}>
                        Konuşulan adaylar sunucu tarafından bir sonraki aşamaya taşınır.
                      </Text>
                    ) : (
                      <View style={styles.chipRow}>
                        {FOLLOW_UP_OPTIONS.map((option) => (
                          <Pressable
                            key={option.id}
                            onPress={() => setFollowUp(followUp === option.id ? null : option.id)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: followUp === option.id }}
                            style={[styles.chip, followUp === option.id && styles.chipSelected]}
                          >
                            <Text
                              style={[
                                styles.chipLabel,
                                followUp === option.id && styles.chipLabelSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    <TextInput
                      value={callNote}
                      onChangeText={setCallNote}
                      placeholder="Arama notu (isteğe bağlı)"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                    />

                    <DialogActions onCancel={() => setPanel(null)} onConfirm={logCall} busy={busy} />
                  </View>
                </View>
              </Modal>

              <Modal visible={panel === 'meeting'} transparent animationType="fade" onRequestClose={() => setPanel(null)}>
                <View style={styles.dialogBackdrop}>
                  <View style={styles.dialog}>
                    <Text style={styles.dialogTitle}>Randevu Planla</Text>

                    <View style={styles.chipRow}>
                      {(Object.keys(LEAD_MEETING_KIND_LABELS) as LeadMeetingKind[]).map((value) => (
                        <Pressable
                          key={value}
                          onPress={() => setMeetingKind(value)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: meetingKind === value }}
                          style={[styles.chip, meetingKind === value && styles.chipSelected]}
                        >
                          <Text
                            style={[
                              styles.chipLabel,
                              meetingKind === value && styles.chipLabelSelected,
                            ]}
                          >
                            {LEAD_MEETING_KIND_LABELS[value]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => setPickingDate(true)}
                      accessibilityRole="button"
                      style={styles.input}
                    >
                      <Text style={styles.inputText}>{formatDayLabel(meetingDate)}</Text>
                    </Pressable>

                    <DropdownSelect
                      placeholder="Saat seç"
                      selectedId={meetingTime}
                      options={TIME_OPTIONS.map((option) => ({ id: option, label: option }))}
                      open={openDropdown === 'time'}
                      onToggle={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
                      onSelect={(id) => {
                        if (id) setMeetingTime(id);
                        setOpenDropdown(null);
                      }}
                    />

                    <DropdownSelect
                      placeholder="Eğitmen seç"
                      clearLabel="Eğitmen atama"
                      selectedId={meetingCoach}
                      options={roster
                        .filter((member) => member.status !== 'Inactive')
                        .map((member) => ({ id: member.id, label: member.fullName }))}
                      open={openDropdown === 'coach'}
                      onToggle={() => setOpenDropdown(openDropdown === 'coach' ? null : 'coach')}
                      onSelect={(id) => {
                        setMeetingCoach(id);
                        setOpenDropdown(null);
                      }}
                    />

                    <Text style={styles.hint}>
                      Randevu takvime de eklenir. Seçilen eğitmenin o saatte başka dersi varsa
                      kaydedilmez.
                    </Text>

                    <DialogActions
                      onCancel={() => setPanel(null)}
                      onConfirm={scheduleMeeting}
                      busy={busy}
                    />

                    <SingleDatePickerModal
                      visible={pickingDate}
                      initialDate={fromIsoDate(meetingDate) ?? undefined}
                      onClose={() => setPickingDate(false)}
                      onSelect={(next) => {
                        setMeetingDate(toIsoDate(next));
                        setPickingDate(false);
                      }}
                    />
                  </View>
                </View>
              </Modal>

              <Modal visible={panel === 'close'} transparent animationType="fade" onRequestClose={() => setPanel(null)}>
                <View style={styles.dialogBackdrop}>
                  <View style={styles.dialog}>
                    <Text style={styles.dialogTitle}>Adayı Kapat</Text>
                    <Text style={styles.dialogBody}>
                      Kapatılan aday takipten çıkar. Neden, dönüşüm raporlarında gruplanır.
                    </Text>

                    <View style={styles.chipRow}>
                      {(Object.keys(LEAD_LOSS_REASON_LABELS) as NonNullable<LeadLossReason>[]).map(
                        (value) => (
                          <Pressable
                            key={value}
                            onPress={() => setLossReason(value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: lossReason === value }}
                            style={[styles.chip, lossReason === value && styles.chipSelected]}
                          >
                            <Text
                              style={[
                                styles.chipLabel,
                                lossReason === value && styles.chipLabelSelected,
                              ]}
                            >
                              {LEAD_LOSS_REASON_LABELS[value]}
                            </Text>
                          </Pressable>
                        ),
                      )}
                    </View>

                    <TextInput
                      value={lossNote}
                      onChangeText={setLossNote}
                      placeholder="Açıklama (isteğe bağlı)"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.input}
                    />

                    <DialogActions onCancel={() => setPanel(null)} onConfirm={close} busy={busy} />
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

function DialogActions({
  onCancel,
  onConfirm,
  busy,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.dialogActions}>
      <Pressable onPress={onCancel} accessibilityRole="button" style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>Vazgeç</Text>
      </Pressable>
      <Pressable
        onPress={onConfirm}
        disabled={busy}
        accessibilityRole="button"
        style={[styles.primaryButton, busy && styles.disabled]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.primaryLabel}>Kaydet</Text>
        )}
      </Pressable>
    </View>
  );
}

/** Null on failure, so the effect can branch without a try/catch straddling a setState. */
async function fetchLead(leadId: string): Promise<LeadDetail | null> {
  try {
    return await leadsApi.getLead(leadId);
  } catch {
    return null;
  }
}

/** An instant N hours from now, ISO-8601. The server stores the instant; the client formats it. */
function hoursFromNow(hours: number): string {
  const at = new Date();
  at.setHours(at.getHours() + hours);
  return at.toISOString();
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
    width: 460,
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
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    fontSize: 20,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
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
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
  },
  entry: {
    gap: 2,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  entryMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timeline: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  timelineText: {
    flex: 1,
    gap: 2,
  },
  timelineTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  timelineMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBackground,
  },
  closedText: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  inputText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  secondaryLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  dangerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.critical,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dangerLabel: {
    ...typography.button,
    color: colors.critical,
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
    maxWidth: 440,
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
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
