#!/usr/bin/env node

/**
 * Every route in the contract is either called by the panel or listed here with a reason.
 *
 * <b>Written after finding two features that existed only in the contract.</b> `Receivables` was a
 * registered export kind with no way to ask for it, and the receivables grace period — the number
 * that decides what "gecikti" means on two screens — was settable through the API and reachable
 * from nowhere. Both were implemented, tested, and invisible.
 *
 * Nothing else can see this. The backend's own tests pass on an endpoint nobody calls; `tsc` and
 * `eslint` only see code that exists; and the generated `schema.d.ts` grows a type whether or not
 * anything uses it. The gap is between two repositories, so it needs a check that reads both.
 *
 * <b>This is not a rule that every endpoint needs a button.</b> Six of the entries below never will
 * have one. It is a rule that the answer is written down, because "no UI" and "we forgot" look
 * identical from either side.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Route → why the panel does not call it. */
const ALLOWED = new Map([
  [
    'POST /api/v1/admin/auth/sign-in',
    'SuperAdmin surface. A separate audience with its own TOTP requirement and no studio-facing '
      + 'client by design — the panel is the studio product.',
  ],
  ['POST /api/v1/admin/auth/enrolment', 'SuperAdmin surface.'],
  ['POST /api/v1/admin/auth/enrolment/confirm', 'SuperAdmin surface.'],
  ['GET /api/v1/admin/me', 'SuperAdmin surface.'],
  ['GET /api/v1/admin/break-glass', 'SuperAdmin surface.'],
  ['POST /api/v1/admin/organizations/{organizationId}/break-glass', 'SuperAdmin surface.'],
  [
    'POST /api/v1/organization/export',
    'Answers 501 until Phase 5. A button that reliably fails is worse than an absent one — and the '
      + 'route exists now so the KVKK obligation is visible in the contract rather than forgotten.',
  ],
  [
    'POST /api/v1/organization/deletion',
    'Answers 501 until Phase 5, and is blocked on plan decision D21 (VUK retention versus KVKK '
      + 'erasure), which is a legal answer rather than an engineering one.',
  ],
  [
    'POST /api/v1/realtime/ticket',
    'Works, and there is nothing yet to receive. It mints the handle for the notification hub, '
      + 'whose first publisher is the messaging domain in Phase 3.3. Calling it now would open a '
      + 'connection that never delivers anything — a reconnect loop in every client, for no '
      + 'feature. The panel starts using it in the same change that gives the hub something to say.',
  ],
]);

const spec = JSON.parse(readFileSync(join(ROOT, 'contracts', 'openapi.v1.json'), 'utf8'));

const client = readdirSync(join(ROOT, 'src', 'api'))
  .filter((name) => name.endsWith('.ts'))
  .map((name) => readFileSync(join(ROOT, 'src', 'api', name), 'utf8'))
  .join('\n');

const uncalled = [];

for (const [path, operations] of Object.entries(spec.paths)) {
  for (const method of Object.keys(operations)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;

    // openapi-fetch calls carry the path as a literal: client.GET('/api/v1/members', …). One
    // occurrence anywhere in src/api is enough — this asks whether the route is reachable at all,
    // not whether a particular screen reaches it.
    if (!client.includes(`'${path}'`)) {
      uncalled.push(`${method.toUpperCase()} ${path}`);
    }
  }
}

const unexplained = uncalled.filter((route) => !ALLOWED.has(route));

// Both directions. An entry whose route the panel now calls, or which no longer exists in the
// contract, is a note that has stopped being true — and a stale exemption silently re-permits the
// next endpoint that lands on the same route.
const stale = [...ALLOWED.keys()].filter((route) => !uncalled.includes(route));

if (unexplained.length > 0) {
  console.error('These routes exist in the contract and nothing in src/api calls them:\n');
  for (const route of unexplained) console.error(`  ${route}`);
  console.error(
    '\nAn endpoint the panel cannot reach is a feature that exists only in the contract. Either '
      + 'call it, or add an entry to scripts/check-api-coverage.mjs saying why not.',
  );
}

if (stale.length > 0) {
  console.error('\nThese entries are no longer needed and should be deleted:\n');
  for (const route of stale) console.error(`  ${route}`);
}

if (unexplained.length > 0 || stale.length > 0) process.exit(1);

console.log(
  `API coverage: ${Object.keys(spec.paths).length} paths, ${ALLOWED.size} routes deliberately uncalled.`,
);
