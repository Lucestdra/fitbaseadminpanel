import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import * as programsApi from '@/api/programs';
import { MAX_WEEKS, type ProgramMonth } from '@/api/programs';
import { formatProgramMonth } from '@/utils/programs';
import { colors, spacing, typography, radii } from '@/theme';

interface MemberProgramModalProps {
  visible: boolean;
  memberId: string | null;
  memberName: string;
  month: ProgramMonth | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * The month's weeks, editable.
 *
 * <b>Six slots, not four.</b> Six is how many calendar weeks a month can touch; the panel's four is
 * the number that fits its mock. A slot left blank is not stored — the week is simply absent, so the
 * "3/4 hafta yazıldı" badge counts rows rather than testing strings.
 *
 * The weeks are fetched when the modal opens rather than passed in. The roster deliberately does not
 * carry them: a manager's roster is every active member in the studio, and six paragraphs of
 * training text per row to render a badge would make it the heaviest response in the product.
 */
export function MemberProgramModal({
  visible,
  memberId,
  memberName,
  month,
  onClose,
  onSaved,
  onError,
}: MemberProgramModalProps) {
  const [plans, setPlans] = useState<string[]>(() => Array.from({ length: MAX_WEEKS }, () => ''));
  const [saving, setSaving] = useState(false);

  // What the fields currently hold, rather than a loading flag set inside the effect. Deriving it
  // is what keeps the effect free of a synchronous setState — the lint rule is about cascading
  // renders, and the honest fix is not to have a second piece of state that says the same thing.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const monthLabel = month === null ? '' : formatProgramMonth(month);

  const key =
    memberId === null || month === null ? null : `${memberId}:${month.year}-${month.month}`;

  const loading = visible && key !== null && loadedFor !== key;

  useEffect(() => {
    if (!visible || memberId === null || key === null) return;

    let cancelled = false;

    void (async () => {
      try {
        const detail = await programsApi.getProgram(memberId, month);
        if (cancelled) return;

        setPlans(
          Array.from(
            { length: MAX_WEEKS },
            (_, index) =>
              detail.weeks.find((week) => week.weekNumber === index + 1)?.plan ?? '',
          ),
        );
      } catch (error) {
        if (cancelled) return;
        onError(error instanceof Error ? error.message : 'Program alınamadı.');
      } finally {
        // Marked loaded either way. A failed fetch leaves the editor open on empty fields with the
        // error already shown; holding the spinner forever would be the worse answer.
        if (!cancelled) setLoadedFor(key);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `month` is a fresh object each render; `key` is what actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, key]);

  if (memberId === null) return null;

  const handleSave = () => {
    if (saving) return;
    setSaving(true);

    void (async () => {
      try {
        await programsApi.saveProgram(memberId, {
          year: month?.year ?? null,
          month: month?.month ?? null,

          // Blank weeks are sent and deleted server-side rather than filtered here, so clearing a
          // week is expressible at all — the editor submits the whole month.
          weeks: plans.map((plan, index) => ({ weekNumber: index + 1, plan })),
        });

        onSaved(`${memberName} için ${monthLabel} programı kaydedildi.`);
        onClose();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Program kaydedilemedi.');
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>{memberName} · Aylık Program</Text>
              <Text style={styles.subtitle}>{monthLabel}</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {plans.map((plan, index) => (
                <View key={index}>
                  <Text style={styles.fieldLabel}>Hafta {index + 1}</Text>
                  <TextInput
                    value={plan}
                    onChangeText={(value) =>
                      setPlans((current) =>
                        current.map((existing, position) => (position === index ? value : existing)),
                      )
                    }
                    placeholder="Ör. Üst vücut ağırlık antrenmanı + 20 dk kardiyo"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={2}
                    maxLength={2000}
                    style={[styles.input, styles.textArea]}
                    accessibilityLabel={`Hafta ${index + 1} programı`}
                  />
                </View>
              ))}

              {/* Said once, where it matters. Five- and six-week months are ordinary and the panel
                  had nowhere to put them. */}
              <Text style={styles.hint}>
                Boş bıraktığın haftalar kaydedilmez. Ayın kaç hafta sürdüğüne göre 5. ve 6. haftayı
                kullanabilirsin.
              </Text>
            </ScrollView>
          )}

          <Pressable
            onPress={handleSave}
            disabled={loading || saving}
            accessibilityRole="button"
            accessibilityLabel="Programı kaydet"
            style={({ pressed }) => [
              styles.submitButton,
              (loading || saving) && styles.submitButtonDisabled,
              pressed && !loading && !saving && styles.submitButtonPressed,
            ]}
          >
            <Text style={styles.submitLabel}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
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
  loading: {
    paddingVertical: spacing.xxl,
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
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitLabel: {
    ...typography.button,
    color: colors.white,
  },
});
