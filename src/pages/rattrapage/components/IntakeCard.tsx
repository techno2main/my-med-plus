import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, CheckCircle2, XCircle, Pill, SkipForward } from "lucide-react";
import { IntakeAction } from "../utils/rattrapageTypes";

interface MissedIntake {
  id: string;
  medication: string;
  dosage?: string;
  displayTime: string;
  scheduledTime: string;
  dayName: string;
  status: string;
  medicationId: string;
}

interface IntakeCardProps {
  intake: MissedIntake;
  currentAction: IntakeAction;
  onActionClick: (intakeId: string, action: 'taken' | 'missed' | 'skipped' | 'taken_now') => void;
}

export function IntakeCard({
  intake,
  currentAction,
  onActionClick,
}: IntakeCardProps) {
  const isToday = intake.status === 'missed_today';
  
  const getActionIcon = (action: 'taken' | 'missed' | 'skipped' | 'taken_now' | 'pending') => {
    switch (action) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'taken_now':
        return <Pill className="h-4 w-4 text-primary" />;
      case 'missed':
        return <XCircle className="h-4 w-4 text-danger" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getActionLabel = (action: 'taken' | 'missed' | 'skipped' | 'taken_now' | 'pending') => {
    switch (action) {
      case 'taken':
      case 'taken_now':
      case 'missed':
      case 'skipped':
        return 'Prêt';
      default:
        return 'À traiter';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* En-tête avec date et statut */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isToday ? "default" : "secondary"}
              className="text-xs"
            >
              {intake.dayName}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {getActionIcon(currentAction?.action || 'pending')}
            <span className="text-sm font-medium">
              {getActionLabel(currentAction?.action || 'pending')}
            </span>
          </div>
        </div>

        {/* Informations du médicament */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{intake.medication}</span>
            {intake.dosage && (
              <span className="text-sm text-muted-foreground">
                {intake.dosage}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground pl-6 space-y-1">
            <p>Prévu à {intake.displayTime}</p>
            {currentAction?.actualTakenTime && currentAction.action !== 'pending' && currentAction.action !== 'missed' && currentAction.action !== 'skipped' && (
              <p className="text-primary font-medium">
                Pris à {currentAction.actualTakenTime}
              </p>
            )}
            {currentAction?.action === 'missed' && (
              <p className="text-danger font-medium">
                Prise manquée
              </p>
            )}
            {currentAction?.action === 'skipped' && (
              <p className="text-orange-500 font-medium">
                Prise sautée
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onActionClick(intake.id, 'taken')}
                  className={`w-full gap-1 ${
                    currentAction?.action === 'taken' 
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                      : ''
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Pris
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>J'ai pris le médicament, mais j'ai oublié de cliquer sur le bouton</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onActionClick(intake.id, 'taken_now')}
                  className={`w-full gap-1 ${
                    currentAction?.action === 'taken_now' 
                      ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' 
                      : ''
                  }`}
                >
                  <Pill className="h-3 w-3" />
                  Prendre
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Je prends le médicament maintenant (heure actuelle réelle)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onActionClick(intake.id, 'skipped')}
                  className={`w-full gap-1 ${
                    currentAction?.action === 'skipped' 
                      ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600' 
                      : ''
                  }`}
                >
                  <SkipForward className="h-3 w-3" />
                  Sautée
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>J'ai volontairement sauté cette prise</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={currentAction?.action === 'missed' ? "destructive" : "outline"}
                  onClick={() => onActionClick(intake.id, 'missed')}
                  className={`w-full gap-1 ${
                    currentAction?.action === 'missed' 
                      ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                      : ''
                  }`}
                >
                  <XCircle className="h-3 w-3" />
                  Manquée
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Je n'ai pas pris le médicament et il est trop tard pour le prendre</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
}
