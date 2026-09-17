import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_DIR = dirname(fileURLToPath(import.meta.url));

export function loadMd(name) {
  return readFileSync(join(CONTENT_DIR, `${name}.md`), 'utf8');
}

/** Wave 2 — inferred from product; not final policy */
export function reviewBanner(title) {
  return [
    `> **Pending ops approval — derived from product**`,
    `> Derived from OBO UI / code as of 2026-09-17. Not final policy until an Airepro administrator approves.`,
    ``,
    `# ${title}`,
    ``,
  ].join('\n');
}

export function versionFooter(version = '1.1', note = '') {
  return [
    ``,
    `## Version`,
    ``,
    `${version}${note ? ` — ${note}` : ''}`,
    ``,
  ].join('\n');
}
