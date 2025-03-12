
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Security monitoring endpoint
router.post('/report', (req, res) => {
  const { type, key } = req.body;
  
  if (type === 'key_access_attempt') {
    logger.warn(`Security alert: Client-side attempted to access API key: ${key}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer
    });
  }
  
  // Don't provide information back to client
  res.status(204).end();
});

export default router;
