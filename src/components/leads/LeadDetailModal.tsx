import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, spacing, typography, radii } from '@/theme';
import { useCatalogs } from '@/context/CatalogsContext';
import { getLeadSourceMeta, getStageMeta } from '@/utils/leads';
import { WEEKDAYS, generateTimeOptions } from '@/utils/date';
import type { Lead, CallOutcome } from '@/types/leads';
import type { IconName } from '@/types/dashboard';
import type { TeamMember } from '@/types/team';

export type MeetingKind = 'yuzyuze-gorusme' | 'deneme-planlandi';

interface LeadDetailModalProps {
  visible: boolean;
  lead: Lead | null;
  trainers: TeamMember[];
  onClose: () => void;
  onAddNote: (leadId: string, text: string) => void;
  onLogCall: (leadId: string, outcome: CallOutcome, followUpHours?: number) => void;
  onScheduleMeeting: (leadId: string, kind: MeetingKind, weekdayId: string, time: string, trainerName: string) => void;
}

const CALL_OUTCOME_META: Record<CallOutcome, { label: string; icon: IconName; color: string }> = {
  ulasilamadi: { label: 'Ulaşılamadı', icon: 'call-outline', color: colors.warning },
  mesgul: { label: 'Meşgul', icon: 'time-outline', color: colors.warning },
  konustu: { label: 'Konuştum', icon: 'checkmark-circle-outline', color: colors.primaryDark },
};

const FOLLOW_UP_OPTIONS: { id: string; label: string; hours: number }[] = [
  { id: '1h', label: '1 Saat Sonra', hours: 1 },
  { id: '3h', label: '3 Saat Sonra', hours: 3 },
  { id: '24h', label: 'Yarın Bu Saatte', hours: 24 },
  { id: '48h', label: '2 Gün Sonra', hours: 48 },
];

const MEETING_KIND_LABEL: Record<MeetingKind, string> = {
  'yuzyuze-gorusme': 'Yüzyüze Görüşme',
  'deneme-planlandi': 'Deneme Dersi',
};

const TIME_OPTIONS = generateTimeOptions();

type ScheduleOrigin = 'konustu-choice' | 'direct';

type Panel =
  | { kind: 'followup'; outcome: 'ulasilamadi' | 'mesgul' }
  | { kind: 'konustu-choice' }
  | { kind: 'schedule'; target: MeetingKind; origin: ScheduleOrigin }
  | null;

export function LeadDetailModal({ visible, lead, trainers, onClose, onAddNote, onLogCall, onScheduleMeeting }: LeadDetailModalProps) {
  const [draft, setDraft] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [scheduleDay, setScheduleDay] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [scheduleTrainer, setScheduleTrainer] = useState<string | null>(null);
  const [trainerDropdownOpen, setTrainerDropdownOpen] = useState(false);
  const { leadSources, stages } = useCatalogs();

  if (!lead) return null;

  const source = getLeadSourceMeta(leadSources, lead.source);
  const stageTone = getStageMeta(stages, lead.stage).tone;
  const notes = lead.notes ?? [];
  const orderedNotes = [...notes].reverse();
  const callLogs = lead.callLogs ?? [];
  const orderedCallLogs = [...callLogs].reverse();

  const resetPanel = () => {
    setPanel(null);
    setScheduleDay(null);
    setScheduleTime('09:00');
    setTimeDropdownOpen(false);
    setScheduleTrainer(null);
    setTrainerDropdownOpen(false);
  };

  const handleClose = () => {
    setDraft('');
    resetPanel();
    onClose();
  };

  const handleAddNote = () => {
    const text = draft.trim();
    if (!text) return;
    onAddNote(lead.id, text);
    setDraft('');
  };

  const handleOutcomePress = (outcome: CallOutcome) => {
    if (outcome === 'konustu') {
      setPanel({ kind: 'konustu-choice' });
      return;
    }
    setPanel({ kind: 'followup', outcome });
  };

  const handleConfirmFollowUp = (hours: number) => {
    if (panel?.kind !== 'followup') return;
    onLogCall(lead.id, panel.outcome, hours);
    resetPanel();
  };

  const handleMarkInterestedOnly = () => {
    onLogCall(lead.id, 'konustu');
    resetPanel();
  };

  const handleOpenSchedule = (target: MeetingKind, origin: ScheduleOrigin) => {
    setPanel({ kind: 'schedule', target, origin });
    setScheduleDay(null);
    setScheduleTime('09:00');
    setScheduleTrainer(trainers.some((trainer) => trainer.name === lead.assignedTrainer) ? lead.assignedTrainer : null);
  };

  const handleConfirmSchedule = () => {
    if (panel?.kind !== 'schedule' || !scheduleDay || !scheduleTrainer) return;
    onScheduleMeeting(lead.id, panel.target, scheduleDay, scheduleTime, scheduleTrainer);
    resetPanel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Avatar initials={lead.name.split(' ').map((part) => part[0]).join('').slice(0, 2)} size={44} />
              <View style={styles.headerTextGroup}>
                <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
                <View style={styles.sourceRow}>
                  <AppIcon name={source.icon} size={13} color={colors.textSecondary} />
                  <Text style={styles.sourceLabel}>{source.label}</Text>
                </View>
              </View>
              <Badge label={lead.statusLabel} tone={stageTone} />
            </View>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>İlgi</Text>
                <Text style={styles.metaValue}>{lead.interest}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Sorumlu</Text>
                <Text style={styles.metaValue}>{lead.assignedTrainer}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Tarih</Text>
                <Text style={styles.metaValue}>{lead.dateLabel}</Text>
              </View>
              {lead.phone ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Telefon</Text>
                  <Text style={styles.metaValue}>{lead.phone}</Text>
                </View>
              ) : null}
              {lead.email ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>E-posta</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>{lead.email}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => handleOpenSchedule('deneme-planlandi', 'direct')}
              accessibilityRole="button"
              accessibilityLabel="Deneme Dersi Planla"
              style={({ pressed }) => [
                styles.trialButton,
                panel?.kind === 'schedule' && panel.target === 'deneme-planlandi' && styles.trialButtonActive,
                pressed && styles.trialButtonPressed,
              ]}
            >
              <AppIcon name="fitness-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.trialButtonLabel}>Deneme Dersi Planla</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Arama Sonucu Kaydet</Text>
            <View style={styles.callOutcomeRow}>
              {(Object.keys(CALL_OUTCOME_META) as CallOutcome[]).map((outcome) => {
                const meta = CALL_OUTCOME_META[outcome];
                const active =
                  (panel?.kind === 'followup' && panel.outcome === outcome) ||
                  (outcome === 'konustu' && (panel?.kind === 'konustu-choice' || panel?.kind === 'schedule'));
                return (
                  <Pressable
                    key={outcome}
                    onPress={() => handleOutcomePress(outcome)}
                    accessibilityRole="button"
                    accessibilityLabel={meta.label}
                    style={({ pressed }) => [
                      styles.callOutcomeButton,
                      active && styles.callOutcomeButtonActive,
                      pressed && styles.callOutcomeButtonPressed,
                    ]}
                  >
                    <AppIcon name={meta.icon} size={15} color={meta.color} />
                    <Text style={styles.callOutcomeLabel} numberOfLines={1}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {panel?.kind === 'followup' ? (
              <View style={styles.followUpPanel}>
                <Text style={styles.followUpTitle}>Ne zaman tekrar aranacak?</Text>
                <View style={styles.followUpChipRow}>
                  {FOLLOW_UP_OPTIONS.map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => handleConfirmFollowUp(option.hours)}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      style={({ pressed }) => [styles.followUpChip, pressed && styles.followUpChipPressed]}
                    >
                      <Text style={styles.followUpChipLabel}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={resetPanel} accessibilityRole="button" accessibilityLabel="İptal">
                  <Text style={styles.cancelLink}>İptal</Text>
                </Pressable>
              </View>
            ) : null}

            {panel?.kind === 'konustu-choice' ? (
              <View style={styles.followUpPanel}>
                <Text style={styles.followUpTitle}>Görüşme sonrası ne yapılsın?</Text>
                <View style={styles.choiceCol}>
                  <Pressable
                    onPress={handleMarkInterestedOnly}
                    accessibilityRole="button"
                    accessibilityLabel="Sadece İlgileniyor Olarak İşaretle"
                    style={({ pressed }) => [styles.choiceButton, pressed && styles.choiceButtonPressed]}
                  >
                    <AppIcon name="flag-outline" size={15} color={colors.primaryDark} />
                    <Text style={styles.choiceButtonLabel}>Sadece İlgileniyor Olarak İşaretle</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleOpenSchedule('yuzyuze-gorusme', 'konustu-choice')}
                    accessibilityRole="button"
                    accessibilityLabel="Yüzyüze Görüşme Planla"
                    style={({ pressed }) => [styles.choiceButton, pressed && styles.choiceButtonPressed]}
                  >
                    <AppIcon name="people-outline" size={15} color={colors.info} />
                    <Text style={styles.choiceButtonLabel}>Yüzyüze Görüşme Planla</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleOpenSchedule('deneme-planlandi', 'konustu-choice')}
                    accessibilityRole="button"
                    accessibilityLabel="Deneme Dersi Planla"
                    style={({ pressed }) => [styles.choiceButton, pressed && styles.choiceButtonPressed]}
                  >
                    <AppIcon name="fitness-outline" size={15} color={colors.info} />
                    <Text style={styles.choiceButtonLabel}>Deneme Dersi Planla</Text>
                  </Pressable>
                </View>
                <Pressable onPress={resetPanel} accessibilityRole="button" accessibilityLabel="İptal">
                  <Text style={styles.cancelLink}>İptal</Text>
                </Pressable>
              </View>
            ) : null}

            {panel?.kind === 'schedule' ? (
              <View style={styles.followUpPanel}>
                <Text style={styles.followUpTitle}>{MEETING_KIND_LABEL[panel.target]} ne zaman?</Text>
                <View style={styles.followUpChipRow}>
                  {WEEKDAYS.map((day) => (
                    <Pressable
                      key={day.id}
                      onPress={() => setScheduleDay(day.id)}
                      accessibilityRole="button"
                      accessibilityLabel={day.label}
                      style={({ pressed }) => [
                        styles.followUpChip,
                        scheduleDay === day.id && styles.followUpChipActive,
                        pressed && styles.followUpChipPressed,
                      ]}
                    >
                      <Text style={styles.followUpChipLabel}>{day.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <DropdownSelect
                  placeholder="Saat seç"
                  options={TIME_OPTIONS.map((time) => ({ id: time, label: time }))}
                  selectedId={scheduleTime}
                  onSelect={(id) => {
                    setScheduleTime(id ?? '09:00');
                    setTimeDropdownOpen(false);
                  }}
                  open={timeDropdownOpen}
                  onToggle={() => setTimeDropdownOpen((current) => !current)}
                />
                <Text style={styles.followUpTitle}>Kim ilgilenecek?</Text>
                <DropdownSelect
                  placeholder="Eğitmen seç"
                  options={trainers.map((trainer) => ({ id: trainer.name, label: trainer.name, meta: trainer.specialty ?? undefined }))}
                  selectedId={scheduleTrainer}
                  onSelect={(id) => {
                    setScheduleTrainer(id);
                    setTrainerDropdownOpen(false);
                  }}
                  open={trainerDropdownOpen}
                  onToggle={() => setTrainerDropdownOpen((current) => !current)}
                />
                <View style={styles.scheduleActionsRow}>
                  <Pressable
                    onPress={() => (panel.origin === 'konustu-choice' ? setPanel({ kind: 'konustu-choice' }) : resetPanel())}
                    accessibilityRole="button"
                    accessibilityLabel={panel.origin === 'konustu-choice' ? 'Geri' : 'İptal'}
                  >
                    <Text style={styles.cancelLink}>{panel.origin === 'konustu-choice' ? 'Geri' : 'İptal'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmSchedule}
                    disabled={!scheduleDay || !scheduleTrainer}
                    accessibilityRole="button"
                    accessibilityLabel="Planla"
                    style={({ pressed }) => [
                      styles.scheduleConfirmButton,
                      (!scheduleDay || !scheduleTrainer) && styles.scheduleConfirmButtonDisabled,
                      pressed && !!scheduleDay && !!scheduleTrainer && styles.scheduleConfirmButtonPressed,
                    ]}
                  >
                    <Text style={styles.scheduleConfirmLabel}>Planla</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {orderedCallLogs.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Arama Geçmişi</Text>
                {orderedCallLogs.map((entry) => {
                  const meta = CALL_OUTCOME_META[entry.outcome];
                  return (
                    <View key={entry.id} style={styles.callLogItem}>
                      <AppIcon name={meta.icon} size={14} color={meta.color} />
                      <View style={styles.callLogTextGroup}>
                        <Text style={styles.callLogText}>
                          {meta.label} <Text style={styles.callLogDate}>· {entry.dateLabel}</Text>
                        </Text>
                        {entry.followUpLabel ? (
                          <Text style={styles.callLogFollowUp}>
                            {entry.outcome === 'konustu' ? 'Planlandı: ' : 'Tekrar arama: '}
                            {entry.followUpLabel}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Notlar</Text>

            {orderedNotes.length === 0 ? (
              <Text style={styles.emptyNotes}>Henüz not eklenmedi.</Text>
            ) : (
              orderedNotes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <Text style={styles.noteDate}>{note.dateLabel}</Text>
                  <Text style={styles.noteText}>{note.text}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.addNoteRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Yeni not ekle..."
              placeholderTextColor={colors.textSecondary}
              multiline
              style={styles.noteInput}
              accessibilityLabel="Yeni not"
            />
            <Pressable
              onPress={handleAddNote}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="Notu ekle"
              style={({ pressed }) => [
                styles.addButton,
                !draft.trim() && styles.addButtonDisabled,
                pressed && !!draft.trim() && styles.addButtonPressed,
              ]}
            >
              <AppIcon name="add" size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: 440,
    maxWidth: '90%',
    maxHeight: '85%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  metaItem: {
    minWidth: 110,
    gap: 2,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  emptyNotes: {
    ...typography.body,
    color: colors.textSecondary,
    paddingVertical: spacing.sm,
  },
  scrollArea: {
    maxHeight: 420,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
  },
  trialButtonActive: {
    backgroundColor: colors.primary,
  },
  trialButtonPressed: {
    backgroundColor: colors.primary,
  },
  trialButtonLabel: {
    ...typography.button,
    color: colors.primaryDark,
  },
  callOutcomeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  callOutcomeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  callOutcomeButtonActive: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.pageBackground,
  },
  callOutcomeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  callOutcomeLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  followUpPanel: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  followUpTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  followUpChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  followUpChip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followUpChipPressed: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  followUpChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
  },
  followUpChipLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  choiceCol: {
    gap: spacing.xs,
  },
  choiceButton: {
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
  choiceButtonPressed: {
    backgroundColor: colors.mintLight,
  },
  choiceButtonLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scheduleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleConfirmButton: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleConfirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  scheduleConfirmButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  scheduleConfirmLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
  },
  cancelLink: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
  },
  callLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  callLogTextGroup: {
    flex: 1,
    gap: 1,
  },
  callLogText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  callLogDate: {
    ...typography.caption,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  callLogFollowUp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noteItem: {
    gap: 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noteText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  noteInput: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 44,
    maxHeight: 88,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.border,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
});
