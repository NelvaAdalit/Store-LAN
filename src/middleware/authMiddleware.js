import jwt from 'jsonwebtoken';

export const verificarAdmin = (req, res, next) => {
    // Obtenemos el token del encabezado "Authorization"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN"

    if (!token) return res.status(403).json({ error: "Acceso denegado: Token requerido" });

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificamos que el rol sea 'admin'
        if (decodificado.rol !== 'admin') {
            return res.status(403).json({ error: "Acceso denegado: No tienes permisos de administrador" });
        }
        
        req.usuario = decodificado; // Guardamos info del usuario para usarla después
        next(); // ¡Todo bien! Pasamos a la siguiente función
    } catch (err) {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
};

export const verificarCliente = (req, res, next) => {
    // Obtenemos el token del encabezado "Authorization"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato esperado: "Bearer TOKEN"

    if (!token) return res.status(403).json({ error: "Acceso denegado: Token requerido" });

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificamos que el rol sea 'cliente'
        if (decodificado.rol !== 'cliente') {
            return res.status(403).json({ error: "Acceso denegado: Se requiere cuenta de cliente" });
        }
        
        req.cliente = decodificado; // Guardamos info del cliente
        next();
    } catch (err) {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
};