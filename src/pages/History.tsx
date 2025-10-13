import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";

export default function History() {
  // Mock data - à remplacer par des vraies données
  const historyData = [
    {
      date: new Date(),
      intakes: [
        { id: 1, time: "08:00", medication: "Metformine 850mg", status: "taken", takenAt: "08:05" },
        { id: 2, time: "13:00", medication: "Atorvastatine 20mg", status: "taken", takenAt: "13:10" },
        { id: 3, time: "22:00", medication: "Zolpidem 10mg", status: "pending" },
      ]
    },
    {
      date: subDays(new Date(), 1),
      intakes: [
        { id: 4, time: "08:00", medication: "Metformine 850mg", status: "taken", takenAt: "08:15" },
        { id: 5, time: "13:00", medication: "Atorvastatine 20mg", status: "taken", takenAt: "13:05" },
        { id: 6, time: "22:00", medication: "Zolpidem 10mg", status: "skipped" },
      ]
    },
    {
      date: subDays(new Date(), 2),
      intakes: [
        { id: 7, time: "08:00", medication: "Metformine 850mg", status: "taken", takenAt: "08:00" },
        { id: 8, time: "13:00", medication: "Atorvastatine 20mg", status: "taken", takenAt: "13:20" },
        { id: 9, time: "22:00", medication: "Zolpidem 10mg", status: "taken", takenAt: "22:05" },
      ]
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "skipped":
        return <XCircle className="h-5 w-5 text-danger" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "taken":
        return <Badge variant="success">Pris</Badge>;
      case "skipped":
        return <Badge variant="danger">Oublié</Badge>;
      case "pending":
        return <Badge variant="warning">À venir</Badge>;
      default:
        return null;
    }
  };

  const calculateAdherence = (days: number = 7) => {
    // Mock calculation
    return 85;
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Historique</h1>
          <p className="text-muted-foreground">Suivez vos prises de médicaments</p>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {historyData.map((day, dayIdx) => (
              <Card key={dayIdx} className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">
                    {format(day.date, "EEEE d MMMM yyyy", { locale: fr })}
                  </h3>
                </div>

                <div className="space-y-3">
                  {day.intakes.map((intake) => (
                    <div key={intake.id} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(intake.status)}
                        <div className="flex-1">
                          <p className="font-medium">{intake.medication}</p>
                          <p className="text-sm text-muted-foreground">
                            Prévu à {intake.time}
                            {intake.takenAt && ` • Pris à ${intake.takenAt}`}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(intake.status)}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Observance thérapeutique</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">7 derniers jours</p>
                    <p className="text-2xl font-bold text-primary">{calculateAdherence(7)}%</p>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-3">
                    <div 
                      className="bg-gradient-primary h-3 rounded-full transition-all" 
                      style={{ width: `${calculateAdherence(7)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">30 derniers jours</p>
                    <p className="text-2xl font-bold text-primary">92%</p>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-3">
                    <div 
                      className="bg-gradient-primary h-3 rounded-full transition-all" 
                      style={{ width: "92%" }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Résumé</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted-foreground mb-1">Prises validées</p>
                  <p className="text-3xl font-bold text-success">42</p>
                </div>
                <div className="p-4 rounded-lg bg-danger/10">
                  <p className="text-sm text-muted-foreground mb-1">Prises oubliées</p>
                  <p className="text-3xl font-bold text-danger">3</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}