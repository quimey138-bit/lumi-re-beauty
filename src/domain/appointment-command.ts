import { z } from 'zod';

const schema = z.discriminatedUnion('action', [
  z.object({ id: z.uuid(), action: z.literal('reschedule'), start: z.iso.datetime({ offset: true }) }),
  z.object({ id: z.uuid(), action: z.enum(['cancel', 'complete', 'absent']) }),
]);

export function appointmentCommand(input: unknown) {
  const value = schema.parse(input);
  if (value.action === 'reschedule') {
    return { name: 'reschedule_appointment', params: { p_id: value.id, p_start: value.start } };
  }
  const names = { cancel: 'cancel_appointment', complete: 'complete_appointment', absent: 'mark_absent' };
  return { name: names[value.action], params: { p_id: value.id } };
}
