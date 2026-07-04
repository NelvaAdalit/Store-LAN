// --- Configuración Inicial ---
const API_URL = CONFIG.API_URL;

// Estado del Carrito (recuperado de localStorage)
let carrito = JSON.parse(localStorage.getItem('carritoStoreLan')) || [];

// Parámetros de Filtrado Activos (para Tienda)
let filtroCategoria = 'all';
let filtroBusqueda = '';

// --- Referencias al DOM ---
const catalogGrid = document.getElementById('catalogGrid');
const catalogGridHome = document.getElementById('catalogGridHome');
const categoryList = document.getElementById('categoryList');
const searchQueryInput = document.getElementById('searchQuery');
const btnSearch = document.getElementById('btnSearch');

// Carrito DOM
const cartSidebar = document.getElementById('cartSidebar');
const btnOpenCart = document.getElementById('btnOpenCart');
const btnCloseCart = document.getElementById('btnCloseCart');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalSum = document.getElementById('cartTotalSum');
const btnCheckout = document.getElementById('btnCheckout');

// Contacto DOM (solo en index.html)
const clientContactForm = document.getElementById('clientContactForm');
const contactResponse = document.getElementById('contactResponse');

// --- 1. Inicialización y Carga de Datos ---
document.addEventListener('DOMContentLoaded', () => {
    if (catalogGridHome) {
        // Estamos en index.html (Home) - Cargar Últimos Ingresos (limit=5, orden=id_desc)
        obtenerUltimosIngresos();
    } else if (catalogGrid) {
        // Estamos en tienda.html (Tienda) - Cargar catálogo completo y categorías
        cargarCategorias();
        obtenerCatalogo();
    }
    actualizarCarritoDOM();
});

// Cargar categorías dinámicamente (solo en tienda.html)
async function cargarCategorias() {
    if (!categoryList) return;
    try {
        const response = await fetch(`${API_URL}/test-db`); // endpoint que retorna las categorías
        const result = await response.json();
        
        if (response.ok && result.data) {
            categoryList.innerHTML = `<button class="active" data-cat="all">Todos</button>`;
            
            result.data.forEach(cat => {
                categoryList.innerHTML += `<button data-cat="${cat.id}">${cat.nombre}</button>`;
            });

            // Registrar eventos de filtro de categorías
            const buttons = categoryList.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    filtroCategoria = btn.getAttribute('data-cat');
                    obtenerCatalogo(); // Recargar productos filtrados
                });
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// Cargar catálogo de productos con filtros (solo en tienda.html)
async function obtenerCatalogo() {
    if (!catalogGrid) return;
    catalogGrid.innerHTML = `<div class="loading-spinner" style="grid-column: 1/-1; text-align: center; padding: 50px; color: #a0a0a0;">Cargando catálogo...</div>`;
    
    const params = new URLSearchParams();
    if (filtroCategoria !== 'all') {
        params.append('categoria', filtroCategoria);
    }
    if (filtroBusqueda) {
        params.append('search', filtroBusqueda);
    }

    try {
        const response = await fetch(`${API_URL}/productos?${params.toString()}`);
        const result = await response.json();

        const productos = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && productos.length > 0) {
            catalogGrid.innerHTML = '';
            
            productos.forEach(producto => {
                const categoriaNombre = producto.categorias?.nombre || producto.categorias || 'Colección';
                const fotoUrl = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0].url : 'https://via.placeholder.com/250x250.png?text=STORE+LAN';

                // Determinar si tiene etiqueta de oferta (demo balanceado)
                const esOferta = producto.nombre.toLowerCase().includes('oferta') || 
                                 (producto.descripcion && producto.descripcion.toLowerCase().includes('oferta')) ||
                                 producto.id % 2 === 0;
                const badgeHtml = esOferta ? `<span class="badge-oferta">Oferta</span>` : '';

                catalogGrid.innerHTML += `
                    <div class="product-card glass-card" onclick="verDetallesProducto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${categoriaNombre.replace(/'/g, "\\'")}', '${fotoUrl}', ${producto.precio}, '${(producto.descripcion || 'Sin descripción disponible.').replace(/'/g, "\\'")}')">
                        <div class="img-container" style="position: relative;">
                            ${badgeHtml}
                            <img src="${fotoUrl}" alt="${producto.nombre}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <span class="product-cat">${categoriaNombre}</span>
                            <h3 class="product-title">${producto.nombre}</h3>
                            <p class="product-desc">${producto.descripcion || 'Sin descripción disponible.'}</p>
                            <div class="product-price-row">
                                <span class="product-price">Bs. ${producto.precio}</span>
                                <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarritoDirecto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${fotoUrl}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            catalogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #a0a0a0;">No encontramos prendas que coincidan con tu búsqueda.</div>`;
        }
    } catch (error) {
        console.error("Error al obtener catálogo:", error);
        catalogGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #ff4d4d;">Error de comunicación con el servidor backend.</div>`;
    }
}

// Cargar Últimos Ingresos (solo en index.html - Home)
async function obtenerUltimosIngresos() {
    if (!catalogGridHome) return;
    catalogGridHome.innerHTML = `<div class="loading-spinner" style="text-align: center; color: #a0a0a0; padding: 50px; width: 100%; grid-column: 1/-1;">Cargando novedades...</div>`;

    try {
        // Cargar últimos 5 productos creados
        const response = await fetch(`${API_URL}/productos?limit=5&orden=id_desc`);
        const result = await response.json();

        const productos = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && productos.length > 0) {
            catalogGridHome.innerHTML = '';
            
            productos.forEach(producto => {
                const categoriaNombre = producto.categorias?.nombre || producto.categorias || 'Colección';
                const fotoUrl = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0].url : 'https://via.placeholder.com/250x250.png?text=STORE+LAN';

                // Determinar si tiene etiqueta de oferta (demo balanceado)
                const esOferta = producto.nombre.toLowerCase().includes('oferta') || 
                                 (producto.descripcion && producto.descripcion.toLowerCase().includes('oferta')) ||
                                 producto.id % 2 === 0;
                const badgeHtml = esOferta ? `<span class="badge-oferta">Oferta</span>` : '';

                catalogGridHome.innerHTML += `
                    <div class="novedades-card" onclick="verDetallesProducto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${categoriaNombre.replace(/'/g, "\\'")}', '${fotoUrl}', ${producto.precio}, '${(producto.descripcion || 'Sin descripción disponible.').replace(/'/g, "\\'")}')">
                        <div class="novedades-img-container">
                            ${badgeHtml}
                            <img src="${fotoUrl}" alt="${producto.nombre}" loading="lazy">
                        </div>
                        <div class="novedades-info">
                            <h3 class="novedades-title">${producto.nombre}</h3>
                            <span class="novedades-price">Bs. ${producto.precio}</span>
                            <button class="btn-novedades-add" onclick="event.stopPropagation(); agregarAlCarritoDirecto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${fotoUrl}')">
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            catalogGridHome.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #a0a0a0;">No hay novedades disponibles en este momento.</div>`;
        }
    } catch (error) {
        console.error("Error cargando novedades:", error);
        catalogGridHome.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #ff4d4d;">Error de comunicación con el servidor backend.</div>`;
    }
}

// Búsqueda por texto (solo en tienda.html)
if (btnSearch && searchQueryInput) {
    btnSearch.addEventListener('click', () => {
        filtroBusqueda = searchQueryInput.value.trim();
        obtenerCatalogo();
    });

    searchQueryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filtroBusqueda = searchQueryInput.value.trim();
            obtenerCatalogo();
        }
    });
}

// --- 2. Lógica del Carrito ---

// Abrir/Cerrar Carrito Sidebar
btnOpenCart.addEventListener('click', () => {
    cartSidebar.style.transform = 'translateX(0)';
});

btnCloseCart.addEventListener('click', () => {
    cartSidebar.style.transform = 'translateX(105%)';
});

// Agregar item
window.agregarAlCarrito = (id, nombre, precio, foto, cantidad = 1, idVariante = null) => {
    const idItem = idVariante ? idVariante : id;
    const itemExistente = carrito.find(item => item.id === idItem);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({ 
            id: idItem, 
            nombre: nombre, 
            precio: parseFloat(precio), 
            foto: foto, 
            cantidad: cantidad 
        });
    }

    guardarCarrito();
    actualizarCarritoDOM();
    cartSidebar.style.transform = 'translateX(0)';
};

// Cambiar cantidades
window.cambiarCantidad = (id, cambio) => {
    const item = carrito.find(item => item.id === id);
    if (item) {
        item.cantidad += cambio;
        if (item.cantidad <= 0) {
            carrito = carrito.filter(i => i.id !== id);
        }
    }
    guardarCarrito();
    actualizarCarritoDOM();
};

// Quitar item
window.quitarDelCarrito = (id) => {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarCarritoDOM();
};

// Guardar en LocalStorage
function guardarCarrito() {
    localStorage.setItem('carritoStoreLan', JSON.stringify(carrito));
}

// Actualizar vista del carrito
function actualizarCarritoDOM() {
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    cartCount.innerText = cantidadTotal;

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-text">Tu bolsa de compras está vacía.</p>`;
        cartTotalSum.innerText = 'Bs. 0';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;

        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.foto}" alt="${item.nombre}">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.nombre}</h4>
                    <span class="cart-item-price">Bs. ${item.precio}</span>
                    <div class="cart-item-controls">
                        <button onclick="cambiarCantidad(${item.id}, -1)">-</button>
                        <span>${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
                        <button onclick="quitarDelCarrito(${item.id})" class="btn-remove-item" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    });

    cartTotalSum.innerText = `Bs. ${total}`;
}

// Confirmar pedido (Crear Orden)
btnCheckout.addEventListener('click', async () => {
    if (carrito.length === 0) {
        alert("Agrega productos al carrito antes de confirmar el pedido.");
        return;
    }

    const sesionActiva = localStorage.getItem('sesionClienteActiva');
    if (!sesionActiva) {
        alert("Para realizar compras, por favor inicia sesión o crea una cuenta de cliente.");
        cartSidebar.style.transform = 'translateX(105%)'; // Cierra el carrito
        authModal.style.display = 'flex'; // Abre el modal de login
        return;
    }

    abrirCheckoutModal();
});

// --- 3. Formulario de Contacto ---
if (clientContactForm) {
    clientContactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const mensaje = document.getElementById('mensaje').value;

        contactResponse.innerText = "Enviando mensaje...";
        contactResponse.style.color = "#e6c27a";

        try {
            const response = await fetch(`${API_URL}/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, mensaje })
            });

            const data = await response.json();

            if (response.ok) {
                contactResponse.innerText = "¡Mensaje enviado exitosamente! Nos contactaremos a la brevedad.";
                contactResponse.style.color = "#25d366";
                clientContactForm.reset();
            } else {
                contactResponse.innerText = data.error || "No se pudo enviar el mensaje.";
                contactResponse.style.color = "#ff4d4d";
            }
        } catch (error) {
            console.error("Error al enviar mensaje de contacto:", error);
            contactResponse.innerText = "Error de conexión con el servidor.";
            contactResponse.style.color = "#ff4d4d";
        }
    });
}

// --- 4. Autenticación y Checkout con Pago QR ---

// DOM Referencias
const authModal = document.getElementById('authModal');
const btnOpenAuth = document.getElementById('btnOpenAuth');
const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
const clientNameNav = document.getElementById('clientNameNav');

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const clientLoginForm = document.getElementById('clientLoginForm');
const clientRegisterForm = document.getElementById('clientRegisterForm');

const checkoutModal = document.getElementById('checkoutModal');
const btnCloseCheckoutModal = document.getElementById('btnCloseCheckoutModal');
const checkoutQrImg = document.getElementById('checkoutQrImg');
const checkoutMonto = document.getElementById('checkoutMonto');
const checkoutForm = document.getElementById('checkoutForm');
const comprobanteFileInput = document.getElementById('comprobanteFile');

// Cargar Nombre de Cliente al iniciar
const nombreGuardado = localStorage.getItem('nombreCliente');
if (nombreGuardado && clientNameNav) {
    clientNameNav.innerText = nombreGuardado.split(' ')[0]; // Primer nombre
}

// Evento botón Mi Cuenta / Iniciar Sesión
if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', async () => {
        const sesionActiva = localStorage.getItem('sesionClienteActiva');
        if (sesionActiva) {
            if (confirm("¿Deseas cerrar tu sesión de cliente?")) {
                try {
                    await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
                } catch (e) {
                    console.error("Error cerrando sesión:", e);
                }
                localStorage.removeItem('tokenCliente');
                localStorage.removeItem('nombreCliente');
                localStorage.removeItem('sesionClienteActiva');
                if (clientNameNav) clientNameNav.innerText = "Iniciar Sesión";
                window.location.reload();
            }
        } else {
            authModal.style.display = 'flex';
        }
    });
}

if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });
}

// Pestañas
if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabLogin.style.color = '#e6c27a';
        tabRegister.classList.remove('active');
        tabRegister.style.color = '#a0a0a0';
        clientLoginForm.style.display = 'block';
        clientRegisterForm.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabRegister.style.color = '#e6c27a';
        tabLogin.classList.remove('active');
        tabLogin.style.color = '#a0a0a0';
        clientRegisterForm.style.display = 'block';
        clientLoginForm.style.display = 'none';
    });
}

// Submit Login
if (clientLoginForm) {
    clientLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/cliente/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.rol === 'admin' || data.rol === 'superadmin') {
                    localStorage.setItem('sesionAdminActiva', 'true');
                    alert("¡Acceso concedido como Administrador! Redireccionando al panel de control...");
                    window.location.href = 'frontend-admin/dashboard.html';
                    return;
                }

                localStorage.setItem('sesionClienteActiva', 'true');
                localStorage.setItem('nombreCliente', data.cliente.nombre);
                if (clientNameNav) clientNameNav.innerText = data.cliente.nombre.split(' ')[0];
                authModal.style.display = 'none';
                alert(`¡Bienvenido de nuevo, ${data.cliente.nombre}!`);

                if (carrito.length > 0) {
                    abrirCheckoutModal();
                }
            } else {
                alert(data.error || "Error al iniciar sesión.");
            }
        } catch (error) {
            console.error("Error en login cliente:", error);
            alert("Error de conexión al iniciar sesión.");
        }
    });
}

// Submit Registro
if (clientRegisterForm) {
    clientRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('regNombre').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const telefono = document.getElementById('regTelf').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
            const response = await fetch(`${API_URL}/auth/cliente/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password, telefono })
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Registro exitoso! Por favor inicia sesión con tu nueva cuenta.");
                tabLogin.click();
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = '';
            } else {
                alert(data.error || "Ocurrió un error al registrarse.");
            }
        } catch (error) {
            console.error("Error en registro cliente:", error);
            alert("Error de conexión al registrar cuenta.");
        }
    });
}

// Abrir el modal de Checkout y Cargar el QR Oficial
async function abrirCheckoutModal() {
    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    checkoutMonto.innerText = `Bs. ${total}`;
    
    try {
        const response = await fetch(`${API_URL}/admin/qr`);
        const data = await response.json();
        
        if (response.ok && data.qr_url) {
            checkoutQrImg.src = data.qr_url;
        } else {
            checkoutQrImg.src = 'https://via.placeholder.com/220x220.png?text=QR+No+Disponible';
        }
    } catch (error) {
        console.error("Error cargando QR para checkout:", error);
        checkoutQrImg.src = 'https://via.placeholder.com/220x220.png?text=QR+No+Disponible';
    }

    checkoutModal.style.display = 'flex';
}

if (btnCloseCheckoutModal) {
    btnCloseCheckoutModal.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
    });
}

// Finalizar Compra (Enviar comprobante y registrar orden)
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!comprobanteFileInput.files[0]) {
            alert("Por favor selecciona la imagen de tu comprobante de pago.");
            return;
        }

        const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const sesionActiva = localStorage.getItem('sesionClienteActiva');

        if (!sesionActiva) {
            alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
            checkoutModal.style.display = 'none';
            authModal.style.display = 'flex';
            return;
        }

        try {
            const detalles = carrito.map(item => ({
                id_variante: item.id, // ID del producto (se resolverá a su variante en la DB)
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }));

            // 1. Registrar la orden en el servidor
            const responseOrden = await fetch(`${API_URL}/ordenes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ total, detalles })
            });

            const dataOrden = await responseOrden.json();

            if (!responseOrden.ok) {
                alert(dataOrden.error || "Ocurrió un error al registrar tu orden.");
                return;
            }

            const ordenId = dataOrden.orden.id;

            // 2. Subir el comprobante de pago QR asociado a la orden creada
            const formData = new FormData();
            formData.append('comprobante', comprobanteFileInput.files[0]);

            const responseComprobante = await fetch(`${API_URL}/ordenes/${ordenId}/comprobante`, {
                method: 'POST',
                body: formData
            });

            const dataComprobante = await responseComprobante.json();

            if (responseComprobante.ok) {
                alert(`¡Pedido registrado exitosamente!\n\nID de Orden: #${ordenId}\nEstado: Pendiente de Verificación.\n\nRevisaremos tu comprobante y aprobaremos tu orden lo antes posible. ¡Gracias por comprar en STORE LAN!`);
                
                carrito = [];
                guardarCarrito();
                actualizarCarritoDOM();

                checkoutModal.style.display = 'none';
                checkoutForm.reset();
            } else {
                alert(dataComprobante.error || "El pedido se guardó, pero la subida de tu comprobante falló. Contáctanos por WhatsApp para enviarlo.");
            }
        } catch (error) {
            console.error("Error al finalizar la compra:", error);
            alert("Error de conexión al procesar tu compra.");
        }
    });
}

// --- 5. Lógica del Carrusel Promocional ---
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.carousel-dots .dot');
const carouselInner = document.querySelector('.carousel-inner');

function showSlide(index) {
    if (!carouselInner || slides.length === 0) return;
    
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }
    
    carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, idx) => {
        if (idx === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

const nextBtn = document.getElementById('nextSlide');
const prevBtn = document.getElementById('prevSlide');

if (nextBtn) {
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
}
if (prevBtn) {
    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
}

dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => showSlide(idx));
});

// Auto-play cada 5 segundos
if (carouselInner && slides.length > 0) {
    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);
}

// --- 6. Agregar al Carrito con Verificación de Variantes ---
window.agregarAlCarritoDirecto = async (id, nombre, precio, foto) => {
    try {
        const response = await fetch(`${API_URL}/productos/${id}/variantes`);
        const variantes = await response.json();
        
        if (response.ok && variantes.length > 0) {
            alert("Esta prenda cuenta con opciones de Talla y Color. Por favor selecciona tu variante preferida en la vista de detalles.");
            verDetallesProducto(id, nombre, "Colección", foto, precio, "Cargando detalles...");
        } else {
            agregarAlCarrito(id, nombre, precio, foto);
        }
    } catch (error) {
        console.error("Error al verificar variantes:", error);
        agregarAlCarrito(id, nombre, precio, foto);
    }
};

// --- 7. Modal de Detalles de Producto ---
const productDetailModal = document.getElementById('productDetailModal');
const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');

window.verDetallesProducto = async (id, nombre, categoria, foto, precio, descripcion) => {
    document.getElementById('detailProductImg').src = foto;
    document.getElementById('detailProductCat').innerText = categoria;
    document.getElementById('detailProductName').innerText = nombre;
    document.getElementById('detailProductDesc').innerText = descripcion;
    document.getElementById('detailProductPrice').innerText = `Bs. ${precio}`;
    
    const select = document.getElementById('detailVariantSelect');
    select.innerHTML = '<option value="">Cargando opciones...</option>';
    
    const btnAdd = document.getElementById('btnDetailAddCart');
    btnAdd.disabled = true;

    try {
        const response = await fetch(`${API_URL}/productos/${id}/variantes`);
        const variantes = await response.json();
        
        if (response.ok && variantes.length > 0) {
            select.innerHTML = '';
            variantes.forEach(v => {
                const stockText = v.stock > 0 ? `Stock: ${v.stock} u.` : 'Agotado';
                const disabledText = v.stock === 0 ? 'disabled' : '';
                select.innerHTML += `
                    <option value="${v.id}" data-stock="${v.stock}" data-talla="${v.talla}" data-color="${v.color}" ${disabledText}>
                        Talla: ${v.talla} - Color: ${v.color} (${stockText})
                    </option>
                `;
            });
            btnAdd.disabled = false;
        } else {
            select.innerHTML = `<option value="default" data-stock="100" data-talla="Única" data-color="Estándar">Estándar (Stock Disponible)</option>`;
            btnAdd.disabled = false;
        }
    } catch (error) {
        console.error("Error al cargar variantes en detalle:", error);
        select.innerHTML = `<option value="default" data-stock="100" data-talla="Única" data-color="Estándar">Estándar (Stock Disponible)</option>`;
        btnAdd.disabled = false;
    }

    const newBtnAdd = btnAdd.cloneNode(true);
    btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
    
    newBtnAdd.addEventListener('click', () => {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption) {
            alert("Por favor selecciona una variante disponible.");
            return;
        }
        
        const variantId = selectedOption.value;
        const talla = selectedOption.getAttribute('data-talla');
        const color = selectedOption.getAttribute('data-color');
        const stock = parseInt(selectedOption.getAttribute('data-stock'));
        
        if (stock <= 0) {
            alert("Esta variante se encuentra agotada.");
            return;
        }
        
        const variantName = `${nombre} (${talla} / ${color})`;
        agregarAlCarrito(id, variantName, precio, foto, 1, variantId !== 'default' ? parseInt(variantId) : null);
        
        productDetailModal.style.display = 'none';
    });

    productDetailModal.style.display = 'flex';
};

if (btnCloseDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => {
        productDetailModal.style.display = 'none';
    });
}
