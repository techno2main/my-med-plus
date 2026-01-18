export interface IntakeAction {
  id: string;
  action: 'taken' | 'missed' | 'skipped' | 'taken_now' | 'pending';
  takenAt?: string;
  scheduledTime?: string;
  actualTakenTime?: string;
}

export interface ConfirmationDialog {
  isOpen: boolean;
  intakeId: string;
  action: 'taken' | 'missed' | 'skipped' | 'taken_now' | 'pending';
  medicationName: string;
  dosage?: string;
  scheduledTime: string;
  displayTime: string;
  dayName: string;
  actualTakenTime?: string;
}

export const getActionIcon = (action: 'taken' | 'skipped' | 'taken_now' | 'pending') => {
  return action;
};

export const getActionLabel = (action: 'taken' | 'missed' | 'skipped' | 'taken_now' | 'pending'): string => {
  switch (action) {
    case 'taken':
    case 'taken_now':
    case 'missed':
    case 'skipped':
      return 'Prêt';
    default:
      return 'À mettre à jour';
  }
};
