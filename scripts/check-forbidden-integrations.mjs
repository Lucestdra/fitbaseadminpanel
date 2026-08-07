#!/usr/bin/env node

/**
 * Refuses the provider integration patterns the backend forbids outright.
 *
 * <b>Written because one of them shipped.</b> `QrConnectModal.tsx` told a studio to open
 * "WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz Bağla" and scan a code — WhatsApp Web linked-device
 * pairing, which backend CLAUDE.md §11.1 and §35 forbid, and which Meta does not sanction for a
 * business number. It sat in the repository for months looking like an unfinished feature rather
 * than a violation, because nothing could tell the difference.
 *
 * The backend's rules are enforced in the backend: architecture tests, banned symbols, structural
 * SQL assertions. None of them can see this repository, and the panel is where a connection flow
 * is actually presented to a person. So the check has to live here.
 *
 * <b>This looks for intent, not for a library.</b> The unofficial route is rarely a dependency —
 * it is a screen that instructs someone to pair a device. So the patterns below are the words such
 * a screen has to use, in both languages, plus the handful of packages that exist only to emulate
 * a WhatsApp client.
 *
 * False positives are expected and are the point: a file that discusses the prohibition — this one,
 * and the notice that replaced the modal — must say so in a comment marked with the exemption
 * below, which is a sentence someone has to write deliberately.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** A file whose comment carries this is discussing the rule rather than breaking it. */
const EXEMPTION = 'forbidden-integration-check: discusses the prohibition';

const SEARCHED = ['src', 'app'];

/** Pattern → why it is refused. */
const FORBIDDEN = [
  [
    /bağlı\s*cihaz/iu,
    'WhatsApp\'s linked-device screen. Instructing a studio there is QR pairing, which CLAUDE.md '
      + '§11.1 forbids and Meta does not sanction for a business number.',
  ],
  [
    /cihaz\s*bağla/iu,
    'The linked-device pairing step, in Turkish. Same prohibition.',
  ],
  [
    /linked\s*device/iu,
    'The linked-device pairing step, in English. Same prohibition.',
  ],
  [
    /whatsapp[-\s]?web/iu,
    'WhatsApp Web automation. §35: no unofficial WhatsApp Web or QR-session integrations.',
  ],
  [
    /\b(whatsapp-web\.js|venom-bot|baileys|wppconnect)\b/iu,
    'A library that emulates a WhatsApp client. §11.1: unofficial SDKs are forbidden.',
  ],
];

/** Packages that exist only to emulate a provider client. Checked separately, by name. */
const FORBIDDEN_PACKAGES = ['whatsapp-web.js', 'venom-bot', '@open-wa/wa-automate', 'baileys', 'wppconnect'];

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;

    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      yield path;
    }
  }
}

const findings = [];

for (const directory of SEARCHED) {
  for (const path of walk(join(ROOT, directory))) {
    const source = readFileSync(path, 'utf8');

    if (source.includes(EXEMPTION)) continue;

    for (const [pattern, reason] of FORBIDDEN) {
      const match = pattern.exec(source);

      if (match) {
        const line = source.slice(0, match.index).split('\n').length;
        findings.push({ file: `${relative(ROOT, path)}:${line}`, matched: match[0], reason });
      }
    }
  }
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };

for (const name of FORBIDDEN_PACKAGES) {
  if (name in dependencies) {
    findings.push({
      file: 'package.json',
      matched: name,
      reason: 'A package that emulates a provider client. CLAUDE.md §35.',
    });
  }
}

if (findings.length > 0) {
  console.error('Forbidden provider-integration patterns:\n');

  for (const finding of findings) {
    console.error(`  ${finding.file}`);
    console.error(`    matched: ${finding.matched}`);
    console.error(`    ${finding.reason}\n`);
  }

  console.error(
    'Channels are connected through the provider\'s official authorization flow — Embedded Signup '
      + 'for WhatsApp — and never by pairing a device. If this file discusses the prohibition '
      + `rather than breaking it, add a comment containing: ${EXEMPTION}`,
  );

  process.exit(1);
}

console.log('No forbidden provider-integration patterns found.');
