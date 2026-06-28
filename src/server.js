import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabaseClient.js';
import productoRoutes from './routes/productoRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/productos', productoRoutes);

// Ruta de prueba para verificar que la DB está conectada
app.get('/api/test-db', async (req, res) => {
    const { data, error } = await supabase.from('categorias').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Conexión exitosa a Supabase", data });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});