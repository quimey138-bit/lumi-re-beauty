import {it,expect} from 'vitest';
import {createHmac} from 'node:crypto';
import {verifyPaymentSignature} from '../src/domain/payments';
it('verifies Mercado Pago signatures and rejects tampered or stale requests',()=>{
  const now=1792150000000;const ts=String(now);const id='123';const requestId='req-1';const secret='test-secret';
  const hash=createHmac('sha256',secret).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex');
  expect(verifyPaymentSignature({signature:`ts=${ts},v1=${hash}`,requestId,id,secret,now})).toBe(true);
  expect(verifyPaymentSignature({signature:`ts=${ts},v1=${hash}`,requestId,id:'456',secret,now})).toBe(false);
  expect(verifyPaymentSignature({signature:`ts=${ts},v1=${hash}`,requestId,id,secret,now:now+600000})).toBe(false);
  expect(verifyPaymentSignature({signature:'invalid',requestId,id,secret,now})).toBe(false);
});
