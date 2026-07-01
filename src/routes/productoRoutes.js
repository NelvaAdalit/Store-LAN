import express from 'express';
import { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    eliminarProducto,
    obtenerVariantes,
    crearVariante,
    eliminarVariante 
} from '../controllers/productoController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Rutas de catálogo
router.get('/', obtenerProductos);

// Crear producto con foto optimizada (Solo Admin)
router.post('/', verificarAdmin, upload.single('imagen'), crearProducto);

// Actualizar producto (Solo Admin)
router.put('/:id', verificarAdmin, upload.single('imagen'), actualizarProducto);

// Eliminar producto (Solo Admin)
router.delete('/:id', verificarAdmin, eliminarProducto);

// Gestión de variantes y stock por producto
router.get('/:id/variantes', obtenerVariantes);
router.post('/:id/variantes', verificarAdmin, crearVariante);
router.delete('/variantes/:id', verificarAdmin, eliminarVariante);

// Esta ruta requiere privilegios de administrador
router.post('/prueba-admin', verificarAdmin, (req, res) => {
    res.json({ message: "¡Bienvenida, Nelva! Tienes acceso como admin." });
});

export default router;