const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://store-lan-api.onrender.com/api' // Remplaza con tu URL de producción final
};

// Interceptor global de peticiones (JWT Lifecycle)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);
        
        // Si el backend responde 401 (No autorizado) o 403 (Prohibido)
        if (response.status === 401 || response.status === 403) {
            const tokenCliente = localStorage.getItem('tokenCliente');
            if (tokenCliente) {
                // Purgamos sesión local de cliente
                localStorage.removeItem('tokenCliente');
                localStorage.removeItem('nombreCliente');
                alert("Tu sesión ha expirado o es inválida. Por favor, inicia sesión nuevamente.");
                window.location.reload();
            }
        }
        return response;
    } catch (error) {
        // Propagar el error de conexión para que los formularios muestren 'Error de conexión'
        throw error;
    }
};
