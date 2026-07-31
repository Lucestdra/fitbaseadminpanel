import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';

export interface DropdownOption {
  id: string;
  label: string;
  meta?: string;
}

interface DropdownSelectProps {
  placeholder: string;
  options: DropdownOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  open: boolean;
  onToggle: () => void;
  clearLabel?: string;
}

export function DropdownSelect({ placeholder, options, selectedId, onSelect, open, onToggle, clearLabel }: DropdownSelectProps) {
  const selected = options.find((option) => option.id === selectedId) ?? null;
  return (
    <View style={[styles.wrapper, open && styles.wrapperOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </Pressable>
      {open ? (
        <View style={styles.list}>
          {clearLabel ? (
            <Pressable
              onPress={() => onSelect(null)}
              accessibilityRole="button"
              accessibilityLabel={clearLabel}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Text style={styles.itemName}>{clearLabel}</Text>
            </Pressable>
          ) : null}
          {options.map((option) => {
            const active = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                style={({ pressed }) => [styles.item, (pressed || active) && styles.itemPressed]}
              >
                <Text style={[styles.itemName, active && styles.itemNameActive]} numberOfLines={1}>
                  {option.label}
                </Text>
                {option.meta ? <Text style={styles.itemMeta} numberOfLines={1}>{option.meta}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1,
  },
  wrapperOpen: {
    zIndex: 20,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  triggerPressed: {
    backgroundColor: colors.cardBackground,
  },
  triggerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  list: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    zIndex: 20,
    ...cardShadow,
  },
  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemPressed: {
    backgroundColor: colors.pageBackground,
  },
  itemName: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  itemNameActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
