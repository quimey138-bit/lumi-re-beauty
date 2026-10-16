import { createHmac,timingSafeEqual } from 'node:crypto';
type SignatureInput={signature:string|null;requestId:string|null;id:string;secret:string;now?:number};
export function verifyPaymentSignature({signature,requestId,id,secret,now=Date.now()}:SignatureInput) {
  if(!signature||!requestId||!id||!secret)return false;
  const parts=Object.fromEntries(signature.split(',').map(part=>part.trim().split('=')));
  if(!/^\d{10,13}$/.test(parts.ts||'')||!/^[a-fA-F0-9]{64}$/.test(parts.v1||''))return false;
  const timestamp=Number(parts.ts)*(parts.ts.length===10?1000:1);
  if(Math.abs(now-timestamp)>300000)return false;
  const expected=createHmac('sha256',secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest();
  return timingSafeEqual(expected,Buffer.from(parts.v1,'hex'));
}
