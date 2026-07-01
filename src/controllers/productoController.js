import { supabase } from '../config/supabaseClient.js';
import { optimizarImagen } from '../middleware/uploadMiddleware.js';

// Función auxiliar robusta para subir archivos al Storage de Supabase
const subirImagenSupabase = async (bucketName, nombreArchivo, buffer, isPublic = true) => {
    let { data, error } = await supabase.storage
        .from(bucketName)
        .upload(nombreArchivo, buffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: true
        });

    // Si el bucket no se encuentra, intentamos crearlo
    if (error && (error.message === 'Bucket not found' || error.error === 'Bucket not found' || (error.statusCode === '404' && error.message.toLowerCase().includes('not found')))) {
        console.log(`El bucket '${bucketName}' no existe. Intentando crearlo de forma automática...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, { public: isPublic });
        
        if (!createError) {
            console.log(`Bucket '${bucketName}' creado con éxito. Reintentando subida...`);
            const retry = await supabase.storage
                .from(bucketName)
                .upload(nombreArchivo, buffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: true
                });
            data = retry.data;
            error = retry.error;
        } else {
            console.error(`No se pudo crear el bucket '${bucketName}':`, createError);
            error = new Error(`El bucket '${bucketName}' no existe en tu proyecto de Supabase. Por favor, créalo desde la pestaña Storage del panel de Supabase con acceso público.`);
        }
    }

    return { data, error };
};

export const obtenerProductos = async (req, res) => {
    try {
        const { search, categoria, precio_min, precio_max, orden, page, limit } = req.query;

        // Iniciamos la consulta base filtering only active products (Soft Delete)
        let query = supabase
            .from('productos')
            .select('*, categorias(nombre), imagenes(url)')
            .eq('estado_activo', true);

        // 1. Filtrar por término de búsqueda (en nombre o descripción)
        if (search) {
            query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`);
        }

        // 2. Filtrar por id_categoria
        if (categoria) {
            query = query.eq('id_categoria', parseInt(categoria));
        }

        // 3. Filtrar por rango de precios
        if (precio_min) {
            query = query.gte('precio', parseFloat(precio_min));
        }
        if (precio_max) {
            query = query.lte('precio', parseFloat(precio_max));
        }

        // 4. Ordenar resultados
        if (orden) {
            if (orden === 'precio_asc') {
                query = query.order('precio', { ascending: true });
            } else if (orden === 'precio_desc') {
                query = query.order('precio', { ascending: false });
            } else if (orden === 'nombre_asc') {
                query = query.order('nombre', { ascending: true });
            } else if (orden === 'nombre_desc') {
                query = query.order('nombre', { ascending: false });
            }
        } else {
            // Orden predeterminado por ID
            query = query.order('id', { ascending: true });
        }

        // 5. Paginación y límite de registros para evitar saturación de memoria
        const p = parseInt(page) || 1;
        const l = parseInt(limit) || 20; // Límite por defecto: 20
        const from = (p - 1) * l;
        const to = from + l - 1;
        query = query.range(from, to);

        const { data, error } = await query;

        if (error) {
            console.error("Error al consultar productos filtrados:", error);
            return res.status(400).json({ error: error.message });
        }
        
        res.json(data);
    } catch (error) {
        console.error("Excepción en obtenerProductos:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, id_categoria } = req.body;

        if (!nombre || !precio || !id_categoria) {
            return res.status(400).json({ error: "Nombre, precio e id_categoria son requeridos" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "La imagen del producto es requerida" });
        }

        // 1. Optimizar la imagen a WebP con Sharp
        const webpBuffer = await optimizarImagen(req.file.buffer);

        // 2. Generar un nombre único para el archivo
        const nombreArchivo = `${Date.now()}-${nombre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.webp`;

        // 3. Subir la imagen optimizada a Supabase Storage (bucket público: 'ropa')
        const { error: uploadError } = await subirImagenSupabase('ropa', nombreArchivo, webpBuffer, true);

        if (uploadError) {
            console.error("Error subiendo la foto a Supabase Storage:", uploadError);
            return res.status(500).json({ error: uploadError.message || "Error al subir la imagen al almacén de Supabase" });
        }

        // 4. Obtener la URL pública de la imagen
        const { data: publicUrlData } = supabase.storage
            .from('ropa')
            .getPublicUrl(nombreArchivo);

        const imagenUrl = publicUrlData.publicUrl;

        // 5. Guardar el producto en la base de datos
        const { data: nuevoProducto, error: dbError } = await supabase
            .from('productos')
            .insert({
                nombre,
                descripcion,
                precio: parseFloat(precio),
                id_categoria: parseInt(id_categoria)
            })
            .select('*')
            .single();

        if (dbError) {
            console.error("Error al registrar el producto en BD:", dbError);
            return res.status(500).json({ error: "Error en el servidor al registrar el producto" });
        }

        // 6. Guardar la relación de la imagen en la tabla 'imagenes'
        const { error: imgError } = await supabase
            .from('imagenes')
            .insert({
                id_producto: nuevoProducto.id,
                url: imagenUrl
            });

        if (imgError) {
            console.error("Error al registrar la imagen del producto en BD:", imgError);
        }

        res.status(201).json({
            message: "Producto creado exitosamente con imagen optimizada",
            producto: nuevoProducto
        });
    } catch (error) {
        console.error("Excepción en crearProducto:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, id_categoria } = req.body;

        let updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (precio) updateData.precio = parseFloat(precio);
        if (id_categoria) updateData.id_categoria = parseInt(id_categoria);

        let imagenUrl = null;

        // Si se carga una nueva imagen
        if (req.file) {
            // 1. Optimizar imagen a WebP con Sharp
            const webpBuffer = await optimizarImagen(req.file.buffer);

            // 2. Generar nombre de archivo único
            const nombreArchivo = `${Date.now()}-${nombre ? nombre.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'update'}.webp`;

            // 3. Subir a Supabase Storage (bucket público: 'ropa')
            const { error: uploadError } = await subirImagenSupabase('ropa', nombreArchivo, webpBuffer, true);

            if (uploadError) {
                console.error("Error al subir nueva imagen:", uploadError);
                return res.status(500).json({ error: uploadError.message || "Error al subir la nueva imagen" });
            }

            // 4. Obtener URL pública
            const { data: publicUrlData } = supabase.storage
                .from('ropa')
                .getPublicUrl(nombreArchivo);

            imagenUrl = publicUrlData.publicUrl;
        }

        // 5. Actualizar en la base de datos (tabla productos)
        const { data: productoActualizado, error: dbError } = await supabase
            .from('productos')
            .update(updateData)
            .eq('id', parseInt(id))
            .select('*')
            .single();

        if (dbError) {
            console.error("Error al actualizar producto en BD:", dbError);
            return res.status(500).json({ error: "Error al actualizar el producto en la base de datos" });
        }

        // 6. Si se cargó una nueva imagen, actualizar la tabla imagenes
        if (imagenUrl) {
            // Primero eliminamos las imágenes anteriores asociadas al producto
            await supabase
                .from('imagenes')
                .delete()
                .eq('id_producto', parseInt(id));

            // Insertamos la nueva relación de imagen
            const { error: imgError } = await supabase
                .from('imagenes')
                .insert({
                    id_producto: parseInt(id),
                    url: imagenUrl
                });

            if (imgError) {
                console.error("Error al registrar la nueva imagen del producto en BD:", imgError);
            }
        }

        res.json({
            message: "Producto actualizado exitosamente",
            producto: productoActualizado
        });
    } catch (error) {
        console.error("Excepción en actualizarProducto:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // Borrado lógico (Soft Delete) para conservar historial de ventas (detalle_orden)
        const { error: dbError } = await supabase
            .from('productos')
            .update({ 
                estado_activo: false,
                updated_at: new Date()
            })
            .eq('id', parseInt(id));

        if (dbError) {
            console.error("Error al borrar lógicamente producto de la BD:", dbError);
            return res.status(500).json({ error: "Error en el servidor al intentar eliminar el producto" });
        }

        res.json({ message: "Producto eliminado exitosamente (borrado lógico)" });
    } catch (error) {
        console.error("Excepción en eliminarProducto:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const obtenerVariantes = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto
        const { data, error } = await supabase
            .from('variantes')
            .select('*')
            .eq('id_producto', parseInt(id))
            .eq('estado_activo', true); // Solo variantes activas

        if (error) {
            console.error("Error al obtener variantes:", error);
            return res.status(500).json({ error: "Error al obtener las variantes" });
        }

        res.json(data);
    } catch (error) {
        console.error("Excepción en obtenerVariantes:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const crearVariante = async (req, res) => {
    try {
        const { id } = req.params; // ID del producto
        const { talla, color, stock } = req.body;

        if (!talla || !color || stock === undefined) {
            return res.status(400).json({ error: "Talla, color y stock son requeridos" });
        }

        const { data, error } = await supabase
            .from('variantes')
            .insert({
                id_producto: parseInt(id),
                talla,
                color,
                stock: parseInt(stock)
            })
            .select('*')
            .single();

        if (error) {
            console.error("Error al crear variante:", error);
            return res.status(500).json({ error: "Error al crear la variante" });
        }

        res.status(201).json({
            message: "Variante agregada con éxito",
            variante: data
        });
    } catch (error) {
        console.error("Excepción en crearVariante:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};

export const eliminarVariante = async (req, res) => {
    try {
        const { id } = req.params; // ID de la variante

        // Borrado lógico de variantes (Soft Delete)
        const { error } = await supabase
            .from('variantes')
            .update({ 
                estado_activo: false,
                updated_at: new Date()
            })
            .eq('id', parseInt(id));

        if (error) {
            console.error("Error al eliminar lógicamente variante:", error);
            return res.status(500).json({ error: "Error al eliminar la variante" });
        }

        res.json({ message: "Variante eliminada con éxito (borrado lógico)" });
    } catch (error) {
        console.error("Excepción en eliminarVariante:", error);
        res.status(500).json({ error: "Error interno en el servidor" });
    }
};