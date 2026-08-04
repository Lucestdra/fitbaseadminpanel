import type { BadgeTone } from '@/components/ui/Badge';
import type { CallOutcome, LeadLossReason, LeadMeetingKind } from './leads';
import type { MemberBadge, MembershipState, SessionCreditReason } from './members';
import type {
  InstallmentStatus,
  PaymentMethod,
  PaymentStatus,
  RefundReason,
} from './finance';

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

/**
 * How a call went.
 *
 * Only `Spoke` moves the lead forward on its own. The other two mean the conversation has not
 * happened yet, and a pipeline that promoted on "meşgul" would report interest nobody expressed.
 */
export const CALL_OUTCOME_LABELS = {
  Unreachable: 'Ulaşılamadı',
  Busy: 'Meşgul',
  Spoke: 'Konuştu',
} satisfies Record<CallOutcome, string>;

/**
 * Why a lead stopped being a lead.
 *
 * A closed set, because these are the buckets a studio acts on — "too expensive" is a pricing
 * conversation and "went elsewhere" is a competitive one. `Timing` is the one worth calling again,
 * which is why reopening exists.
 *
 * `NonNullable` because the generated `LeadLossReason` carries `| null`: the .NET OpenAPI
 * generator folds nullability into a shared enum schema when any one property uses it nullably,
 * and a lead that is still open has no loss reason. `LeadStageSemanticRole` has had the same shape
 * since Phase 2.1. The null belongs to the *property*, not to the set of reasons, so it is
 * stripped here rather than given a label — there is no such thing as a lead lost for reason null.
 */
export const LEAD_LOSS_REASON_LABELS = {
  NoResponse: 'Ulaşılamadı',
  Price: 'Fiyat',
  WentElsewhere: 'Başka Yere Gitti',
  NotSuitable: 'Uygun Değil',
  Timing: 'Zamanlama',
  Other: 'Diğer',
} satisfies Record<NonNullable<LeadLossReason>, string>;

/** A consultation or a trial class. Both hold a coach's time; only one is a class. */
export const LEAD_MEETING_KIND_LABELS = {
  Consultation: 'Yüzyüze Görüşme',
  TrialSession: 'Deneme Dersi',
} satisfies Record<LeadMeetingKind, string>;

/**
 * How the money arrived.
 *
 * A wire enum rather than a studio-editable catalog, deliberately. "Havale" is not a vocabulary a
 * gym owns — it is how Turkish banking works — and making it one would put a foreign concept in
 * the catalogs screen for no benefit.
 */
export const PAYMENT_METHOD_LABELS = {
  CreditCard: 'Kredi Kartı',
  Cash: 'Nakit',
  BankTransfer: 'Havale',
  Other: 'Diğer',
} satisfies Record<NonNullable<PaymentMethod>, string>;

/**
 * What happened to a payment.
 *
 * <b>There is no `Overdue` here, and its absence is the point</b> (ADR-0033). The panel's `gecikti`
 * was a fourth value in this list, which made lateness a property of a payment — but a payment that
 * arrived is never late. What was late is the money the studio was waiting for, and that is an
 * instalment, on the receivables list, computed against today.
 */
export const PAYMENT_STATUS_LABELS = {
  Collected: 'Tahsil Edildi',
  Pending: 'Beklemede',
  Failed: 'Başarısız',
  Voided: 'İptal Edildi',
} satisfies Record<NonNullable<PaymentStatus>, string>;

export const PAYMENT_STATUS_TONES = {
  Collected: 'mint',
  Pending: 'warning',
  Failed: 'critical',
  Voided: 'neutral',
} satisfies Record<NonNullable<PaymentStatus>, BadgeTone>;

/**
 * Why money went back out.
 *
 * A closed set because it is what the report groups by, and because the difference matters:
 * `StudioCancellation` is the studio's fault and `MemberRequest` is not, which is the distinction
 * an owner wants when the refund line grows.
 */
export const REFUND_REASON_LABELS = {
  MemberRequest: 'Üye Talebi',
  StudioCancellation: 'Stüdyo İptali',
  BillingError: 'Tahsilat Hatası',
  Other: 'Diğer',
} satisfies Record<NonNullable<RefundReason>, string>;

/**
 * Where an instalment is in its life.
 *
 * `Cancelled` is a discount the studio gave rather than a row that was deleted — money it chose not
 * to pursue is still a decision it made, and it shows up here as one.
 */
export const INSTALLMENT_STATUS_LABELS = {
  Pending: 'Bekliyor',
  Settled: 'Ödendi',
  Cancelled: 'İptal Edildi',
} satisfies Record<NonNullable<InstallmentStatus>, string>;
