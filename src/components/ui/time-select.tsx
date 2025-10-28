import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimeSelect({ value, onValueChange, placeholder = "HH:MM", className }: TimeSelectProps) {
  // Générer toutes les heures de 00:00 à 23:45 par tranches de 15 minutes
  const timeOptions = Array.from({ length: 24 }, (_, h) => 
    Array.from({ length: 4 }, (_, q) => {
      const hour = h.toString().padStart(2, '0');
      const minute = (q * 15).toString().padStart(2, '0');
      return `${hour}:${minute}`;
    })
  ).flat();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((timeValue) => (
          <SelectItem key={timeValue} value={timeValue}>
            {timeValue}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}