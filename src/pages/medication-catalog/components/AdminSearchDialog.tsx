import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Database, Globe, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchANSMApi, getPathologyFromSubstance, type ANSMMedication } from "@/services/ansmApiService"
import { supabase } from "@/integrations/supabase/client"

interface AdminSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (medication: any) => void
}

export const AdminSearchDialog = ({
  open,
  onOpenChange,
  onSelect
}: AdminSearchDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchingAPI, setIsSearchingAPI] = useState(false)
  const [apiResults, setApiResults] = useState<ANSMMedication[]>([])
  const [hasSearchedAPI, setHasSearchedAPI] = useState(false)
  const [catalog, setCatalog] = useState<any[]>([])

  // Charger le catalogue au montage
  useState(() => {
    const loadCatalog = async () => {
      const { data } = await supabase
        .from("medication_catalog")
        .select("id, name, strength")
        .order("name")
      if (data) setCatalog(data)
    }
    if (open) loadCatalog()
  })

  // Recherche locale dans le catalogue
  const localResults = useMemo(() => {
    if (!searchTerm) return []

    const term = searchTerm.toLowerCase()
    return catalog.filter(med =>
      med.name.toLowerCase().includes(term)
    ).slice(0, 10) // Limiter à 10 pour l'aperçu
  }, [catalog, searchTerm])

  // Recherche API ANSM
  const handleSearch = async (value: string) => {
    setSearchTerm(value)
    setHasSearchedAPI(false)
    setApiResults([])

    if (value.length < 3) return

    const term = value.toLowerCase()
    const localMatches = catalog.filter(med =>
      med.name.toLowerCase().includes(term)
    )

    // Seulement si aucun résultat local
    if (localMatches.length === 0 && value.length >= 3) {
      setIsSearchingAPI(true)
      try {
        const results = await searchANSMApi(value)
        setApiResults(results)
        setHasSearchedAPI(true)
      } catch (error) {
        console.error("Erreur recherche API:", error)
      } finally {
        setIsSearchingAPI(false)
      }
    }
  }

  const showNoResults = searchTerm.length >= 3 && localResults.length === 0 && !isSearchingAPI && hasSearchedAPI && apiResults.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Rechercher un médicament</DialogTitle>
          <DialogDescription>
            Recherchez dans le catalogue local ou la base officielle ANSM pour pré-remplir le formulaire
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du médicament..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(85vh-180px)]">
          <div className="px-6 py-4 space-y-3">
            {/* Message d'accueil */}
            {!searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Tapez au moins 3 caractères pour lancer la recherche</p>
                <p className="text-xs mt-1">Recherche dans {catalog.length} médicaments du catalogue + base ANSM</p>
              </div>
            )}

            {/* Résultats locaux (catalogue existant) */}
            {localResults.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Database className="h-3 w-3" />
                  <span>{localResults.length} résultat(s) déjà dans le catalogue</span>
                  <Badge variant="outline" className="text-xs">Doublon potentiel</Badge>
                </div>
                {localResults.map((med) => (
                  <Card
                    key={med.id}
                    className="p-4 border-yellow-500/30 bg-yellow-500/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{med.name}</h4>
                          {med.strength && (
                            <span className="text-sm text-muted-foreground">{med.strength}</span>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">Déjà au catalogue</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
                <div className="border-t my-4" />
              </>
            )}

            {/* Indicateur recherche API */}
            {isSearchingAPI && (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium">Recherche dans la base officielle...</p>
                  <p className="text-xs">ANSM - Base de Données Publique des Médicaments</p>
                </div>
              </div>
            )}

            {/* Résultats API ANSM */}
            {apiResults.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Globe className="h-3 w-3" />
                  <span>{apiResults.length} résultat(s) dans la base officielle ANSM</span>
                </div>
                {apiResults.map((med, index) => (
                  <Card
                    key={`ansm-${index}`}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-primary/30"
                    onClick={() => onSelect(med)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{med.denomination}</h4>
                          <Badge variant="outline" className="text-xs shrink-0">Officiel ANSM</Badge>
                          {med.substanceActive && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {med.substanceActive}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{med.formePharmaceutique}</p>
                        {med.substanceActive && getPathologyFromSubstance(med.substanceActive) && (
                          <p className="text-xs text-primary">
                            🎯 Pathologie suggérée : {getPathologyFromSubstance(med.substanceActive)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                ))}
              </>
            )}

            {/* Aucun résultat */}
            {showNoResults && (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Aucun médicament trouvé pour "{searchTerm}"
                </p>
                <p className="text-xs text-muted-foreground">
                  Fermez cette fenêtre et remplissez le formulaire manuellement
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/20 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            💡 Sélectionnez un résultat pour pré-remplir le formulaire
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="sm"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
