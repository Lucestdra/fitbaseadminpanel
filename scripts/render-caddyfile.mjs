#!/usr/bin/env node

/**
 * Renders the panel container's Caddyfile from the bundle the build actually produced.
 *
 * <b>Two values in that file cannot be written by hand, and both fail silently when wrong.</b>
 *
 * The first is the Content-Security-Policy hash for Expo Router's inline hydration script — today
 * the single line `globalThis.__EXPO_ROUTER_HYDRATE__=true;`, emitted into every exported page. A
 * strict `script-src` must name its hash or the browser refuses to run it, and the app then never
 * hydrates: the panel serves 200, renders nothing, and says so only in the console. Expo owns that
 * line and may change it in any release, so a hash committed to a config file is a blank screen
 * waiting for an upgrade. Reading it back out of the build makes the two impossible to separate.
 *
 * The second is the API origin for `connect-src`. The bundle is compiled against
 * `EXPO_PUBLIC_API_BASE_URL`; if the policy names a different host, every request the panel makes
 * is blocked — a signed-in-looking panel where nothing loads. Deriving both from one input means
 * there is no second place to keep in step.
 *
 * Usage: node scripts/render-caddyfile.mjs <dist-dir> <template> <output>
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const [distDir, templatePath, outputPath] = process.argv.slice(2);

if (!distDir || !templatePath || !outputPath) {
  console.error('Usage: render-caddyfile.mjs <dist-dir> <template> <output>');
  process.exit(1);
}

/** Every inline <script> in one HTML document, without its attributes. */
function inlineScripts(html) {
  const found = [];
  const pattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (match[1].length > 0) found.push(match[1]);
  }

  return found;
}

function* htmlFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      yield* htmlFiles(path);
    } else if (path.endsWith('.html')) {
      yield path;
    }
  }
}

// Every page, not just index.html. They carry the same hydration line today, but a build that
// emitted a different one on a single route would produce a panel where exactly one screen is
// blank — and that screen could easily be the OAuth return, which is visited once per connection
// and by nobody else.
const hashes = new Set();
let pages = 0;

for (const path of htmlFiles(distDir)) {
  pages++;

  for (const script of inlineScripts(readFileSync(path, 'utf8'))) {
    hashes.add(`'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`);
  }
}

if (pages === 0) {
  console.error(`No HTML found under ${distDir}. The export did not run, or wrote somewhere else.`);
  process.exit(1);
}

// Zero is not a legitimate answer today, and treating it as one would silently ship a policy that
// blocks the app. If Expo ever stops emitting an inline script this exits and somebody deletes
// these four lines deliberately.
if (hashes.size === 0) {
  console.error(
    `No inline script found in ${pages} page(s). Expo has always emitted one, so this is either a `
      + 'changed export format or a broken build — and shipping a script-src without it would '
      + 'produce a panel that renders nothing. Refusing to render a policy that cannot be right.',
  );
  process.exit(1);
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

// The origin, not the configured string: a base URL with a path or a trailing slash is not a valid
// CSP source and Caddy would serve the malformed directive without complaint.
let apiOrigin = '';

if (apiBaseUrl.length > 0) {
  try {
    apiOrigin = new URL(apiBaseUrl).origin;
  } catch {
    console.error(`EXPO_PUBLIC_API_BASE_URL is not a URL: ${apiBaseUrl}`);
    process.exit(1);
  }
}

// Empty means same-origin, which `connect-src 'self'` already covers. That is the old single-origin
// deployment and still a valid one, so it renders rather than failing — but it is worth saying out
// loud during a build that is almost certainly meant to be split.
if (apiOrigin === '') {
  console.warn(
    'EXPO_PUBLIC_API_BASE_URL is empty: the panel will call its own origin. Correct only if the '
      + 'API is served from this same host.',
  );
}

const rendered = readFileSync(templatePath, 'utf8')
  .replaceAll('__INLINE_SCRIPT_HASHES__', [...hashes].join(' '))
  .replaceAll('__API_ORIGIN__', apiOrigin);

if (rendered.includes('__INLINE_SCRIPT_HASHES__') || rendered.includes('__API_ORIGIN__')) {
  console.error('A placeholder survived rendering. Refusing to write a partial policy.');
  process.exit(1);
}

writeFileSync(outputPath, rendered, 'utf8');

console.log(
  `Rendered ${outputPath}: ${hashes.size} inline-script hash(es) over ${pages} page(s), `
    + `connect-src ${apiOrigin || "'self' only"}.`,
);
