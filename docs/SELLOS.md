# Mi ritual Lumière

Rediseño visual de la tarjeta de sellos a partir de las referencias del usuario, sin el bloque QR. La cartilla completa y la actividad están en `/fidelidad`; `/cuenta` muestra la misma tarjeta en versión resumida. La navegación se llama «Mis sellos».

## Comportamiento

- Quince círculos con un destello de Lumière, en tres filas de cinco. Los hitos 6, 8 y 15 tienen un borde distintivo.
- Los sellos acreditados tienen una animación de estampado al mostrarse. Un nuevo sello acreditado por el estudio se refleja al actualizar la tarjeta. Se respeta la preferencia de reducir movimiento.
- El botón de actualización solo vuelve a consultar los datos. No acredita sellos. No hay sellos ficticios, demo en cuentas reales ni reinicio de la tarjeta al llegar a 15.
- El total se obtiene con conteo exacto de Supabase y puede superar los quince espacios visibles. Se consultan los últimos treinta sellos para la actividad, y se muestran los quince movimientos más recientes entre sellos y canjes.
- Las fechas se muestran en horario de Argentina. Cada consulta de sellos y canjes se restringe a la cuenta autenticada y conserva RLS.
- Al visitante sin sesión se le presenta el programa y el enlace a ingresar; no se muestra una cartilla personal de ejemplo.

## Recompensas

Se muestran un descuento a los 6 sellos (20% previsto por el usuario), regalo sorpresa a los 8 y producto a los 15, con entrega/canje en el estudio. Si existe una regla habilitada con otro porcentaje, la tarjeta personal usa ese porcentaje. Las condiciones y los productos elegibles se leen de las reglas existentes.

El rediseño no habilita ni cambia reglas en la base remota. Un premio alcanzado solo se muestra «Disponible en el estudio» si sus condiciones están habilitadas; de lo contrario indica coordinar con el estudio. Los canjes entregados mantienen su estado. La entrega y acreditación siguen restringidas a las operaciones autorizadas del sistema anterior.

Los canjes históricos usan el porcentaje y condiciones guardados en `conditions_snapshot`, no las reglas vigentes. Los registros antiguos sin snapshot muestran una descripción genérica, sin inventar un porcentaje. La presentación para visitantes consulta el descuento habilitado; solo usa el 20% previsto si no hay una regla activa.

El QR administrativo para imprimir en el local sigue disponible, separado de la tarjeta de la clienta. No se modificaron turnero, carrito, credenciales ni migraciones en este cambio.
