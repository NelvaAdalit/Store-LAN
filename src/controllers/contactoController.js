import { supabase } from '../config/supabaseClient.js';

/**
 * Registra un mensaje de contacto de un cliente.
 */
export const registrarContacto = async (req, res) => {
    try {
        const { nombre, email, mensaje } = req.body;

        // 1. Validar campos requeridos
        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ error: "El nombre, correo y mensaje son requeridos." });
        }

        // Validar formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El formato del correo electrónico no es válido." });
        }

        // 2. Insertar mensaje en Supabase
        const { data, error } = await supabase
            .from('contactos')
            .insert({ nombre, email, mensaje })
            .select('*')
            .single();

        if (error) {
            console.error("Error al insertar mensaje de contacto:", error);
            return res.status(500).json({ error: "Error interno al intentar registrar tu mensaje." });
        }

        return res.status(201).json({
            message: "Mensaje recibido exitosamente.",
            contacto: data
        });
    } catch (error) {
        console.error("Excepción en registrarContacto:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Obtiene todos los mensajes de contacto (Solo Admin).
 */
export const obtenerContactos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contactos')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) {
            console.error("Error al consultar mensajes de contacto:", error);
            return res.status(500).json({ error: "Error al consultar los mensajes en la base de datos." });
        }

        return res.json(data);
    } catch (error) {
        console.error("Excepción en obtenerContactos:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};
