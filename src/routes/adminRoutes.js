import express from 'express';
import { subirQrOficial, obtenerQrOficial, crearCategoria } from '../controllers/adminController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/admin/qr - Obtener la URL del QR de pago oficial (Público)
router.get('/qr', obtenerQrOficial);

// POST /api/admin/qr - Actualizar el QR de pago (Solo Admin)
router.post('/qr', verificarAdmin, upload.single('qr'), subirQrOficial);

// POST /api/admin/categorias - Crear nueva categoría (Solo Admin)
router.post('/categorias', verificarAdmin, crearCategoria);

export default router;
