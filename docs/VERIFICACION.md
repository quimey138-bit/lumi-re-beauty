# Evidencia de validación — 16 de octubre de 2026

## Preparación de publicación (estado actual)

- Suite actual `npm.cmd test`: **12 archivos, 81 pruebas aprobadas**, salida 0, 29,71 s. Incluye 23 pruebas SQL y el rechazo HTTP del alta de turnos sin pago de seña.
- Validación final previa al commit: `npm.cmd run lint`, `npm.cmd run typecheck` y `npm.cmd run build` terminaron con salida 0. Build de Next.js 16.3.8 con 20 páginas generadas y rutas privadas dinámicas.
- Las corridas generales anteriores **fallaron** al inicializar PGlite: 57/58 pruebas aprobadas y 22/23 SQL omitidas, según la versión. Una repetición con `--hookTimeout=120000` tampoco resolvía el inicio porque `beforeAll` tenía un límite explícito de 30 s. No se cuentan como éxitos.
- El fixture SQL ahora tiene hasta 120 s de inicio y 30 s de cierre para WASM/Postgres y siete migraciones en Windows. Las aserciones y los permisos probados no se debilitaron. Con ese cambio pasó una corrida general de 81 pruebas en 46,20 s y otra en 29,71 s.
- Revisión independiente de publicación: detectó y cerró en el script SQL de release el acceso directo a `book_appointment` y `create_order`. El script comprueba el esquema antes de revocar permisos y también rechaza privilegios INSERT inesperados; prueba local de ejecución repetida y denegación directa aprobada.
- El usuario informó haber guardado las cinco variables de Vercel, las URLs de Supabase y ejecutado el script de cierre. La captura mostró los nombres de las cinco variables en Production, con valores ocultos; no se verificaron sus valores por lectura remota. La conexión Vercel disponible sigue devolviendo 403 para `quim2`.
- Verificación local sobre el build en `127.0.0.1:3101`: carrusel llega a 8/8, carrito lateral con fotos, sugerencias y cambio de 1×$38.000 a 2×$38.000=$76.000; checkout con pago deshabilitado. GET sin cookies a `/admin`, `/cuenta` y `/profesional` devuelve 307 a `/ingresar`; ingreso, catálogo y foto grupal devuelven 200. No se crearon cuentas, reservas, pagos ni entregas.
- Escaneo de los archivos candidatos contra secretos presentes en `.env.local`: sin coincidencias. `.env.local` ignorado; `.env.example` contiene solo placeholders y valores públicos.

La evidencia histórica que sigue corresponde a etapas anteriores, antes de que el usuario configurara Supabase. Para los pasos de publicación vigentes, ver [PUBLICACION.md](PUBLICACION.md).

## Resultado local

| Comprobación | Resultado observado |
|---|---|
| `npm.cmd test` | 7 archivos, **56 tests pasaron**, salida 0; corrida final aislada de 12,31 s |
| `npm.cmd run lint` | Salida 0 |
| `npm.cmd run typecheck` | Salida 0 |
| `npm.cmd run build` | Salida 0; Next.js 16.3.8, compilación/TypeScript y 21 páginas generadas; rutas privadas dinámicas |
| `npm.cmd run verify:http` | **7/7** sin Supabase configurado; rechazos por configuración/origen/secreto y callback al origen configurado |
| `git diff --check` | Salida 0; solo avisos de conversión LF/CRLF de Git en Windows |
| `npm.cmd audit --omit=dev --json` | 0 vulnerabilidades de dependencias de producción |
| `npm.cmd audit --json` | 13 paquetes de desarrollo marcados con severidad alta, 0 críticos; sin corrección automática disponible en el stack fijado |

Los avisos de desarrollo pertenecen a las cadenas `brace-expansion`/`braces` → globs → ESLint/TypeScript-ESLint. La auditoría completa devuelve salida 1 por esos avisos; no se presenta como limpia. No se aplicaron overrides ni actualizaciones forzadas. Revisar esa cadena de herramientas antes de habilitar CI sobre entradas de terceros no confiables.

Una corrida de tests en paralelo con el build agotó el timeout de inicialización de PGlite; los 22 tests de base de datos quedaron omitidos en esa corrida. Se ejecutó nuevamente la suite completa **sola**, sin cambiar sus aserciones ni aumentar timeouts: los 56 pasaron. La corrida omitida no se cuenta como éxito.

## Navegador local

Servidor `http://127.0.0.1:3100`, sin Supabase configurado:

1. Catálogo `/insumos`: rechazo de cookies opcionales y agregado de Limpiador/Bálsamo.
2. Carrito: 1 unidad = $38.000; cambiar a 2 unidades = $76.000.
3. Recargar conserva cantidad y total.
4. Checkout muestra retiro local y aviso de pagos no habilitados; botón Mercado Pago deshabilitado.
5. Viewport 390 × 844: controles y contenido visibles; override restaurado después de revisar.
6. Consola del navegador sin errores durante el flujo de carrito/checkout.
7. `/admin` sin Supabase muestra estado de configuración pendiente y acceso a AgendaPro; no expone una administración de prueba.

Evidencia: [checkout móvil](evidence/checkout-mobile.jpg).

## Qué cubren las pruebas

- Precios de catálogo, cantidades/IDs inválidos, carritos duplicados y almacenamiento corrupto.
- Intervalos adyacentes/solapados, fecha inválida y recordatorios 24 h.
- Redirecciones locales permitidas, origen HTTP real cuando Next normaliza un hostname interno y datos estructurados escapados.
- Migraciones completas con grants históricos de Supabase, RLS, denegación de escalada de rol y acceso anónimo a funciones privilegiadas.
- Visita terminada requerida, sello único, reprogramación con revisiones de avisos y bloqueo por profesional inactiva.
- Permisos de cuentas profesionales y contactos, restauración de acceso y retiro autorizado de bloqueos.
- Recompensas habilitadas, condiciones, elección de producto elegible, stock y canje repetido.
- Stock no confirmado, reserva de stock, idempotencia secuencial, montos/moneda, pagos repetidos, reembolso anterior a aprobación y snapshots parciales fuera de orden.
- Recibo de consentimiento revocado incluso antes de crear el pedido; límites de reintentos y jobs sin configuración.
- Payloads y rechazos de proveedores con HTTP simulado, aceptación de mensaje/email con ID, preferencia sandbox y cuenta receptora incorrecta.
- Medición bloqueada sin consentimiento o almacenamiento disponible.

## Revisión independiente

Se realizó una revisión inicial y otra de la retomada. Los hallazgos importantes se reprodujeron cuando era posible y se corrigieron: grants históricos, visitas futuras, reglas de premios, leases agotados, agenda truncada, contactos, revocación persistente, idempotencia de reserva, profesional inactiva, restauración de rol, persistencia CAS de preferencia y orden de snapshots de pagos. Se verificaron con suite SQL/dominio/HTTP y lectura del flujo.

El lock por clave y la exclusión de intervalos implementan protección de concurrencia, pero **PGlite no demuestra una intercalación multiconexión de Postgres**. Ese ensayo sigue pendiente contra un entorno de pruebas real.

## Pendientes externos

- El usuario todavía no tiene Supabase y pidió seguir validación local. Auth real, RLS/PostgREST desplegados y migraciones en Supabase no se probaron.
- Mercado Pago: el usuario tiene credenciales de prueba; falta Supabase y una URL HTTPS de pruebas para el webhook. No se efectuó ningún cobro.
- WhatsApp/Resend: faltan cuentas/plantillas/remitente y entrega real. Un ID aceptado no prueba entrega ni lectura.
- GTM/GA4/Meta: faltan IDs/tokens/configuración del contenedor y pruebas de recepción/deduplicación.
- Correo Argentino: solo hay interfaz deshabilitada; faltan contrato/API de cuenta, implementación HTTP, cotización y etiquetas.
- Direcciones, jornadas reales, stock, condiciones de premios y programador autenticado deben configurarse antes de operar.

No se hicieron commits, push, deploys ni modificaciones a bases remotas. Ver `IMPLEMENTACION.md` para activación y límites operativos.
