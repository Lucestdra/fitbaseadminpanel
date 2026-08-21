#!/usr/bin/env node

/**
 * The Phase 2 exit gate: no screen reads `src/mock/` except the two that are allowed to.
 *
 * The panel shipped as 169 files of mock arrays read into `useState`. Every one of them has been
 * replaced by a real query, and the risk now is the opposite of the original problem — a screen
 * quietly reaching back for a mock array to fill a gap, in a codebase where three files still hold
 * them legitimately. That reads as finished and is not.
 *
 * An allowlist, entry by entry, with the reason and what retires it. A fourth entry means writing
 * down why, which is the point: each of these is a decision, and none of them is "for now".
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Importer → why it is allowed, and what removes it. */
const ALLOWED = new Map([
  [
    'app/ayarlar.tsx',
    'Subscription and invoices are stubbed behind contracts by backend ADR-0042; billing has no '
      + 'endpoint to call. Retired when the billing module ships a real one.',
  ],
]);

const SEARCH_ROOTS = ['src', 'app'];
const EXTENSIONS = ['.ts', '.tsx'];
const IMPORT_PATTERN = /from\s+['"](?:@\/mock\/|(?:\.\.?\/)+mock\/)/;

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      yield* walk(path);
      continue;
    }

    if (EXTENSIONS.some((extension) => path.endsWith(extension))) {
      yield path;
    }
  }
}

const offenders = [];

for (const searchRoot of SEARCH_ROOTS) {
  for (const path of walk(join(ROOT, searchRoot))) {
    const relativePath = relative(ROOT, path).split(sep).join('/');

    // The mock files may of course import each other.
    if (relativePath.startsWith('src/mock/')) {
      continue;
    }

    if (!IMPORT_PATTERN.test(readFileSync(path, 'utf8'))) {
      continue;
    }

    if (!ALLOWED.has(relativePath)) {
      offenders.push(relativePath);
    }
  }
}

// Both directions. An allowlist entry whose file has stopped importing a mock is an entry nobody
// removed, and it would go on permitting a re-import that the gate was supposed to catch.
const stale = [...ALLOWED.keys()].filter((path) => {
  try {
    return !IMPORT_PATTERN.test(readFileSync(join(ROOT, path), 'utf8'));
  } catch {
    return true;
  }
});

if (offenders.length > 0) {
  console.error('These files import from src/mock/ and are not on the allowlist:\n');
  for (const path of offenders) {
    console.error(`  ${path}`);
  }
  console.error(
    '\nA screen reaching for a mock array is a screen that looks finished and is not. Either '
      + 'call the API, or add an entry to scripts/check-mock-imports.mjs saying why not and what '
      + 'retires it.',
  );
}

if (stale.length > 0) {
  console.error('\nThese allowlist entries no longer import a mock and should be deleted:\n');
  for (const path of stale) {
    console.error(`  ${path} — ${ALLOWED.get(path)}`);
  }
}

if (offenders.length > 0 || stale.length > 0) {
  process.exit(1);
}

console.log(`Mock imports: ${ALLOWED.size} allowed, 0 unexpected.`);
