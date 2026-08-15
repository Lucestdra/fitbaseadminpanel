import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection, type MessagingChannelId } from '@/types/messaging';

/**
 * Explains how a channel is actually connected, and that authorization is not open yet.
 *
 * <b>This replaces `QrConnectModal`, which was a compliance violation rather than an unfinished
 * feature.</b> That modal told the studio to open WhatsApp's device-pairing screen and scan a code —
 * a WhatsApp Web session flow that backend CLAUDE.md §11.1 and §35 forbid outright and that Meta
 * does not sanction for a business number. It was a lie twice over: its confirm button flipped a
 * boolean in local state, so the panel reported a connection on the studio's say-so with nothing
 * behind it. Connection status is server-computed and always will be.
 *
 * <b>There is a QR in the real flow, and it is a different QR</b> (ADR-0043). WhatsApp Coexistence
 * links a number already in use in the WhatsApp Business *app* to the Cloud API, and Meta presents
 * its QR inside Embedded Signup, scanned from that app. The studio keeps answering on their phone
 * and the same conversations appear here. It is Meta's screen, Meta's code, and available only where
 * Meta reports the capability — which is why this dialog describes it rather than drawing one.
 *
 * The door stays closed until the Meta gates clear (ADR-0045): Business Verification, App Review per
 * channel, and Tech Provider standing. An honest closed door beats a door that appears to open.
 *
 * forbidden-integration-check: discusses the prohibition. The words above name the flow this file
 * exists to refuse; naming it is how the next person understands why the door is closed.
 */
interface ChannelConnectNoticeProps {
  channel: ChannelConnection | null;
  visible: boolean;
  onClose: () => void;
}

interface FlowStep {
  title: string;
  detail: string;
}

const FLOWS: Record<MessagingChannelId, FlowStep[]> = {
  whatsapp: [
    {
      title: 'Meta yetkilendirme penceresi açılır',
      detail: 'Facebook hesabınla giriş yapıp WhatsApp Business hesabını seçersin. Pencere Meta’ya aittir.',
    },
    {
      title: 'Numaranı bağlarsın',
      detail:
        'Numaran hâlihazırda WhatsApp Business uygulamasındaysa Meta bir QR gösterir; uygulamadan okutursun. Uygulamayı kullanmaya devam edersin, mesajlar aynı anda buraya da düşer.',
    },
    {
      title: 'Sunucu bağlantıyı kurar',
      detail: 'Yetki kodu sunucuya gelir, sunucu bildirim aboneliğini açar ve durum burada görünür.',
    },
  ],
  instagram: [
    {
      title: 'Meta yetkilendirme penceresi açılır',
      detail: 'Instagram profesyonel hesabınla ya da bağlı olduğu Facebook hesabıyla giriş yaparsın.',
    },
    {
      title: 'Hesabı seçersin',
      detail: 'İşletme veya içerik üretici hesabını seçersin. Kişisel hesaplar mesajlaşma API’sine uygun değildir.',
    },
    {
      title: 'Sunucu bağlantıyı kurar',
      detail: 'DM aboneliği açılır; gelen mesajlar bu ekrandaki konuşma listesine düşer.',
    },
  ],
  facebook: [
    {
      title: 'Facebook ile giriş yaparsın',
      detail: 'Yönetici olduğun sayfalar listelenir.',
    },
    {
      title: 'Sayfayı seçersin',
      detail: 'Messenger kutusunu buraya taşıyacağın sayfayı seçersin. Birden fazla sayfa bağlanabilir.',
    },
    {
      title: 'Sunucu bağlantıyı kurar',
      detail: 'Sayfa erişimi sunucuda şifreli saklanır ve bildirim aboneliği açılır.',
    },
  ],
};

export function ChannelConnectNotice({ channel, visible, onClose }: ChannelConnectNoticeProps) {
  if (!channel) return null;

  const meta = CHANNEL_META[channel.id];
  const steps = FLOWS[channel.id];

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
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: meta.backgroundColor }]}>
                <AppIcon name={meta.icon} size={18} color={meta.color} />
              </View>
              <Text style={styles.title}>{channel.label} Bağlantısı</Text>
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

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.lead}>Bağlantı şu adımlarla kurulur:</Text>

            {steps.map((step, index) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDetail}>{step.detail}</Text>
                </View>
              </View>
            ))}

            <View style={styles.gate}>
              <AppIcon name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <View style={styles.gateText}>
                <Text style={styles.gateTitle}>Yetkilendirme henüz açık değil</Text>
                <Text style={styles.gateDetail}>
                  Bu akış Meta’nın işletme doğrulaması ve uygulama incelemesinden geçtikten sonra
                  açılır. Süreç tamamlandığında bu ekrandan bağlayabileceksin — ayrıca bir şey
                  yapman gerekmiyor.
                </Text>
              </View>
            </View>

            {/* Said here because it is the question this dialog gets asked. Another product's
                "QR okut" is a WhatsApp Web session, not an API connection, and it is the reason
                numbers get banned. */}
            <Text style={styles.footnote}>
              Bağlantı yalnızca Meta’nın resmî yetkilendirme ekranı üzerinden kurulur. Numaranı
              başka bir cihaza eşleştiren yöntemler kullanılmaz — bunlar Meta tarafından
              onaylanmaz ve numaranın kapanmasına yol açabilir.
            </Text>
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
    padding: spacing.lg,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.cardBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
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
    gap: spacing.lg,
  },
  lead: {
    ...typography.body,
    color: colors.textPrimary,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  stepText: {
    flexShrink: 1,
    gap: 2,
  },
  stepTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  stepDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  gate: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  gateText: {
    flexShrink: 1,
    gap: 2,
  },
  gateTitle: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  gateDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footnote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
