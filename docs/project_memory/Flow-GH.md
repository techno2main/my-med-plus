# Mémoire VSC – Flow GitHub complet MyHealth+

Quand je te dis « Flow GH » ou « Flow GitHub », tu appliques STRICTEMENT le workflow suivant, sans inventer d’étapes et sans changer l’ordre.

---

## 0. Règles générales

- Tu travailles toujours avec des commits petits et cohérents.
- Tu expliques clairement, dans chaque message de commit, CE QUI a été changé et POURQUOI.
- Tu ne merges ni ne push si l’état Git n’est pas propre (pas de conflits, pas de fichiers en cours sans décision).

---

## 1. Si on est sur une branche dédiée (autre que dev ou main)

Cas typique d'exemple : branche `fix/android-gradle-8-13` ou autre branche de fonctionnalité / bugfix.

1. Vérifier la branche active :
   git branch --show-current
Si la branche active N’EST PAS dev NI main (branche dédiée) :

Commiter tout le travail en cours sur cette branche (commits petits et cohérents).

Pousser la branche dédiée vers le dépôt principal :

git push origin <nom-branche>
Fusionner cette branche dans dev :

git switch dev
git pull origin dev
git merge <nom-branche>
git push origin dev
(Optionnel mais recommandé) Quand tout est OK : supprimer la branche dédiée (local + distant) après le passage dans dev et main (voir étape 5).

Ensuite, le flow continue sur dev puis main.

2. Commit par fonctionnalité / modification
Regrouper les changements par fonctionnalité ou correction logique (pas de gros commit fourre-tout).

Pour chaque regroupement cohérent, créer UN commit avec un message clair et détaillé au format :
feat : ... pour une nouvelle fonctionnalité
fix : ... pour une correction de bug
perf : ... pour une optimisation
refactor : ... pour une réécriture de code sans changement fonctionnel
docs : ... pour la documentation
chore : ... pour la maintenance (dépendances, scripts, etc.)

Chaque message doit permettre de comprendre la mise à jour sans ouvrir les fichiers.

3. Push sur la branche dev
S’assurer que la branche active est dev :

git switch dev
git pull origin dev

Pousser la branche dev sur le dépôt principal :
git push origin dev

4. Merge dev → main (branche principale)
Basculer sur main :
git switch main

Récupérer l’état le plus récent de main :
git pull origin main

Fusionner dev dans main :
git merge dev

En cas de conflit, les résoudre proprement, re-tester, puis finaliser la fusion.

Pousser main vers le dépôt principal si nécessaire :
git push origin main

5. Push de main sur le dépôt distant Lovable

Pousser main sur le dépôt Lovable :
git push lovable main

6. Nettoyage des branches dédiées
Si le travail a été fait sur une branche dédiée (autre que dev ou main), APRÈS intégration dans dev puis dans main :

Supprimer la branche locale :
git branch -d <nom-branche>

Supprimer la branche distante correspondante (sur le remote principal) :
git push origin --delete <nom-branche>

7. Alignement final dev ↔ main (OBLIGATION : git merge main --ff-only)

Objectif : à la fin du flow, la branche dev doit être parfaitement alignée sur main, et sur GitHub l’interface doit afficher :
This branch is up to date with main.

POUR CELA, TU DOIS TOUJOURS UTILISER git merge main --ff-only (et jamais un merge simple pour cette étape).

S’assurer que main contient bien tous les derniers commits et qu’ils ont été poussés :

git switch main
git pull origin main
git push origin main

Basculer sur dev :
git switch dev
git pull origin dev

Aligner dev sur main UNIQUEMENT en fast-forward :
git merge main --ff-only

Si la commande échoue, tu NE dois PAS faire un merge simple.

Dans ce cas, tu dois :
Me prévenir explicitement qu’un fast-forward n’est pas possible.
Proposer une solution claire (rebase propre de dev sur main, ou autre stratégie EXPLICITE avant de continuer).

Pousser la branche dev alignée :
git push origin dev

8. Comportement attendu de l’agent

Quand je demande un « Flow GH » :
Tu appliques exactement les étapes 1 → 7 ci-dessus.

Tu expliques brièvement ce que tu fais à chaque grande étape (commit, merge, push, suppression de branche, alignement).

Tu t’assures avant la fin que :
main contient les derniers commits validés.
dev est alignée sur main avec git merge main --ff-only (obligatoire, jamais oublié).

Les branches dédiées utilisées ont été :
poussées vers origin avant intégration dans dev,
fusionnées dans dev puis dans main,
supprimées localement et à distance si elles ne servent plus.

