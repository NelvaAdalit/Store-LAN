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
    if (document.getElementById('carritoMainContainer')) {
        // Estamos en carrito.html
        renderizarPaginaCarrito();
    } else if (document.getElementById('checkoutFormPage')) {
        // Estamos en finalizarcompra.html
        renderizarPaginaCheckout();
    } else if (document.getElementById('reciboId')) {
        // Estamos en pedidorecibido.html
        renderizarPaginaRecibo();
    } else if (document.getElementById('detailBreadcrumbs')) {
        // Estamos en producto.html
        cargarPaginaDetalleProducto();
    } else if (catalogGridHome) {
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

                const esOferta = producto.precio_oferta && parseFloat(producto.precio_oferta) > 0;
                const badgeHtml = esOferta ? `<span class="badge-oferta">Oferta</span>` : '';
                const precioCompra = esOferta ? parseFloat(producto.precio_oferta) : parseFloat(producto.precio);

                const precioHtml = esOferta
                    ? `<span style="text-decoration: line-through; color: #a0a0a0; font-size: 0.85rem; margin-right: 8px;">Bs. ${producto.precio}</span>Bs. ${producto.precio_oferta}`
                    : `Bs. ${producto.precio}`;

                // Calcular stock total
                const variantesActivas = producto.variantes ? producto.variantes.filter(v => v.estado_activo !== false) : [];
                const totalStock = variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0);
                
                let stockHtml = '';
                let btnAddHtml = `
                    <button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarritoDirecto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${precioCompra}, '${fotoUrl}')">
                        <i class="fas fa-plus"></i>
                    </button>
                `;

                if (totalStock === 0) {
                    stockHtml = `<span style="color: #ff4d4d; font-size: 0.8rem; font-weight: bold; display: block; margin-top: 5px;"><i class="fas fa-times-circle"></i> Agotado</span>`;
                    btnAddHtml = `
                        <button class="btn-add-cart" disabled style="background: rgba(255,255,255,0.05); color: #777; cursor: not-allowed;" onclick="event.stopPropagation();">
                            <i class="fas fa-ban"></i>
                        </button>
                    `;
                } else if (totalStock === 1) {
                    stockHtml = `<span style="color: #ffb703; font-size: 0.8rem; font-weight: bold; display: block; margin-top: 5px;"><i class="fas fa-exclamation-triangle"></i> ¡Última disponible!</span>`;
                } else {
                    stockHtml = `<span style="color: #25d366; font-size: 0.8rem; font-weight: 500; display: block; margin-top: 5px;"><i class="fas fa-check-circle"></i> Stock: ${totalStock} un.</span>`;
                }

                catalogGrid.innerHTML += `
                    <div class="product-card glass-card" onclick="verDetallesProducto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${categoriaNombre.replace(/'/g, "\\'")}', '${fotoUrl}', ${precioCompra}, '${(producto.descripcion || 'Sin descripción disponible.').replace(/'/g, "\\'")}', ${producto.precio})">
                        <div class="img-container" style="position: relative;">
                            ${badgeHtml}
                            <img src="${fotoUrl}" alt="${producto.nombre}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <span class="product-cat">${categoriaNombre}</span>
                            <h3 class="product-title">${producto.nombre}</h3>
                            ${stockHtml}
                            <p class="product-desc">${producto.descripcion || 'Sin descripción disponible.'}</p>
                            <div class="product-price-row">
                                <span class="product-price">${precioHtml}</span>
                                ${btnAddHtml}
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

// Cargar Últimos Ingresos (solo en index.html - Home y carrito.html vacío)
async function obtenerUltimosIngresos() {
    const targetGrid = catalogGridHome || document.getElementById('catalogGridHome');
    if (!targetGrid) return;
    targetGrid.innerHTML = `<div class="loading-spinner" style="text-align: center; color: #a0a0a0; padding: 50px; width: 100%; grid-column: 1/-1;">Cargando novedades...</div>`;

    try {
        const response = await fetch(`${API_URL}/productos?limit=5&orden=id_desc`);
        const result = await response.json();

        const productos = Array.isArray(result) ? result : (result.data || []);

        if (response.ok && productos.length > 0) {
            targetGrid.innerHTML = '';
            
            productos.forEach(producto => {
                const categoriaNombre = producto.categorias?.nombre || producto.categorias || 'Colección';
                const fotoUrl = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0].url : 'https://via.placeholder.com/250x250.png?text=STORE+LAN';

                const esOferta = producto.precio_oferta && parseFloat(producto.precio_oferta) > 0;
                const badgeHtml = esOferta ? `<span class="badge-oferta">Oferta</span>` : '';
                const precioCompra = esOferta ? parseFloat(producto.precio_oferta) : parseFloat(producto.precio);

                const precioHtml = esOferta
                    ? `<span style="text-decoration: line-through; color: #a0a0a0; font-size: 0.8rem; margin-right: 8px;">Bs. ${producto.precio}</span>Bs. ${producto.precio_oferta}`
                    : `Bs. ${producto.precio}`;

                // Calcular stock total
                const variantesActivas = producto.variantes ? producto.variantes.filter(v => v.estado_activo !== false) : [];
                const totalStock = variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0);
                
                let stockHtml = '';
                let btnAddHtml = `
                    <button class="btn-novedades-add" onclick="event.stopPropagation(); agregarAlCarritoDirecto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${precioCompra}, '${fotoUrl}')">
                        Añadir al Carrito
                    </button>
                `;

                if (totalStock === 0) {
                    stockHtml = `<span style="color: #ff4d4d; font-size: 0.8rem; font-weight: bold; display: block; margin: 5px 0;"><i class="fas fa-times-circle"></i> Agotado</span>`;
                    btnAddHtml = `
                        <button class="btn-novedades-add" disabled style="background: rgba(255,255,255,0.05); color: #777; cursor: not-allowed;" onclick="event.stopPropagation();">
                            Agotado
                        </button>
                    `;
                } else if (totalStock === 1) {
                    stockHtml = `<span style="color: #ffb703; font-size: 0.8rem; font-weight: bold; display: block; margin: 5px 0;"><i class="fas fa-exclamation-triangle"></i> ¡Última disponible!</span>`;
                } else {
                    stockHtml = `<span style="color: #25d366; font-size: 0.8rem; font-weight: 500; display: block; margin: 5px 0;"><i class="fas fa-check-circle"></i> Stock: ${totalStock} un.</span>`;
                }

                targetGrid.innerHTML += `
                    <div class="novedades-card" onclick="verDetallesProducto(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', '${categoriaNombre.replace(/'/g, "\\'")}', '${fotoUrl}', ${precioCompra}, '${(producto.descripcion || 'Sin descripción disponible.').replace(/'/g, "\\'")}', ${producto.precio})">
                        <div class="novedades-img-container">
                            ${badgeHtml}
                            <img src="${fotoUrl}" alt="${producto.nombre}" loading="lazy">
                        </div>
                        <div class="novedades-info">
                            <h3 class="novedades-title">${producto.nombre}</h3>
                            ${stockHtml}
                            <span class="novedades-price">${precioHtml}</span>
                            ${btnAddHtml}
                        </div>
                    </div>
                `;
            });
        } else {
            targetGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #a0a0a0;">No hay novedades disponibles en este momento.</div>`;
        }
    } catch (error) {
        console.error("Error cargando novedades:", error);
        targetGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #ff4d4d;">Error de comunicación con el servidor backend.</div>`;
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

// Redireccionar al hacer clic en el botón del carrito
if (btnOpenCart) {
    btnOpenCart.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'carrito.html';
    });
}

if (btnCloseCart) {
    btnCloseCart.addEventListener('click', () => {
        cartSidebar.style.transform = 'translateX(105%)';
    });
}

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
    
    // Si estamos en la página del carrito, refrescamos la vista completa
    if (document.getElementById('carritoMainContainer')) {
        renderizarPaginaCarrito();
    } else {
        if (confirm("¡Prenda agregada a la bolsa de compras! ¿Deseas ir al carrito para finalizar tu compra?")) {
            window.location.href = 'carrito.html';
        }
    }
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

// Métodos locales para recargar carrito.html
window.cambiarCantidadLocal = (id, cambio) => {
    cambiarCantidad(id, cambio);
    renderizarPaginaCarrito();
};

window.quitarDelCarritoLocal = (id) => {
    quitarDelCarrito(id);
    renderizarPaginaCarrito();
};

// Guardar en LocalStorage
function guardarCarrito() {
    localStorage.setItem('carritoStoreLan', JSON.stringify(carrito));
}

// Actualizar vista del carrito
function actualizarCarritoDOM() {
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (cartCount) cartCount.innerText = cantidadTotal;

    if (!cartItemsContainer) return; // Si no hay sidebar en la página actual

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-container" style="text-align: center; padding: 40px 10px; color: #a0a0a0; width: 100%;">
                <h4 style="color: #e6c27a; font-family: 'Outfit', sans-serif; font-size: 1.15rem; font-weight: 500; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">Carrito de compras – STORE LAN</h4>
                <div style="font-size: 3.5rem; color: #e6c27a; margin-bottom: 20px; opacity: 0.8;">
                    <i class="far fa-sad-tear"></i>
                </div>
                <p style="font-size: 0.85rem; color: #d0d0d0; font-family: 'Poppins', sans-serif; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 10px; display: inline-block; margin: 0;">¡Tu carrito está actualmente vacío!</p>
            </div>
        `;
        if (cartTotalSum) cartTotalSum.innerText = 'Bs. 0';
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

    if (cartTotalSum) cartTotalSum.innerText = `Bs. ${total}`;
}

// Confirmar pedido desde sidebar (si aplica)
if (btnCheckout) {
    btnCheckout.addEventListener('click', async () => {
        if (carrito.length === 0) {
            alert("Agrega productos al carrito antes de confirmar el pedido.");
            return;
        }
        window.location.href = 'carrito.html';
    });
}

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

// --- 4. Autenticación de Cliente ---

// DOM Referencias
const authModal = document.getElementById('authModal');
const btnOpenAuth = document.getElementById('btnOpenAuth');
const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
const clientNameNav = document.getElementById('clientNameNav');

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const clientLoginForm = document.getElementById('clientLoginForm');
const clientRegisterForm = document.getElementById('clientRegisterForm');

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

// Pestañas de Autenticación
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

                // Si estamos en la página del carrito, refrescamos e iniciamos checkout
                if (document.getElementById('carritoMainContainer')) {
                    renderizarPaginaCarrito();
                    irACheckout();
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

window.verDetallesProducto = (id) => {
    window.location.href = `producto.html?id=${id}`;
};

// --- 8. Lógica Específica de la Página de Carrito (carrito.html) ---
function renderizarPaginaCarrito() {
    const mainContainer = document.getElementById('carritoMainContainer');
    if (!mainContainer) return;

    if (carrito.length === 0) {
        // Carrito vacío: Carita triste + Sugerencias
        mainContainer.innerHTML = `
            <div style="max-width: 1200px; margin: 40px auto; padding: 0 30px; box-sizing: border-box;">
                <div class="empty-cart-container glass-card" style="text-align: center; padding: 50px 20px; color: #a0a0a0; max-width: 600px; margin: 0 auto 50px auto;">
                    <h3 style="color: #e6c27a; font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 500; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">Carrito de compras – STORE LAN</h3>
                    <div style="font-size: 4rem; color: #e6c27a; margin-bottom: 25px; opacity: 0.8;">
                        <i class="far fa-sad-tear"></i>
                    </div>
                    <p style="font-size: 0.95rem; color: #d0d0d0; font-family: 'Poppins', sans-serif; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 10px; display: inline-block; margin: 0;">¡Tu carrito está actualmente vacío!</p>
                </div>

                <div class="catalog-header" style="text-align: center; margin-top: 60px;">
                    <h2 style="display: inline-block; border: none; padding: 0; font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; color: #e6c27a; margin-bottom: 20px;">Nuevo en la tienda</h2>
                    <div style="width: 60px; height: 2px; background: #e6c27a; margin: -10px auto 35px auto;"></div>
                </div>
                <div class="novedades-grid" id="catalogGridHome">
                    <!-- Se carga dinámicamente -->
                </div>
            </div>
        `;
        obtenerUltimosIngresos();
    } else {
        // Carrito con productos: Tabla + Totales lateral
        let total = 0;
        let tableRowsHtml = '';

        carrito.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;

            tableRowsHtml += `
                <tr>
                    <td>
                        <div class="cart-product-cell">
                            <img src="${item.foto}" alt="${item.nombre}">
                            <div class="cart-product-details">
                                <h4 class="cart-product-title">${item.nombre}</h4>
                                <p class="cart-product-desc">Precio unitario: Bs. ${item.precio}</p>
                            </div>
                        </div>
                    </td>
                    <td style="color: #e6c27a; font-weight: bold; font-size: 0.95rem;">Bs. ${itemTotal}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <div class="qty-control">
                                <button onclick="cambiarCantidadLocal(${item.id}, -1)">-</button>
                                <span>${item.cantidad}</span>
                                <button onclick="cambiarCantidadLocal(${item.id}, 1)">+</button>
                            </div>
                            <button onclick="quitarDelCarritoLocal(${item.id})" class="btn-delete-cart" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });

        mainContainer.innerHTML = `
            <div class="checkout-layout">
                <!-- Columna Izquierda: Tabla -->
                <div class="glass-card" style="padding: 30px; width: 100%; box-sizing: border-box;">
                    <h3 style="color: #e6c27a; font-family: 'Outfit', sans-serif; font-size: 1.4rem; font-weight: 500; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">Carrito de compras – STORE LAN</h3>
                    
                    <div style="overflow-x: auto; width: 100%;">
                        <table class="cart-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Total</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 10px; font-size: 0.85rem; color: #a0a0a0;">
                        <span>Moda Circular</span>
                    </div>
                </div>

                <!-- Columna Derecha: Totales -->
                <div class="glass-card" style="padding: 30px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px;">
                    <h3 style="color: #e6c27a; font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 15px; margin-bottom: 5px;">Totales del Carrito</h3>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #a0a0a0;">
                        <span>Free shipping:</span>
                        <span style="color: #25d366; font-weight: bold;">GRATIS</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold; color: white; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px;">
                        <span>Total estimado:</span>
                        <span style="color: #e6c27a;">Bs. ${total}</span>
                    </div>

                    <button onclick="irACheckout()" class="btn-gold" style="width: 100%; border-radius: 8px; padding: 14px; font-weight: bold; font-size: 0.95rem; margin-top: 20px;">Finalizar compra</button>
                    
                    <div style="text-align: right; font-size: 0.8rem; color: #a0a0a0; margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08);">
                        <span>Todos los derechos reservados</span>
                    </div>
                </div>
            </div>
        `;
    }
}

window.irACheckout = () => {
    const sesionActiva = localStorage.getItem('sesionClienteActiva');
    if (!sesionActiva) {
        alert("Para realizar compras, por favor inicia sesión o crea una cuenta de cliente.");
        authModal.style.display = 'flex';
        return;
    }
    window.location.href = 'finalizarcompra.html';
};

// --- 9. Lógica de Finalizar Compra (finalizarcompra.html) ---
async function renderizarPaginaCheckout() {
    const formPage = document.getElementById('checkoutFormPage');
    if (!formPage) return;

    if (carrito.length === 0) {
        alert("Tu bolsa de compras está vacía. Redireccionando a la tienda...");
        window.location.href = 'tienda.html';
        return;
    }

    const nombreGuardado = localStorage.getItem('nombreCliente');
    if (nombreGuardado) {
        document.getElementById('checkNombre').value = nombreGuardado.split(' ')[0];
        document.getElementById('checkApellidos').value = nombreGuardado.split(' ').slice(1).join(' ') || ' ';
    }

    const summaryContainer = document.getElementById('checkoutSummaryItems');
    const totalSumLabel = document.getElementById('checkoutTotalSumPage');
    const subtotalLabel = document.getElementById('checkoutSubtotal');
    
    summaryContainer.innerHTML = '';
    let total = 0;

    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;

        summaryContainer.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <img src="${item.foto}" alt="${item.nombre}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(212,175,55,0.2);">
                    <div>
                        <span style="font-weight: 500; color: white;">${item.nombre}</span>
                        <span style="display: block; color: #a0a0a0; font-size: 0.75rem;">Cant: ${item.cantidad}</span>
                    </div>
                </div>
                <span style="color: #e6c27a; font-weight: bold;">Bs. ${itemTotal}</span>
            </div>
        `;
    });

    subtotalLabel.innerText = `Bs. ${total}`;
    totalSumLabel.innerText = `Bs. ${total}`;

    formPage.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('checkEmail').value.trim();
        const nombre = document.getElementById('checkNombre').value.trim();
        const apellidos = document.getElementById('checkApellidos').value.trim();
        const direccion = document.getElementById('checkDireccion').value.trim();
        const apto = document.getElementById('checkApto').value.trim();
        const ciudad = document.getElementById('checkCiudad').value.trim();
        const departamento = document.getElementById('checkDepartamento').value;
        const telefono = document.getElementById('checkTelf').value.trim();
        const nota = document.getElementById('checkNota').value.trim();

        const envioInfo = {
            nombre,
            apellidos,
            email,
            telefono,
            direccion,
            apto,
            ciudad,
            departamento,
            nota
        };

        try {
            const detalles = carrito.map(item => ({
                id_variante: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            }));

            // 1. Crear Orden en el Backend
            const responseOrden = await fetch(`${API_URL}/ordenes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    total, 
                    detalles,
                    detalles_envio: envioInfo
                })
            });

            const dataOrden = await responseOrden.json();

            if (!responseOrden.ok) {
                alert(dataOrden.error || "Ocurrió un error al registrar tu orden.");
                return;
            }

            const ordenId = dataOrden.orden.id;

            // Guardamos el resumen del pedido en localStorage para la página de recibo
            const ordenResumen = {
                id: ordenId,
                fecha: dataOrden.orden.fecha || new Date(),
                total: total,
                items: carrito,
                envio: envioInfo
            };
            localStorage.setItem('ultimoPedidoStoreLan', JSON.stringify(ordenResumen));

            // Vaciar carrito
            carrito = [];
            guardarCarrito();
            actualizarCarritoDOM();

            // Redirigir a pedidorecibido.html
            window.location.href = 'pedidorecibido.html';
        } catch (error) {
            console.error("Error procesando compra:", error);
            alert("Error de conexión al registrar tu pedido.");
        }
    });
}

// --- 10. Lógica de Pedido Recibido (pedidorecibido.html) ---
async function renderizarPaginaRecibo() {
    const reciboIdLabel = document.getElementById('reciboId');
    if (!reciboIdLabel) return;

    // Obtener los detalles de la orden guardada en localStorage
    const ultimoPedido = JSON.parse(localStorage.getItem('ultimoPedidoStoreLan'));
    if (!ultimoPedido) {
        alert("No se encontró información del pedido. Redireccionando a la tienda...");
        window.location.href = 'tienda.html';
        return;
    }

    // 1. Mostrar cabecera
    reciboIdLabel.innerText = `#${ultimoPedido.id}`;
    
    const fechaObj = new Date(ultimoPedido.fecha || Date.now());
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('reciboFecha').innerText = fechaObj.toLocaleDateString('es-ES', opcionesFecha);
    
    document.getElementById('reciboTotal').innerText = `Bs. ${ultimoPedido.total}`;
    document.getElementById('reciboSubtotal').innerText = `Bs. ${ultimoPedido.total}`;
    document.getElementById('reciboTotalTable').innerText = `Bs. ${ultimoPedido.total}`;

    // 2. Cargar QR oficial
    const reciboQrImg = document.getElementById('reciboQrImg');
    try {
        const response = await fetch(`${API_URL}/admin/qr`);
        const data = await response.json();
        if (response.ok && data.qr_url) {
            reciboQrImg.src = data.qr_url;
        } else {
            reciboQrImg.src = 'https://via.placeholder.com/220x220.png?text=QR+No+Disponible';
        }
    } catch (e) {
        console.error("Error cargando QR:", e);
        reciboQrImg.src = 'https://via.placeholder.com/220x220.png?text=QR+No+Disponible';
    }

    // 3. Renderizar items
    const itemsContainer = document.getElementById('reciboItems');
    itemsContainer.innerHTML = '';
    
    let listadoParaMensaje = ''; // Texto para enviar por WhatsApp

    ultimoPedido.items.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        listadoParaMensaje += `- ${item.nombre} x ${item.cantidad} (Bs. ${itemTotal})\n`;

        itemsContainer.innerHTML += `
            <tr>
                <td style="padding: 15px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #d0d0d0;">
                    ${item.nombre} <strong style="color: #e6c27a; margin-left: 5px;">× ${item.cantidad}</strong>
                </td>
                <td style="padding: 15px 10px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; font-weight: 500;">
                    Bs. ${itemTotal}
                </td>
            </tr>
        `;
    });

    // 4. Renderizar direcciones
    const checkInfo = ultimoPedido.envio;
    const direccionTexto = `
        ${checkInfo.nombre} ${checkInfo.apellidos}<br>
        ${checkInfo.direccion}<br>
        ${checkInfo.apto ? checkInfo.apto + '<br>' : ''}
        ${checkInfo.ciudad}, ${checkInfo.departamento}<br>
        Bolivia<br>
        <i class="fas fa-phone-alt" style="margin-right: 5px; color: #e6c27a; font-size: 0.75rem; margin-top: 10px;"></i> ${checkInfo.telefono}<br>
        <i class="fas fa-envelope" style="margin-right: 5px; color: #e6c27a; font-size: 0.75rem;"></i> ${checkInfo.email}
    `;

    document.getElementById('reciboFacturacion').innerHTML = direccionTexto;
    document.getElementById('reciboEnvio').innerHTML = direccionTexto;

    // 5. Configurar botón de WhatsApp
    const btnSendWhatsapp = document.getElementById('btnSendWhatsapp');
    const tlfTienda = "59164725885"; // Celular de Store-LAN
    
    const mensajeTexto = `Hola STORE LAN, acabo de realizar un pedido:\n\n*Pedido Nro:* #${ultimoPedido.id}\n*Total:* Bs. ${ultimoPedido.total}\n\n*Detalles del Pedido:*\n${listadoParaMensaje}\n*Datos de Envío:*\n- Nombre: ${checkInfo.nombre} ${checkInfo.apellidos}\n- Celular: ${checkInfo.telefono}\n- Dirección: ${checkInfo.direccion}, ${checkInfo.apto ? checkInfo.apto : ''} (${checkInfo.ciudad} - ${checkInfo.departamento})\n\nAdjunto la captura del comprobante de transferencia a continuación:`;
    
    const whatsappUrl = `https://wa.me/${tlfTienda}?text=${encodeURIComponent(mensajeTexto)}`;
    btnSendWhatsapp.href = whatsappUrl;

    // Registrar acción de click para avisar al backend de que se envió por WhatsApp
    btnSendWhatsapp.addEventListener('click', async () => {
        try {
            await fetch(`${API_URL}/ordenes/${ultimoPedido.id}/comprobante-whatsapp`, {
                method: 'POST'
            });
        } catch (e) {
            console.error("Error al marcar comprobante por WhatsApp:", e);
        }
    });

    // 6. Subir comprobante por Web
    const btnUploadWebComprobante = document.getElementById('btnUploadWebComprobante');
    const comprobanteWebFile = document.getElementById('comprobanteWebFile');

    if (btnUploadWebComprobante && comprobanteWebFile) {
        btnUploadWebComprobante.addEventListener('click', async () => {
            if (!comprobanteWebFile.files[0]) {
                alert("Por favor selecciona la imagen de tu comprobante de pago.");
                return;
            }

            btnUploadWebComprobante.disabled = true;
            btnUploadWebComprobante.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';

            const formData = new FormData();
            formData.append('comprobante', comprobanteWebFile.files[0]);

            try {
                const response = await fetch(`${API_URL}/ordenes/${ultimoPedido.id}/comprobante`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    alert("¡Comprobante subido exitosamente al sitio web!\n\nRevisaremos tu pago a la brevedad para preparar tu envío. ¡Muchas gracias!");
                    btnUploadWebComprobante.innerHTML = '<i class="fas fa-check"></i> Subido con Éxito';
                    btnUploadWebComprobante.style.background = '#25d366';
                    comprobanteWebFile.disabled = true;
                } else {
                    alert(data.error || "Ocurrió un error al subir el comprobante. Por favor intenta enviarlo por WhatsApp.");
                    btnUploadWebComprobante.disabled = false;
                    btnUploadWebComprobante.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir Comprobante a la Web';
                }
            } catch (error) {
                console.error("Error subiendo comprobante:", error);
                alert("Error de conexión al intentar subir el comprobante. Por favor intenta enviarlo por WhatsApp.");
                btnUploadWebComprobante.disabled = false;
                btnUploadWebComprobante.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Subir Comprobante a la Web';
            }
        });
    }
}

// --- 11. Carga de Detalle de Prenda (producto.html) ---
async function cargarPaginaDetalleProducto() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
        alert("No se especificó una prenda válida. Redireccionando a la tienda...");
        window.location.href = 'tienda.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/productos/${id}`);
        if (!response.ok) {
            alert("No se pudo obtener la información de la prenda.");
            window.location.href = 'tienda.html';
            return;
        }

        const producto = await response.json();
        const categoriaNombre = producto.categorias?.nombre || 'Colección';
        const fotoUrl = (producto.imagenes && producto.imagenes.length > 0) ? producto.imagenes[0].url : 'https://via.placeholder.com/250x250.png?text=STORE+LAN';

        const esOferta = producto.precio_oferta && parseFloat(producto.precio_oferta) > 0;
        const precioCompra = esOferta ? parseFloat(producto.precio_oferta) : parseFloat(producto.precio);

        // Llenar datos básicos
        document.getElementById('breadProductName').innerText = producto.nombre;
        document.getElementById('detailImg').src = fotoUrl;
        document.getElementById('detailCatLabel').innerText = categoriaNombre;
        document.getElementById('detailName').innerText = producto.nombre;
        document.getElementById('detailDescShort').innerText = producto.descripcion || 'Sin descripción disponible.';
        document.getElementById('metaCategory').innerText = categoriaNombre;

        // Mostrar oferta si aplica
        const tagBadge = document.getElementById('detailTagBadge');
        const oldPriceLabel = document.getElementById('detailOldPrice');
        const priceLabel = document.getElementById('detailPrice');

        if (esOferta) {
            tagBadge.style.display = 'block';
            tagBadge.innerText = 'Oferta';
            oldPriceLabel.style.display = 'inline';
            oldPriceLabel.innerText = `Bs. ${producto.precio}`;
            priceLabel.innerText = `Bs. ${producto.precio_oferta}`;
        } else {
            tagBadge.style.display = 'none';
            oldPriceLabel.style.display = 'none';
            priceLabel.innerText = `Bs. ${producto.precio}`;
        }

        // Carga de variantes
        const select = document.getElementById('detailVariant');
        select.innerHTML = '<option value="">Cargando opciones...</option>';
        const btnAdd = document.getElementById('btnAddToCartDetail');
        btnAdd.disabled = true;

        try {
            const resVar = await fetch(`${API_URL}/productos/${id}/variantes`);
            const variantes = await resVar.json();
            
            if (resVar.ok && variantes.length > 0) {
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
        } catch (errVar) {
            console.error("Error al cargar variantes:", errVar);
            select.innerHTML = `<option value="default" data-stock="100" data-talla="Única" data-color="Estándar">Estándar (Stock Disponible)</option>`;
            btnAdd.disabled = false;
        }

        // Lógica del selector de cantidad
        const qtyInput = document.getElementById('qtyInput');
        const btnMinus = document.getElementById('btnQtyMinus');
        const btnPlus = document.getElementById('btnQtyPlus');

        btnMinus.onclick = () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
            }
        };

        btnPlus.onclick = () => {
            const selectedOption = select.options[select.selectedIndex];
            const maxStock = selectedOption ? parseInt(selectedOption.getAttribute('data-stock')) : 100;
            let val = parseInt(qtyInput.value) || 1;
            if (val < maxStock) {
                qtyInput.value = val + 1;
            }
        };

        // Lógica del botón de añadir
        btnAdd.onclick = () => {
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) {
                alert("Por favor selecciona una variante disponible.");
                return;
            }
            
            const variantId = selectedOption.value;
            const talla = selectedOption.getAttribute('data-talla');
            const color = selectedOption.getAttribute('data-color');
            const stock = parseInt(selectedOption.getAttribute('data-stock'));
            const cantidad = parseInt(qtyInput.value) || 1;
            
            if (stock <= 0) {
                alert("Esta variante se encuentra agotada.");
                return;
            }
            
            const variantName = `${producto.nombre} (${talla} / ${color})`;
            agregarAlCarrito(producto.id, variantName, precioCompra, fotoUrl, cantidad, variantId !== 'default' ? parseInt(variantId) : null);
            
            alert(`¡Se agregaron ${cantidad} unidades de ${producto.nombre} (${talla} / ${color}) a tu bolsa!`);
            window.location.href = 'carrito.html';
        };

        // Pestañas (Descripción y Valoraciones)
        const tabBtnDesc = document.getElementById('tabBtnDesc');
        const tabBtnVal = document.getElementById('tabBtnVal');
        const tabContentArea = document.getElementById('tabContentArea');

        // Contenido por defecto
        tabContentArea.innerHTML = `
            <h3 style="color: #e6c27a; margin-bottom: 15px; font-weight: 500;">Descripción del Producto</h3>
            <p>${producto.descripcion || 'Sin descripción detallada disponible.'}</p>
            <ul style="margin-top: 15px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
                <li>Material: Seda / Lino / Algodón Premium</li>
                <li>Diseño exclusivo y de alta costura</li>
                <li>Limpieza en seco o lavado suave a mano recomendados</li>
            </ul>
        `;

        tabBtnDesc.onclick = () => {
            tabBtnDesc.classList.add('active');
            tabBtnVal.classList.remove('active');
            tabContentArea.innerHTML = `
                <h3 style="color: #e6c27a; margin-bottom: 15px; font-weight: 500;">Descripción del Producto</h3>
                <p>${producto.descripcion || 'Sin descripción detallada disponible.'}</p>
                <ul style="margin-top: 15px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
                    <li>Material: Seda / Lino / Algodón Premium</li>
                    <li>Diseño exclusivo y de alta costura</li>
                    <li>Limpieza en seco o lavado suave a mano recomendados</li>
                </ul>
            `;
        };

        tabBtnVal.onclick = () => {
            tabBtnVal.classList.add('active');
            tabBtnDesc.classList.remove('active');
            tabContentArea.innerHTML = `
                <h3 style="color: #e6c27a; margin-bottom: 15px; font-weight: 500;">Valoraciones de Clientes</h3>
                <p style="color: #a0a0a0; font-style: italic;">No hay valoraciones para este producto todavía. ¡Sé el primero en valorarlo al realizar tu compra!</p>
            `;
        };

        // Cargar productos relacionados
        cargarProductosRelacionados(producto.id, producto.id_categoria);

    } catch (error) {
        console.error("Error al cargar la página de detalle:", error);
    }
}

async function cargarProductosRelacionados(productId, categoryId) {
    const grid = document.getElementById('relatedProductsGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="color: #a0a0a0;">Cargando relacionados...</div>';

    try {
        const response = await fetch(`${API_URL}/productos?categoria=${categoryId}&limit=5`);
        const result = await response.json();
        const productos = Array.isArray(result) ? result : (result.data || []);

        // Filtrar el producto actual
        const relacionados = productos.filter(p => p.id !== productId).slice(0, 4);

        if (response.ok && relacionados.length > 0) {
            grid.innerHTML = '';
            relacionados.forEach(prod => {
                const catNombre = prod.categorias?.nombre || 'Colección';
                const fotoUrl = (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0].url : 'https://via.placeholder.com/250x250.png?text=STORE+LAN';
                const esOferta = prod.precio_oferta && parseFloat(prod.precio_oferta) > 0;
                const precioHtml = esOferta
                    ? `<span style="text-decoration: line-through; color: #a0a0a0; font-size: 0.85rem; margin-right: 8px;">Bs. ${prod.precio}</span>Bs. ${prod.precio_oferta}`
                    : `Bs. ${prod.precio}`;

                grid.innerHTML += `
                    <div class="product-card glass-card" onclick="verDetallesProducto(${prod.id})">
                        <div class="img-container">
                            ${esOferta ? '<span class="badge-oferta">Oferta</span>' : ''}
                            <img src="${fotoUrl}" alt="${prod.nombre}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <span class="product-cat">${catNombre}</span>
                            <h3 class="product-title">${prod.nombre}</h3>
                            <div class="product-price-row" style="margin-top: 10px;">
                                <span class="product-price">${precioHtml}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            grid.innerHTML = '<p style="color: #a0a0a0; grid-column: 1/-1;">No se encontraron productos relacionados.</p>';
        }
    } catch (e) {
        console.error("Error al cargar relacionados:", e);
        grid.innerHTML = '<p style="color: #a0a0a0; grid-column: 1/-1;">No se pudieron cargar relacionados.</p>';
    }
}
