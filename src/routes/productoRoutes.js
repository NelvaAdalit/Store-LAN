import express from 'express';
import { obtenerProductos } from '../controllers/productoController.js';

const router = express.Router();

// Definimos la ruta: cuando alguien entre a /api/productos, llama a la función
router.get('/', obtenerProductos);

export default router;