import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface CatalogItem {
  id: string;
  label: string;
}

interface CatalogListCardProps {
  title: string;
  icon: IconName;
  subtitle?: string;
  items: CatalogItem[];
  onAdd: (label: string) => void;
  onRemove: (id: string) => void;
  addPlaceholder: string;
}

export function CatalogListCard({ title, icon, subtitle, items, onAdd, onRemove, addPlaceholder }: CatalogListCardProps) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  };

  return (
    <Card style={styles.card}>
      <SectionHeader title={title} icon={icon} />
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.chipRow}>
        {items.length === 0 ? <Text style={styles.emptyText}>Henüz seçenek eklenmedi.</Text> : null}
        {items.map((item) => (
          <View key={item.id} style={styles.chip}>
            <Text style={styles.chipLabel} numberOfLines={1}>{item.label}</Text>
            <Pressable
              onPress={() => onRemove(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} sil`}
              hitSlop={6}
              style={({ pressed }) => [styles.chipRemove, pressed && styles.chipRemovePressed]}
            >
              <AppIcon name="close" size={12} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          placeholder={addPlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel={addPlaceholder}
        />
        <Pressable
          onPress={handleAdd}
          disabled={!draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Ekle"
          style={({ pressed }) => [
            styles.addButton,
            !draft.trim() && styles.addButtonDisabled,
            pressed && !!draft.trim() && styles.addButtonPressed,
          ]}
        >
          <AppIcon name="add" size={18} color={colors.white} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemovePressed: {
    backgroundColor: colors.border,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    outlineStyle: 'none' as never,
  },
  addButton: {
    width: 40,
    height: 40,
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
