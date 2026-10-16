# Lumière Beauty: propuesta de arquitectura incremental

Estado: aprobada por el usuario; implementación local en validación. No desplegada. Estado operativo y límites en `docs/IMPLEMENTACION.md`.
Fecha: 16 de octubre de 2026.

## Objetivo y restricciones

Ampliar el sitio existente con cuentas cliente/profesional/admin, agenda propia, notificaciones, fidelización y comercio electrónico. Preservar diseño, catálogo, fotografías y acceso a AgendaPro mientras se valida el reemplazo. Trabajar en este repositorio, sin eliminar cambios del usuario, inventar credenciales ni publicar en producción.

La conversación de referencia permite recuperar los requisitos del usuario, pero las respuestas anteriores aparecen como referencias sin contenido. Esta propuesta no presume decisiones de implementación que no se pudieron recuperar.

## Inspección inicial

- Git sin modificaciones al comenzar; HEAD `d3ad085`.
- Next.js 16.3.4, React 19.2.8, TypeScript estricto y Tailwind 4.
- Rutas actuales: `/`, `/servicios`, `/insumos` y `/turnos`.
- `/turnos` redirige a AgendaPro; también existen enlaces directos desde varias páginas.
- 51 servicios en `src/data/catalog.json`, cinco categorías. Cuatro precios cero requieren confirmación: `servicio-31`, `servicio-32`, `servicio-44`, `servicio-51`.
- Ocho productos definidos dentro de `src/app/components/products.tsx`; precios como texto y consultas por WhatsApp, sin carrito.
- WhatsApp del estudio ya configurado como enlace: `5491158875779`. Un enlace no envía mensajes automáticamente.
- `src/archive/turnos-demo` contiene una maqueta con datos ilustrativos, estado React y panel sin autenticación. No usarla como backend ni tomar profesionales, horarios o seña como datos reales.
- No se encontraron archivos `.env*`, migraciones, autenticación, API propia ni pruebas del proyecto. No existe script `test`.
- `.gitignore` ignora `.env*`; la implementación deberá permitir explícitamente `.env.example`.
- Guías locales consultadas: Route Handlers, Proxy, Authentication y Environment Variables, bajo `node_modules/next/dist/docs/01-app`.

### Validación de la base existente

Ejecutada el 16 de octubre de 2026, antes de modificar código funcional:

- `npm.cmd run lint`: código de salida 0.
- `npm.cmd run build`: código de salida 0; compilación, comprobación TypeScript y generación de páginas completadas.
- No se ejecutaron tests de dominio o integración: todavía no hay suite ni script configurados.
- Node v24.21.0 y npm 11.19.0. Se utilizó `npm.cmd` porque la política de PowerShell bloquea `npm.ps1`, sin cambiar esa política.
- El único cambio de esta etapa es este documento; no se instalaron dependencias ni se modificaron las rutas existentes. No se hicieron commits ni deploys.

## Enfoques evaluados

1. **Recomendado: monolito modular Next.js con Supabase/Postgres.** Mantener el frontend y sumar módulos de dominio, autorización, transacciones y adaptadores externos. Permite cambios graduales y pruebas locales sin credenciales.
2. Mantener AgendaPro como agenda definitiva y agregar tienda/fidelidad. Reduce trabajo inicial, pero no satisface el turnero propio ni unifica sus operaciones sin otra integración.
3. Backend independiente o microservicios. Separa despliegues, pero agrega infraestructura y coordinación innecesarias para el repositorio actual.

## Etapas y límites de entrega

Cada etapa requiere pruebas apropiadas y revisión antes de activar efectos externos. Las etapas son subsistemas separados; esta propuesta describe su relación, no reemplaza sus planes de implementación detallados.

### 1. Cuentas, permisos y datos

Supabase Auth con clientes SSR y navegador separados, sesiones por cookies y verificación de identidad en servidor. `src/proxy.ts` podrá refrescar sesiones; cada operación sensible comprobará identidad y permisos nuevamente. No autorizar usando solo la presencia de una cookie o un control visual.

Tablas: `profiles`, `user_roles`, `professionals`, `services`, `professional_services`, `working_hours`, `schedule_blocks`, `appointments` y `audit_events`. Los registros públicos empiezan como cliente. El usuario no puede elevar su rol a través de metadata o formularios. El primer administrador se asigna mediante operación de base de datos documentada y explícita, nunca mediante una ruta pública.

RLS: cliente accede a sus datos; profesional a su agenda y datos mínimos necesarios; admin gestiona la operación. No exponer emails/teléfonos en consultas públicas de disponibilidad. Claves privilegiadas exclusivamente en servidor. Funciones SQL con permisos mínimos y `search_path` explícito si requieren `SECURITY DEFINER`.

Entregable inicial: migraciones, pruebas de políticas y dominio, `/ingresar`, `/cuenta`, `/profesional`, `/admin` y diagnóstico de configuración. Sin Supabase, mostrar configuración pendiente y rechazar operaciones reales; nunca habilitar un admin ficticio como alternativa.

### 2. Turnero y dashboard

Nueva agenda en `/reservar`; conservar `/turnos` y AgendaPro hasta la activación deliberada. Seleccionar servicio, profesional, fecha y horario. Importar el catálogo existente sin suponer que el tiempo de agenda equivale al tiempo efectivo: el servicio 01 ya documenta esa diferencia.

Horarios por profesional, servicios habilitados, descansos, bloqueos y duración se resuelven en servidor. Guardar instantes como `timestamptz`, mostrar en `America/Argentina/Buenos_Aires`, usar intervalos semiabiertos `[inicio, fin)`.

Crear/cancelar/reprogramar mediante transacción. Restricción de exclusión Postgres por profesional e intervalo para estados que bloquean agenda; no basta consultar disponibilidad antes de insertar. Idempotencia por usuario y solicitud, validación de fecha futura y límites de horizonte. Dos solicitudes concurrentes para el mismo intervalo deben producir una sola reserva y un conflicto controlado.

Estados: confirmado, completado, cancelado, ausente. No agregar una seña obligatoria basándose en la maqueta: ese flujo no está confirmado en los requisitos actuales. Si se incorpora después, las retenciones deben expirar automáticamente.

Dashboard: filtro por profesional/fecha/estado, cambios autorizados, clientes paginados y métricas obtenidas de reservas y pagos reales. Marcar completado queda auditado y habilita el sello; una clienta no puede completar su propio servicio.

### 3. Notificaciones y recordatorio 24 h

Interfaces independientes para WhatsApp y email. Propuesta inicial: WhatsApp Cloud API y proveedor transaccional de email; confirmar disponibilidad de cuentas y plantillas al integrarlos. No diseñar payloads o URLs suponiendo un contrato no verificado.

Una outbox persistente se crea en la misma transacción que confirma el turno. Destinos: estudio y clienta; recordatorio a la clienta con `due_at = inicio - 24 h`. Si se reserva con menos de 24 h, enviar confirmación y omitir recordatorio vencido. Cancelar o reprogramar invalida trabajos anteriores.

Worker autenticado por secreto, invocable localmente y luego por programador externo. Reclamo de trabajos con bloqueo/lease, reintentos limitados y backoff, claves de deduplicación y registro de intentos. Documentar que, ante timeout ambiguo del proveedor, no se puede prometer entrega exactamente una vez sin soporte de idempotencia externo.

Sin credenciales, el adaptador local registra una simulación identificada como tal; nunca informa que entregó un WhatsApp o email real. Consentimiento por canal, no incluir secretos ni datos completos en logs.

### 4. QR, sellos y recompensas

Tablas: `loyalty_visits`, `loyalty_tokens`, `loyalty_rewards`, `reward_redemptions`. Un sello por turno completado y cliente, protegido por restricción única y transacción. Ledger auditable; no permitir enviar un contador desde el navegador.

QR físico apunta a `/fidelidad`: abre la cuenta y el canje. El QR estático no autoriza sellos por sí solo. Para acreditar la visita, validar turno completado y autorización del estudio mediante token de un solo uso, de corta duración, vinculado a cliente/turno y almacenado como hash. Alternativa operativa: acreditación por personal autorizado con auditoría.

Hitos: 6 = descuento especial, 8 = regalo sorpresa, 15 = producto gratis a elección. No inventar porcentaje ni productos elegibles: se configuran antes de canjear. Para la primera versión, hitos únicos y contador acumulado, sin reinicio automático; cualquier ciclo posterior requiere definición de negocio. Canje transaccional, sin duplicados, confirmado por personal autorizado.

### 5. Carrito, checkout, pagos y envíos

Extraer un catálogo tipado de productos conservando IDs, nombres, fotos y precios existentes. Importes monetarios como enteros en unidades menores; presentación ARS. Carrito persistido localmente con validación al leer, cantidades limitadas y recuperación ante almacenamiento inválido.

El checkout recalcula precios, descuentos, stock y envío en servidor. Crear pedido y líneas con instantánea de precio y dirección; no aceptar montos finales del cliente. Reserva de stock con vencimiento, prevención de sobreventa y transición transaccional al pagar/cancelar.

Mercado Pago Checkout Pro mediante adaptador. Estado pagado solo después de validar firma del webhook y consultar el pago al proveedor, cotejando pedido, moneda, monto, cuenta y entorno. Retorno del navegador no acredita un pago. Repeticiones de webhook no duplican stock, eventos ni pedidos; gestionar estados pendientes, rechazados y reembolsados.

Correo Argentino detrás de interfaces de cotización, creación de envío y etiqueta. Confirmar modalidad y contrato habilitados de la cuenta antes de implementar su cliente HTTP. Cotización depende de origen, destino, peso y dimensiones reales; no estimar tarifas silenciosamente ni fabricar etiquetas. Sin configuración, permitir retiro en local; envío postal queda explícitamente no disponible. La creación de etiqueta es una acción administrativa idempotente sobre un pedido pagado.

Sin credenciales: carrito, totales y retiro local son comprobables; checkout de pago real queda deshabilitado con motivo visible. Las pruebas usan proveedores falsos inyectados y datos de ejemplo claramente separados.

### 6. Analítica y SEO

Contrato tipado de eventos `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `schedule_appointment`, `claim_reward`. `purchase` proviene de pago verificado; reserva y premio se emiten tras éxito persistido. IDs de evento estables para deduplicar Meta Pixel/CAPI; tabla outbox para conversiones confirmadas.

GTM/GA4 y Meta Pixel se habilitan solo con IDs configurados y consentimiento aplicable. Evitar carga duplicada de GA4 si ya lo administra GTM. No enviar email, teléfono, nombres ni tratamientos sensibles al `dataLayer`. CAPI solo desde operaciones verificadas; no exponer un relay público que permita fabricar compras o definir destinos arbitrarios. Mantener restricciones de consentimiento también en servidor.

JSON-LD `BeautySalon` con los datos reales disponibles, sin inventar dirección, horarios, valoraciones ni coordenadas. `Product` con nombre, imagen y precios reales; no afirmar disponibilidad no verificada. Serialización segura de JSON-LD, canonical, metadata por ruta, sitemap y robots. Excluir paneles y cuenta del índice; robots no sustituye autorización.

## Organización propuesta

```text
src/app/ingresar/        formulario de autenticación
src/app/cuenta/          perfil, turnos y fidelidad
src/app/profesional/     agenda propia protegida
src/app/admin/           administración protegida
src/app/reservar/        turnero propio
src/app/fidelidad/       acceso desde QR
src/app/carrito/         carrito
src/app/checkout/        checkout y resultado
src/app/api/             operaciones, webhooks y worker autenticado
src/lib/supabase/        clientes y refresco de sesión
src/lib/auth/            identidad y autorización
src/domain/              reglas puras por subsistema
src/server/              persistencia y casos de uso
src/integrations/        WhatsApp, email, Mercado Pago, Correo, Meta
src/components/          nuevas piezas compartidas
src/proxy.ts             refresco de sesión, si corresponde
supabase/migrations/     esquema, restricciones, RLS y funciones
tests/                   dominio, seguridad, integraciones y navegación
```

No mover masivamente `src/app/components` ni `src/app/lib` existentes; integrarlos gradualmente.

## Configuración prevista

`.env.example` contendrá valores vacíos y comentarios de alcance; nunca secretos reales. Los nombres siguientes son la propuesta de contrato local, no variables ya implementadas:

- Públicas: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`.
- Servidor: clave privilegiada de Supabase según API/SDK elegido, `CRON_SECRET`, credenciales WhatsApp/email, token y secreto webhook Mercado Pago, credenciales y entorno Correo Argentino, token CAPI y versión soportada de Graph API.
- Negocio: teléfono estudio `5491158875779`, origen postal, horarios/profesionales reales, pesos/dimensiones/stock, condiciones de premios. Estos datos operativos se administran en base de datos cuando corresponda.

Ausencia de credenciales no debe romper `next build`; las rutas dependientes deben responder con un estado claro de configuración pendiente, sin filtrar variables. No permitir modos de prueba que omitan autenticación en producción.

## Criterios de validación

1. Lint, TypeScript y build sin credenciales externas.
2. Pruebas unitarias de intervalos, huso horario, totales, hitos y vencimientos.
3. Pruebas de integración Postgres/Supabase local: RLS entre clientes/profesionales, escalada de rol, doble reserva concurrente, sello/canje repetidos, idempotencia de pedidos y webhooks.
4. Pruebas de adaptadores con HTTP simulado: timeout, rechazo, firma inválida, moneda/monto incorrectos y duplicados.
5. Navegación en móvil/escritorio: catálogo existente, carrito, estados sin configuración y accesos privados.
6. Flujo real en sandbox cuando se aporten cuentas de prueba; no declarar verificados los proveedores reales antes de ejecutarlo.
7. Revisar diff final y distinguir código implementado, simulación local, pendiente de credenciales y pendiente de activación.

## Datos que no bloquean la base técnica

Profesionales y horarios reales, stock/pesos/dimensiones, origen postal, dominio canónico, porcentaje del descuento y selección de productos elegibles deberán suministrarse antes de activar esos flujos. Se pueden desarrollar contratos, reglas, migraciones y pruebas con fixtures sin hacer pasar esos ejemplos por datos del negocio.

## Fuentes técnicas consultadas

- Guías Next.js incluidas con la versión instalada: rutas, proxy, autenticación y variables de entorno.
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Mercado Pago, autenticidad de notificaciones: https://www.mercadopago.com.ar/developers/es/docs/split-payments/additional-content/your-integrations/notifications/webhooks

Antes de escribir cada integración, revisar su documentación oficial específica, versiones vigentes y contrato de la cuenta. La referencia de webhooks respalda la necesidad de verificar firma, no decide qué producto de pagos contratar.
