const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://store-lan.onrender.com/api' // URL de producción en Render
};

// Interceptor global de peticiones (JWT Lifecycle para Administrador con Cookies)
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
    const options = init || {};
    options.credentials = 'include'; // Asegura el envío de cookies HttpOnly en peticiones CORS

    try {
        const response = await originalFetch(input, options);
        
        // Si el backend responde 401 (No autorizado) o 403 (Prohibido)
        if (response.status === 401 || response.status === 403) {
            const sesionActiva = localStorage.getItem('sesionAdminActiva') || localStorage.getItem('tokenStoreLan');
            if (sesionActiva) {
                // Purgamos sesión local de administrador
                localStorage.removeItem('tokenStoreLan');
                localStorage.removeItem('sesionAdminActiva');
                alert("Tu sesión de administrador ha expirado o es inválida. Iniciando sesión de nuevo.");
                window.location.href = 'index.html';
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
};
