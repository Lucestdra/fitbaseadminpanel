import { client, withAuth } from './client';
import type { components } from './schema';

export type PaymentListItem = components['schemas']['PaymentListItem'];
export type PaymentCounters = components['schemas']['PaymentCounters'];
export type PaymentList = components['schemas']['PaymentList'];
export type PaymentReceipt = components['schemas']['PaymentReceipt'];
export type AllocationLine = components['schemas']['AllocationLine'];
export type ReceivableItem = components['schemas']['ReceivableItem'];
export type ReceivablesList = components['schemas']['ReceivablesList'];
export type PaymentPlanDetail = components['schemas']['PaymentPlanDetail'];
export type MemberFinance = components['schemas']['MemberFinance'];
export type FinanceRangeReport = components['schemas']['FinanceRangeReport'];
export type MethodTotal = components['schemas']['MethodTotal'];

export type PaymentMethod = components['schemas']['PaymentMethod'];
export type PaymentStatus = components['schemas']['PaymentStatus'];
export type RefundReason = components['schemas']['RefundReason'];
export type InstallmentStatus = components['schemas']['InstallmentStatus'];

/**
 * How the payments list is narrowed.
 *
 * `from` and `to` are organization-local dates (`YYYY-MM-DD`) applied to when the money arrived,
 * not to when somebody typed it in. A studio recording Friday's cash on Monday means both are true
 * and only one of them is the revenue date.
 */
export interface PaymentQuery {
  memberId?: string;
  from?: string;
  to?: string;
  method?: PaymentMethod[];
  status?: PaymentStatus[];
  /** Matches the payment reference. Member names are searched on the members screen. */
  search?: string;
  /** From a previous page's `nextCursor`. Opaque — never build one. */
  cursor?: string;
  limit?: number;
}

export async function listPayments(query: PaymentQuery = {}): Promise<PaymentList> {
  return withAuth(() =>
    client.GET('/api/v1/finance/payments', {
      params: {
        query: {
          memberId: query.memberId,
          from: query.from,
          to: query.to,
          method: query.method,
          status: query.status,
          search: query.search,
          cursor: query.cursor,
          limit: query.limit,
        },
      },
    }),
  );
}

/**
 * What the studio is owed.
 *
 * <b>A different question from the payments list, and a different endpoint.</b> A payment is money
 * that arrived; a receivable is money that has not. The panel conflates them — its `bekliyor` is a
 * payment row that never happened — which is why its outstanding tile could only ever be a
 * hardcoded ₺67.850.
 *
 * `isOverdue` is computed by the server from the studio's own today and its own grace period, and
 * the response says which grace period it used. The client cannot derive it: the device clock is in
 * whichever zone the laptop is in, and this is a studio-local question.
 */
export interface ReceivablesQuery {
  memberId?: string;
  overdueOnly?: boolean;
  /** Everything falling due on or before this organization-local date — "bu ay bekleyen". */
  dueBefore?: string;
  cursor?: string;
  limit?: number;
}

export async function listReceivables(query: ReceivablesQuery = {}): Promise<ReceivablesList> {
  return withAuth(() =>
    client.GET('/api/v1/finance/receivables', {
      params: {
        query: {
          memberId: query.memberId,
          overdueOnly: query.overdueOnly,
          dueBefore: query.dueBefore,
          cursor: query.cursor,
          limit: query.limit,
        },
      },
    }),
  );
}

/** One member's plans, payments, balance and any credit they are holding. */
export async function getMemberFinance(memberId: string): Promise<MemberFinance> {
  return withAuth(() =>
    client.GET('/api/v1/finance/members/{memberId}', { params: { path: { memberId } } }),
  );
}

export async function getPaymentPlan(planId: string): Promise<PaymentPlanDetail> {
  return withAuth(() =>
    client.GET('/api/v1/finance/plans/{planId}', { params: { path: { planId } } }),
  );
}

/**
 * What a studio charged and collected over a period.
 *
 * <b>Two date axes.</b> `collected` and `refunded` are windowed on when the money moved;
 * `dueInWindow`, `outstanding` and `overdue` on when it fell due. Forcing them onto one axis makes
 * a report claim a studio is owed nothing in a month where everything due happened to be paid
 * early.
 */
export async function getFinanceReport(from: string, to: string): Promise<FinanceRangeReport> {
  return withAuth(() =>
    client.GET('/api/v1/finance/report', { params: { query: { from, to } } }),
  );
}

/** One instalment of a plan, as the client describes it. */
export interface InstallmentBody {
  amount: number;
  /** Organization-local `YYYY-MM-DD`. */
  dueOn: string;
}

/**
 * A sale and how it will be paid for.
 *
 * <b>No total is sent.</b> It is the sum of the instalments — two versions of the same number
 * diverge the first time somebody edits one, leaving a plan whose parts do not add up to its whole
 * and neither figure obviously the wrong one.
 */
export interface PaymentPlanBody {
  memberId: string;
  membershipId: string | null;
  description: string;
  discountAmount: number | null;
  currency: string | null;
  installments: InstallmentBody[];
}

export async function createPaymentPlan(body: PaymentPlanBody): Promise<PaymentPlanDetail> {
  return withAuth(() => client.POST('/api/v1/finance/plans', { body }));
}

/** Stops chasing the unpaid part of a plan. The instalments are cancelled, not deleted. */
export async function cancelPlanRemainder(planId: string): Promise<PaymentPlanDetail> {
  return withAuth(() =>
    client.POST('/api/v1/finance/plans/{planId}/cancel-remainder', {
      params: { path: { planId } },
    }),
  );
}

/**
 * Money that arrived.
 *
 * `amount` is <b>a number</b>. The panel held it as `'₺2.400'` and stripped non-digits on the way
 * in, which turns ₺2.400,50 into 240050 — off by a factor of a hundred, silently, in the direction
 * that makes a studio think it had a good month.
 *
 * `allocations` null settles the oldest debt first, which is what a studio means by "he paid a
 * thousand off his balance". Send an explicit list only when that rule is wrong — somebody paying
 * next month's instalment while disputing this month's.
 */
export interface PaymentBody {
  memberId: string;
  amount: number;
  currency: string | null;
  method: NonNullable<PaymentMethod>;
  /** ISO-8601 instant. Null means now. */
  paidAt: string | null;
  reference: string | null;
  note: string | null;
  allocations: { installmentId: string; amount: number }[] | null;
}

export async function recordPayment(body: PaymentBody): Promise<PaymentReceipt> {
  return withAuth(() => client.POST('/api/v1/finance/payments', { body }));
}

/**
 * Withdraws a payment recorded in error.
 *
 * <b>Not a refund.</b> Voiding says the payment never happened, so what it settled becomes owed
 * again; refunding says it happened and was given back, so the collection stays in its month. A
 * payment that has already been refunded cannot be voided — the two are contradictory statements
 * about the same money.
 */
export async function voidPayment(
  paymentId: string,
  reason: string | null,
): Promise<PaymentReceipt> {
  return withAuth(() =>
    client.POST('/api/v1/finance/payments/{paymentId}/void', {
      params: { path: { paymentId } },
      body: { reason },
    }),
  );
}

/**
 * Sends money back out, on its own date.
 *
 * Partial refunds are ordinary — half a package when somebody moves away mid-term — and several
 * against one payment are allowed up to what arrived. The instalments it settled stay settled;
 * whether the membership is cancelled is a separate decision.
 */
export async function refundPayment(
  paymentId: string,
  // `NonNullable`, because the generated enum carries `| null`. The server requires a reason.
  body: { amount: number; reason: NonNullable<RefundReason>; note: string | null },
): Promise<PaymentReceipt> {
  return withAuth(() =>
    client.POST('/api/v1/finance/payments/{paymentId}/refunds', {
      params: { path: { paymentId } },
      body,
    }),
  );
}
