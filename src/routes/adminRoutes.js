import express from 'express';
import { subirQrOficial, obtenerQrOficial, crearCategoria, obtenerClientesAdmin } from '../controllers/adminController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/admin/qr - Obtener la URL del QR de pago oficial (Público)
router.get('/qr', obtenerQrOficial);

// POST /api/admin/qr - Actualizar el QR de pago (Solo Admin)
router.post('/qr', verificarAdmin, upload.single('qr'), subirQrOficial);

// POST /api/admin/categorias - Crear nueva categoría (Solo Admin)
router.post('/categorias', verificarAdmin, crearCategoria);

// GET /api/admin/clientes - Obtener todos los clientes registrados (Solo Admin)
router.get('/clientes', verificarAdmin, obtenerClientesAdmin);

export default router;
