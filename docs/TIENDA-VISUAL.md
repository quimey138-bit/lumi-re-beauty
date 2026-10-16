# Tienda, portada y carrito lateral

Cambios aprobados en conversación: mostrar Insumos antes de Servicios en la portada y los menús; recorrer productos horizontalmente; carrito lateral con sugerencias y controles; y colocar la foto grupal con una versión breve del texto de Lumière en Palermo. El usuario pidió dejar las marcas para después.

## Implementación

- El carrusel usa el catálogo real existente y conserva sus precios, imágenes e identificación para analítica. Tiene flechas, indicadores por grupo, navegación con teclado y desplazamiento táctil. No tiene reproducción automática. En `/insumos` también hay un buscador sin distinción de tildes.
- «Elegidos para tu rutina» presenta la selección existente; no se inventaron rankings de ventas, reseñas, marcas ni productos.
- «Sobre Lumière» utiliza `public/team/nosotras.jpg`, sin imágenes generadas. El texto fue resumido del proporcionado por el usuario. Incluye acceso a Servicios y al enlace de Maps recibido.
- El panel lateral usa un diálogo modal nativo con cierre por Escape, foco contenido, devolución del foco al cerrar y bloqueo temporal del scroll de fondo. Se abre al agregar un producto y desde los accesos de carrito.
- Cantidades y eliminaciones usan el carrito local existente. El contador se sincroniza con todas las vistas; las sugerencias excluyen los productos ya agregados. En celular se muestran horizontalmente dentro del panel.
- La página `/carrito` y el checkout comparten las nuevas filas con fotografías, controles de cantidad y subtotal. Las verificaciones de stock y precio del servidor y las banderas de Mercado Pago se conservaron.
- La clave de reintento del checkout queda vinculada al contenido del carrito; durante la preparación del pago se bloquean las modificaciones desde todas las vistas de esta pestaña. Si falla la preparación, se vuelve a permitir editar.
- Las flechas del carrusel dependen de los extremos reales del desplazamiento. En pantallas de poca altura, el panel completo puede desplazarse para mantener accesibles las acciones finales.

## Envíos y límites

Retiro en el estudio sin costo. La sección de Correo Argentino permite completar un destino, pero avisa antes de hacerlo que la cotización no está habilitada. El botón valida los campos y muestra el estado pendiente; no llama a una API, no guarda el destino, no crea un envío ni agrega una tarifa ficticia. El checkout sigue disponible solo para retiro.

No se modificaron credenciales, stock remoto, cuentas, reservas ni sellos. No hubo deploy ni pagos. Las compras reales requieren la configuración y validación del sistema de pagos y del stock.

## Comprobación funcional

En navegador: portada y menú con el orden nuevo; carrusel de ocho productos hasta el último grupo, en escritorio y móvil; búsqueda por «munequeras» y estado sin resultados; agregado que abre el panel; cambio de cantidades y subtotal; sugerencia agregada y retirada; formulario de envío con estado pendiente; cierre por Escape. Se preservó el carrito original del usuario después de las pruebas. Sin desbordamiento horizontal a 390 px.
