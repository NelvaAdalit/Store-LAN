import { supabase } from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "El correo y la contraseña son requeridos" });
        }

        // 1. Buscar usuario en Supabase
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error("Error al consultar la tabla usuarios:", error);
            return res.status(500).json({ error: "Error en el servidor al intentar autenticar" });
        }

        if (!usuario) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        // 2. Verificar contraseña cifrada
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        // 3. Crear el Token JWT
        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.json({ message: "Login exitoso", token });
    } catch (err) {
        console.error("Excepción en el proceso de login:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};