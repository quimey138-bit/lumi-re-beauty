export type BookingService = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  category: string;
  description: string;
  note: string;
};

export type BookingProfessional = {
  id: string;
  name: string;
  photo: string | null;
  specialty: string;
  days: string;
  hoursConfigured: boolean;
};

export type ServiceMapping = { professional_id: string; service_id: string };

export const bookingCategories = ['Faciales', 'Masajes', 'Cejas y Pestañas', 'Corporales', 'Manos y Pies', 'Otros'];

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

export function filterBookingServices(services: BookingService[], mappings: ServiceMapping[], filters: { query: string; category: string; professional: string }) {
  const terms = normalized(filters.query).split(/\s+/).filter(Boolean);
  return services.filter(service => {
    const text = normalized(`${service.name} ${service.category} ${service.description}`);
    return (!filters.category || filters.category === service.category)
      && (!filters.professional || mappings.some(mapping => mapping.service_id === service.id && mapping.professional_id === filters.professional))
      && terms.every(term => text.includes(term));
  });
}

export function bookingMoney(priceCents: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(priceCents / 100);
}

export function bookingDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours} h${remainder ? ` ${remainder} min` : ''}` : `${minutes} min`;
}
