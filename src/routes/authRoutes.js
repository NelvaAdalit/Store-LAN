import express from 'express';
import { login, registrarCliente, loginCliente, logout } from '../controllers/authController.js';

const router = express.Router();

// Rutas de administración (usuarios admin)
router.post('/login', login);
router.post('/logout', logout);

// Rutas de clientes (tabla clientes)
router.post('/cliente/register', registrarCliente);
router.post('/cliente/login', loginCliente);

export default router;