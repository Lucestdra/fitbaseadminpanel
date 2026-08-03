import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DropdownSelect } from '@/components/ui/DropdownSelect';
import { colors, radii, spacing, typography } from '@/theme';
import type { CatalogReference } from '@/api/catalogs';

export interface CatalogReplacement {
  id: string;
  label: string;
}

interface CatalogUsageConflictDialogProps {
  visible: boolean;

  /** What the studio tried to delete. */
  entryLabel: string;

  /** The blocking references, as the server counted them. */
  references: CatalogReference[];

  /** The other entries in the same catalog, for the reassignment picker. */
  replacements: CatalogReplacement[];

  onDeactivate: () => void;
  onReassign: (replacementId: string) => void;
  onClose: () => void;
  busy: boolean;
}

/**
 * Turkish for a module and entity pair.
 *
 * The server sends closed-vocabulary English — `Members`/`Member` — and never a name or an id
 * (backend CLAUDE.md §31), so the wording lives here. An unmapped pair renders its raw entity
 * rather than nothing: a count with an unfamiliar label still tells the studio something, and a
 * blank row tells them the dialog is broken.
 */
const ENTITY_LABEL: Record<string, string> = {
  'Members/Member': 'üye',
  'Members/Membership': 'üyelik',
  'Leads/Lead': 'müşteri adayı',
  'Leads/LeadStageTransition': 'aşama geçişi',
  'Scheduling/ClassDefinition': 'ders',
  'Scheduling/ScheduledSession': 'seans',
  'Finance/Payment': 'ödeme',
};

function describe(reference: CatalogReference): string {
  const label = ENTITY_LABEL[`${reference.module}/${reference.entity}`] ?? reference.entity;
  return `${reference.count} ${label}`;
}

/**
 * What the studio may do about an entry something is still using.
 *
 * The panel deleted catalog entries with `filter(item => item.id !== id)`. Against mock arrays that
 * was harmless; against real data it orphans every row that referenced the entry, and there is no
 * foreign key to stop it (backend ADR-0017). The server refuses instead, with the counts below —
 * this dialog is where that refusal becomes a choice rather than an error toast.
 *
 * Deactivating is offered first and deliberately: it is almost always the right answer. The entry
 * stops being offered for new work and keeps resolving for every row that already points at it, so
 * nothing is lost and nothing breaks. Reassign-then-delete is the destructive path and reads like
 * one.
 */
export function CatalogUsageConflictDialog({
  visible,
  entryLabel,
  references,
  replacements,
  onDeactivate,
  onReassign,
  onClose,
  busy,
}: CatalogUsageConflictDialogProps) {
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const close = () => {
    setReplacementId(null);
    setPickerOpen(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{entryLabel} siliniyor</Text>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.warning}>
            <AppIcon name="alert-circle-outline" size={18} color={colors.critical} />
            <Text style={styles.warningText}>
              Bu kayıt hâlâ kullanılıyor: {references.map(describe).join(', ')}. Silmek bu kayıtları
              boşta bırakır.
            </Text>
          </View>

          <View style={styles.option}>
            <Text style={styles.optionTitle}>Pasife al</Text>
            <Text style={styles.optionCaption}>
              Yeni kayıtlarda seçilemez olur, mevcut kayıtlarda görünmeye devam eder. Hiçbir şey
              kaybolmaz.
            </Text>
            <Pressable
              onPress={onDeactivate}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`${entryLabel} kaydını pasife al`}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryLabel}>Pasife Al</Text>
            </Pressable>
          </View>

          {replacements.length > 0 ? (
            <View style={styles.option}>
              <Text style={styles.optionTitle}>Başka bir kayda taşı ve sil</Text>
              <Text style={styles.optionCaption}>
                Bu kaydı kullananlar seçtiğin kayda taşınır. Geçmiş kayıtlar olduğu gibi kalır.
              </Text>

              <DropdownSelect
                placeholder="Taşınacak kaydı seç"
                options={replacements}
                selectedId={replacementId}
                onSelect={(id) => {
                  setReplacementId(id);
                  setPickerOpen(false);
                }}
                open={pickerOpen}
                onToggle={() => setPickerOpen((current) => !current)}
              />

              <Pressable
                onPress={() => {
                  if (replacementId) onReassign(replacementId);
                }}
                disabled={busy || replacementId === null}
                accessibilityRole="button"
                accessibilityLabel="Taşı ve sil"
                style={({ pressed }) => [
                  styles.dangerButton,
                  replacementId === null && styles.dangerButtonDisabled,
                  pressed && styles.dangerButtonPressed,
                ]}
              >
                <Text style={styles.dangerLabel}>Taşı ve Sil</Text>
              </Pressable>
            </View>
          ) : null}
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
    padding: spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.criticalLight,
  },
  warningText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  option: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  optionCaption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
  dangerButton: {
    alignSelf: 'flex-start',
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.5,
  },
  dangerButtonPressed: {
    backgroundColor: colors.criticalLight,
  },
  dangerLabel: {
    ...typography.captionStrong,
    color: colors.critical,
  },
});
