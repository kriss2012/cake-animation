import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

// Create a cake
router.post('/', authMiddleware, async (req, res) => {
  const { recipientName, message, frostingColor, decorations, candleColor } = req.body;
  
  try {
    const cake = await prisma.cake.create({
      data: {
        ownerId: req.user.id,
        recipientName,
        message,
        frostingColor,
        decorations: decorations || {},
        candleColor: candleColor || '#FFD700',
      }
    });
    res.status(201).json(cake);
  } catch (err) {
    console.error('Prisma cake creation error:', err);
    res.status(500).json({ error: 'Failed to create cake record in database' });
  }
});

// Get a cake by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const cake = await prisma.cake.findUnique({
      where: { id: req.params.id },
      include: { 
        wishes: { 
          orderBy: { createdAt: 'asc' } 
        } 
      }
    });
    
    if (!cake) return res.status(404).json({ error: 'Cake not found' });
    
    // Increment view count
    await prisma.cake.update({ 
      where: { id: req.params.id }, 
      data: { viewCount: { increment: 1 } } 
    });
    
    res.json(cake);
  } catch (err) {
    console.error('Prisma cake retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve cake record' });
  }
});

// Get current user's cakes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cakes = await prisma.cake.findMany({
      where: { ownerId: req.user.id },
      include: { _count: { select: { wishes: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(cakes);
  } catch (err) {
    console.error('Prisma query error:', err);
    res.status(500).json({ error: 'Failed to load user cakes' });
  }
});

export default router;
