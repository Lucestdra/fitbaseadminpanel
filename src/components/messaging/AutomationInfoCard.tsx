import { View, Text, Switch, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';

interface AutomationInfoCardProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function AutomationInfoCard({ enabled, onToggle }: AutomationInfoCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <AppIcon name="flash-outline" size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.title}>Otomatik Müşteri Adayı Oluşturma</Text>
          <Text style={styles.description}>
            WhatsApp veya Instagram&rsquo;dan mesaj atan yeni kişiler otomatik olarak &ldquo;Yeni&rdquo; aşamasında
            Müşteri Adayları listesine eklenir.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="Otomatik müşteri adayı oluşturmayı aç/kapat"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
