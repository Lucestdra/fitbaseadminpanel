import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import type { Invoice } from '@/types/settings';

interface InvoiceHistoryModalProps {
  visible: boolean;
  invoices: Invoice[];
  onClose: () => void;
  onDownload: (invoice: Invoice) => void;
}

export function InvoiceHistoryModal({ visible, invoices, onClose, onDownload }: InvoiceHistoryModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Fatura Geçmişi</Text>
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

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {invoices.map((invoice, index) => (
              <View key={invoice.id} style={[styles.row, index === invoices.length - 1 && styles.rowLast]}>
                <View style={styles.fileIcon}>
                  <AppIcon name="document-text-outline" size={18} color={colors.primaryDark} />
                </View>
                <View style={styles.infoGroup}>
                  <Text style={styles.fileName} numberOfLines={1}>{invoice.fileName}</Text>
                  <Text style={styles.date}>{invoice.date}</Text>
                </View>
                <Text style={styles.amount}>{invoice.amount}</Text>
                <Badge label={invoice.status === 'odendi' ? 'Ödendi' : 'Bekliyor'} tone={invoice.status === 'odendi' ? 'mint' : 'warning'} />
                <Pressable
                  onPress={() => onDownload(invoice)}
                  accessibilityRole="button"
                  accessibilityLabel={`${invoice.fileName} indir`}
                  hitSlop={8}
                  style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
                >
                  <AppIcon name="download-outline" size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
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
    width: 460,
    maxWidth: '92%',
    maxHeight: '80%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
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
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGroup: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    minWidth: 64,
    textAlign: 'right',
  },
  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
});
