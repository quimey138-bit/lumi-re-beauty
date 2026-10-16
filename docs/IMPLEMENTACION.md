# Lumière Beauty — implementación y activación

Estado: código local en validación. No se desplegó ni se ejecutaron migraciones remotas.

## Qué se agregó

| Área | Implementado en el repositorio | Activación pendiente |
|---|---|---|
| Cuentas | Registro, login, confirmación PKCE, logout, perfil y verificación de roles en servidor/RLS | Proyecto Supabase, URL y claves, email de confirmación |
| Administración | Agenda filtrada y paginada, contactos autorizados, clientes por nombre/páginas, profesionales, horarios, bloqueos, stock, reglas de premios y QR descargable | Datos reales del estudio y cuenta admin |
| Reservas | Selección de servicio/profesional/fecha/hora, exclusión de solapamientos, reprogramación, cancelación, completado y ausente | Migraciones, catálogo revisado, profesionales y jornadas |
| Avisos | Outbox persistente, confirmación a estudio/clienta, recordatorio 24 h, invalidación de avisos anteriores | Credenciales, plantillas, remitente y programador HTTP |
| Fidelidad | Sellos únicos por visita terminada, hitos 6/8/15, condiciones configurables, producto elegible a elección y descuento de stock | Condiciones de premios y stock |
| Comercio | Carrito persistente, cantidades/totales validados, precios en centavos, pedidos/stock transaccionales, vencimiento e idempotencia | Supabase, stock confirmado y Mercado Pago |
| Mercado Pago | Checkout Pro, preferencia y lease, firma del webhook, consulta al proveedor, cuenta/entorno/monto/moneda, reembolsos y snapshots fuera de orden | Cuenta de prueba y prueba completa del webhook |
| Correo Argentino | Contrato TypeScript del adaptador y estado no disponible; retiro local habilitado en el flujo | API/contrato de la cuenta, cotización y etiquetas: **no implementados** |
| Medición | Eventos dataLayer/GA4, Pixel, consentimiento, CAPI Purchase por outbox y deduplicación de ID | IDs/tags, tokens y pruebas en herramientas de los proveedores |
| SEO | BeautySalon/Product JSON-LD seguro, canonical por página pública, sitemap, robots y noindex privado | Dominio final y datos reales de dirección/horarios; no se inventan |

AgendaPro continúa disponible en `/turnos` y en los enlaces originales. La agenda propia está en `/reservar`.

## Desarrollo local en Windows

Se usa Node 24. El proyecto fija Next.js y eslint-config-next en 16.3.8, actualizado desde 16.3.4 durante esta implementación.

```powershell
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1 --port 3100
```

Abrir `http://127.0.0.1:3100`. `.env.local` ya se preparó con campos vacíos y está ignorado por Git. Si no existe en otra copia del proyecto, copiar `.env.example` y ajustar `NEXT_PUBLIC_SITE_URL` a la dirección usada. No sobrescribir un `.env.local` existente.

Sin Supabase la tienda y el carrito funcionan localmente; cuentas y reservas muestran configuración pendiente. El checkout no permite cobrar. No hay usuarios de ejemplo con permisos elevados ni almacenamiento de reservas en memoria.

## Preparar Supabase de pruebas

1. Crear un proyecto aislado para pruebas. No aplicar directamente estos cambios a una base con datos reales sin revisión y backup.
2. Aplicar **todos** los SQL en `supabase/migrations/` por orden numérico antes de conectar clientes a la API. Los scripts usan transacciones. Son migraciones de una sola ejecución, no scripts para repetir sobre la misma base.
3. Aplicar `supabase/seed.sql`. El seed conserva registros existentes mediante `ON CONFLICT DO NOTHING`. `node scripts/generate-seed.mjs` lo regenera desde el catálogo del repositorio.
4. Revisar duraciones y precios. El catálogo existente tenía cuatro precios cero y una duración de agenda distinta del tratamiento; esos servicios no se habilitan automáticamente en el seed.
5. Configurar Supabase Auth con el Site URL local y permitir el retorno `/auth/callback` en las URLs de redirección. Para el entorno público de pruebas usar su propia URL HTTPS.
6. Completar en `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La clave privilegiada es exclusiva del servidor. Las operaciones normales usan el cliente autenticado y RLS; no se reemplaza autorización con la clave privilegiada.

7. Registrar la cuenta de la dueña y confirmar su email. Obtener su UUID en Supabase y asignar el primer rol admin desde el editor SQL privado:

```sql
-- Sustituir el UUID por el de la cuenta verificada de la dueña.
update public.profiles
set role = 'admin'
where id = '<UUID_DE_LA_DUENA>'::uuid;
```

El formulario público solo crea clientes. Desde `/admin` se pueden habilitar cuentas como profesionales y asociarlas a una profesional; el panel no concede ni retira roles admin. Deshabilitar acceso profesional oculta su calendario público; restaurarlo reactiva la asociación existente.

8. Cargar profesionales reales, habilitar sus servicios, configurar jornadas y bloqueos, confirmar stock disponible y definir condiciones de premios.

## Reservas, fidelidad y límites operativos

- Tiempos guardados como `timestamptz`, mostrados en `America/Argentina/Buenos_Aires`; intervalos `[inicio, fin)` permiten turnos consecutivos.
- Una restricción de exclusión de Postgres protege la agenda, incluso si dos clientes vieron el mismo horario. Los locks por solicitud evitan duplicar una reserva al reintentar con la misma clave.
- Reprogramar conserva servicio y profesional, valida disponibilidad y aumenta la revisión del turno. Los avisos de revisiones anteriores se cancelan.
- Solo personal autorizado puede completar una visita o registrar ausencia, y solo cuando terminó su intervalo.
- El QR físico abre `/fidelidad` y la tarjeta. **Escanearlo no acredita un sello por sí solo**: el equipo acredita la visita al marcarla completada, evitando que una foto del QR permita sumar visitas falsas.
- Cada visita completada genera un único sello. Los hitos son únicos, acumulativos, sin reinicio automático.
- El descuento de 6 sellos se configura como beneficio del estudio; esta versión registra su entrega, no genera un cupón automático de checkout.
- La recompensa de 15 requiere producto elegido dentro de la lista habilitada y stock confirmado; entrega y descuento de stock son atómicos. La entrega conserva una copia de las condiciones aplicadas.
- Agenda y clientes se consultan de a 30. Las métricas de ventas muestran el neto de los últimos 100 pedidos e indican ese alcance.

## WhatsApp, email y recordatorio 24 h

Completar las variables correspondientes de `.env.example`. WhatsApp usa Cloud API y plantillas aprobadas; la versión Graph se configura explícitamente.

Parámetros de cuerpo que deben tener las plantillas:

| Plantilla | Parámetros, en orden |
|---|---|
| Confirmación clienta | Nombre, servicio, fecha/hora |
| Recordatorio clienta | Nombre, servicio, fecha/hora |
| Aviso al estudio | Nombre clienta, servicio, profesional, fecha/hora, teléfono clienta |

Resend requiere `RESEND_API_KEY`, `EMAIL_FROM` con remitente habilitado y `STUDIO_EMAIL` para el aviso al estudio.

Los permisos WhatsApp/email se guardan en el perfil y se vuelven a verificar antes del envío. Si se reserva con menos de 24 horas de anticipación, se omite el recordatorio vencido. No se informa una entrega real cuando falta configuración: el trabajo queda pendiente y se reintenta después de una hora. Una aceptación con ID de proveedor confirma recepción por el proveedor, no entrega/lectura del destinatario.

Programar llamadas periódicas, por ejemplo cada cinco minutos, a:

```text
GET /api/cron/notifications
Authorization: Bearer <CRON_SECRET_CONFIGURADO>
```

El endpoint también vence reservas de stock y procesa CAPI. No hay un programador remoto activado. No se agregó un deploy ni un cron externo. Proteger el secreto; no incluirlo en una URL pública.

Los trabajos se reclaman mediante lease y se limitan a tres por cola y ejecución. Con este límite, ajustar la frecuencia al volumen esperado. Tras cinco fallos quedan `failed`; los leases vencidos del quinto intento también se cierran. Antes de reencolar manualmente un fallo, comprobar si el proveedor ya aceptó el mensaje. WhatsApp no garantiza deduplicación de envíos con timeout ambiguo. Una cancelación no puede retirar un mensaje que ya está en vuelo; el worker verifica estado, revisión y lease justo antes de enviarlo.

## Mercado Pago de prueba

El usuario indicó que tiene credenciales de prueba y que todavía no tiene Supabase; se continúa con validación local. No se probó ningún cobro real ni de sandbox contra el proveedor.

Variables del servidor:

```dotenv
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
MERCADOPAGO_ENABLED=false
MERCADOPAGO_LIVE_MODE=false
```

Este Checkout Pro no requiere Public Key en el navegador. Mantener deshabilitado hasta tener Supabase, stock y webhooks listos. Después, habilitar explícitamente el entorno de prueba conservando `MERCADOPAGO_LIVE_MODE=false`.

El webhook es `/api/webhooks/mercadopago` y requiere una URL HTTPS pública de pruebas: Mercado Pago no puede notificar a `127.0.0.1`. Antes de usar una preview o un túnel, definir ese entorno deliberadamente. No se publica producción como parte de esta entrega.

- El servidor recalcula las líneas y Postgres decide precios y stock; el importe enviado por el navegador no es confiable.
- Los pedidos reservan stock durante 30 minutos. El worker debe ejecutarse para liberar los vencidos.
- La firma se comprueba antes de consultar el pago; luego se verifican cuenta receptora, entorno, referencia, moneda y monto.
- El retorno del navegador solo consulta el estado persistido. Nunca acredita una compra por sus parámetros.
- Un pago aprobado después de liberar stock queda `paid_review` y requiere reconciliación del estudio; no se entrega automáticamente.
- Reembolsos completos/contracargos son terminales frente a aprobaciones atrasadas. Los reembolsos parciales no disminuyen con snapshots antiguos. No se repone inventario de una venta ya pagada sin revisar la devolución física.
- Un segundo pago distinto para el mismo pedido requiere reconciliación manual; la ruta no lo acredita dos veces.
- Se usa un lease para crear y guardar preferencias. Un timeout ambiguo del proveedor puede requerir revisar preferencias en Mercado Pago; no se promete exactamente una preferencia externa ante todos los cortes de red.

## Analítica, consentimiento y SEO

Eventos: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `schedule_appointment`, `claim_reward`. No se incluyen datos de contacto ni nombres de tratamientos en el dataLayer.

GTM tiene prioridad sobre la carga directa de GA4 para evitar doble instalación. Configurar tags/activadores para estos eventos y hacer que los tags del contenedor respeten Consent Mode; el código no puede garantizar el comportamiento de un tag personalizado configurado por terceros. Pixel usa eventos estándar y `ClaimReward` como evento personalizado.

CAPI implementa `Purchase` confirmado en servidor y comparte el ID `purchase:<pedido>` con Pixel. Los demás eventos se emiten en cliente/dataLayer. Los jobs de compra solo se crean si existe consentimiento válido. Los recibos privados guardan revocaciones aun si llegan antes que el pedido; volver a aceptar crea otro recibo para compras futuras. No se pueden retirar eventos ya enviados ni un request que ya empezó a viajar al proveedor.

`BeautySalon` contiene nombre, teléfono y red social existentes. No se inventaron dirección, horarios, valoraciones ni disponibilidad de productos. Configurar el dominio y los datos reales pendientes antes de verificar elegibilidad para resultados enriquecidos.

## Verificación reproducible

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
# Con el servidor local en 127.0.0.1:3100 y sin Supabase configurado:
npm.cmd run verify:http
```

La suite ejecuta las migraciones en PGlite y modela los grants amplios históricos de Supabase. Verifica denegación de escalada de rol, aislamiento, reservas, revisión de avisos, canjes/stock, estados de pago y revocación. Los proveedores HTTP se simulan exclusivamente en tests con fixtures identificados como pruebas.

La validación HTTP prueba rechazos sin credenciales/origen/secret y la redirección del callback. El navegador verificó catálogo → carrito → cantidad → recarga → checkout deshabilitado y tamaño móvil; evidencia en `docs/evidence/checkout-mobile.jpg`.

**Lo que aún no demuestra esta validación:** concurrencia entre conexiones reales de Postgres, instalación real de Supabase Auth/PostgREST, correos de confirmación y pagos/envíos/eventos recibidos por proveedores reales. Esos pasos necesitan el entorno y las credenciales correspondientes; no se declaran verificados.

## Fuentes consultadas para contratos externos

- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Mercado Pago webhooks: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks
- WhatsApp, colección oficial de Meta: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- Resend: https://resend.com/docs/api-reference/emails/send-email
- Next.js: documentación incluida con la versión instalada en `node_modules/next/dist/docs/`.
