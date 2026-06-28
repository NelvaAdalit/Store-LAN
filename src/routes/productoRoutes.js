import express from 'express';
import { obtenerProductos } from '../controllers/productoController.js';
import { verificarAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Definimos la ruta: cuando alguien entre a /api/productos, llama a la función
router.get('/', obtenerProductos);

// Esta ruta requiere privilegios de administrador
router.post('/prueba-admin', verificarAdmin, (req, res) => {
    res.json({ message: "¡Bienvenida, Nelva! Tienes acceso como admin." });
});

export default router;