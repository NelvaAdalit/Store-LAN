document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita la recarga de página al enviar el formulario

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const mensaje = document.getElementById('mensaje');

    // 1. Validaciones del lado del cliente
    if (password !== confirmPassword) {
        mensaje.style.color = '#ff4d4d'; // Rojo para error
        mensaje.innerText = 'Las contraseñas no coinciden.';
        return;
    }

    if (password.length < 6) {
        mensaje.style.color = '#ff4d4d';
        mensaje.innerText = 'La contraseña debe tener al menos 6 caracteres.';
        return;
    }

    mensaje.style.color = 'white';
    mensaje.innerText = 'Registrando usuario...';

    try {
        // 2. Envío de datos al servidor local
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            mensaje.style.color = '#00ff88'; // Verde brillante
            mensaje.innerText = '¡Registro exitoso! Redirigiendo al login...';
            
            // Espera 2 segundos y redirige al login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            // Muestra error devuelto por la API (ej. correo duplicado)
            mensaje.style.color = '#ff4d4d';
            mensaje.innerText = data.error || 'Error al registrar el usuario.';
        }
    } catch (error) {
        mensaje.style.color = '#ff4d4d';
        mensaje.innerText = 'Error: No se pudo conectar al servidor. Verifica que esté encendido.';
    }
});
