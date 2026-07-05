import express from 'express';
import { login, registrarCliente, loginCliente, logout, obtenerPerfilCliente } from '../controllers/authController.js';
import { verificarCliente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de administración (usuarios admin)
router.post('/login', login);
router.post('/logout', logout);

// Rutas de clientes (tabla clientes)
router.post('/cliente/register', registrarCliente);
router.post('/cliente/login', loginCliente);
router.get('/cliente/perfil', verificarCliente, obtenerPerfilCliente);

export default router;