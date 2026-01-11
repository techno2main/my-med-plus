# Solution Simple - À implémenter

Le code actuel est trop complexe (330+ lignes) avec des problèmes de:
- Double filtrage
- États redondants (medications ET allMedications)
- Appels multiples à la base
- Erreurs 400 au chargement

## Solution recommandée :

1. **Supprimer allMedications** - garder seulement medications
2. **Charger selon selectedLetter** - pas tout d'un coup
3. **Filtrer uniquement côté client** pour searchTerm
4. **Recharger à chaque changement de lettre**

Voulez-vous que je réécrive complètement le fichier useMedicationCatalog.ts de façon propre et simple ?
