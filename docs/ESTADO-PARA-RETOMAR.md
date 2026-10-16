# Registro de pausa y retomada — 16 de octubre de 2026

El usuario retomó con «seguimos». La pausa ya terminó. El registro de abajo conserva el estado histórico al cerrar la primera sesión; para el estado actual ver `IMPLEMENTACION.md` y `VERIFICACION.md`.

En la retomada se conectaron reprogramación/ausencias, filtros/paginación, contactos profesionales, permisos, bloqueos y condiciones de premios. Se agregaron las migraciones 006–007 y se corrigieron las carreras de idempotencia, reembolso y consentimiento. El usuario tiene credenciales de prueba Mercado Pago, pero no Supabase; pidió continuar validación local. Se preparó `.env.local` ignorado por Git, sin inventar secretos.

## Guardado localmente

Cambios sin commit en `C:\Users\Quim\Documents\lumiere`. No hubo deploy, push, configuración de credenciales ni ejecución de SQL remoto. El sitio publicado conserva su funcionamiento anterior.

- Plan aprobado: `docs/superpowers/specs/2026-10-16-lumiere-platform-design.md`.
- Plan de implementación y decisiones: `docs/superpowers/plans/2026-10-16-lumiere-platform.md`.
- Dependencias Supabase SSR, Zod, QR y Vitest/PGlite; scripts `test` y `typecheck`.
- `.env.example` sin credenciales; se permite su seguimiento en `.gitignore`.
- Catálogo tipado, reglas de carrito/agenda/fidelidad, carrito local y botones del catálogo.
- Rutas de autenticación, cuenta, agenda, administración, fidelidad, checkout y resultado. Sin configuración muestran estados pendientes; no se habilita autenticación de prueba.
- Cinco migraciones SQL y `supabase/seed.sql` generado del catálogo real. No aplicar parcialmente ni directamente a producción.
- Turnos y fidelidad mediante funciones SQL restringidas. Exclusión de intervalos en Postgres; reservas, cancelación, completado, reprogramación y ausente en SQL.
- Outbox de notificaciones, worker autenticado, adaptadores WhatsApp Cloud API/Resend, Mercado Pago y CAPI. No se comprobaron entregas ni pagos reales.
- Correo Argentino es SOLO interfaz deshabilitada, no cotiza ni genera etiquetas.
- Analítica con consentimiento, JSON-LD, sitemap y robots.

## Validación obtenida antes de la pausa

- `npm.cmd test`: 34 pruebas pasaron. Incluyen Postgres embebido con grants históricos de Supabase, RLS, escalada de rol, solapamiento, sellos, precios/stock, pago repetido, revocación de tracking y reprogramación.
- `npm.cmd run lint`: salida 0.
- `npm.cmd run typecheck`: salida 0.
- Instalación del parche terminada: Next.js solicitado, instalado y registrado en lockfile = `16.3.8`; `eslint-config-next` fijado también a `16.3.8`. No queda instalación pendiente al confirmar que puede cerrar.
- Build final y pruebas en navegador pendientes; el build del sitio original había pasado, pero eso NO valida esta implementación nueva.
- PGlite no prueba concurrencia real entre conexiones ni la configuración real de Supabase Auth/PostgREST.
- Revisión independiente realizada. Se reprodujeron y corrigieron grants históricos, finalización futura, revocación CAPI, reintento final del worker y condiciones obligatorias de premios en SQL. Falta terminar toda la revisión funcional.

## Pendiente prioritario al retomar

1. Verificar instalación/lockfile de Next.js 16.3.8 y `eslint-config-next` 16.3.8; se actualizan desde 16.3.4 por avisos de seguridad. La instalación requirió permisos sobre caché npm. Releer las guías incluidas si cambia versión. Usar `npm.cmd` en PowerShell.
2. Ejecutar `npm.cmd run build`, corregir cualquier fallo, repetir validaciones apropiadas y probar navegador móvil/escritorio.
3. Conectar UI/API de reprogramación y ausente; ya existen funciones SQL pero los controles actuales solo cancelan/completan.
4. Agregar filtros/paginación de agenda y clientes. La consulta actual ordena ascendente con límite 100: es una limitación conocida, no usar como agenda operativa con volumen.
5. Conectar `appointment_contacts` al panel profesional: hoy muestra UUID cliente. Configurar bloqueos/descansos desde panel usando `add_schedule_block`.
6. Agregar controles administrativos para `configure_reward`: el canje ahora exige reglas habilitadas, porcentaje para 6 y producto elegible para 15. No inventar condiciones del negocio.
7. Emitir `claim_reward` tras canje confirmado; el contrato existe pero el formulario administrativo todavía no emite el evento. Revisar `view_item` si se acepta consentimiento después de haber visto un producto.
8. Completar verificación de eventos GA4/GTM/Pixel, revocación y CAPI en sandbox. Los tags personalizados de GTM deben respetar consentimiento. La revocación de compras usa recibo privado del navegador; mensajes o conversiones ya enviados/en vuelo no se pueden retirar.
9. Probar HTTP real de cada adaptador con mocks y luego cuentas sandbox. Verificar WhatsApp Graph/plantillas aprobadas y respuestas de aceptación, Resend/remitente, Mercado Pago firma/cuenta/entorno/expiración y eventos de reembolso parcial.
10. Revisar lease de preferencia Mercado Pago y comportamiento frente a timeout ambiguo. Reintentos externos no garantizan exactamente una entrega sin soporte del proveedor.
11. Documentar activación: migraciones en orden, seed, administrador inicial por SQL privado, profesionales/horarios reales, stock y scheduler autenticado. No hay credenciales ni programador remoto configurados.
12. Auditar dependencias remanentes, sin `audit fix --force`. La actualización quita avisos de Next; había avisos altos adicionales que requieren clasificación.

Mantener AgendaPro mientras no se valide el reemplazo. No desplegar producción sin aprobación explícita.
