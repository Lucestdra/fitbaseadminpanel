import type { BadgeTone } from '@/components/ui/Badge';
import type { MemberBadge, MembershipState, SessionCreditReason } from './members';

/**
 * Turkish labels for the wire enums.
 *
 * <b>The server speaks English and the panel speaks Turkish</b> (ADR-0012), and this file is the
 * one place the two meet. Each map is `satisfies Record<TheWireType, string>`, so adding a value to
 * the contract breaks the build here until somebody names it — rather than rendering the raw
 * `BookingCancelled` to a studio owner, which is what an index signature would have allowed.
 *
 * Registered in `docs/contracts/vocabulary.md` §5. The labels there and the labels here are the
 * same words on purpose; the register is the review surface and this is the implementation.
 */

export const MEMBERSHIP_STATE_LABELS = {
  Active: 'Aktif',
  Frozen: 'Donduruldu',
  Expired: 'Süresi Doldu',
  Cancelled: 'İptal Edildi',
  NoMembership: 'Üyelik Yok',
} satisfies Record<MembershipState, string>;

/**
 * The badge on a member's row.
 *
 * `Overdue` never arrives yet — it means an unpaid installment past its grace period, which needs
 * the finance module. It is labelled anyway, because the value exists in the contract and an
 * unlabelled one would be a build break the day Phase 2.5 starts returning it.
 */
export const MEMBER_BADGE_LABELS = {
  Active: 'Aktif',
  RenewalSoon: 'Yenileme Yakın',
  Overdue: 'Gecikmiş',
  Frozen: 'Donduruldu',
  Inactive: 'Pasif',
} satisfies Record<MemberBadge, string>;

export const MEMBER_BADGE_TONES = {
  Active: 'mint',
  RenewalSoon: 'warning',
  Overdue: 'critical',
  Frozen: 'info',
  Inactive: 'neutral',
} satisfies Record<MemberBadge, BadgeTone>;

/**
 * Why session credits moved.
 *
 * This is what turns a ledger into an answer to "where did my sessions go", which is a question
 * asked out loud, at a desk, by someone who paid.
 */
export const SESSION_REASON_LABELS = {
  Purchase: 'Paket Alımı',
  Booking: 'Rezervasyon',
  BookingCancelled: 'İptal İadesi',
  Gift: 'Hediye',
  ManualAdjustment: 'Manuel Düzeltme',
  Expiry: 'Süre Doldu',
} satisfies Record<SessionCreditReason, string>;
