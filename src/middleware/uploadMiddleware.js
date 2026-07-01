import multer from 'multer';
import sharp from 'sharp';

// Configuración para almacenar los archivos en memoria como búfer
const storage = multer.memoryStorage();

// Middleware de multer para subida de archivo único
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Límite de 10 MB
    }
});

/**
 * Redimensiona y optimiza una imagen convirtiéndola a WebP.
 * @param {Buffer} fileBuffer - Búfer original de la imagen.
 * @returns {Promise<Buffer>} - Búfer de la imagen optimizada en formato WebP.
 */
export const optimizarImagen = async (fileBuffer) => {
    return await sharp(fileBuffer)
        .resize({ width: 800, withoutEnlargement: true }) // Máximo 800px de ancho
        .webp({ quality: 80 }) // Calidad 80% en formato WebP
        .toBuffer();
};
