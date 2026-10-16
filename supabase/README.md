# Base de datos Lumière

Aplicar los SQL de `migrations/` por orden, en un proyecto Supabase de pruebas vacío, antes de conectar la aplicación. Luego ejecutar `seed.sql`. No aplicar solo las primeras migraciones: las posteriores endurecen grants y operaciones.

El seed preserva valores ya existentes. No carga profesionales, horarios, stock ni usuarios ficticios.

Los nombres `_..._v1` son funciones internas sin acceso `anon/authenticated`, reutilizadas por wrappers transaccionales. No concederles permisos públicos. Las migraciones revocan grants históricos de Supabase además de `PUBLIC`; RLS y privilegios de columna protegen `profiles.role`.

Las pruebas en `tests/database.test.ts` crean un esquema Auth mínimo en PGlite, aplican las migraciones y ejercitan sus funciones con roles restringidos. No reemplazan una prueba multiconexión contra Postgres ni la validación del servicio Auth real.

Activación, scheduler y recuperación: `docs/IMPLEMENTACION.md`.
