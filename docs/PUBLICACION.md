# Publicación para revisión con la dueña

Destino autorizado: rama `main` de `quimey138-bit/lumi-re-beauty`, proyecto Vercel `quim2/lumiere-beauty`, dominio `https://lumiere-beauty-smoky.vercel.app`.

## Entorno de producción

Configurar únicamente `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://lumiere-beauty-smoky.vercel.app`, `MERCADOPAGO_ENABLED=false` y `MERCADOPAGO_LIVE_MODE=false`. Obtener los dos valores de Supabase de `.env.local`, sin subir ese archivo. No copiar tokens de Mercado Pago, claves de servicio, cron, WhatsApp, email ni Correo.

## Cierre previo de operaciones sin pagos

Ejecutar en SQL Editor del proyecto Supabase existente [close-unpaid-checkout.sql](../supabase/release/close-unpaid-checkout.sql). El script comprueba firmas y objetos de la migración 007 antes de modificar permisos y aborta si no coinciden. No repite migraciones ni seeds. También comprueba que los roles públicos no tengan INSERT directo sobre turnos/pedidos. Su resultado final debe mostrar `reservas_habilitadas=false` y `pedidos_habilitados=false`.

El formulario y POST `/api/appointments` rechazan nuevas reservas mientras no se verifique la seña obligatoria de $10.000. El cierre SQL evita que una cuenta autenticada eluda la web llamando directamente a Supabase; también impide bloquear stock a través de pedidos sin pagos ni worker de vencimiento. Las cuentas, roles, consultas, administración de datos y sellos se conservan. Restaurar permisos requiere integrar y validar los pagos y sus procesos de expiración; las banderas de Mercado Pago por sí solas no restauran estos permisos.

## URLs de autenticación

En Supabase, Authentication → URL Configuration:

- Site URL: `https://lumiere-beauty-smoky.vercel.app`.
- Agregar Redirect URL exacta: `https://lumiere-beauty-smoky.vercel.app/auth/callback`.
- Conservar los callbacks locales existentes, incluido `http://127.0.0.1:3100/auth/callback`; agregar `http://localhost:3000/auth/callback` solo si se usa ese origen.

La verificación pública no debe crear reservas, cobros ni entregas. El acceso del administrador sin sesión debe redirigir a `/ingresar` y no exponer datos.
