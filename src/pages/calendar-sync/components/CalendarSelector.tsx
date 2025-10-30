import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import type { NativeCalendar } from '../types';

interface CalendarSelectorProps {
  calendars: NativeCalendar[];
  selectedCalendarId: string | null;
  onSelectCalendar: (calendarId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const CalendarSelector = ({
  calendars,
  selectedCalendarId,
  onSelectCalendar,
  onRefresh,
  loading
}: CalendarSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sélection du calendrier
        </CardTitle>
        <CardDescription>
          Choisissez le calendrier natif où synchroniser vos événements de santé
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select
            value={selectedCalendarId || ''}
            onValueChange={onSelectCalendar}
            disabled={loading || calendars.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionner un calendrier" />
            </SelectTrigger>
            <SelectContent>
              {calendars.map(calendar => (
                <SelectItem key={calendar.id} value={calendar.id}>
                  {calendar.displayName}
                  {calendar.isPrimary && ' (Principal)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {calendars.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            Aucun calendrier disponible. Vérifiez les permissions de l'application.
          </p>
        )}

        {selectedCalendarId && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium">Calendrier sélectionné</p>
            <p className="text-sm text-muted-foreground">
              {calendars.find(c => c.id === selectedCalendarId)?.displayName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
