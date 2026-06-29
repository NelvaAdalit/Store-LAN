// 1. Verificación de Seguridad Inmediata
const token = localStorage.getItem('tokenStoreLan');

if (!token) {
    // Si no hay token, expulsamos al usuario al login
    window.location.href = 'index.html';
}

// 2. Lógica para Cerrar Sesión
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('tokenStoreLan'); // Borramos la llave
    window.location.href = 'index.html'; // Lo mandamos al login
});

// En el próximo paso agregaremos aquí la función:
// async function cargarProductos() { ... }