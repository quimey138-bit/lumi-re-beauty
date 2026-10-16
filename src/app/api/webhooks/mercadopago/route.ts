import {z} from 'zod';
import {verifyPaymentSignature} from '../../../../domain/payments';
import {verifiedPayment} from '../../../../integrations/mercadopago';
import {adminClient} from '../../../../lib/supabase/admin';
export async function POST(request:Request){
  const secret=process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if(!secret)return Response.json({error:'Not configured'},{status:503});
  const url=new URL(request.url);const id=url.searchParams.get('data.id')||'';
  if(!/^\d{1,40}$/.test(id)||!verifyPaymentSignature({signature:request.headers.get('x-signature'),requestId:request.headers.get('x-request-id'),id,secret}))return Response.json({error:'Invalid signature'},{status:401});
  try{
    const body=z.object({type:z.literal('payment'),data:z.object({id:z.union([z.string(),z.number()])})}).parse(await request.json());
    if(String(body.data.id)!==id)return Response.json({error:'Mismatched payment'},{status:400});
    const payment=await verifiedPayment(id);
    const amount=Math.round(payment.transaction_amount*100);
    if(!Number.isSafeInteger(amount))return Response.json({error:'Invalid amount'},{status:400});
    const {error}=await adminClient().rpc('settle_order',{p_order:payment.external_reference,p_payment:String(payment.id),p_amount:amount,p_currency:payment.currency_id,p_status:payment.status,p_refunded:Math.round(payment.transaction_amount_refunded*100),p_updated:payment.date_last_updated||null});
    if(error)return Response.json({error:'Payment reconciliation failed'},{status:409});
    return Response.json({received:true});
  }catch{return Response.json({error:'Payment verification unavailable'},{status:503});}
}
