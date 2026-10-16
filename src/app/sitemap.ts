import type {MetadataRoute} from 'next';
import {siteUrl} from '../lib/config';
export default function sitemap():MetadataRoute.Sitemap{const base=siteUrl();return base?['','/servicios','/insumos'].map(path=>({url:base+path})):[];}
