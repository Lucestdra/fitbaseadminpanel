import { colors } from '@/theme';
import type { BadgeTone } from '@/components/ui/Badge';
import type { IconName } from './dashboard';

/**
 * The channels the product connects, keyed the way the server names them.
 *
 * `ChannelProvider` on the wire carries `Telegram` and `TikTok` too; they are registered and
 * unimplemented (vocabulary §ChannelProvider) and are absent here until a connector exists. A
 * channel on this screen is one somebody will be able to connect.
 */
export type MessagingChannelId = 'whatsapp' | 'instagram' | 'facebook';

/**
 * Where a connection is in its life.
 *
 * <b>Eight values, not a boolean.</b> "Bağlı değil" covers a studio that never authorized, one whose
 * token expired, and one an operator suspended — three situations with three different sentences and
 * three different remedies. The panel's `connected: boolean` is why the screen could only ever say
 * one of them.
 *
 * Mirrors `ChannelConnectionStatus` (backend, CLAUDE.md §12). Labels are the registered Turkish ones
 * from `docs/contracts/vocabulary.md`; the server sends the English value (ADR-0012).
 */
export type ChannelConnectionStatus =
  | 'PendingAuthorization'
  | 'PendingConfiguration'
  | 'Active'
  | 'Degraded'
  | 'ReauthorizationRequired'
  | 'Suspended'
  | 'Disconnected'
  | 'Failed';

export const CHANNEL_STATUS_LABELS: Record<ChannelConnectionStatus, string> = {
  PendingAuthorization: 'Yetkilendirme Bekliyor',
  PendingConfiguration: 'Yapılandırma Bekliyor',
  Active: 'Bağlı',
  Degraded: 'Sorunlu',
  ReauthorizationRequired: 'Yeniden Yetkilendirme Gerekli',
  Suspended: 'Askıya Alındı',
  Disconnected: 'Bağlı Değil',
  Failed: 'Başarısız',
};

export const CHANNEL_STATUS_TONES: Record<ChannelConnectionStatus, BadgeTone> = {
  PendingAuthorization: 'info',
  PendingConfiguration: 'info',
  Active: 'mint',
  Degraded: 'warning',
  ReauthorizationRequired: 'warning',
  Suspended: 'critical',
  Disconnected: 'neutral',
  Failed: 'critical',
};

/** The two statuses a studio can act on, and what it should do. */
export const CHANNEL_STATUS_REMEDIES: Partial<Record<ChannelConnectionStatus, string>> = {
  Degraded:
    'Sağlayıcı şu an mesajları yavaş işliyor veya bir kısmını reddediyor. Genelde kendiliğinden düzelir.',
  ReauthorizationRequired:
    'Erişim izni sona erdi. Bağlantıyı yeniden yetkilendirmen gerekiyor — mesajlar o ana kadar gelmez.',
  Suspended: 'Bağlantı platform tarafından durduruldu. Destek ile iletişime geç.',
  Failed: 'Bağlantı geri dönülemez bir hatayla sonlandı. Yeniden bağlaman gerekiyor.',
};

export interface ChannelConnection {
  id: MessagingChannelId;
  label: string;
  /** What the provider calls the connected account. Null before there is one. */
  accountName: string | null;
  status: ChannelConnectionStatus;
  /** Null until connected. */
  connectedSince: string | null;
  /**
   * The last delivery the server saw. Null means nothing has arrived — which on an `Active`
   * connection is either a quiet studio or a broken subscription, and worth showing either way.
   */
  lastInboundAt: string | null;
}

export interface ChannelMeta {
  icon: IconName;
  backgroundColor: string;
  color: string;
  /** How this channel is authorized, in one line, for the connect dialog's heading. */
  flowSummary: string;
}

export const CHANNEL_META: Record<MessagingChannelId, ChannelMeta> = {
  whatsapp: {
    icon: 'logo-whatsapp',
    backgroundColor: colors.mintLight,
    color: colors.primaryDark,
    flowSummary: 'Meta Embedded Signup — mevcut numaranı Coexistence ile bağlayabilirsin.',
  },
  instagram: {
    icon: 'logo-instagram',
    backgroundColor: '#E3EEFD',
    color: colors.info,
    flowSummary: 'Instagram profesyonel hesap girişi veya Facebook üzerinden yetkilendirme.',
  },
  facebook: {
    icon: 'logo-facebook',
    backgroundColor: '#E8EDF9',
    color: '#1877F2',
    flowSummary: 'Facebook ile giriş yapıp Messenger kutusunu yöneteceğin sayfayı seçersin.',
  },
};

/** The order the connect screen lists them in — the order they ship in (ADR-0004). */
export const CHANNEL_ORDER: MessagingChannelId[] = ['whatsapp', 'instagram', 'facebook'];

export const CHANNEL_LABELS: Record<MessagingChannelId, string> = {
  whatsapp: 'WhatsApp Business',
  instagram: 'Instagram',
  facebook: 'Messenger',
};
