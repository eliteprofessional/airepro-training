import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '..');
export const TRAINING_DIR = path.join(ROOT_DIR, 'public', 'training');
export const RESOURCES_PATH = path.join(TRAINING_DIR, 'resources.json');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function sanitizeSlug(raw) {
  if (typeof raw !== 'string') return null;
  const slug = raw.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return null;
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) return null;
  return slug;
}

export function resolveMarkdownPath(slug) {
  const safe = sanitizeSlug(slug);
  if (!safe) return null;

  const resolved = path.resolve(TRAINING_DIR, `${safe}.md`);
  const relative = path.relative(TRAINING_DIR, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

export function fileUrlForSlug(slug) {
  return `/training/${slug}.md`;
}

async function writeAtomic(filePath, contents) {
  const dir = path.dirname(filePath);
  const tempPath = path.join(
    dir,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );
  await fs.writeFile(tempPath, contents, 'utf8');
  await fs.rename(tempPath, filePath);
}

export async function readResources() {
  const raw = await fs.readFile(RESOURCES_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('resources.json must be an array');
  }
  return data;
}

export async function writeResources(resources) {
  const payload = `${JSON.stringify(resources, null, 2)}\n`;
  await writeAtomic(RESOURCES_PATH, payload);
}

export async function readMarkdown(slug) {
  const filePath = resolveMarkdownPath(slug);
  if (!filePath) {
    const err = new Error('Invalid slug');
    err.status = 400;
    throw err;
  }
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      const err = new Error('Document file not found');
      err.status = 404;
      throw err;
    }
    throw error;
  }
}

export async function writeMarkdown(slug, markdown) {
  const filePath = resolveMarkdownPath(slug);
  if (!filePath) {
    const err = new Error('Invalid slug');
    err.status = 400;
    throw err;
  }
  await writeAtomic(filePath, typeof markdown === 'string' ? markdown : '');
}

export async function deleteMarkdown(slug) {
  const filePath = resolveMarkdownPath(slug);
  if (!filePath) {
    const err = new Error('Invalid slug');
    err.status = 400;
    throw err;
  }
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function toPublicResource(entry) {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    file: entry.file,
    preview: Boolean(entry.preview),
    download: Boolean(entry.download),
  };
}

export function buildResourceEntry({
  slug,
  title,
  description = '',
  preview = true,
  download = true,
  id,
}) {
  return {
    id: id || slug,
    slug,
    title,
    description,
    file: fileUrlForSlug(slug),
    preview: Boolean(preview),
    download: Boolean(download),
  };
}
