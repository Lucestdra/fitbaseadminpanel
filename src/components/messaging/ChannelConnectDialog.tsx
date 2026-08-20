import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection, type MessagingChannelId } from '@/types/messaging';

/**
 * Explains how a channel is actually connected, and then starts it.
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
 * <b>The door is open, which is what changed.</b> This dialog used to end in a padlock explaining
 * that authorization was not available: ADR-0043 §5 holds that a connect flow which exists and
 * returns a policy error is a support burden with no upside, and until a transport could actually
 * carry the authorization, the honest screen was a closed one. ADR-0075 supplies that transport, so
 * the same three steps now end in a button rather than in an apology.
 *
 * <b>It still explains before it acts.</b> Pressing "Bağla" hands somebody to a third party's login
 * screen, and the step list is what makes that predictable — which account gets picked, what happens
 * to the number they already use, and where they end up afterwards.
 *
 * forbidden-integration-check: discusses the prohibition. The words above name the flow this file
 * exists to refuse; naming it is how the next person understands why the QR in Meta's own dialog is
 * not the QR another product means by the word.
 */
interface ChannelConnectDialogProps {
  channel: ChannelConnection | null;
  visible: boolean;
  /** True while the start call is in flight. The button must not be pressable twice. */
  busy: boolean;
  onClose: () => void;
  /** Starts the authorization. The screen owns the call and the navigation that follows it. */
  onConfirm: (channel: ChannelConnection) => void;
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
      detail: 'Yetkilendirme bilgisi sunucuya gelir, sunucu bildirim aboneliğini açar ve durum burada görünür.',
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
      detail: 'DM aboneliği açılır; gelen mesajlar bu ekrandaki konuşma listesine düşer. Bağlantıdan önceki konuşmalar da kısa süre içinde gelir.',
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
      detail: 'Sayfa erişimi sunucuda saklanır ve bildirim aboneliği açılır.',
    },
  ],
};

export function ChannelConnectDialog({
  channel,
  visible,
  busy,
  onClose,
  onConfirm,
}: ChannelConnectDialogProps) {
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
              <AppIcon name="open-outline" size={16} color={colors.textSecondary} />
              <View style={styles.gateText}>
                <Text style={styles.gateTitle}>Sağlayıcının kendi ekranına gideceksin</Text>
                <Text style={styles.gateDetail}>
                  Devam ettiğinde bu sekme sağlayıcının yetkilendirme sayfasına gider. İşlem
                  bitince buraya geri dönersin ve bağlantı burada görünür. Yarıda bırakırsan
                  hiçbir şey değişmez.
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

          <Pressable
            onPress={() => onConfirm(channel)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            accessibilityLabel={`${channel.label} yetkilendirmesini başlat`}
            style={({ pressed }) => [
              styles.confirmButton,
              pressed && !busy && styles.confirmButtonPressed,
              busy && styles.confirmButtonBusy,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppIcon name="open-outline" size={16} color={colors.white} />
            )}
            <Text style={styles.confirmLabel}>
              {busy ? 'Yönlendiriliyor…' : 'Devam Et'}
            </Text>
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    marginTop: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmButtonBusy: {
    backgroundColor: colors.primaryDark,
  },
  confirmLabel: {
    ...typography.button,
    color: colors.white,
  },
});
