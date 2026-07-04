import express from 'express';
import { crearOrden, subirComprobantePago, obtenerOrdenes, actualizarEstadoOrden, obtenerMisOrdenes, marcarComprobanteWhatsApp } from '../controllers/ordenController.js';
import { verificarAdmin, verificarCliente } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// GET /api/ordenes/mis-ordenes - Obtener historial de órdenes del cliente autenticado
router.get('/mis-ordenes', verificarCliente, obtenerMisOrdenes);

// POST /api/ordenes - Registrar una nueva orden de compra (Requiere Cliente)
router.post('/', verificarCliente, crearOrden);

// POST /api/ordenes/:id/comprobante - Subir la captura de pantalla QR del pago (Requiere Cliente)
router.post('/:id/comprobante', verificarCliente, upload.single('comprobante'), subirComprobantePago);

// POST /api/ordenes/:id/comprobante-whatsapp - Marcar que se envió el comprobante por WhatsApp (Requiere Cliente)
router.post('/:id/comprobante-whatsapp', verificarCliente, marcarComprobanteWhatsApp);

// GET /api/ordenes - Obtener todas las órdenes (Solo Admin)
router.get('/', verificarAdmin, obtenerOrdenes);

// PUT /api/ordenes/:id - Actualizar estado de orden (Aprobar/Cancelar) (Solo Admin)
router.put('/:id', verificarAdmin, actualizarEstadoOrden);

export default router;
