// 1. Verificación de Seguridad Inmediata
const token = localStorage.getItem('tokenStoreLan');

if (!token) {
    // Si no hay token, expulsamos al usuario al login
    window.location.href = 'index.html';
}

const API_URL = CONFIG.API_URL;

// 2. Lógica para Cerrar Sesión
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('tokenStoreLan'); // Borramos la llave
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
                
                // Agregamos filas dinámicamente escapando caracteres especiales en strings
                tbody.innerHTML += `
                    <tr>
                        <td>#${producto.id}</td>
                        <td><img src="${fotoUrl}" alt="${producto.nombre}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2);"></td>
                        <td>${producto.nombre || 'Sin nombre'}</td>
                        <td>${categoriaNombre}</td>
                        <td style="color: #e6c27a; font-weight: bold;">Bs. ${producto.precio || 0}</td>
                        <td>
                            <button onclick="abrirModalVariantes(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}')" title="Gestionar Stock" style="background:transparent; border:none; color:#e6c27a; cursor:pointer; margin-right: 10px; font-size: 1.1rem;">
                                <i class="fas fa-cubes"></i>
                            </button>
                            <button onclick="prepararEdicion(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${(producto.descripcion || '').replace(/'/g, "\\'")}', ${producto.precio}, ${producto.id_categoria})" title="Editar" style="background:transparent; border:none; color:#e6c27a; cursor:pointer; margin-right: 10px; font-size: 1.1rem;">
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
window.prepararEdicion = (id, nombre, descripcion, precio, id_categoria) => {
    modalTitle.innerText = "Editar Producto";
    productIdInput.value = id;
    prodNombreInput.value = nombre;
    prodDescripcionInput.value = (descripcion === 'undefined' || !descripcion) ? '' : descripcion;
    prodPrecioInput.value = precio;
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
    const id_categoria = prodCategoriaSelect.value;
    const imagen = prodImagenInput.files[0];

    // Usamos FormData para enviar archivo binario y textos
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('id_categoria', id_categoria);
    if (imagen) {
        formData.append('imagen', imagen);
    }

    const url = id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}` // Token JWT para pasar el middleware de Admin
            },
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
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
    cambiarVista(linkClientes, clientesSection, 'Mensajes de Contacto');
    cargarContactos();
});

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
        const response = await fetch(`${API_URL}/ordenes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        const ordenes = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && ordenes.length > 0) {
            tbody.innerHTML = '';
            ordenes.forEach(orden => {
                const fecha = new Date(orden.creado_en).toLocaleString('es-ES');
                
                // Mostrar info del cliente
                const clienteInfo = orden.clientes ? `
                    <div style="font-size: 0.85rem; line-height: 1.3; text-align: left;">
                        <strong>${orden.clientes.nombre}</strong><br>
                        <span style="color: #a0a0a0;">${orden.clientes.email || 'Sin correo'}</span><br>
                        <span style="color: #e6c27a;">${orden.clientes.telefono || 'Sin telf.'}</span>
                    </div>
                ` : '<span style="color: #a0a0a0;">Desconocido</span>';

                // Mostrar comprobante
                let comprobanteHtml = '<span style="color: #a0a0a0;">Sin subir</span>';
                if (orden.comprobante_url) {
                    comprobanteHtml = `<a href="${orden.comprobante_url}" target="_blank" title="Ver Comprobante completo" style="display: inline-block;"><img src="${orden.comprobante_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3);"></a>`;
                }

                // Colorear estado
                let estadoColor = '#e6c27a'; // Pendiente
                if (orden.estado === 'Aprobado') estadoColor = '#25d366';
                if (orden.estado === 'Cancelado') estadoColor = '#ff4d4d';

                // Acciones de aprobación/cancelación
                let accionesHtml = '';
                if (orden.estado === 'Pendiente') {
                    accionesHtml = `
                        <button onclick="cambiarEstadoOrden(${orden.id}, 'Aprobado')" class="btn-gold" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 4px; display: inline-block; margin-right: 5px;"><i class="fas fa-check"></i> Aprobar</button>
                        <button onclick="cambiarEstadoOrden(${orden.id}, 'Cancelado')" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 4px; display: inline-block; background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; cursor: pointer;"><i class="fas fa-times"></i> Cancelar</button>
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
        const response = await fetch(`${API_URL}/contacto`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
            // Hacemos una petición rápida para verificar que el archivo existe en Storage
            const verify = await fetch(data.qr_url, { method: 'HEAD' });
            if (verify.ok) {
                currentQrImg.src = `${data.qr_url}?t=${Date.now()}`;
                currentQrImg.style.display = 'block';
                noQrText.style.display = 'none';
                return;
            }
        }
        currentQrImg.style.display = 'none';
        noQrText.style.display = 'block';
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
            headers: {
                'Authorization': `Bearer ${token}`
            },
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

btnCloseVariantsModal.addEventListener('click', () => {
    variantsModal.style.display = 'none';
});