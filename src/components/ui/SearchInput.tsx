import { View, TextInput, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors, radii, spacing, typography } from '@/theme';

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchInput({ placeholder, value, onChangeText }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <AppIcon name="search-outline" size={16} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
    minWidth: 220,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    outlineStyle: 'none' as never,
  },
});
