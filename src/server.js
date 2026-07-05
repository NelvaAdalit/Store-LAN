import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { supabase } from './config/supabaseClient.js';
import productoRoutes from './routes/productoRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactoRoutes from './routes/contactoRoutes.js';
import ordenRoutes from './routes/ordenRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

const originsPermitidos = [
    'https://store-lan.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (originsPermitidos.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS por política de seguridad'));
        }
    },
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use('/api/productos', productoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contacto', contactoRoutes);
app.use('/api/ordenes', ordenRoutes);
app.use('/api/admin', adminRoutes);

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