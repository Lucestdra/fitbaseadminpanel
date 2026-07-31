import { colors } from '@/theme';
import type { IconName } from './dashboard';

export type MessagingChannelId = 'whatsapp' | 'instagram';

export interface ChannelConnection {
  id: MessagingChannelId;
  label: string;
  accountName: string;
  connected: boolean;
  connectedSince: string;
  lastSync: string;
  leadsGenerated: number;
}

export interface ChannelMeta {
  icon: IconName;
  backgroundColor: string;
  color: string;
}

export const CHANNEL_META: Record<MessagingChannelId, ChannelMeta> = {
  whatsapp: { icon: 'logo-whatsapp', backgroundColor: colors.mintLight, color: colors.primaryDark },
  instagram: { icon: 'logo-instagram', backgroundColor: '#E3EEFD', color: colors.info },
};
