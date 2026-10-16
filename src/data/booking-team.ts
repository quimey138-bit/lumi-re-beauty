const team: Record<string, { name: string; photo: string | null; specialty: string; days: string }> = {
  nat: { name: 'Natt', photo: '/team/natt.jpg', specialty: 'Faciales, corporales, cejas y pestañas', days: 'Lunes a sábado' },
  natt: { name: 'Natt', photo: '/team/natt.jpg', specialty: 'Faciales, corporales, cejas y pestañas', days: 'Lunes a sábado' },
  maru: { name: 'Maru', photo: '/team/maru.jpg', specialty: 'Manos y pies', days: 'Lunes, miércoles y jueves' },
  virginia: { name: 'Virginia', photo: null, specialty: 'Masajes', days: 'Lunes, martes y sábado' },
};

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function bookingTeamMember(professional: { id: string; name: string }, hours: { professional_id: string; weekday: number }[]) {
  const presentation = team[professional.name.trim().toLocaleLowerCase('es')];
  const actualDays = [...new Set(hours.filter(hour => hour.professional_id === professional.id).map(hour => hour.weekday))].sort((first, second) => (first || 7) - (second || 7));
  return {
    ...professional,
    name: presentation?.name ?? professional.name,
    photo: presentation?.photo ?? null,
    specialty: presentation?.specialty ?? 'Equipo Lumière',
    days: actualDays.length ? actualDays.map(day => weekdays[day]).join(', ') : presentation?.days ?? 'Días a coordinar con el estudio',
    hoursConfigured: actualDays.length > 0,
  };
}
