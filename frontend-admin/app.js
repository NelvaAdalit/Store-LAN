document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensaje = document.getElementById('mensaje');

    mensaje.style.color = 'white';
    mensaje.innerText = 'Conectando...';

    try {
        // Hacemos la petición POST a tu servidor utilizando la URL dinámica
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // ¡ÉXITO! Guardamos el token en la memoria del navegador
            localStorage.setItem('tokenStoreLan', data.token);
            
            mensaje.style.color = '#00ff88'; // Verde brillante
            mensaje.innerText = '¡Acceso concedido! Entrando...';
            
            // REDIRECCIÓN ACTIVADA: Te lleva al panel principal
            window.location.href = 'dashboard.html';
        } else {
            // ERROR (Contraseña incorrecta, etc.)
            mensaje.style.color = '#ff4d4d'; // Rojo
            mensaje.innerText = data.error || 'Error al iniciar sesión';
        }
    } catch (error) {
        mensaje.style.color = '#ff4d4d';
        mensaje.innerText = 'Error: Verifica que el servidor (Node) esté encendido.';
    }
});