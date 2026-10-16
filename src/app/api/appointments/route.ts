import { apiIdentity, failure, HttpError } from '../../../server/http';
import { appointmentCommand } from '../../../domain/appointment-command';
export async function POST(request:Request) {
  try {
    await apiIdentity(request);
    // Keep the server closed too until a verified deposit can confirm a booking.
    throw new HttpError(503,'Las reservas online están pendientes de integrar el pago de la seña obligatoria de $10.000. Consultá con el estudio.');
  } catch(error) { return failure(error); }
}
export async function PATCH(request:Request) {
  try {
    const {db} = await apiIdentity(request);
    const command = appointmentCommand(await request.json());
    const {error} = await db.rpc(command.name,command.params);
    if (error) throw new HttpError(403,'No se pudo cambiar el turno. Revisá tus permisos y el estado de la reserva.');
    return Response.json({ok:true});
  } catch(error) { return failure(error); }
}
