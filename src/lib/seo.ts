import {products} from '../data/products';
export const jsonLd=(value:unknown)=>JSON.stringify(value).replace(/</g,'\\u003c');
export function businessSchema(base:string|null){return {'@context':'https://schema.org','@type':'BeautySalon',name:'Lumière Beauty',telephone:'+5491158875779',sameAs:['https://www.instagram.com/lumierebeauty.ar'],...(base?{url:base}:{}),priceRange:'ARS'};}
export function productSchema(base:string){return {'@context':'https://schema.org','@type':'ItemList',itemListElement:products.map((p,index)=>({'@type':'ListItem',position:index+1,item:{'@type':'Product',name:p.name,sku:p.id,image:`${base}/products/${p.image}`,url:`${base}/insumos#${p.id}`,offers:{'@type':'Offer',priceCurrency:'ARS',price:p.priceCents/100,url:`${base}/insumos#${p.id}`}}}))};}
