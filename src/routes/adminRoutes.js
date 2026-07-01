import express from 'express';
import { subirQrOficial, obtenerQrOficial } from '../controllers/adminController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/admin/qr - Obtener la URL del QR de pago oficial (Público)
router.get('/qr', obtenerQrOficial);

// POST /api/admin/qr - Actualizar el QR de pago (Solo Admin)
router.post('/qr', verificarAdmin, upload.single('qr'), subirQrOficial);

export default router;
