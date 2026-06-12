import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cakesRouter from './routes/cakes.js';
import wishesRouter from './routes/wishes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow CORS requests from development frontend port 5173 or customized production URL
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']
}));

app.use(express.json());

// API route groups
app.use('/api/cakes', cakesRouter);
app.use('/api/wishes', wishesRouter);

// Service health-check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Default root index
app.get('/', (req, res) => {
  res.send('🎂 BdayCake Clone backend service is operational.');
});

app.listen(PORT, () => {
  console.log(`[BdayCake Backend] Service listening on port ${PORT}`);
});
