import { supabase } from '../config/supabaseClient.js';
import sharp from 'sharp';

/**
 * Sube y sobrescribe el código QR de pago oficial de la tienda.
 */
export const subirQrOficial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "El archivo de imagen del código QR es requerido." });
        }

        // 1. Optimizar imagen QR (500px es ideal para códigos QR)
        const webpBuffer = await sharp(req.file.buffer)
            .resize({ width: 500, withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

        const nombreArchivo = 'qr-oficial.webp';

        // 2. Subir con upsert: true para reemplazar el anterior
        const { error } = await supabase.storage
            .from('ropa')
            .upload(nombreArchivo, webpBuffer, {
                contentType: 'image/webp',
                cacheControl: '0', // Evita almacenamiento en caché para refrescar cambios
                upsert: true
            });

        if (error) {
            console.error("Error al subir QR oficial a Supabase Storage:", error);
            return res.status(500).json({ error: "Error al guardar el QR oficial en Supabase Storage." });
        }

        // 3. Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from('ropa')
            .getPublicUrl(nombreArchivo);

        return res.json({
            message: "Código QR oficial actualizado con éxito.",
            qr_url: publicUrlData.publicUrl
        });
    } catch (error) {
        console.error("Excepción en subirQrOficial:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Retorna la URL pública del QR oficial para que el cliente realice su pago.
 */
export const obtenerQrOficial = async (req, res) => {
    try {
        const nombreArchivo = 'qr-oficial.webp';
        
        const { data } = supabase.storage
            .from('ropa')
            .getPublicUrl(nombreArchivo);

        return res.json({ qr_url: data.publicUrl });
    } catch (error) {
        console.error("Excepción en obtenerQrOficial:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};
