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

export const register = async (req, res) => {
    try {
        const { email, password, rol } = req.body;

        // 1. Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({ error: "El correo y la contraseña son requeridos" });
        }

        // Validar formato del correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El formato del correo electrónico no es válido" });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }

        // Validar y sanear rol (por defecto 'cliente')
        let rolFinal = 'cliente';
        if (rol) {
            if (rol !== 'cliente' && rol !== 'admin') {
                return res.status(400).json({ error: "El rol especificado no es válido (debe ser 'cliente' o 'admin')" });
            }
            rolFinal = rol;
        }

        // 2. Verificar si el usuario ya existe
        const { data: usuarioExistente, error: errorBusqueda } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (errorBusqueda) {
            console.error("Error al verificar duplicados en registro:", errorBusqueda);
            return res.status(500).json({ error: "Error en el servidor al verificar el correo" });
        }

        if (usuarioExistente) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado" });
        }

        // 3. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Crear el usuario en Supabase
        const { data: nuevoUsuario, error: errorInsercion } = await supabase
            .from('usuarios')
            .insert({
                email,
                password: passwordHash,
                rol: rolFinal
            })
            .select('id, email, rol')
            .single();

        if (errorInsercion) {
            console.error("Error al insertar nuevo usuario:", errorInsercion);
            return res.status(500).json({ error: "Error en el servidor al guardar el usuario" });
        }

        return res.status(201).json({
            message: "Usuario registrado con éxito",
            usuario: nuevoUsuario
        });
    } catch (err) {
        console.error("Excepción en el proceso de registro:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};