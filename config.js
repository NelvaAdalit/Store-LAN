const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://store-lan.onrender.com/api' // URL de producción en Render
};

// Interceptor global de peticiones (JWT Lifecycle con soporte para Cookies)
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
    const options = init || {};
    options.credentials = 'include'; // Asegura el envío de cookies HttpOnly en peticiones CORS

    try {
        const response = await originalFetch(input, options);
        
        // Si el backend responde 401 (No autorizado) o 403 (Prohibido)
        if (response.status === 401 || response.status === 403) {
            const sesionActiva = localStorage.getItem('sesionClienteActiva') || localStorage.getItem('tokenCliente');
            if (sesionActiva) {
                // Purgamos sesión local de cliente
                localStorage.removeItem('tokenCliente');
                localStorage.removeItem('nombreCliente');
                localStorage.removeItem('sesionClienteActiva');
                alert("Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.");
                window.location.reload();
            }
        }
        return response;
    } catch (error) {
        // Propagar el error de conexión
        throw error;
    }
};
