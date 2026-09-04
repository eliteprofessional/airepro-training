import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  clearAuthCookie,
  issueToken,
  requireAdmin,
  setAuthCookie,
} from '../auth.js';
import {
  buildResourceEntry,
  deleteMarkdown,
  readMarkdown,
  readResources,
  sanitizeSlug,
  toPublicResource,
  writeMarkdown,
  writeResources,
} from '../resources.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const password = req.body?.password;
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: 'Admin password is not configured' });
  }

  if (typeof password !== 'string' || password !== expected) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const token = issueToken();
    setAuthCookie(res, token);
    return res.json({ token, expiresIn: '12h' });
  } catch (error) {
    console.error('Failed to issue admin token', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.use(requireAdmin);

router.get('/documents', async (_req, res) => {
  try {
    const resources = await readResources();
    res.json(resources.map(toPublicResource));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

router.get('/documents/:slug', async (req, res) => {
  try {
    const slug = sanitizeSlug(req.params.slug);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const resources = await readResources();
    const entry = resources.find((item) => item.slug === slug);
    if (!entry) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const markdown = await readMarkdown(slug);
    return res.json({ ...toPublicResource(entry), markdown });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to load document' });
  }
});

router.post('/documents', async (req, res) => {
  try {
    const slug = sanitizeSlug(req.body?.slug);
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const markdown = typeof req.body?.markdown === 'string' ? req.body.markdown : '';
    const preview = req.body?.preview !== false;
    const download = req.body?.download !== false;

    if (!slug) {
      return res.status(400).json({ error: 'Slug must match [a-z0-9-]+' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const resources = await readResources();
    if (resources.some((item) => item.slug === slug)) {
      return res.status(409).json({ error: 'A document with this slug already exists' });
    }

    const entry = buildResourceEntry({
      slug,
      title,
      description,
      preview,
      download,
    });

    await writeMarkdown(slug, markdown);
    resources.push(entry);
    await writeResources(resources);

    return res.status(201).json({ ...toPublicResource(entry), markdown });
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to create document' });
  }
});

router.put('/documents/:slug', async (req, res) => {
  try {
    const currentSlug = sanitizeSlug(req.params.slug);
    if (!currentSlug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const resources = await readResources();
    const index = resources.findIndex((item) => item.slug === currentSlug);
    if (index === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const existing = resources[index];
    const nextSlugRaw = req.body?.slug;
    const nextSlug =
      nextSlugRaw === undefined || nextSlugRaw === null || nextSlugRaw === ''
        ? currentSlug
        : sanitizeSlug(nextSlugRaw);

    if (!nextSlug) {
      return res.status(400).json({ error: 'Slug must match [a-z0-9-]+' });
    }

    if (nextSlug !== currentSlug && resources.some((item) => item.slug === nextSlug)) {
      return res.status(409).json({ error: 'A document with this slug already exists' });
    }

    const title =
      typeof req.body?.title === 'string' ? req.body.title.trim() : existing.title;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const description =
      typeof req.body?.description === 'string'
        ? req.body.description.trim()
        : existing.description;

    const preview =
      req.body?.preview === undefined ? existing.preview : Boolean(req.body.preview);
    const download =
      req.body?.download === undefined ? existing.download : Boolean(req.body.download);

    let markdown;
    if (typeof req.body?.markdown === 'string') {
      markdown = req.body.markdown;
    } else {
      markdown = await readMarkdown(currentSlug);
    }

    if (nextSlug !== currentSlug) {
      await writeMarkdown(nextSlug, markdown);
      await deleteMarkdown(currentSlug);
    } else {
      await writeMarkdown(currentSlug, markdown);
    }

    const updated = buildResourceEntry({
      id: existing.id === currentSlug ? nextSlug : existing.id,
      slug: nextSlug,
      title,
      description,
      preview,
      download,
    });

    resources[index] = updated;
    await writeResources(resources);

    return res.json({ ...toPublicResource(updated), markdown });
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to update document' });
  }
});

router.delete('/documents/:slug', async (req, res) => {
  try {
    const slug = sanitizeSlug(req.params.slug);
    if (!slug) {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    const resources = await readResources();
    const next = resources.filter((item) => item.slug !== slug);
    if (next.length === resources.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await deleteMarkdown(slug);
    await writeResources(next);
    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'Failed to delete document' });
  }
});

export default router;
