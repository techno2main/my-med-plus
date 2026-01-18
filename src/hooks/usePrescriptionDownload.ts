import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";

/**
 * Hook réutilisable pour télécharger et ouvrir les ordonnances PDF
 * Fonctionne sur mobile (ouverture automatique) et PC (téléchargement)
 */
export function usePrescriptionDownload() {
  const downloadPrescription = async (filePath: string, originalFilename?: string | null) => {
    if (!filePath) {
      toast.error("Aucun fichier disponible");
      return;
    }

    try {
      const { data, error } = await supabase.storage.from("prescriptions").download(filePath);

      if (error) throw error;

      const fileName = originalFilename || filePath.split("/").pop() || "prescription.pdf";

      // Sur mobile : utiliser FileOpener pour ouvrir le PDF
      if (Capacitor.isNativePlatform()) {
        // Convertir le Blob en base64
        const reader = new FileReader();
        reader.readAsDataURL(data);
        
        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              
              // Sauvegarder dans le cache
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache,
              });

              // Ouvrir le fichier avec l'application par défaut
              await FileOpener.open({
                filePath: savedFile.uri,
                contentType: 'application/pdf',
              });

              toast.success("Le PDF s'ouvre automatiquement");
              resolve(true);
            } catch (err: any) {
              toast.error("Impossible d'ouvrir le PDF");
              reject(err);
            }
          };
          reader.onerror = reject;
        });
      } else {
        // Sur PC : téléchargement classique
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Téléchargement réussi");
      }
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  return { downloadPrescription };
}
