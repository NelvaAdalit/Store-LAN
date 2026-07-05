// 1. Verificación de Seguridad Inmediata
const sesionActiva = localStorage.getItem('sesionAdminActiva');

if (!sesionActiva) {
    // Si no hay sesión activa, expulsamos al usuario al login
    window.location.href = 'index.html';
}

const API_URL = CONFIG.API_URL;

// 2. Lógica para Cerrar Sesión
document.getElementById('btnLogout').addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {
        console.error("Error al cerrar sesión en servidor:", e);
    }
    localStorage.removeItem('tokenStoreLan');
    localStorage.removeItem('sesionAdminActiva');
    window.location.href = '../index.html'; // Lo mandamos al inicio oficial (tienda)
});

// Referencias a elementos del DOM para el Modal
const productModal = document.getElementById('productModal');
const btnOpenModal = document.querySelector('.table-header .btn-gold');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');

// Campos del formulario
const productIdInput = document.getElementById('productId');
const prodNombreInput = document.getElementById('prodNombre');
const prodDescripcionInput = document.getElementById('prodDescripcion');
const prodPrecioInput = document.getElementById('prodPrecio');
const prodPrecioOfertaInput = document.getElementById('prodPrecioOferta');
const prodCategoriaSelect = document.getElementById('prodCategoria');
const prodImagenInput = document.getElementById('prodImagen');

// Cargar categorías dinámicamente desde el backend
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/test-db`); // Reutiliza el endpoint de prueba que retorna categorías
        const result = await response.json();
        if (response.ok && result.data) {
            prodCategoriaSelect.innerHTML = '';
            result.data.forEach(cat => {
                prodCategoriaSelect.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

// Crear nueva categoría dinámicamente
document.getElementById('btnCrearCategoria').addEventListener('click', async () => {
    const nombre = prompt("Ingresa el nombre de la nueva categoría (ej: Chompas, Camisas):");
    if (!nombre || !nombre.trim()) return;

    try {
        const response = await fetch(`${API_URL}/admin/categorias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: nombre.trim() })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`¡Categoría "${data.categoria.nombre}" creada con éxito!`);
            await cargarCategorias(); // Recargar el dropdown
            prodCategoriaSelect.value = data.categoria.id; // Seleccionar la nueva categoría
        } else {
            alert(data.error || "Ocurrió un error al crear la categoría.");
        }
    } catch (error) {
        console.error("Error al crear categoría:", error);
        alert("Error de conexión al intentar crear la categoría.");
    }
});

// 3. Función para cargar productos desde la base de datos
async function cargarProductos() {
    const tbody = document.querySelector('#productosTable tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #a0a0a0;">Cargando productos...</td></tr>`;
    
    try {
        const response = await fetch(`${API_URL}/productos`);
        const result = await response.json();

        // Obtenemos los productos de forma robusta sea un array directo o un objeto { data: [...] }
        const productos = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && productos.length > 0) {
            tbody.innerHTML = ''; // Limpiamos
            
            productos.forEach(producto => {
                const categoriaNombre = producto.categorias?.nombre || producto.categorias || 'Sin categoría';
                const fotoUrl = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0].url : 'https://via.placeholder.com/50x50.png?text=Sin+foto';
                
                // Mostrar precio de oferta si existe
                const precioTexto = producto.precio_oferta 
                    ? `<span style="text-decoration: line-through; color: #a0a0a0; font-size: 0.85rem; margin-right: 8px;">Bs. ${producto.precio}</span>Bs. ${producto.precio_oferta}`
                    : `Bs. ${producto.precio || 0}`;

                // Agregamos filas dinámicamente escapando caracteres especiales en strings
                tbody.innerHTML += `
                    <tr>
                        <td>#${producto.id}</td>
                        <td><img src="${fotoUrl}" alt="${producto.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);"></td>
                        <td>${producto.nombre || 'Sin nombre'}</td>
                        <td>${categoriaNombre}</td>
                        <td style="color: #e6c27a; font-weight: bold;">${precioTexto}</td>
                        <td>
                            <button onclick="abrirModalVariantes(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}')" title="Gestionar Stock" style="background:transparent; border:none; color:#e6c27a; cursor:pointer; margin-right: 10px; font-size: 1.1rem;">
                                <i class="fas fa-cubes"></i>
                            </button>
                            <button onclick="prepararEdicion(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${(producto.descripcion || '').replace(/'/g, "\\'")}', ${producto.precio}, ${producto.id_categoria}, ${producto.precio_oferta || 'null'})" title="Editar" style="background:transparent; border:none; color:#e6c27a; cursor:pointer; margin-right: 10px; font-size: 1.1rem;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarProducto(${producto.id})" title="Eliminar" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-size: 1.1rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #a0a0a0;">El catálogo de STORE LAN está vacío.</td></tr>`;
        }
    } catch (error) {
        console.error("Error cargando productos:", error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ff4d4d;">Error de conexión con el servidor. Verifica que Node esté corriendo.</td></tr>`;
    }
}

// 4. Lógica de Apertura/Cierre de Modal
btnOpenModal.addEventListener('click', () => {
    modalTitle.innerText = "Nuevo Producto";
    productIdInput.value = "";
    prodImagenInput.required = true; // Imagen requerida para nuevos
    productForm.reset();
    productModal.style.display = "flex";
});

const cerrarModal = () => {
    productModal.style.display = "none";
};

btnCloseModal.addEventListener('click', cerrarModal);
btnCancelModal.addEventListener('click', cerrarModal);

// Cerrar al hacer clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === productModal) {
        cerrarModal();
    }
});

// Preparar Edición
window.prepararEdicion = (id, nombre, descripcion, precio, id_categoria, precio_oferta) => {
    modalTitle.innerText = "Editar Producto";
    productIdInput.value = id;
    prodNombreInput.value = nombre;
    prodDescripcionInput.value = (descripcion === 'undefined' || !descripcion) ? '' : descripcion;
    prodPrecioInput.value = precio;
    prodPrecioOfertaInput.value = precio_oferta ? precio_oferta : '';
    prodCategoriaSelect.value = id_categoria;
    prodImagenInput.required = false; // Opcional en edición
    productModal.style.display = "flex";
};

// Enviar formulario (Crear o Editar)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = productIdInput.value;
    const nombre = prodNombreInput.value;
    const descripcion = prodDescripcionInput.value;
    const precio = prodPrecioInput.value;
    const precio_oferta = prodPrecioOfertaInput.value;
    const id_categoria = prodCategoriaSelect.value;
    const imagen = prodImagenInput.files[0];

    // Usamos FormData para enviar archivo binario y textos
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('precio_oferta', precio_oferta);
    formData.append('id_categoria', id_categoria);
    if (imagen) {
        formData.append('imagen', imagen);
    }

    const url = id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert(id ? "Producto actualizado correctamente." : "Producto creado correctamente.");
            cerrarModal();
            cargarProductos(); // Recargar tabla
        } else {
            alert(data.error || "Ocurrió un error en la operación.");
        }
    } catch (error) {
        console.error("Error al procesar producto:", error);
        alert("Error de conexión con el servidor.");
    }
});

// Eliminar Producto
window.eliminarProducto = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto? Esta acción borrará permanentemente el registro y su imagen.")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert("Producto eliminado exitosamente.");
            cargarProductos(); // Recargar tabla
        } else {
            alert(data.error || "No se pudo eliminar el producto.");
        }
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert("Error de conexión con el servidor.");
    }
};

// 5. Inicialización
cargarCategorias();
cargarProductos();

// --- 6. Navegación del Panel de Administración ---
const linkProductos = document.getElementById('linkProductos');
const linkOrdenes = document.getElementById('linkOrdenes');
const linkClientes = document.getElementById('linkClientes');
const linkQrConfig = document.getElementById('linkQrConfig');

const productosSection = document.getElementById('productosSection');
const ordenesSection = document.getElementById('ordenesSection');
const clientesSection = document.getElementById('clientesSection');
const qrSection = document.getElementById('qrSection');

const navTitle = document.querySelector('.nav-title');

function cambiarVista(linkActivo, seccionActiva, titulo) {
    // Clases activas en enlaces
    [linkProductos, linkOrdenes, linkClientes, linkQrConfig].forEach(link => link.classList.remove('active'));
    linkActivo.classList.add('active');

    // Visibilidad de secciones
    [productosSection, ordenesSection, clientesSection, qrSection].forEach(sec => sec.style.display = 'none');
    seccionActiva.style.display = 'block';

    // Cambiar título del navbar
    navTitle.innerText = titulo;
}

linkProductos.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarVista(linkProductos, productosSection, 'Gestión de Catálogo');
    cargarProductos();
});

linkOrdenes.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarVista(linkOrdenes, ordenesSection, 'Gestión de Órdenes');
    cargarOrdenes();
});

linkClientes.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarVista(linkClientes, clientesSection, 'Clientes y Contactos');
    const btnTabClientesReg = document.getElementById('btnTabClientesReg');
    if (btnTabClientesReg) btnTabClientesReg.click();
});

// --- 6.1 Pestañas de la Sección Clientes y Contactos ---
const btnTabClientesReg = document.getElementById('btnTabClientesReg');
const btnTabContactos = document.getElementById('btnTabContactos');
const panelClientesReg = document.getElementById('panelClientesReg');
const panelContactos = document.getElementById('panelContactos');

if (btnTabClientesReg && btnTabContactos) {
    btnTabClientesReg.addEventListener('click', () => {
        btnTabClientesReg.style.background = 'rgba(230,194,122,0.05)';
        btnTabClientesReg.style.borderColor = '#e6c27a';
        btnTabClientesReg.style.color = '#e6c27a';

        btnTabContactos.style.background = 'transparent';
        btnTabContactos.style.borderColor = 'rgba(255,255,255,0.2)';
        btnTabContactos.style.color = 'white';

        panelClientesReg.style.display = 'block';
        panelContactos.style.display = 'none';
        cargarClientesRegistrados();
    });

    btnTabContactos.addEventListener('click', () => {
        btnTabContactos.style.background = 'rgba(230,194,122,0.05)';
        btnTabContactos.style.borderColor = '#e6c27a';
        btnTabContactos.style.color = '#e6c27a';

        btnTabClientesReg.style.background = 'transparent';
        btnTabClientesReg.style.borderColor = 'rgba(255,255,255,0.2)';
        btnTabClientesReg.style.color = 'white';

        panelContactos.style.display = 'block';
        panelClientesReg.style.display = 'none';
        cargarContactos();
    });
}

linkQrConfig.addEventListener('click', (e) => {
    e.preventDefault();
    cambiarVista(linkQrConfig, qrSection, 'Configurar QR de Pago');
    cargarQrOficial();
});

// --- 7. Cargar y Gestionar Órdenes ---
async function cargarOrdenes() {
    const tbody = document.querySelector('#ordenesTable tbody');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #a0a0a0;">Cargando órdenes...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/ordenes`);
        const result = await response.json();
        const ordenes = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && ordenes.length > 0) {
            tbody.innerHTML = '';
            ordenes.forEach(orden => {
                const fecha = new Date(orden.creado_en).toLocaleString('es-ES');
                
                // Mostrar info del cliente
                let clientTelClean = orden.clientes && orden.clientes.telefono ? orden.clientes.telefono.replace(/\D/g, '') : '';
                let clientTelFinal = clientTelClean.startsWith('591') ? clientTelClean : `591${clientTelClean}`;
                
                let clienteInfo = orden.clientes ? `
                    <div style="font-size: 0.85rem; line-height: 1.3; text-align: left;">
                        <strong>${orden.clientes.nombre}</strong><br>
                        <span style="color: #a0a0a0;">${orden.clientes.email || 'Sin correo'}</span><br>
                        <span style="color: #e6c27a;">
                            ${orden.clientes.telefono || 'Sin telf.'} 
                            ${orden.clientes.telefono ? `<a href="https://wa.me/${clientTelFinal}" target="_blank" title="Chatear con el cliente" style="color: #25d366; margin-left: 5px; font-size: 0.95rem; text-decoration: none;"><i class="fab fa-whatsapp"></i> Chat</a>` : ''}
                        </span>
                    </div>
                ` : '<span style="color: #a0a0a0;">Desconocido</span>';

                if (orden.detalles_envio) {
                    const tEnv = orden.detalles_envio.telefono.replace(/\D/g, '');
                    const tEnvFinal = tEnv.startsWith('591') ? tEnv : `591${tEnv}`;
                    clienteInfo += `
                        <div style="margin-top: 8px; font-size: 0.75rem; line-height: 1.4; text-align: left; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(212,175,55,0.25); max-width: 250px;">
                            <strong style="color: #e6c27a;">Dirección de Envío:</strong><br>
                            ${orden.detalles_envio.nombre} ${orden.detalles_envio.apellidos}<br>
                            ${orden.detalles_envio.direccion} ${orden.detalles_envio.apto ? '(' + orden.detalles_envio.apto + ')' : ''}<br>
                            ${orden.detalles_envio.ciudad} - ${orden.detalles_envio.departamento}<br>
                            Telf: ${orden.detalles_envio.telefono} <a href="https://wa.me/${tEnvFinal}" target="_blank" title="Chatear con el cliente" style="color: #25d366; margin-left: 5px; font-size: 0.9rem; text-decoration: none;"><i class="fab fa-whatsapp"></i> Chat</a><br>
                            ${orden.detalles_envio.nota ? `<span style="color: #ffb703; font-style: italic; display: block; margin-top: 3px;">Nota: "${orden.detalles_envio.nota}"</span>` : ''}
                        </div>
                    `;
                }

                // Listar prendas compradas
                let prendasHtml = '';
                if (orden.detalle_orden && orden.detalle_orden.length > 0) {
                    prendasHtml += `
                        <div style="margin-top: 8px; font-size: 0.75rem; color: #d0d0d0; text-align: left; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); max-width: 250px;">
                            <strong style="color: #e6c27a; display: block; margin-bottom: 4px;"><i class="fas fa-tshirt"></i> Prendas:</strong>
                    `;
                    orden.detalle_orden.forEach(det => {
                        const pName = det.variantes?.productos?.nombre || 'Prenda';
                        const pSize = det.variantes?.talle || 'U';
                        prendasHtml += `<span style="display: block; margin-bottom: 2px;">• ${det.cantidad}x ${pName} (${pSize})</span>`;
                    });
                    prendasHtml += `</div>`;
                }
                clienteInfo += prendasHtml;

                // Mostrar comprobante
                let comprobanteHtml = '';
                const cliName = orden.detalles_envio ? orden.detalles_envio.nombre : (orden.clientes ? orden.clientes.nombre : '');
                const cliTelf = orden.detalles_envio ? orden.detalles_envio.telefono : (orden.clientes ? orden.clientes.telefono : '');

                if (orden.comprobante_url) {
                    if (orden.comprobante_url === 'Enviado a WhatsApp') {
                        const tlfDest = cliTelf.replace(/\D/g, '');
                        const tlfFinal = tlfDest.startsWith('591') ? tlfDest : `591${tlfDest}`;
                        comprobanteHtml = `<a href="https://wa.me/${tlfFinal}" target="_blank" title="Ir al chat del cliente" style="color: #25d366; font-weight: bold; font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;"><i class="fab fa-whatsapp"></i> Enviado a WhatsApp</a>`;
                    } else {
                        comprobanteHtml = `<a href="${orden.comprobante_url}" target="_blank" title="Ver Comprobante completo" style="display: inline-block;"><img src="${orden.comprobante_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3);"></a>`;
                    }
                } else {
                    comprobanteHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="color: #ff4d4d; font-size: 0.8rem; font-weight: 500;">Sin subir</span>
                            <button onclick="recordarPagoWhatsApp(${orden.id}, '${cliName.replace(/'/g, "\\'")}', '${cliTelf.replace(/'/g, "\\'")}', '${orden.total}')" title="Enviar recordatorio de pago" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; background: rgba(255,183,3,0.15); border: 1px solid #ffb703; color: #ffb703; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas fa-bell"></i> Recordar
                            </button>
                        </div>
                    `;
                }

                // Colorear estado
                let estadoColor = '#e6c27a'; // Pendiente
                if (orden.estado === 'Aprobado') estadoColor = '#25d366';
                if (orden.estado === 'Cancelado') estadoColor = '#ff4d4d';

                // Acciones de aprobación/cancelación
                let accionesHtml = '';
                if (orden.estado === 'Pendiente') {
                    accionesHtml = `
                        <div style="display: flex; flex-direction: column; gap: 6px; align-items: stretch;">
                            <div style="display: flex; gap: 5px;">
                                <button onclick="cambiarEstadoOrden(${orden.id}, 'Aprobado')" class="btn-gold" style="padding: 5px 10px; font-size: 0.8rem; border-radius: 4px; cursor: pointer; flex: 1;"><i class="fas fa-check"></i> Aprobar</button>
                                <button onclick="cambiarEstadoOrden(${orden.id}, 'Cancelado')" style="padding: 5px 10px; font-size: 0.8rem; border-radius: 4px; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; cursor: pointer; flex: 1;"><i class="fas fa-times"></i> Cancelar</button>
                            </div>
                            <button onclick="chatearDetallesPedido(${orden.id}, '${cliName.replace(/'/g, "\\'")}', '${cliTelf.replace(/'/g, "\\'")}')" class="btn-gold" style="padding: 6px 10px; font-size: 0.75rem; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; text-align: center; gap: 4px; background: #25d366; border: none; color: white; cursor: pointer; width: 100%; white-space: normal; line-height: 1.3;"><i class="fab fa-whatsapp"></i> Dirigirse a chat con el cliente para detalles de su pedido</button>
                        </div>
                    `;
                } else if (orden.estado === 'Aprobado') {
                    accionesHtml = `
                        <button onclick="chatearDetallesPedido(${orden.id}, '${cliName.replace(/'/g, "\\'")}', '${cliTelf.replace(/'/g, "\\'")}')" class="btn-gold" style="padding: 6px 10px; font-size: 0.75rem; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; text-align: center; gap: 4px; background: #25d366; border: none; color: white; cursor: pointer; width: 100%; white-space: normal; line-height: 1.3;"><i class="fab fa-whatsapp"></i> Dirigirse a chat con el cliente para detalles de su pedido</button>
                    `;
                } else {
                    accionesHtml = `<span style="color: #a0a0a0;">Cerrada</span>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td>#${orden.id}</td>
                        <td>${clienteInfo}</td>
                        <td>${fecha}</td>
                        <td style="color: #e6c27a; font-weight: bold;">Bs. ${orden.total}</td>
                        <td>${comprobanteHtml}</td>
                        <td style="color: ${estadoColor}; font-weight: 500;">${orden.estado}</td>
                        <td>${accionesHtml}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #a0a0a0;">No hay órdenes registradas.</td></tr>`;
        }
    } catch (error) {
        console.error("Error al cargar órdenes:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff4d4d;">Error de conexión con el servidor.</td></tr>`;
    }
}

// Cambiar estado de orden (Aprobar / Cancelar)
window.cambiarEstadoOrden = async (id, estado) => {
    if (!confirm(`¿Estás seguro de cambiar el estado de la orden #${id} a "${estado}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/ordenes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Orden #${id} marcada como ${estado} exitosamente.`);
            cargarOrdenes();
        } else {
            alert(data.error || "Ocurrió un error al cambiar el estado.");
        }
    } catch (error) {
        console.error("Error al actualizar orden:", error);
        alert("Error de conexión con el servidor.");
    }
};

// --- 8. Cargar Mensajes de Contacto ---
async function cargarContactos() {
    const tbody = document.querySelector('#contactosTable tbody');
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #a0a0a0;">Cargando mensajes...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/contacto`);
        const result = await response.json();
        const contactos = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && contactos.length > 0) {
            tbody.innerHTML = '';
            contactos.forEach(contacto => {
                const fecha = new Date(contacto.creado_en).toLocaleString('es-ES');
                
                tbody.innerHTML += `
                    <tr>
                        <td>#${contacto.id}</td>
                        <td>${contacto.nombre}</td>
                        <td><a href="mailto:${contacto.email}" style="color: #e6c27a; text-decoration: none;">${contacto.email}</a></td>
                        <td style="max-width: 300px; word-break: break-all;">${contacto.mensaje}</td>
                        <td>${fecha}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #a0a0a0;">No hay mensajes de contacto.</td></tr>`;
        }
    } catch (error) {
        console.error("Error al cargar mensajes:", error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ff4d4d;">Error de conexión con el servidor (verifica la tabla 'contactos').</td></tr>`;
    }
}

// --- 9. Configuración del QR de Pago Oficial ---
const qrForm = document.getElementById('qrForm');
const qrFileInput = document.getElementById('qrFile');
const currentQrImg = document.getElementById('currentQrImg');
const noQrText = document.getElementById('noQrText');

async function cargarQrOficial() {
    try {
        const response = await fetch(`${API_URL}/admin/qr`);
        const data = await response.json();

        if (response.ok && data.qr_url) {
            currentQrImg.src = `${data.qr_url}?t=${Date.now()}`;
            currentQrImg.style.display = 'block';
            noQrText.style.display = 'none';
            return;
        }
    } catch (error) {
        console.error("Error al cargar QR oficial:", error);
        currentQrImg.style.display = 'none';
        noQrText.style.display = 'block';
    }
}

qrForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!qrFileInput.files[0]) {
        alert("Selecciona un archivo de imagen primero.");
        return;
    }

    const formData = new FormData();
    formData.append('qr', qrFileInput.files[0]);

    try {
        const response = await fetch(`${API_URL}/admin/qr`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert("¡QR de Pago Oficial actualizado exitosamente!");
            qrForm.reset();
            cargarQrOficial();
        } else {
            alert(result.error || "Ocurrió un error al actualizar el QR oficial.");
        }
    } catch (error) {
        console.error("Error al subir QR oficial:", error);
        alert("Error de conexión al subir el QR oficial.");
    }
});

// --- 10. Gestión de Variantes y Stock ---
const variantsModal = document.getElementById('variantsModal');
const btnCloseVariantsModal = document.getElementById('btnCloseVariantsModal');
const variantsTableBody = document.querySelector('#variantsTable tbody');
const variantForm = document.getElementById('variantForm');
const varProductIdInput = document.getElementById('varProductId');
const variantsModalTitle = document.getElementById('variantsModalTitle');

window.abrirModalVariantes = async (productId, productName) => {
    variantsModalTitle.innerText = `Variantes y Stock: ${productName}`;
    varProductIdInput.value = productId;
    
    variantForm.reset();
    variantsModal.style.display = 'flex';
    
    cargarVariantes(productId);
};

async function cargarVariantes(productId) {
    variantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #a0a0a0; padding: 15px;">Cargando variantes...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/productos/${productId}/variantes`);
        const variantes = await response.json();

        if (response.ok && variantes.length > 0) {
            variantsTableBody.innerHTML = '';
            variantes.forEach(v => {
                variantsTableBody.innerHTML += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 10px; color: white; font-weight: 500;">${v.talla}</td>
                        <td style="padding: 10px; color: #d0d0d0;">${v.color}</td>
                        <td style="padding: 10px; color: #e6c27a; font-weight: bold;">${v.stock} u.</td>
                        <td style="padding: 10px; text-align: center;">
                            <button onclick="editarVariante(${v.id}, '${v.talla.replace(/'/g, "\\'")}', '${v.color.replace(/'/g, "\\'")}', ${v.stock}, ${productId})" title="Editar Talla, Color y Stock" style="background:transparent; border:none; color:#e6c27a; cursor:pointer; margin-right: 15px; font-size: 1rem;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarVariante(${v.id}, ${productId})" title="Eliminar Variante" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-size: 1rem;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            variantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #a0a0a0; padding: 15px;">No hay tallas o colores registrados para este producto.</td></tr>`;
        }
    } catch (error) {
        console.error("Error al cargar variantes:", error);
        variantsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ff4d4d; padding: 15px;">Error al consultar stock en base de datos.</td></tr>`;
    }
}

variantForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = varProductIdInput.value;
    const talla = document.getElementById('varTalla').value.trim();
    const color = document.getElementById('varColor').value.trim();
    const stock = document.getElementById('varStock').value.trim();

    if (!talla || !color || !stock) {
        alert("Completa todos los campos de la variante.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/${productId}/variantes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ talla, color, stock })
        });

        const result = await response.json();

        if (response.ok) {
            variantForm.reset();
            cargarVariantes(productId);
        } else {
            alert(result.error || "Ocurrió un error al registrar la variante.");
        }
    } catch (error) {
        console.error("Error al registrar variante:", error);
        alert("Error de conexión con el servidor.");
    }
});

window.eliminarVariante = async (variantId, productId) => {
    if (!confirm("¿Estás seguro de eliminar esta talla/color?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/variantes/${variantId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            cargarVariantes(productId);
        } else {
            alert(result.error || "No se pudo eliminar la variante.");
        }
    } catch (error) {
        console.error("Error al eliminar variante:", error);
        alert("Error de conexión al intentar eliminar.");
    }
};

window.editarVariante = async (variantId, tallaActual, colorActual, stockActual, productId) => {
    const nuevaTalla = prompt("Ingresa la nueva Talla para esta variante:", tallaActual);
    if (nuevaTalla === null) return;
    if (!nuevaTalla.trim()) {
        alert("La talla no puede estar vacía.");
        return;
    }

    const nuevoColor = prompt("Ingresa el nuevo Color para esta variante:", colorActual);
    if (nuevoColor === null) return;
    if (!nuevoColor.trim()) {
        alert("El color no puede estar vacío.");
        return;
    }

    const nuevoStock = prompt("Ingresa el nuevo stock para esta variante:", stockActual);
    if (nuevoStock === null) return;

    const stockNum = parseInt(nuevoStock);
    if (isNaN(stockNum) || stockNum < 0) {
        alert("Por favor ingresa un número de stock válido (entero no negativo).");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/variantes/${variantId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                talla: nuevaTalla.trim(),
                color: nuevoColor.trim(),
                stock: stockNum 
            })
        });

        const result = await response.json();

        if (response.ok) {
            cargarVariantes(productId);
        } else {
            alert(result.error || "No se pudo actualizar la variante.");
        }
    } catch (error) {
        console.error("Error al actualizar variante:", error);
        alert("Error de conexión al intentar actualizar la variante.");
    }
};

window.chatearDetallesPedido = (ordenId, clienteNombre, clienteTelefono) => {
    if (!clienteTelefono) {
        alert("El cliente no tiene registrado un número de teléfono.");
        return;
    }

    const tlfDestinatario = clienteTelefono.replace(/\D/g, '');
    const tlfFinal = tlfDestinatario.startsWith('591') ? tlfDestinatario : `591${tlfDestinatario}`;

    const mensajeText = `Hola ${clienteNombre || 'cliente'},\n\nTe escribo de *STORE LAN* para coordinar los detalles de la entrega de tu pedido *#${ordenId}*. ✨`;

    const whatsappUrl = `https://wa.me/${tlfFinal}?text=${encodeURIComponent(mensajeText)}`;
    window.open(whatsappUrl, '_blank');
};

window.recordarPagoWhatsApp = (ordenId, clienteNombre, clienteTelefono, total) => {
    if (!clienteTelefono) {
        alert("El cliente no tiene registrado un número de teléfono.");
        return;
    }

    const tlfDestinatario = clienteTelefono.replace(/\D/g, '');
    const tlfFinal = tlfDestinatario.startsWith('591') ? tlfDestinatario : `591${tlfDestinatario}`;

    const mensajeText = `Hola ${clienteNombre || 'cliente'},\n\nTe escribimos de *STORE LAN* para recordarte que tienes un pedido pendiente (*#${ordenId}*) por un total de *Bs. ${total}*.\n\nPor favor, sube tu comprobante de pago QR al sitio web o envíanoslo por este chat para que podamos confirmar tu pago, separar tu prenda y preparar tu envío lo antes posible. ¡Muchas gracias! 😊✨`;

    const whatsappUrl = `https://wa.me/${tlfFinal}?text=${encodeURIComponent(mensajeText)}`;
    window.open(whatsappUrl, '_blank');
};

btnCloseVariantsModal.addEventListener('click', () => {
    variantsModal.style.display = 'none';
});

// --- 9. Listar Clientes Registrados ---
async function cargarClientesRegistrados() {
    const tbody = document.querySelector('#clientesTable tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #a0a0a0;">Cargando clientes...</td></tr>`;

    try {
        const response = await fetch(`${API_URL}/admin/clientes`);
        const clientes = await response.json();

        if (response.ok && clientes.length > 0) {
            tbody.innerHTML = '';
            clientes.forEach(c => {
                const fechaReg = new Date(c.creado_en).toLocaleDateString('es-ES');
                const cleanPhone = c.telefono ? c.telefono.replace(/\D/g, '') : '';
                const finalPhone = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`;
                const telfHtml = c.telefono 
                    ? `${c.telefono} <a href="https://wa.me/${finalPhone}" target="_blank" title="Chatear por WhatsApp" style="color: #25d366; text-decoration: none; margin-left: 5px; font-size: 0.85rem;"><i class="fab fa-whatsapp"></i> Chat</a>`
                    : '<span style="color: #a0a0a0;">Sin teléfono</span>';

                tbody.innerHTML += `
                    <tr>
                        <td>#${c.id}</td>
                        <td style="font-weight: 500; color: white;">${c.nombre}</td>
                        <td>${c.email}</td>
                        <td>${telfHtml}</td>
                        <td style="text-align: center;">${c.totalOrdenes}</td>
                        <td style="color: #e6c27a; font-weight: bold;">Bs. ${c.totalGastado}</td>
                        <td>${fechaReg}</td>
                        <td>
                            <button onclick="abrirHistorialPedidosCliente(${c.id}, '${c.nombre.replace(/'/g, "\\'")}')" class="btn-gold" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas fa-history"></i> Historial
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #a0a0a0;">No hay clientes registrados aún.</td></tr>`;
        }
    } catch (error) {
        console.error("Error al cargar clientes registrados:", error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ff4d4d;">Error de conexión con el servidor.</td></tr>`;
    }
}

// --- 10. Modal Historial de Pedidos del Cliente ---
const historyModal = document.getElementById('historyModal');
const btnCloseHistoryModal = document.getElementById('btnCloseHistoryModal');
const historyListContainer = document.getElementById('historyListContainer');

if (btnCloseHistoryModal) {
    btnCloseHistoryModal.addEventListener('click', () => {
        historyModal.style.display = 'none';
    });
}

window.abrirHistorialPedidosCliente = async (clienteId, clienteNombre) => {
    document.getElementById('historyModalTitle').innerText = `Historial de Pedidos: ${clienteNombre}`;
    historyListContainer.innerHTML = `
        <div style="text-align: center; padding: 20px 0; color: #a0a0a0;">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #e6c27a; margin-bottom: 10px;"></i>
            <p style="font-size: 0.85rem;">Cargando pedidos del cliente...</p>
        </div>
    `;
    historyModal.style.display = 'flex';

    try {
        const response = await fetch(`${API_URL}/ordenes`);
        const result = await response.json();
        const ordenes = Array.isArray(result) ? result : (result.data || []);

        // Filtrar órdenes de este cliente específico
        const ordenesCliente = ordenes.filter(o => o.id_cliente === clienteId);

        if (response.ok && ordenesCliente.length > 0) {
            historyListContainer.innerHTML = '';
            
            ordenesCliente.forEach(orden => {
                const fecha = new Date(orden.creado_en).toLocaleString('es-ES');
                
                // Color y texto del estado
                let estadoColor = '#e6c27a';
                if (orden.estado === 'Aprobado') estadoColor = '#25d366';
                if (orden.estado === 'Cancelado') estadoColor = '#ff4d4d';

                // Compilar prendas
                let prendasText = '';
                if (orden.detalle_orden && orden.detalle_orden.length > 0) {
                    orden.detalle_orden.forEach(det => {
                        const pName = det.variantes?.productos?.nombre || 'Prenda';
                        const pSize = det.variantes?.talle || 'U';
                        prendasText += `<div style="font-size: 0.85rem; color: white; display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.05); padding: 4px 0;">
                            <span>• ${det.cantidad}x ${pName} (Talla: ${pSize})</span>
                            <span style="color: #e6c27a; font-weight: 500;">Bs. ${det.precio_unitario * det.cantidad}</span>
                        </div>`;
                    });
                } else {
                    prendasText = `<div style="color: #a0a0a0; font-size: 0.8rem;">Detalle de prendas no disponible.</div>`;
                }

                historyListContainer.innerHTML += `
                    <div class="glass-panel" style="padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 12px;">
                            <div>
                                <strong style="color: white; font-size: 0.95rem;">Pedido #${orden.id}</strong>
                                <span style="font-size: 0.75rem; color: #a0a0a0; margin-left: 10px;">${fecha}</span>
                            </div>
                            <span style="color: ${estadoColor}; font-weight: 600; font-size: 0.8rem; text-transform: uppercase;">${orden.estado}</span>
                        </div>
                        
                        <div style="margin-bottom: 12px;">
                            ${prendasText}
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                            <span style="color: #a0a0a0;">Monto Total:</span>
                            <span style="color: #e6c27a; font-weight: 700;">Bs. ${orden.total}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            historyListContainer.innerHTML = `<p style="color: #a0a0a0; text-align: center; padding: 20px;">Este cliente no tiene pedidos registrados.</p>`;
        }
    } catch (error) {
        console.error("Error al cargar historial de pedidos:", error);
        historyListContainer.innerHTML = `<p style="color: #ff4d4d; text-align: center; padding: 20px;">Error al obtener el historial de compras.</p>`;
    }
};