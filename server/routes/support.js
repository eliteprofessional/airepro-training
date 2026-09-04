import { Router } from 'express';
import { readResources, toPublicResource } from '../resources.js';

const router = Router();

router.get('/resources', async (_req, res) => {
  try {
    const resources = await readResources();
    res.json(resources.map(toPublicResource));
  } catch (error) {
    console.error('Failed to read support resources', error);
    res.status(500).json({ error: 'Failed to load support resources' });
  }
});

export default router;
