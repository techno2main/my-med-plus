import { differenceInYears } from "date-fns";

export const calculateAge = (dateOfBirth: Date | undefined): number | null => {
  if (!dateOfBirth) return null;
  return differenceInYears(new Date(), dateOfBirth);
};

export const calculateBMI = (height: string, weight: string): string | null => {
  const h = parseFloat(height);
  const w = parseFloat(weight);
  if (!h || !w) return null;
  const bmi = w / Math.pow(h / 100, 2);
  return bmi.toFixed(1);
};

export const getBMIColor = (bmi: number): string => {
  if (bmi < 18.5) return "text-blue-500";
  if (bmi < 25) return "text-green-500";
  if (bmi < 30) return "text-orange-500";
  return "text-red-500";
};

export const getBMILabel = (bmi: number): string => {
  if (bmi < 18.5) return "Insuffisance pondérale";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Surpoids";
  return "Obésité";
};

export const getInitials = (firstName: string, lastName: string): string => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  return initials.toUpperCase();
};
