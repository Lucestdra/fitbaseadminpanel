import { colors } from '@/theme';
import type { BadgeTone } from '@/components/ui/Badge';
import type { ChannelConnectionStatus as WireStatus, ChannelProvider } from '@/api/channels';
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
 * <b>Aliased from the generated contract rather than re-typed.</b> These eight names were written
 * out here by hand while the server described the field as `string`, so the two lists agreed only
 * because somebody had checked. They are the same list now by construction: a status the backend
 * adds or renames lands in `schema.d.ts` on the next `api:sync` and breaks the `Record` types below
 * at compile time, which is the only moment anyone would otherwise notice — the alternative is an
 * unlabelled badge on a live screen. Labels are the registered Turkish ones from
 * `docs/contracts/vocabulary.md`; the server sends the English value (ADR-0012).
 */
export type ChannelConnectionStatus = WireStatus;

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
  /**
   * The server's id for this connection, needed to disconnect it.
   *
   * Null on a channel that has never been connected — those entries come from the catalogue rather
   * than from a row, and there is nothing to end. Non-null does not mean live: a `Disconnected` row
   * keeps its id so the conversations that reference it still resolve.
   */
  connectionId: string | null;
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

/**
 * What each channel is called on the wire.
 *
 * <b>Two spellings of one thing, and the map is the seam between them.</b> The panel keys presentation
 * by a lowercase id because that is what its icons, labels and routes are written against; the API
 * speaks `ChannelProvider`, whose values are English PascalCase by ADR-0012. Typing the values
 * against the generated union is what stops the two drifting — a provider renamed on the wire fails
 * to compile here rather than silently matching nothing at runtime.
 */
export const CHANNEL_PROVIDERS: Record<MessagingChannelId, ChannelProvider> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
};

/** The order the connect screen lists them in — the order they ship in (ADR-0004). */
export const CHANNEL_ORDER: MessagingChannelId[] = ['whatsapp', 'instagram', 'facebook'];

export const CHANNEL_LABELS: Record<MessagingChannelId, string> = {
  whatsapp: 'WhatsApp Business',
  instagram: 'Instagram',
  facebook: 'Messenger',
};
