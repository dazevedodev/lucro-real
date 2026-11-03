// América/São_Paulo não observa horário de verão desde 2019, então o offset
// fixo de -3h é seguro aqui e evita puxar timezone data no runtime.
const BR_OFFSET_MS = -3 * 60 * 60 * 1000;

export function getPeriodStarts(): { dayStart: string; weekStart: string; monthStart: string } {
  const nowShifted = new Date(Date.now() + BR_OFFSET_MS);

  const dayStartShifted = new Date(
    Date.UTC(nowShifted.getUTCFullYear(), nowShifted.getUTCMonth(), nowShifted.getUTCDate())
  );

  const weekday = dayStartShifted.getUTCDay(); // 0 = domingo
  const diffToMonday = weekday === 0 ? 6 : weekday - 1;
  const weekStartShifted = new Date(dayStartShifted);
  weekStartShifted.setUTCDate(weekStartShifted.getUTCDate() - diffToMonday);

  const monthStartShifted = new Date(Date.UTC(nowShifted.getUTCFullYear(), nowShifted.getUTCMonth(), 1));

  return {
    dayStart: new Date(dayStartShifted.getTime() - BR_OFFSET_MS).toISOString(),
    weekStart: new Date(weekStartShifted.getTime() - BR_OFFSET_MS).toISOString(),
    monthStart: new Date(monthStartShifted.getTime() - BR_OFFSET_MS).toISOString(),
  };
}
