import type {MetadataRoute} from 'next';
import {siteUrl} from '../lib/config';
export default function robots():MetadataRoute.Robots{const base=siteUrl();return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/admin','/profesional','/cuenta','/checkout','/carrito','/ingresar','/fidelidad','/reservar']},...(base?{sitemap:`${base}/sitemap.xml`}:{})};}
