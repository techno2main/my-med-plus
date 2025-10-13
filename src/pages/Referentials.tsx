import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Users, Stethoscope, AlertCircle, Pill } from "lucide-react"

const Referentials = () => {
  const navigate = useNavigate()

  const categories = [
    {
      title: "Professionnels de Santé",
      description: "Médecins, pharmacies et laboratoires",
      icon: Stethoscope,
      path: "/referentials/health-professionals"
    },
    {
      title: "Pathologies",
      description: "Gestion des pathologies",
      icon: AlertCircle,
      path: "/referentials/pathologies"
    },
    {
      title: "Allergies",
      description: "Gestion des allergies",
      icon: AlertCircle,
      path: "/referentials/allergies"
    },
    {
      title: "Médicaments",
      description: "Catalogue complet des médicaments",
      icon: Pill,
      path: "/medications"
    }
  ]

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Référentiels</h1>
          <p className="text-sm text-muted-foreground">Gérez vos référentiels de données</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <Card
              key={category.path}
              className="p-6 surface-elevated hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(category.path)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

export default Referentials
