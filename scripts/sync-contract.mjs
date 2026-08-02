#!/usr/bin/env node
/**
 * Copies the backend's OpenAPI contract into this repo.
 *
 * The contract is committed here, not fetched at build time. Two reasons: `npm run api:generate`
 * has to work on a machine with no backend checkout and no network, and a generated client that
 * silently tracks whatever the backend published today would make a breaking API change appear as
 * a mysterious type error in an unrelated pull request. Syncing is a deliberate act with a diff.
 *
 *   npm run api:sync                      from ../backend/contracts/openapi.v1.json
 *   FITBASE_CONTRACT=<path|url> npm run api:sync
 *
 * The backend's own CI fails if its committed contract is stale (ADR-0011), so the file this
 * copies is always the one that instance actually serves.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const target = resolve(root, 'contracts/openapi.v1.json');

const source =
  process.env.FITBASE_CONTRACT ?? resolve(root, '../backend/contracts/openapi.v1.json');

async function read() {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`${source} responded ${response.status}`);
    }
    return await response.text();
  }

  if (!existsSync(source)) {
    throw new Error(
      `${source} does not exist. Point FITBASE_CONTRACT at the backend's ` +
        'contracts/openapi.v1.json, or at the published URL.',
    );
  }

  return readFileSync(source, 'utf8');
}

const contract = await read();

// Parsed before writing, so a truncated download or an HTML error page fails here rather than
// inside the generator with a message about an unexpected token.
const document = JSON.parse(contract);
const paths = Object.keys(document.paths ?? {}).length;

if (paths === 0) {
  throw new Error('The contract declares no paths. Refusing to sync a document with nothing in it.');
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

console.log(`Synced ${paths} path(s) from ${source}`);
console.log('Next: npm run api:generate && npm run typecheck');
