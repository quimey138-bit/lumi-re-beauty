# Turnero visual — 16 de octubre de 2026

Rediseño de `/reservar` a partir de las referencias compartidas: buscador, categorías desplegables, tarjetas con precios y duración, filtro por profesional y resumen de selección. Las fotos de tratamientos quedan pendientes. Se conservaron la autenticación y la consulta de disponibilidad existentes; no se modificaron el carrito ni la tarjeta de sellos.

## Datos y fotografías

- Los nombres, precios, duraciones y servicios habilitados se consultan en Supabase. El catálogo local aporta categoría, descripción y notas, sin reemplazar los precios de la base.
- Las fotografías originales proporcionadas están en `public/team/`: Natt, Maru y el equipo. La grupal se conserva para otra sección y no se muestra en el turnero, según la corrección del usuario. Virginia usa una inicial hasta recibir su foto. Los encuadres se realizan con CSS.
- `src/data/booking-team.ts` contiene las especialidades, el nombre visible Natt (compatible con Nat en la base) y los días informados: Natt de lunes a sábado; Maru lunes, miércoles y jueves; Virginia lunes, martes y sábado.
- Cuando la dueña configura jornadas desde el panel, los días reales de `working_hours` tienen prioridad sobre esos textos iniciales. Los días informativos no crean horarios ni disponibilidad en la base.
- Se incluyó el enlace de Maps recibido para llegar al estudio. No se inventó una dirección postal.

## Reservas y seña

El resumen informa una seña obligatoria de $10.000 ARS. El pago de señas todavía no está integrado: el nuevo formulario permite elegir y consultar disponibilidad, pero no envía confirmaciones ni crea reservas. La fecha queda deshabilitada mientras la profesional no tenga jornadas cargadas.

La API de alta devuelve 503 incluso con una sesión válida mientras no exista verificación de la seña. Las funciones SQL anteriores se conservan para el desarrollo: antes de publicar la configuración de Supabase hay que ejecutar el cierre de permisos de `supabase/release/close-unpaid-checkout.sql`, que primero comprueba el esquema esperado. Esto impide eludir la API invocando las RPC directamente. El script también cierra la creación de pedidos mientras los pagos y el worker de vencimiento estén deshabilitados; no modifica reservas, pedidos, stock ni cuentas existentes.

Antes de habilitar reservas reales hay que incorporar el estado pendiente de pago, bloqueo temporal del horario, vencimiento, verificación del pago por webhook e idempotencia; recién entonces revisar y restaurar los permisos de creación, habilitar el botón de pago y revisar las reglas de cancelación.

## Comprobaciones

Se agregaron pruebas del buscador sin tildes, combinación de filtros, conservación de precios, nombre visible y días de atención. La comprobación en navegador cubre filtros, selección de Natt/Maru/Virginia y el estado sin jornadas, en escritorio y celular. No se realizaron pagos, reservas de prueba en la base remota, deploy ni cambios en las credenciales.

Validación de esta entrega: lint, TypeScript y build finalizaron con salida 0. La suite completa ejecutó 39 pruebas correctamente; las 22 pruebas SQL no llegaron a ejecutarse porque el inicio y cierre de PGlite excedieron sus timeouts. El problema se repitió con un solo worker. No se alteraron los timeouts ni se presenta la suite completa como aprobada.
