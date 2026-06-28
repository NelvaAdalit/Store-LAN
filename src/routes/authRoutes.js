import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// Esto le dice al servidor que cuando llegue un POST a /login, ejecute tu controlador
router.post('/login', login);

export default router;