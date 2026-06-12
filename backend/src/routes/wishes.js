import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Add a wish/candle to a cake
router.post('/', async (req, res) => {
  const { cakeId, guestName, message, candleColor, emoji } = req.body;
  
  if (!cakeId || !message) {
    return res.status(400).json({ error: 'Cake ID and Message are required parameters' });
  }

  try {
    // Enforce tier limit: check if candle count has exceeded 25 on free tier
    const count = await prisma.wish.count({ where: { cakeId } });
    if (count >= 25) {
      return res.status(403).json({ error: 'Candle limit of 25 has been reached for this cake!' });
    }

    const wish = await prisma.wish.create({
      data: {
        cakeId,
        guestName: guestName || 'Anonymous',
        message,
        candleColor: candleColor || '#FFD700',
        emoji: emoji || '🕯️'
      }
    });
    
    res.status(201).json(wish);
  } catch (err) {
    console.error('Prisma wish creation error:', err);
    res.status(500).json({ error: 'Failed to record wish in database' });
  }
});

export default router;
