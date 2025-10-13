import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Phone, Mail, MapPin, Stethoscope, Building2, Star } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

const Pros = () => {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from("health_professionals")
        .select("*")
        .order("is_primary_doctor", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error("Error loading professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "doctor":
      case "specialist":
        return <Stethoscope className="h-5 w-5 text-primary" />;
      case "pharmacy":
        return <Building2 className="h-5 w-5 text-primary" />;
      default:
        return <Stethoscope className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Professionnels de santé</h1>
            <p className="text-sm text-muted-foreground">{professionals.length} contact(s)</p>
          </div>
          <Button className="gradient-primary" onClick={() => navigate("/pros/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : professionals.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun professionnel enregistré</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {professionals.map((pro) => (
              <Card key={pro.id} className="p-4 surface-elevated hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {getIcon(pro.type)}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{pro.name}</h3>
                          {pro.is_primary_doctor && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Médecin traitant
                            </Badge>
                          )}
                        </div>
                        {pro.specialty && <Badge variant="muted" className="mt-1">{pro.specialty}</Badge>}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {pro.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${pro.phone}`} className="hover:text-primary transition-colors">
                            {pro.phone}
                          </a>
                        </div>
                      )}
                      {pro.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${pro.email}`} className="hover:text-primary transition-colors">
                            {pro.email}
                          </a>
                        </div>
                      )}
                      {pro.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{pro.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default Pros
