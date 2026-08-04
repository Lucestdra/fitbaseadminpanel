import { useState } from 'react';
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
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { useCatalogs } from '@/context/CatalogsContext';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import * as leadsApi from '@/api/leads';
import { colors, spacing, typography, radii } from '@/theme';
import type { LeadListItem } from '@/api/leads';

interface LeadFormModalProps {
  /** Null when adding. */
  editing: LeadListItem | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

type DropdownField = 'source' | 'interest' | 'assignee' | null;

/**
 * Adds or edits a lead.
 *
 * <b>Every reference is an id.</b> The source, the interest and the owner were free-text strings in
 * the panel — `source: 'instagram'`, `assignedTrainer: 'Ece Yıldız'` — which meant a studio could
 * not rename its own sources and an assignment stopped meaning anything the day a second Ece was
 * hired (ADR-0016).
 *
 * <b>Editing does not move the lead.</b> Correcting a phone number is not a pipeline event, and a
 * form that moved the lead as a side effect would write transitions nobody intended — which is
 * exactly the noise that makes a funnel untrustworthy.
 */
export function LeadFormModal({ editing, onClose, onSaved, onError }: LeadFormModalProps) {
  const { leadSources, interests } = useCatalogs();
  const { roster } = useStaffRoster();

  const [fullName, setFullName] = useState(editing?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(editing?.phoneNumber ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [sourceId, setSourceId] = useState<string | null>(editing?.sourceId ?? null);
  const [interestId, setInterestId] = useState<string | null>(editing?.interestId ?? null);
  const [assigneeId, setAssigneeId] = useState<string | null>(editing?.assignedStaffMemberId ?? null);
  const [note, setNote] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownField>(null);
  const [busy, setBusy] = useState(false);

  const active = roster.filter((member) => member.status !== 'Inactive');
  const canSubmit = fullName.trim().length > 0 && !busy;

  const submit = () => {
    if (!canSubmit) return;

    setBusy(true);

    void (async () => {
      try {
        const body: leadsApi.LeadBody = {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || null,
          email: email.trim() || null,
          sourceId,
          interestId,
          assignedStaffMemberId: assigneeId,
          // Only on create. An edit that carried a note would silently append one every time
          // somebody fixed a typo.
          note: editing ? null : note.trim() || null,
        };

        if (editing) {
          await leadsApi.updateLead(editing.id, body);
          onSaved(`${body.fullName} güncellendi.`);
        } else {
          await leadsApi.createLead(body);
          onSaved(`${body.fullName} aday olarak eklendi.`);
        }

        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Aday kaydedilemedi.');
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Adayı Düzenle' : 'Yeni Aday'}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <Text style={styles.label}>Ad Soyad</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Örn. Selin Kaya"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Telefon</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="0532 111 22 33"
                placeholderTextColor={colors.textSecondary}
                inputMode="tel"
                style={styles.input}
              />
              {/*
                Said out loud because it changes what happens later: conversion matches on the
                number, so a lead without one always creates a new member even if that person is
                already on the roster.
              */}
              <Text style={styles.hint}>
                Üyeliğe dönüştürürken mevcut üye eşleştirmesi telefon numarasıyla yapılır.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="İsteğe bağlı"
                placeholderTextColor={colors.textSecondary}
                inputMode="email"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kaynak</Text>
              <DropdownSelect
                placeholder="Kaynak seç"
                clearLabel="Kaynak yok"
                selectedId={sourceId}
                options={leadSources.map((entry) => ({ id: entry.id, label: entry.label }))}
                open={openDropdown === 'source'}
                onToggle={() => setOpenDropdown(openDropdown === 'source' ? null : 'source')}
                onSelect={(id) => {
                  setSourceId(id);
                  setOpenDropdown(null);
                }}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>İlgi Alanı</Text>
              <DropdownSelect
                placeholder="İlgi alanı seç"
                clearLabel="Belirtilmedi"
                selectedId={interestId}
                options={interests.map((entry) => ({ id: entry.id, label: entry.label }))}
                open={openDropdown === 'interest'}
                onToggle={() => setOpenDropdown(openDropdown === 'interest' ? null : 'interest')}
                onSelect={(id) => {
                  setInterestId(id);
                  setOpenDropdown(null);
                }}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Sorumlu</Text>
              <DropdownSelect
                placeholder="Sorumlu seç"
                clearLabel="Atanmadı"
                selectedId={assigneeId}
                options={active.map((member) => ({ id: member.id, label: member.fullName }))}
                open={openDropdown === 'assignee'}
                onToggle={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
                onSelect={(id) => {
                  setAssigneeId(id);
                  setOpenDropdown(null);
                }}
              />
            </View>

            {editing ? null : (
              <View style={styles.field}>
                <Text style={styles.label}>İlk Not</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="İsteğe bağlı"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={[styles.input, styles.multiline]}
                />
              </View>
            )}

            <View style={styles.actions}>
              <Pressable onPress={onClose} accessibilityRole="button" style={styles.secondaryButton}>
                <Text style={styles.secondaryLabel}>Vazgeç</Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                accessibilityRole="button"
                style={[styles.primaryButton, !canSubmit && styles.disabled]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.primaryLabel}>{editing ? 'Kaydet' : 'Ekle'}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
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
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  body: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
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
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
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
});
