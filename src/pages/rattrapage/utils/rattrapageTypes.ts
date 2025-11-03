export interface IntakeAction {
  id: string;
  action: 'taken' | 'skipped' | 'taken_now' | 'pending';
  takenAt?: string;
  scheduledTime?: string;
  actualTakenTime?: string;
}

export interface ConfirmationDialog {
  isOpen: boolean;
  intakeId: string;
  action: 'taken' | 'skipped' | 'taken_now' | 'pending';
  medicationName: string;
  scheduledTime: string;
  displayTime: string;
  dayName: string;
  actualTakenTime?: string;
}

export const getActionIcon = (action: 'taken' | 'skipped' | 'taken_now' | 'pending') => {
  return action;
};

export const getActionLabel = (action: 'taken' | 'skipped' | 'taken_now' | 'pending'): string => {
  switch (action) {
    case 'taken':
    case 'taken_now':
    case 'skipped':
      return 'Prêt';
    default:
      return 'À traiter';
  }
};
