/**
 * An RFC 9457 problem document, as this API returns them.
 *
 * `code` is the member clients branch on and it is stable across versions — the backend's
 * `docs/contracts/vocabulary.md` §6 registers every one and forbids repurposing them. `detail` is
 * a sentence for a person; it is not stable and must never be matched against.
 */
export interface Problem {
  status: number;
  code: string;
  title?: string;
  detail?: string;
  /** Present on `auth.permission_denied`. Names the permission the caller lacks. */
  requiredPermission?: string;
  /** Present on `validation.failed`. Field name to messages. */
  errors?: Record<string, string[]>;
  /** Present on `auth.password_rejected`. Which policy the password broke. */
  rule?: string;
}

/**
 * The codes this app reacts to structurally rather than by showing a message.
 *
 * Listed rather than scattered, so that adding a branch on a new code is a change in one place —
 * and so a typo is a compile error rather than a branch that never fires.
 */
export const ProblemCode = {
  Unauthenticated: 'auth.unauthenticated',
  CredentialsInvalid: 'auth.credentials_invalid',
  EmailUnverified: 'auth.email_unverified',
  AccountLocked: 'auth.account_locked',
  PermissionsStale: 'auth.permissions_stale',
  PermissionDenied: 'auth.permission_denied',
  RefreshInvalid: 'auth.refresh_invalid',
  RefreshReuseDetected: 'auth.refresh_reuse_detected',
  PasswordRejected: 'auth.password_rejected',
  SecurityTokenInvalid: 'auth.security_token_invalid',
  InvitationInvalid: 'auth.invitation_invalid',
  InvitationExpired: 'auth.invitation_expired',
  InvitationAlreadyAccepted: 'auth.invitation_already_accepted',
  StaffInactive: 'auth.staff_inactive',
  RateLimited: 'ratelimit.exceeded',
} as const;

/** Turkish messages for the codes a person can act on. */
const MESSAGES: Record<string, string> = {
  [ProblemCode.CredentialsInvalid]: 'E-posta veya şifre hatalı.',
  [ProblemCode.EmailUnverified]: 'Giriş yapmadan önce e-posta adresini doğrula.',
  [ProblemCode.AccountLocked]: 'Çok fazla hatalı deneme yapıldı. Biraz sonra tekrar dene.',
  [ProblemCode.PermissionDenied]: 'Bu işlem için yetkin yok.',
  [ProblemCode.StaffInactive]: 'Hesabın bu stüdyoda aktif değil.',
  [ProblemCode.SecurityTokenInvalid]: 'Bu bağlantı artık geçerli değil. Yeni bir tane iste.',
  [ProblemCode.InvitationInvalid]: 'Bu davet bağlantısı geçerli değil.',
  [ProblemCode.InvitationExpired]: 'Bu davetin süresi dolmuş. Stüdyodan yeni bir davet iste.',
  [ProblemCode.InvitationAlreadyAccepted]: 'Bu davet zaten kabul edilmiş. Giriş yapabilirsin.',
  [ProblemCode.RateLimited]: 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.',
  'auth.kvkk_notice_required': 'Devam etmek için KVKK aydınlatma metnini onaylaman gerekiyor.',
  'auth.full_name_required': 'Ad soyad gerekli.',
  'auth.invitation_already_on_roster': 'Bu hesap zaten bu stüdyonun ekibinde.',
  'validation.failed': 'Girilen bilgilerde bir hata var.',

  // Scheduling. Every one of these is something the person in front of the screen can act on —
  // pick another session, sell a package, choose another coach — which is the test for whether a
  // code belongs here rather than falling through to the generic sentence.
  'scheduling.session.not_found': 'Bu ders bulunamadı. Takvim yenilenmiş olabilir.',
  'scheduling.session.capacity_exceeded': 'Bu dersin kontenjanı doldu.',
  'scheduling.session.already_started': 'Bu ders başlamış; artık değiştirilemez.',
  'scheduling.session.cancelled': 'Bu ders iptal edilmiş.',
  'scheduling.booking.duplicate': 'Bu üye zaten bu derse kayıtlı.',
  'scheduling.booking.cancellation_window_closed':
    'İptal süresi doldu. Seans hakkı iade edilmeyecek.',
  'scheduling.trainer.double_booked': 'Bu eğitmenin aynı saatte başka bir dersi var.',
  'scheduling.horizon.exceeded': 'Takvim bu kadar ileri tarih için henüz oluşturulmadı.',
  'scheduling.coach.not_found': 'Bu eğitmen stüdyonun ekibinde değil.',
  'scheduling.class.not_found': 'Bu ders tanımı bulunamadı.',
  'scheduling.slot.not_found': 'Bu ders saati bulunamadı.',
  'scheduling.slot.invalid_interval': 'Tekrar aralığı 1 ile 4 hafta arasında olmalı.',
  'scheduling.slot.invalid_window': 'Bitiş tarihi başlangıçtan sonra olmalı.',
  'scheduling.session.invalid_terms': 'Süre ve kontenjan sıfırdan büyük olmalı.',
  'scheduling.calendar.invalid_range': 'Seçilen tarih aralığı geçersiz.',
  'members.session_credits.insufficient': 'Bu üyenin kalan seans hakkı yok.',
  'members.membership.inactive': 'Bu üyenin aktif bir üyeliği yok.',
};

const FALLBACK = 'Beklenmeyen bir hata oluştu. Lütfen tekrar dene.';

/**
 * Reads a problem document out of whatever the server returned.
 *
 * Defensive because the one response nobody designs is the one from a proxy: a 502 from Caddy is
 * HTML, and a client that assumed JSON would throw inside its own error handler.
 */
export function toProblem(status: number, body: unknown): Problem {
  if (body !== null && typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if (typeof record.code === 'string') {
      return {
        status,
        code: record.code,
        title: typeof record.title === 'string' ? record.title : undefined,
        detail: typeof record.detail === 'string' ? record.detail : undefined,
        requiredPermission:
          typeof record.requiredPermission === 'string' ? record.requiredPermission : undefined,
        errors: isFieldErrors(record.errors) ? record.errors : undefined,
        rule: typeof record.rule === 'string' ? record.rule : undefined,
      };
    }
  }

  return { status, code: `http.${status}` };
}

/**
 * What to show the person.
 *
 * Falls back to a generic sentence rather than to `detail`. The server's detail is written for
 * whoever reads a log — it is in English, it names internal concepts, and on a 500 it deliberately
 * says nothing. Showing it would leak the first and confuse the second.
 */
export function describeProblem(problem: Problem): string {
  if (problem.code === 'validation.failed' && problem.errors) {
    const first = Object.values(problem.errors)[0]?.[0];
    if (first) {
      return first;
    }
  }

  if (problem.code === ProblemCode.PasswordRejected) {
    return problem.detail ?? 'Bu şifre kabul edilmedi. Daha güçlü bir şifre seç.';
  }

  return MESSAGES[problem.code] ?? FALLBACK;
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.values(value).every(
      (entry) => Array.isArray(entry) && entry.every((item) => typeof item === 'string'),
    )
  );
}

/** A failed call, carrying the problem so callers can branch on `code`. */
export class ApiError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(describeProblem(problem));
    this.name = 'ApiError';
    this.problem = problem;
  }

  get code(): string {
    return this.problem.code;
  }
}
