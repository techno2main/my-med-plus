import { useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"

/**
 * Hook pour archiver automatiquement les traitements expirés au démarrage de l'app.
 * Appelle la fonction SQL auto_archive_expired_treatments() une seule fois.
 */
export const useAutoArchiveTreatments = () => {
  const hasRun = useRef(false)

  useEffect(() => {
    // Éviter les exécutions multiples
    if (hasRun.current) return
    hasRun.current = true

    const archiveExpiredTreatments = async () => {
      try {
        const { data, error } = await supabase.rpc("auto_archive_expired_treatments")
        
        if (error) {
          console.error("Auto-archive error:", error)
          return
        }

        if (data && data > 0) {
          console.log(`Auto-archived ${data} expired treatment(s)`)
        }
      } catch (error) {
        console.error("Auto-archive exception:", error)
      }
    }

    archiveExpiredTreatments()
  }, [])
}
