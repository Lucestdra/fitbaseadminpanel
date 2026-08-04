import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { useCatalogs } from '@/context/CatalogsContext';
import { useStaffRoster } from '@/hooks/useStaffRoster';
import { colors, spacing, typography, radii } from '@/theme';

export interface LeadFilters {
  stageIds: string[];
  sourceIds: string[];
  assignedTo: string[];
  overdueOnly: boolean;
  includeClosed: boolean;
}

export const EMPTY_LEAD_FILTERS: LeadFilters = {
  stageIds: [],
  sourceIds: [],
  assignedTo: [],
  overdueOnly: false,
  includeClosed: false,
};

interface LeadFilterSheetProps {
  visible: boolean;
  filters: LeadFilters;
  onChange: (filters: LeadFilters) => void;
  onClose: () => void;
}

/**
 * The filter, in ids.
 *
 * <b>One filter object drives both views.</b> The list and the board send it to endpoints that
 * parse the identical query string, so switching between them cannot change which leads are in
 * scope — the failure this shape exists to prevent is a studio narrowing the list, flipping to
 * Kanban, and seeing different people with nothing on screen explaining why.
 *
 * The two toggles at the bottom are the ones with teeth. "Gecikmiş" is the day's work list, and
 * "kapatılanlar" is the only way to see a lead that has left the pipeline — the panel has no
 * concept of a closed lead at all.
 */
export function LeadFilterSheet({ visible, filters, onChange, onClose }: LeadFilterSheetProps) {
  const { stages, leadSources } = useCatalogs();
  const { roster } = useStaffRoster();

  const toggle = (key: 'stageIds' | 'sourceIds' | 'assignedTo', id: string) =>
    onChange({
      ...filters,
      [key]: filters[key].includes(id)
        ? filters[key].filter((value) => value !== id)
        : [...filters[key], id],
    });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtrele</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" hitSlop={8}>
              <AppIcon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Section title="Aşama">
              {stages.map((stage) => (
                <Chip
                  key={stage.id}
                  label={stage.title}
                  selected={filters.stageIds.includes(stage.id)}
                  onPress={() => toggle('stageIds', stage.id)}
                />
              ))}
            </Section>

            <Section title="Kaynak">
              {leadSources.map((source) => (
                <Chip
                  key={source.id}
                  label={source.label}
                  selected={filters.sourceIds.includes(source.id)}
                  onPress={() => toggle('sourceIds', source.id)}
                />
              ))}
            </Section>

            <Section title="Sorumlu">
              {roster
                .filter((member) => member.status !== 'Inactive')
                .map((member) => (
                  <Chip
                    key={member.id}
                    label={member.fullName}
                    selected={filters.assignedTo.includes(member.id)}
                    onPress={() => toggle('assignedTo', member.id)}
                  />
                ))}
            </Section>

            <Section title="Durum">
              <Chip
                label="Sadece gecikmiş"
                selected={filters.overdueOnly}
                onPress={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
              />
              <Chip
                label="Kapatılanları göster"
                selected={filters.includeClosed}
                onPress={() => onChange({ ...filters, includeClosed: !filters.includeClosed })}
              />
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onChange(EMPTY_LEAD_FILTERS)}
              accessibilityRole="button"
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryLabel}>Temizle</Text>
            </Pressable>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.primaryButton}>
              <Text style={styles.primaryLabel}>Uygula</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

/** How many filters are active, for the badge on the header button. */
export function countLeadFilters(filters: LeadFilters): number {
  return (
    filters.stageIds.length +
    filters.sourceIds.length +
    filters.assignedTo.length +
    (filters.overdueOnly ? 1 : 0) +
    (filters.includeClosed ? 1 : 0)
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
    maxHeight: '85%',
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
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
