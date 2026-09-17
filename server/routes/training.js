import { Router } from 'express';
import { readResources, toPublicResource } from '../resources.js';

const router = Router();

router.get('/resources', async (_req, res) => {
  try {
    const resources = await readResources();
    res.json(resources.map(toPublicResource));
  } catch (error) {
    console.error('Failed to read training resources', error);
    res.status(500).json({ error: 'Failed to load training resources' });
  }
});

export default router;
