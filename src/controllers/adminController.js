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
        const bucketName = 'ropa';

        // 2. Subir con upsert: true para reemplazar el anterior
        let { error } = await supabase.storage
            .from(bucketName)
            .upload(nombreArchivo, webpBuffer, {
                contentType: 'image/webp',
                cacheControl: '0', // Evita almacenamiento en caché para refrescar cambios
                upsert: true
            });

        // Si el bucket no se encuentra, intentamos crearlo de forma automática
        if (error && (error.message === 'Bucket not found' || error.error === 'Bucket not found' || (error.statusCode === '404' && error.message.toLowerCase().includes('not found')))) {
            console.log(`El bucket '${bucketName}' no existe. Intentando crearlo de forma automática...`);
            const { error: createError } = await supabase.storage.createBucket(bucketName, { public: true });
            
            if (!createError) {
                console.log(`Bucket '${bucketName}' creado con éxito. Reintentando subida...`);
                const retry = await supabase.storage
                    .from(bucketName)
                    .upload(nombreArchivo, webpBuffer, {
                        contentType: 'image/webp',
                        cacheControl: '0',
                        upsert: true
                    });
                error = retry.error;
            } else {
                console.error(`No se pudo crear el bucket '${bucketName}':`, createError);
                error = new Error(`El bucket '${bucketName}' no existe en tu proyecto de Supabase. Créalo desde el panel de Supabase con acceso público.`);
            }
        }

        if (error) {
            console.error("Error al subir QR oficial a Supabase Storage:", error);
            return res.status(500).json({ error: `Error al guardar el QR oficial en Supabase Storage: ${error.message || JSON.stringify(error)}` });
        }

        // 3. Obtener URL pública
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(nombreArchivo);

        return res.json({
            message: "Código QR oficial actualizado con éxito.",
            qr_url: publicUrlData.publicUrl
        });
    } catch (error) {
        console.error("Excepción en subirQrOficial:", error);
        return res.status(500).json({ error: `Error interno del servidor: ${error.message}` });
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

/**
 * Crea una nueva categoría de productos.
 */
export const crearCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ error: "El nombre de la categoría es requerido." });
        }

        const { data, error } = await supabase
            .from('categorias')
            .insert({ nombre: nombre.trim() })
            .select('*')
            .single();

        if (error) {
            console.error("Error al crear categoría en Supabase:", error);
            return res.status(500).json({ error: "Error al guardar la categoría en la base de datos." });
        }

        return res.status(201).json({
            message: "Categoría creada con éxito.",
            categoria: data
        });
    } catch (error) {
        console.error("Excepción en crearCategoria:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};

/**
 * Obtiene la lista completa de clientes registrados, calculando compras y estadísticas (Solo Admin).
 */
export const obtenerClientesAdmin = async (req, res) => {
    try {
        // Obtenemos clientes junto con sus ordenes
        const { data: clientes, error } = await supabase
            .from('clientes')
            .select('id, nombre, email, telefono, created_at, ordenes(total, estado)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error al obtener clientes desde adminController:", error);
            return res.status(500).json({ error: "Error al cargar la lista de clientes registrados." });
        }

        // Mapear clientes para compilar sus estadísticas
        const clientesConStats = clientes.map(c => {
            const totalOrdenes = c.ordenes ? c.ordenes.length : 0;
            const totalGastado = c.ordenes
                ? c.ordenes
                    .filter(o => o.estado === 'Aprobado')
                    .reduce((sum, o) => sum + Number(o.total || 0), 0)
                : 0;

            return {
                id: c.id,
                nombre: c.nombre,
                email: c.email,
                telefono: c.telefono,
                creado_en: c.created_at,
                totalOrdenes,
                totalGastado
            };
        });

        return res.json(clientesConStats);
    } catch (error) {
        console.error("Excepción en obtenerClientesAdmin:", error);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
};
