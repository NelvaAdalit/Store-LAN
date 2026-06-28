import { supabase } from '../config/supabaseClient.js';

export const obtenerProductos = async (req, res) => {
    try {
        // Consultamos la tabla productos en Supabase
        const { data, error } = await supabase
            .from('productos')
            .select('*, categorias(nombre)'); // Traemos el producto y el nombre de su categoría

        if (error) return res.status(400).json({ error: error.message });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
};