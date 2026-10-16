# Lumière Platform Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans in this session. Steps use checkbox syntax.

**Goal:** Implement the approved platform incrementally in the existing repository, with explicit configuration gates.
**Architecture:** Next.js App Router, Supabase SSR/Auth and Postgres RLS/RPC transactions. Pure domain rules are tested independently of providers. External services have server-only adapters.
**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, Supabase, Zod, Vitest.
**Spec:** `docs/superpowers/specs/2026-10-16-lumiere-platform-design.md` (approved).

## Global constraints
- Work directly in the requested directory; preserve current files and AgendaPro fallback.
- No real credentials, production deployment, remote database changes or invented business data.
- Fail closed when provider configuration is absent; never replace authentication with demo roles.
- ARS amounts in integer cents; persisted timestamps in UTC and display in Argentina time.

## Review focus
- Concurrent requests must not double-book, duplicate rewards or acknowledge unpaid orders.
- Clients cannot choose their role or mutate another customer's data.
- Corrupt browser storage and forged checkout totals must not affect server amounts.
- Cancellation/reprogramming must prevent stale reminders.
- Tracking must honor consent and not include customer contact or treatment information.

## Tasks

### 1. Domain and configuration
Files: `src/domain/{commerce,booking,loyalty,security}.ts`, `src/data/products.ts`, `src/lib/config.ts`, `tests/domain.test.ts`, `.env.example`.
Interfaces: `quoteCart(unknown)`, `parseCart(unknown)`, `reminderAt(string, Date)`, `availableSlots(...)`, `safeNext(unknown)`.
- [x] Add tests for invalid quantities/IDs, manipulated amounts, interval overlap, 24-hour boundaries and open redirects; run red.
- [x] Implement rules and typed catalogue; run green.

### 2. Auth and persistence
Files: `src/lib/supabase/*`, `src/server/auth.ts`, `src/proxy.ts`, `src/app/ingresar/*`, `src/app/auth/*`, `supabase/migrations/*`.
Interfaces: `getIdentity()`, `requireIdentity(roles?)`, authenticated Supabase client, RLS-protected records.
- [x] Implement SSR registration/login/logout and safe callback, validated input, default client role.
- [x] Add schema, restricted roles, agenda exclusion constraint, atomic booking and loyalty RPCs, notification outbox.
- [x] Validate build without credentials; execute SQL tests in embedded Postgres. Auth/PostgREST and multi-connection tests remain external validation.

### 3. Reservations and private dashboards
Files: `src/app/{reservar,cuenta,admin,profesional,fidelidad}/**`, `src/app/api/{availability,appointments,loyalty}/**`, `src/components/platform-*`.
Interfaces: availability returns only slots; bookings and completion use restricted transactional RPCs.
- [x] Connect professional/service/time selection and appointment creation; surface conflict and missing configuration.
- [x] Add personal history, protected agenda, authorized completion, QR entry and reward redemption.
- [x] Verify no-configuration pages and denied HTTP requests via local HTTP/browser. Authenticated navigation pending Supabase.

### 4. Commerce and provider services
Files: `src/components/cart-*`, `src/app/{carrito,checkout}/**`, `src/app/api/{checkout,webhooks,cron}/**`, `src/integrations/*`.
Interfaces: server recalculates order totals; verified webhook controls paid state; notification worker claims persistent jobs.
- [x] Test webhook HMAC/amount validation and reminder invalidation before implementation.
- [x] Add persistent cart with validated storage, checkout, local pickup and parameterized Mercado Pago/Correo interfaces.
- [x] Add WhatsApp/email adapters and authenticated outbox worker; absent credentials leave work pending rather than claim delivery.

### 5. Tracking, SEO and final verification
Files: `src/components/analytics.tsx`, `src/lib/analytics.ts`, `src/app/{layout,sitemap,robots}.tsx`, `docs/IMPLEMENTATION.md`.
- [x] Add consent-gated events, product/salon JSON-LD and private-route noindex.
- [x] Run complete tests, lint, TypeScript and build. Review full changes and correct material findings.
- [x] Document local setup, migrations, test evidence and remaining provider/sandbox validation.

## Execution ledger
Ruling: The user explicitly approved the design and asked to start modifying; execute inline without another approval round. Work in place per the original directory instruction. Leave reviewable uncommitted changes; no automatic commits or remote writes.
Pre-flight: tasks 3/4 consume authenticated client from task 2; task 4 consumes cents-based catalog from task 1; task 5 observes only successful operations from tasks 3/4.

### Estado de ejecución tras la retomada

- Task 1: implementación y pruebas locales completas; esquema de configuración y catálogo tipado.
- Task 2: SSR/RLS/migraciones implementados y probados con PGlite; pendiente Auth/PostgREST reales.
- Task 3: agenda, reprogramación, ausente, contactos, paginación, bloqueos y paneles conectados; navegación sin configuración verificada. Navegación autenticada pendiente de Supabase.
- Task 4: carrito/checkout/adaptadores/worker implementados; pruebas HTTP simuladas y denegaciones locales verificadas. Correo sigue como interfaz deshabilitada según contrato no disponible. Proveedores reales pendientes.
- Task 5: analítica/SEO y runbook agregados. 56 tests, 7 HTTP, lint, TypeScript y build pasaron. Evidencia en `docs/VERIFICACION.md`.
- Ruling: wrapper privado para funciones SQL versionadas evita reescribir migraciones ya definidas; ningún cliente puede ejecutar los helpers `_..._v1`.
- Ruling: consentimiento se asocia dentro de la transacción de pedido y registra revocaciones antes de existir una orden; renovar consentimiento crea recibo nuevo para compras futuras.
- Ruling: tests WASM de PGlite se ejecutan sin competir con un build pesado tras observar un timeout de arranque por recursos.
- Ruling: user confirmó credenciales Mercado Pago de prueba, pero no proyecto Supabase; continuar validación local, sin crear servicios externos ni habilitar pagos.
- Final review: revisor independiente, hallazgos importantes corregidos; la prueba multiconexión real y proveedores siguen explícitamente pendientes, no se infieren del build.
