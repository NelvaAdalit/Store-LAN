import jwt from 'jsonwebtoken';

export const verificarAdmin = (req, res, next) => {
    // Intentamos obtener el token desde la cookie de admin, o del header Authorization
    const token = req.cookies?.tokenStoreLan || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) return res.status(403).json({ error: "Acceso denegado: Inicia sesión como administrador." });

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificamos que el rol sea 'admin'
        if (decodificado.rol !== 'admin') {
            return res.status(403).json({ error: "Acceso denegado: No tienes permisos de administrador" });
        }
        
        req.usuario = decodificado; // Guardamos info del usuario para usarla después
        next(); // ¡Todo bien! Pasamos a la siguiente función
    } catch (err) {
        res.status(401).json({ error: "Token de administrador inválido o expirado" });
    }
};

export const verificarCliente = (req, res, next) => {
    // Intentamos obtener el token desde la cookie de cliente, o del header Authorization
    const token = req.cookies?.tokenCliente || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) return res.status(403).json({ error: "Acceso denegado: Se requiere cuenta de cliente" });

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificamos que el rol sea 'cliente'
        if (decodificado.rol !== 'cliente') {
            return res.status(403).json({ error: "Acceso denegado: Se requiere cuenta de cliente" });
        }
        
        req.cliente = decodificado; // Guardamos info del cliente
        next();
    } catch (err) {
        res.status(401).json({ error: "Token de cliente inválido o expirado" });
    }
};