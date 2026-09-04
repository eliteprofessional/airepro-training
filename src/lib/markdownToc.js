const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/gm;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function extractToc(markdown) {
  if (!markdown) return [];

  const items = [];
  const seen = new Map();
  let match;

  HEADING_RE.lastIndex = 0;
  while ((match = HEADING_RE.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].replace(/\*\*|__/g, '').trim();
    if (!title) continue;

    let id = slugify(title);
    const count = seen.get(id) || 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    items.push({ id, title, level });
  }

  return items;
}

export function estimateReadingMinutes(markdown) {
  const words = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`|_\[\]()-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
