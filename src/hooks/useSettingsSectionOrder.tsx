import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { useToast } from "@/hooks/use-toast";

export interface SettingsSection {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

const DEFAULT_SECTIONS: SettingsSection[] = [
  { id: "theme", title: "Thème de l'application", order: 0, visible: true },
  { id: "navigation", title: "Personnalisation", order: 1, visible: true },
  { id: "referentials", title: "Référentiels", order: 2, visible: true },
  { id: "stocks", title: "Stocks", order: 3, visible: true },
  { id: "notifications", title: "Notifications", order: 4, visible: true },
  { id: "calendar", title: "Calendrier", order: 5, visible: true },
  { id: "rattrapage", title: "Rattrapage", order: 6, visible: true },
  { id: "security", title: "Sécurité", order: 7, visible: true },
  { id: "diagnostics", title: "Diagnostics", order: 8, visible: true },
  { id: "about", title: "À propos", order: 9, visible: true },
];

export function useSettingsSectionOrder() {
  const [sections, setSections] = useState<SettingsSection[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSectionOrder();
  }, []);

  const loadSectionOrder = async () => {
    try {
      const { data: user, error: authError } = await getAuthenticatedUser();
      if (authError || !user) {
        console.warn('[useSettingsSectionOrder] Utilisateur non authentifié:', authError?.message);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("settings_section_order")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading settings section order:", error);
        setLoading(false);
        return;
      }

      if (data?.settings_section_order) {
        const savedOrder = data.settings_section_order as unknown as SettingsSection[];
        // Fusionner avec les sections par défaut pour gérer les nouvelles sections
        const mergedSections = DEFAULT_SECTIONS.map(defaultSection => {
          const saved = savedOrder.find(s => s.id === defaultSection.id);
          return saved || defaultSection;
        });
        setSections(mergedSections.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error("Error loading settings section order:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSectionOrder = async (newSections: SettingsSection[]) => {
    try {
      const { data: user, error: authError } = await getAuthenticatedUser();
      if (authError || !user) {
        console.warn('[useSettingsSectionOrder] Utilisateur non authentifié:', authError?.message);
        return;
      }

      const { error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            settings_section_order: newSections as any,
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) {
        console.error("Error saving settings section order:", error);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder l'ordre des sections",
          variant: "destructive",
        });
        return;
      }

      setSections(newSections);
      toast({
        title: "✓ Sauvegardé",
        description: "L'ordre des sections a été mis à jour",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving settings section order:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const reorderSections = (newOrder: SettingsSection[]) => {
    const reordered = newOrder.map((section, index) => ({
      ...section,
      order: index,
    }));
    saveSectionOrder(reordered);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const updated = sections.map(section =>
      section.id === sectionId
        ? { ...section, visible: !section.visible }
        : section
    );
    saveSectionOrder(updated);
  };

  return {
    sections,
    loading,
    reorderSections,
    toggleSectionVisibility,
  };
}
