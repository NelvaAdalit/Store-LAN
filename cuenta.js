const API_URL = CONFIG.API_URL;

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    inicializarPagina();
});

// 1. Verificar si hay sesión activa de cliente
function verificarSesion() {
    const sesionActiva = localStorage.getItem('sesionClienteActiva');
    const token = localStorage.getItem('tokenCliente');
    
    if (!sesionActiva) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = 'index.html';
        return;
    }
    
    // Si la sesión está activa pero falta el token (sesión vieja), forzamos re-login para guardarlo
    if (sesionActiva && !token) {
        alert("Por actualización de seguridad del sitio, por favor inicia sesión de nuevo.");
        localStorage.removeItem('tokenCliente');
        localStorage.removeItem('nombreCliente');
        localStorage.removeItem('sesionClienteActiva');
        window.location.href = 'index.html';
    }
}

// 2. Inicializar Datos de la Página
async function inicializarPagina() {
    actualizarBadgeCarrito();
    await cargarPerfilCliente();
    await cargarHistorialPedidos();
    
    // Configurar botón cerrar sesión
    const btnLogoutProfile = document.getElementById('btnLogoutProfile');
    if (btnLogoutProfile) {
        btnLogoutProfile.addEventListener('click', cerrarSesionCliente);
    }
    
    // Configurar botón Iniciar Sesión / Cuenta de la navegación
    const btnOpenAuth = document.getElementById('btnOpenAuth');
    if (btnOpenAuth) {
        btnOpenAuth.addEventListener('click', cerrarSesionClienteConConfirmacion);
    }
}

// Actualizar badge de carrito
function actualizarBadgeCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.innerText = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    }
}

// Cargar información del perfil de cliente
async function cargarPerfilCliente() {
    try {
        const response = await fetch(`${API_URL}/auth/cliente/perfil`);
        if (!response.ok) {
            throw new Error("No se pudo cargar el perfil.");
        }
        
        const cliente = await response.json();
        
        // Asignar inicial del avatar
        const initials = cliente.nombre ? cliente.nombre.substring(0, 2).toUpperCase() : 'U';
        document.getElementById('profileInitials').innerText = initials;
        
        // Rellenar datos
        document.getElementById('profileName').innerText = cliente.nombre;
        document.getElementById('profileEmail').innerText = cliente.email;
        document.getElementById('profilePhone').innerText = cliente.telefono || 'No registrado';
        
        // Fecha miembro
        const fechaMiembro = new Date(cliente.creado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('profileJoined').innerText = fechaMiembro;
        
        // Modificar nombre en nav
        const clientNameNav = document.getElementById('clientNameNav');
        if (clientNameNav) {
            clientNameNav.innerText = cliente.nombre.split(' ')[0];
        }
        
    } catch (error) {
        console.error("Error al cargar perfil de cliente:", error);
        document.getElementById('profileName').innerText = "Error de Conexión";
        document.getElementById('profileEmail').innerText = `Detalle: ${error.message}`;
    }
}

// Cargar historial de pedidos
async function cargarHistorialPedidos() {
    const container = document.getElementById('ordersList');
    const countLabel = document.getElementById('ordersCount');
    
    try {
        const response = await fetch(`${API_URL}/ordenes/mis-ordenes`);
        if (!response.ok) {
            throw new Error("Error al consultar las órdenes.");
        }
        
        const ordenes = await response.json();
        countLabel.innerText = `${ordenes.length} ${ordenes.length === 1 ? 'pedido' : 'pedidos'}`;
        
        if (ordenes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h4>Aún no tienes pedidos</h4>
                    <p>Encuentra tus prendas favoritas en nuestra colección exclusiva y realiza tu primera compra.</p>
                    <a href="tienda.html" class="btn-gold" style="padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Ver Catálogo</a>
                </div>
            `;
            return;
        }
        
        // Cargar QR oficial por si hay pedidos pendientes
        let qrOficialUrl = '';
        try {
            const qrRes = await fetch(`${API_URL}/admin/qr`);
            const qrData = await qrRes.json();
            qrOficialUrl = qrRes.ok ? qrData.qr_url : '';
        } catch (e) {
            console.error("Error al obtener QR oficial:", e);
        }
        
        container.innerHTML = '';
        ordenes.forEach(orden => {
            const fecha = new Date(orden.creado_en).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Clase del estado
            let statusClass = 'status-pendiente';
            let statusText = 'Pendiente de Pago';
            
            if (orden.comprobante_url) {
                statusClass = 'status-comprobantesubido';
                statusText = 'Pago en Verificación';
            }
            if (orden.comprobante_url === 'Enviado a WhatsApp') {
                statusClass = 'status-comprobantesubido';
                statusText = 'Enviado a WhatsApp';
            }
            if (orden.estado === 'Aprobado') {
                statusClass = 'status-aprobado';
                statusText = 'Pedido Aprobado';
            }
            if (orden.estado === 'Cancelado') {
                statusClass = 'status-cancelado';
                statusText = 'Pedido Cancelado';
            }
            
            // Compilar items de la orden
            let itemsHtml = '';
            if (orden.detalle_orden && orden.detalle_orden.length > 0) {
                orden.detalle_orden.forEach(det => {
                    const prodName = det.variantes?.productos?.nombre || 'Prenda Exclusiva';
                    const prodPrice = det.precio_unitario || 0;
                    const prodSize = det.variantes?.talle || 'Única';
                    const prodImage = (det.variantes?.productos?.imagenes && det.variantes.productos.imagenes.length > 0) 
                        ? det.variantes.productos.imagenes[0].url || det.variantes.productos.imagenes[0]
                        : 'assets/ropa-placeholder.webp'; // placeholder en fallback
                        
                    itemsHtml += `
                        <div class="order-item-row">
                            <div class="order-item-info">
                                <img src="${prodImage}" alt="${prodName}" class="order-item-img" onerror="this.src='https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=200'">
                                <div class="order-item-details">
                                    <span class="order-item-name">${prodName}</span>
                                    <span class="order-item-meta">Talla: ${prodSize} | Cant: ${det.cantidad}</span>
                                </div>
                            </div>
                            <span class="order-item-price">Bs. ${prodPrice * det.cantidad}</span>
                        </div>
                    `;
                });
            } else {
                itemsHtml = `<p style="color: #a0a0a0; font-size: 0.85rem;">Detalles del pedido no disponibles.</p>`;
            }
            
            // Caja para subir comprobante si está Pendiente
            let uploadBoxHtml = '';
            if (orden.estado === 'Pendiente' && !orden.comprobante_url) {
                uploadBoxHtml = `
                    <div class="upload-receipt-box" id="uploadBox-${orden.id}">
                        <h5>💳 Completa tu pago para asegurar tu reserva</h5>
                        <p style="font-size: 0.8rem; color: #d0d0d0; margin: 0 0 10px 0; line-height: 1.4;">
                            Escanea el código QR de pago oficial para transferir <strong>Bs. ${orden.total}</strong>:
                        </p>
                        ${qrOficialUrl ? `
                        <div style="text-align: center; margin-bottom: 12px;">
                            <img src="${qrOficialUrl}" alt="QR Oficial" style="max-width: 140px; border-radius: 8px; border: 1px solid rgba(212,175,55,0.3); padding: 4px; background: white;">
                        </div>
                        ` : ''}
                        
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
                            <label style="font-size: 0.75rem; color: #a0a0a0; font-weight: 500;">Sube tu comprobante desde aquí:</label>
                            <input type="file" id="file-${orden.id}" accept="image/*" style="font-size: 0.8rem; color: white;">
                            
                            <div class="upload-receipt-actions" style="margin-top: 5px;">
                                <button onclick="subirComprobanteWeb(${orden.id})" class="btn-gold" style="padding: 8px 14px; font-size: 0.75rem; font-weight: bold; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; width: auto;">
                                    <i class="fas fa-cloud-upload-alt"></i> Subir a la Web
                                </button>
                                <button onclick="marcarComprobanteWhatsApp(${orden.id})" class="btn-gold" style="padding: 8px 14px; font-size: 0.75rem; font-weight: bold; border-radius: 6px; cursor: pointer; background: #25d366; border: none; color: white; display: inline-flex; align-items: center; gap: 4px; width: auto;">
                                    <i class="fab fa-whatsapp"></i> Ya lo envié por WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML += `
                <div class="order-card glass-card" style="margin-bottom: 20px;">
                    <div class="order-card-header">
                        <div>
                            <span class="order-id">Pedido #${orden.id}</span>
                            <span class="order-date">${fecha}</span>
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div class="order-items-list">
                        ${itemsHtml}
                    </div>
                    
                    ${uploadBoxHtml}
                    
                    <div class="order-card-footer">
                        <span class="order-total-label">Total del Pedido:</span>
                        <span class="order-total-val">Bs. ${orden.total}</span>
                    </div>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("Error al cargar historial de órdenes:", error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff4d4d;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>Ocurrió un error al cargar tus pedidos. Por favor, intenta de nuevo.</p>
                <button onclick="cargarHistorialPedidos()" class="btn-outline" style="margin-top: 10px; padding: 8px 16px; border-radius: 6px; color: white; border-color: rgba(255,255,255,0.2); cursor: pointer;">Reintentar</button>
            </div>
        `;
    }
}

// Subir comprobante desde la web
async function subirComprobanteWeb(ordenId) {
    const fileInput = document.getElementById(`file-${ordenId}`);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Por favor, selecciona una imagen del comprobante de pago.");
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('comprobante', file);
    
    const uploadBox = document.getElementById(`uploadBox-${ordenId}`);
    const originalContent = uploadBox.innerHTML;
    
    // Cambiar estado a subiendo
    uploadBox.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #e6c27a; margin-bottom: 10px;"></i>
            <p style="font-size: 0.8rem; color: #a0a0a0; margin: 0;">Subiendo comprobante, por favor espera...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/ordenes/${ordenId}/comprobante`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("¡Comprobante subido exitosamente! El administrador lo revisará en breve.");
            cargarHistorialPedidos(); // Recargar pedidos
        } else {
            alert(data.error || "Ocurrió un error al subir el comprobante.");
            uploadBox.innerHTML = originalContent;
        }
    } catch (error) {
        console.error("Error al subir comprobante:", error);
        alert("Error de conexión al subir el comprobante de pago.");
        uploadBox.innerHTML = originalContent;
    }
}

// Marcar comprobante enviado por WhatsApp
async function marcarComprobanteWhatsApp(ordenId) {
    const uploadBox = document.getElementById(`uploadBox-${ordenId}`);
    const originalContent = uploadBox.innerHTML;
    
    // Cambiar estado a procesando
    uploadBox.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #e6c27a; margin-bottom: 10px;"></i>
            <p style="font-size: 0.8rem; color: #a0a0a0; margin: 0;">Procesando...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/ordenes/${ordenId}/comprobante-whatsapp`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert("¡Pedido marcado! Se ha notificado que enviaste el comprobante por WhatsApp.");
            // Abrir link de WhatsApp con el mensaje de confirmación
            const textMsg = encodeURIComponent(`Hola STORE LAN,\n\nAcabo de realizar mi pago y marqué que envié el comprobante para mi pedido *#${ordenId}*. Aquí te adjunto la captura del pago.`);
            window.open(`https://wa.me/59164725885?text=${textMsg}`, '_blank');
            cargarHistorialPedidos(); // Recargar pedidos
        } else {
            const data = await response.json();
            alert(data.error || "No se pudo actualizar el estado de comprobante.");
            uploadBox.innerHTML = originalContent;
        }
    } catch (error) {
        console.error("Error al reportar WhatsApp:", error);
        alert("Error de conexión con el servidor.");
        uploadBox.innerHTML = originalContent;
    }
}

// Cerrar sesión
async function cerrarSesionCliente() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
        console.error("Error en petición de logout:", e);
    }
    
    localStorage.removeItem('tokenCliente');
    localStorage.removeItem('nombreCliente');
    localStorage.removeItem('sesionClienteActiva');
    alert("Sesión de cliente cerrada.");
    window.location.href = 'index.html';
}

// Confirmar cierre de sesión al hacer click en "Mi Cuenta" del nav
function cerrarSesionClienteConConfirmacion() {
    if (confirm("¿Deseas cerrar tu sesión de cliente?")) {
        cerrarSesionCliente();
    }
}
