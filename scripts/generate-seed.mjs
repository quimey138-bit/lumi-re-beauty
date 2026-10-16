import { readFileSync,writeFileSync } from 'node:fs';
import { products } from '../src/data/products.ts';
const services=JSON.parse(readFileSync('src/data/catalog.json','utf8'));
const sql=s=>"'"+s.replaceAll("'","''")+"'";
const lines=['-- Datos del catálogo existente. Sin profesionales, horarios ni stock inventados.','begin;'];
for(const s of services) lines.push(`insert into public.services(id,name,duration_minutes,price_cents,active) values(${sql(s.id)},${sql(s.name)},${s.duration},${Math.round(s.price*100)},${s.price>0&&s.id!=='servicio-01'}) on conflict(id) do nothing;`);
for(const p of products)lines.push(`insert into public.products(id,name,price_cents) values(${sql(p.id)},${sql(p.name)},${p.priceCents}) on conflict(id) do nothing;`);
lines.push('commit;');
writeFileSync('supabase/seed.sql',lines.join('\n')+'\n');
