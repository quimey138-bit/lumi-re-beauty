import 'server-only';
export type Parcel={weightGrams:number;widthCm:number;heightCm:number;lengthCm:number};
export interface ShippingProvider {
 quote(input:{origin:string;destination:string;parcel:Parcel}):Promise<{id:string;priceCents:number;expiresAt:string}[]>;
 createShipment(input:{orderId:string;quoteId:string}):Promise<{tracking:string;labelUrl:string}>;
}
// The account's MiCorreo/PAQ.AR contract must be confirmed before implementing HTTP.
export class CorreoArgentino implements ShippingProvider {
 async quote(input:Parameters<ShippingProvider['quote']>[0]):ReturnType<ShippingProvider['quote']>{void input;throw new Error('Correo Argentino pendiente de habilitación y validación de contrato');}
 async createShipment(input:Parameters<ShippingProvider['createShipment']>[0]):ReturnType<ShippingProvider['createShipment']>{void input;throw new Error('Despacho pendiente de configuración');}
}
