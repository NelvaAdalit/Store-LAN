import express from 'express';
import { login, registrarCliente, loginCliente } from '../controllers/authController.js';

const router = express.Router();

// Rutas de administración (usuarios admin)
router.post('/login', login);

// Rutas de clientes (tabla clientes)
router.post('/cliente/register', registrarCliente);
router.post('/cliente/login', loginCliente);

export default router;