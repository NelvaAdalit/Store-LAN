import { supabase } from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Buscar usuario en Supabase
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !usuario) return res.status(401).json({ error: "Usuario no encontrado" });

    // 2. Verificar contraseña cifrada
    const esValida = await bcrypt.compare(password, usuario.password);
    if (!esValida) return res.status(401).json({ error: "Contraseña incorrecta" });

    // 3. Crear el Token JWT
    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: "Login exitoso", token });
};