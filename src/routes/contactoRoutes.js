import express from 'express';
import { registrarContacto, obtenerContactos } from '../controllers/contactoController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/contacto - Permite registrar un mensaje de contacto (público)
router.post('/', registrarContacto);

// GET /api/contacto - Obtener todos los mensajes (Solo Admin)
router.get('/', verificarAdmin, obtenerContactos);

export default router;
