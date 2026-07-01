const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001/api'
        : 'https://store-lan.onrender.com/api' // URL de producción en Render
};

// Interceptor global de peticiones (JWT Lifecycle para Administrador)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    try {
        const response = await originalFetch(...args);
        
        // Si el backend responde 401 (No autorizado) o 403 (Prohibido)
        if (response.status === 401 || response.status === 403) {
            const tokenAdmin = localStorage.getItem('tokenStoreLan');
            if (tokenAdmin) {
                // Purgamos sesión local de administrador
                localStorage.removeItem('tokenStoreLan');
                alert("Tu sesión de administrador ha expirado o es inválida. Iniciando sesión de nuevo.");
                window.location.href = 'index.html';
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
};
