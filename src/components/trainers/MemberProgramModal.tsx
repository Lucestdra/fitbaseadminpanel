import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { Member } from '@/types/members';
import type { MemberProgram, WeeklyProgramEntry } from '@/types/programs';

interface MemberProgramModalProps {
  visible: boolean;
  member: Member | null;
  month: string;
  existingProgram: MemberProgram | null;
  onClose: () => void;
  onSave: (program: MemberProgram) => void;
}

const WEEK_COUNT = 4;

function buildInitialEntries(existingProgram: MemberProgram | null): string[] {
  const entries = Array.from({ length: WEEK_COUNT }, (_, index) => {
    const found = existingProgram?.entries.find((entry) => entry.week === index + 1);
    return found?.plan ?? '';
  });
  return entries;
}

export function MemberProgramModal({ visible, member, month, existingProgram, onClose, onSave }: MemberProgramModalProps) {
  const [weekPlans, setWeekPlans] = useState<string[]>(() => buildInitialEntries(existingProgram));

  if (!member) return null;

  const handleClose = () => {
    setWeekPlans(buildInitialEntries(existingProgram));
    onClose();
  };

  const handleSave = () => {
    const entries: WeeklyProgramEntry[] = weekPlans.map((plan, index) => ({ week: index + 1, plan: plan.trim() }));
    onSave({ memberId: member.id, month, entries });
    handleClose();
  };

  const updateWeek = (index: number, value: string) => {
    setWeekPlans((current) => current.map((plan, i) => (i === index ? value : plan)));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>{member.name} · Aylık Program</Text>
              <Text style={styles.subtitle}>{month}</Text>
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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {weekPlans.map((plan, index) => (
              <View key={index}>
                <Text style={styles.fieldLabel}>Hafta {index + 1}</Text>
                <TextInput
                  value={plan}
                  onChangeText={(value) => updateWeek(index, value)}
                  placeholder="Ör. Üst vücut ağırlık antrenmanı + 20 dk kardiyo"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={2}
                  style={[styles.input, styles.textArea]}
                  accessibilityLabel={`Hafta ${index + 1} programı`}
                />
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Programı kaydet"
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          >
            <Text style={styles.submitLabel}>Kaydet</Text>
          </Pressable>
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
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
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
  body: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  textArea: {
    minHeight: 64,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});
