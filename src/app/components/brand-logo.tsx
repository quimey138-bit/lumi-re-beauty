import Image from "next/image";

export function BrandLogo({ variant = "header" }: { variant?: "header" | "hero" | "footer" }) {
  return <span className={`brand-logo brand-logo-${variant}`}><Image src="/logo-lumiere.png" width={3375} height={3375} alt="Lumière Beauty" sizes={variant === "hero" ? "(max-width: 900px) 90vw, 45vw" : "160px"} priority={variant !== "footer"} /></span>;
}
