import { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MESSAGE_STATUS_LABELS } from '@/config/inbox';
import { colors, radii, spacing, typography } from '@/theme';
import { formatInstantIn } from '@/utils/instants';
import type {
  WelcomeDeliveryItem,
  WelcomeTemplateAudience,
  WelcomeTemplateView,
} from '@/api/messaging';

type Audience = NonNullable<WelcomeTemplateAudience>;

interface WhatsAppTemplateCardProps {
  template: WelcomeTemplateView;
  /** The studio's zone. Every instant on this card is printed in it, never in the device's. */
  timeZoneId: string;
  busy: boolean;
  onSave: (draft: {
    body: string;
    autoSendEnabled: boolean;
    audience: Audience;
  }) => Promise<void>;
}

/** Who the message goes to, in the studio's words. */
const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'Leads', label: 'Müşteri Adayları' },
  { value: 'Customers', label: 'Müşteriler' },
  { value: 'Both', label: 'Her İkisi' },
];

/**
 * A sentence for each reason a welcome did not go out.
 *
 * <b>The codes are the server's and the sentences are ours</b> (ADR-0012). Each one names something
 * the studio can act on — fill in a number, write it in international form, connect a channel —
 * because a status list whose failures say "hata" is one nobody can do anything with.
 */
const FAILURE_REASONS: Record<string, string> = {
  recipient_missing: 'Kayıt bulunamadı; mesaj hazırlanmadan önce silinmiş olabilir.',
  phone_missing: 'Kayıtta telefon numarası yok.',
  phone_invalid:
    'Telefon numarası aranabilir bir numara değil. Ülke koduyla (+90…) kaydetmeyi dene.',
  no_channel: 'Bağlı bir WhatsApp kanalı yok.',
  refused: 'Mesaj oluşturulamadı.',
  connector_fault: 'Kanal sağlayıcısına ulaşılamadı.',
  direct_send_unavailable: 'Bu kurulumda WhatsApp gönderimi henüz açık değil.',
};

/**
 * The studio's automatic WhatsApp greeting.
 *
 * <b>Two facts, kept apart deliberately.</b> A studio drafts the message before switching it on,
 * and a template whose only "off" was an empty body could not be drafted at all — so the text and
 * the switch are separate fields and the switch is what decides whether anything is sent.
 *
 * <b>Nothing here reports a delivery.</b> Saving the template queues nothing; a message is created
 * when somebody is added, and where it then got to is the provider's answer — shown per row from
 * the message's own status rather than assumed from the fact that a row exists (CLAUDE.md §16).
 */
export function WhatsAppTemplateCard({
  template,
  timeZoneId,
  busy,
  onSave,
}: WhatsAppTemplateCardProps) {
  // Seeded at mount, matching every other settings card: the screen mounts this only while its
  // section is open, so reopening after a save picks up the server's copy without an effect.
  const [body, setBody] = useState(template.body);
  const [enabled, setEnabled] = useState(template.autoSendEnabled);
  const [audience, setAudience] = useState<Audience>(template.audience ?? 'Both');

  const trimmed = body.trim();

  const changed =
    trimmed !== template.body.trim()
    || enabled !== template.autoSendEnabled
    || audience !== (template.audience ?? 'Both');

  // An empty template cannot be saved at all — the server refuses it and the database refuses it
  // underneath — so the button says so rather than collecting a press and returning a 422.
  const savable = trimmed.length > 0 && changed && !busy;

  return (
    <Card style={styles.card}>
      <SectionHeader title="WhatsApp Karşılama Mesajı" icon="chatbubble-ellipses-outline" />

      <Text style={styles.intro}>
        Yeni bir müşteri adayı ya da müşteri eklendiğinde, stüdyonun bağlı WhatsApp numarasından
        otomatik olarak gönderilecek mesaj.
      </Text>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleTitle}>Otomatik Gönderim</Text>
          <Text style={styles.toggleHint}>
            {enabled
              ? 'Yeni kayıtlar bu mesajı kendiliğinden alır.'
              : 'Kapalı. Mesaj kaydedilir ama kimseye gönderilmez.'}
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
          accessibilityLabel="Otomatik karşılama mesajını aç/kapat"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Kimlere gönderilsin</Text>
        <SegmentedControl options={AUDIENCES} value={audience} onChange={setAudience} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mesaj</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          placeholder="Merhaba {{name}}, bize ulaştığın için teşekkürler."
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Karşılama mesajı"
        />
      </View>

      {/*
        The placeholder list is the server's, not a copy. The same list is what refuses an unknown
        token on save, so the hint and the rule cannot drift into disagreeing.
      */}
      <View style={styles.variables}>
        <Text style={styles.label}>Kullanılabilir değişkenler</Text>
        {template.variables.map((variable) => (
          <Text key={variable.token} style={styles.variable}>
            <Text style={styles.variableToken}>{`{{${variable.token}}}`}</Text>
            {` · ${variable.label} (örn. ${variable.example})`}
          </Text>
        ))}
      </View>

      <Pressable
        onPress={() =>
          void onSave({ body: trimmed, autoSendEnabled: enabled, audience })
        }
        disabled={!savable}
        accessibilityRole="button"
        accessibilityLabel="Karşılama mesajını kaydet"
        accessibilityState={{ disabled: !savable }}
        style={({ pressed }) => [
          styles.save,
          pressed && savable && styles.savePressed,
          !savable && styles.saveDisabled,
        ]}
      >
        <Text style={styles.saveLabel}>{busy ? 'Kaydediliyor...' : 'Kaydet'}</Text>
      </Pressable>

      {template.updatedAt !== null && (
        <Text style={styles.meta}>
          Son güncelleme: {formatInstantIn(template.updatedAt, timeZoneId)}
        </Text>
      )}

      <View style={styles.deliveries}>
        <Text style={styles.label}>Son otomatik gönderimler</Text>
        {template.recentDeliveries.length === 0 ? (
          <Text style={styles.empty}>
            Henüz otomatik gönderim yok. Otomatik gönderim açıkken eklenen her yeni kayıt burada
            görünür.
          </Text>
        ) : (
          template.recentDeliveries.map((delivery) => (
            <DeliveryRow key={delivery.id} delivery={delivery} timeZoneId={timeZoneId} />
          ))
        )}
      </View>
    </Card>
  );
}

/**
 * One automatic send, with what actually happened to it.
 *
 * <b>Two different facts on one line, and collapsing them would be the lie.</b> `status` says
 * whether a message was ever created; `deliveryStatus` is where that message got to, straight from
 * the message row. A welcome that was queued and then refused by the provider is a success by the
 * first measure and a failure by the second, and the studio needs the second one.
 */
function DeliveryRow({
  delivery,
  timeZoneId,
}: {
  delivery: WelcomeDeliveryItem;
  timeZoneId: string;
}) {
  const failed = delivery.status === 'Failed';

  const detail = failed
    ? FAILURE_REASONS[delivery.failureCode ?? ''] ?? 'Gönderilemedi.'
    : delivery.deliveryStatus !== null
      ? MESSAGE_STATUS_LABELS[delivery.deliveryStatus]
      : 'Mesaj kaydı bulunamadı.';

  return (
    <View style={styles.deliveryRow}>
      <AppIcon
        name={failed ? 'alert-circle-outline' : 'checkmark-circle-outline'}
        size={16}
        color={failed ? colors.critical : colors.primaryDark}
      />
      <View style={styles.deliveryText}>
        <Text style={styles.deliveryName} numberOfLines={1}>
          {delivery.recipientName}
          <Text style={styles.deliveryKind}>
            {delivery.recipientKind === 'Lead' ? ' · Müşteri adayı' : ' · Müşteri'}
          </Text>
        </Text>
        <Text style={[styles.deliveryDetail, failed && styles.deliveryDetailFailed]}>{detail}</Text>
      </View>
      <Text style={styles.deliveryTime}>
        {formatInstantIn(delivery.completedAt ?? delivery.requestedAt, timeZoneId)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    minHeight: 120,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    outlineStyle: 'none' as never,
  },
  variables: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.mintLight,
  },
  variable: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  variableToken: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  save: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  savePressed: {
    opacity: 0.85,
  },
  saveDisabled: {
    opacity: 0.5,
  },
  saveLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deliveries: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  empty: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  deliveryText: {
    flex: 1,
    gap: 2,
  },
  deliveryName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  deliveryKind: {
    ...typography.caption,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  deliveryDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deliveryDetailFailed: {
    color: colors.critical,
  },
  deliveryTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
