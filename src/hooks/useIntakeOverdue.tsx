const TOLERANCE_RULES = {
  morning: { start: 6, end: 12, toleranceHours: 1 },
  afternoon: { start: 12, end: 18, toleranceHours: 1 },
  evening: { start: 18, end: 24, toleranceHours: 1 }
};

export const useIntakeOverdue = () => {
  const isIntakeOverdue = (intakeDate: Date) => {
    const now = new Date();
    const scheduledHour = intakeDate.getHours();
    
    let timeSlot: keyof typeof TOLERANCE_RULES;
    if (scheduledHour >= 6 && scheduledHour < 12) timeSlot = 'morning';
    else if (scheduledHour >= 12 && scheduledHour < 18) timeSlot = 'afternoon';
    else timeSlot = 'evening';
    
    const toleranceMs = TOLERANCE_RULES[timeSlot].toleranceHours * 60 * 60 * 1000;
    const timeDiff = now.getTime() - intakeDate.getTime();
    
    return timeDiff > toleranceMs;
  };

  return { isIntakeOverdue };
};