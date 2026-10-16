# Lumière Beauty

La plataforma se desarrolla incrementalmente sobre el sitio existente. AgendaPro sigue disponible; el turnero propio, cuentas y compras requieren configurar Supabase antes de activarse.

- [Implementación y activación](docs/IMPLEMENTACION.md)
- [Evidencia de validación](docs/VERIFICACION.md)
- [Publicación para revisión y cierre de operaciones sin pagos](docs/PUBLICACION.md)
- [Arquitectura aprobada](docs/superpowers/specs/2026-10-16-lumiere-platform-design.md)
- Variables sin secretos: [.env.example](.env.example). Las credenciales locales van en `.env.local`, ignorado por Git.

En Windows usar `npm.cmd`. Pruebas: `npm.cmd test`; validaciones: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`.

---

Referencia del proyecto Next.js original:

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
