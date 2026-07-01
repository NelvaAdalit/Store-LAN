import { supabase } from '../config/supabaseClient.js';
import { optimizarImagen } from '../middleware/uploadMiddleware.js';

/**
 * Crea una nueva orden de compra con estado 'Pendiente'.
 */
export const crearOrden = async (req, res) => {
    try {
        const { total, detalles } = req.body;
        const id_cliente = req.cliente ? req.cliente.id : null; // Vincula la orden al cliente autenticado

        if (!total) {
            return res.status(400).json({ error: "El total de la orden es requerido." });
        }

        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ error: "Los detalles de la compra son requeridos para procesar el pedido." });
        }

        // Llamar a la función transaccional en la DB (Supabase RPC)
        const { data: ordenId, error } = await supabase.rpc('crear_orden_transaccional', {
            p_id_cliente: id_cliente,
            p_total: parseFloat(total),
            p_detalles: detalles
        });

        if (error) {
            console.error("Error transaccional al crear orden:", error);
            return res.status(400).json({ error: error.message || "Error al procesar la compra. Verifica el stock disponible." });
        }

        // Recuperamos los datos de la orden recién creada
        const { data: nuevaOrden, error: getError } = await supabase
            .from('ordenes')
            .select('*')
            .eq('id', ordenId)
            .single();

        if (getError) {
            console.error("Error al recuperar orden creada:", getError);
            return res.status(500).json({ error: "Error al recuperar los detalles de la orden." });
        }

        return res.status(201).json({
            message: "Orden creada con éxito (Pendiente de pago).",
            orden: nuevaOrden
        });
    } catch (error) {
        console.error("Excepción en crearOrden:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Sube y asocia un comprobante de pago QR a una orden específica.
 */
export const subirComprobantePago = async (req, res) => {
    try {
        const { id } = req.params; // ID de la orden

        if (!req.file) {
            return res.status(400).json({ error: "La captura de pantalla del comprobante es requerida." });
        }

        // 1. Optimizar la imagen a WebP
        const webpBuffer = await optimizarImagen(req.file.buffer);

        // 2. Generar nombre de archivo único
        const nombreArchivo = `${Date.now()}-orden-${id}.webp`;

        // 3. Subir archivo a Supabase Storage (bucket 'comprobantes')
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('comprobantes')
            .upload(nombreArchivo, webpBuffer, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Error al subir el comprobante a Storage:", uploadError);
            return res.status(500).json({ error: "Error al guardar el comprobante en Supabase Storage." });
        }

        // 4. Obtener URL pública del comprobante
        const { data: urlData } = supabase.storage
            .from('comprobantes')
            .getPublicUrl(nombreArchivo);

        const comprobanteUrl = urlData.publicUrl;

        // 5. Actualizar la orden en la BD con la URL del comprobante
        const { data: ordenActualizada, error: dbError } = await supabase
            .from('ordenes')
            .update({ comprobante_url: comprobanteUrl })
            .eq('id', parseInt(id))
            .select('*')
            .single();

        if (dbError) {
            console.error("Error al asociar comprobante en la orden:", dbError);
            return res.status(500).json({ error: "Error al registrar el comprobante en la base de datos." });
        }

        // 6. Opcional: Registrar en tabla 'pagos' si existe
        try {
            await supabase.from('pagos').insert({
                id_orden: parseInt(id),
                comprobante_url: comprobanteUrl,
                estado: 'pendiente'
            });
        } catch (pagoErr) {
            console.log("Nota: No se pudo registrar en la tabla pagos (puede que no exista todavía).");
        }

        return res.status(200).json({
            message: "Comprobante de pago cargado exitosamente.",
            orden: ordenActualizada
        });
    } catch (error) {
        console.error("Excepción en subirComprobantePago:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Obtiene todas las órdenes (Solo Admin).
 */
export const obtenerOrdenes = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ordenes')
            .select('*, clientes(nombre, email, telefono)')
            .order('creado_en', { ascending: false });

        if (error) {
            console.error("Error al consultar órdenes:", error);
            return res.status(500).json({ error: "Error al consultar las órdenes en la base de datos." });
        }

        return res.json(data);
    } catch (error) {
        console.error("Excepción en obtenerOrdenes:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Actualiza el estado de una orden (Aprobar/Cancelar) (Solo Admin).
 */
export const actualizarEstadoOrden = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'Aprobado', 'Cancelado', etc.

        if (!estado) {
            return res.status(400).json({ error: "El estado de la orden es requerido." });
        }

        // Actualizar en base de datos
        const { data, error } = await supabase
            .from('ordenes')
            .update({ estado })
            .eq('id', parseInt(id))
            .select('*')
            .single();

        if (error) {
            console.error("Error al actualizar estado de la orden:", error);
            return res.status(500).json({ error: "Error al intentar actualizar la orden en la BD." });
        }

        // Si se aprobó el pago, también intentamos actualizar la tabla pagos si existe
        try {
            await supabase
                .from('pagos')
                .update({ estado: estado.toLowerCase() })
                .eq('id_orden', parseInt(id));
        } catch (pagoErr) {
            // Ignoramos si no existe
        }

        return res.json({
            message: "Estado de orden actualizado exitosamente.",
            orden: data
        });
    } catch (error) {
        console.error("Excepción en actualizarEstadoOrden:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Obtiene el historial de órdenes del cliente autenticado.
 */
export const obtenerMisOrdenes = async (req, res) => {
    try {
        const id_cliente = req.cliente.id;

        const { data, error } = await supabase
            .from('ordenes')
            .select('*')
            .eq('id_cliente', id_cliente)
            .order('creado_en', { ascending: false });

        if (error) {
            console.error("Error al obtener mis órdenes:", error);
            return res.status(500).json({ error: "Error al consultar tu historial de órdenes." });
        }

        return res.json(data);
    } catch (error) {
        console.error("Excepción en obtenerMisOrdenes:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};
