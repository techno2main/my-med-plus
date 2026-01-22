# Mémoire projet – MyHealth+

## 1. Référence centrale du Flow GitHub

Pour tout ce qui concerne le workflow Git / Flow GH :

- Tu dois TOUJOURS lire et respecter le contenu de :
  `docs/project_memory/Flow-GH.md`.

Quand je te demande un « Flow GH » ou « Flow GitHub » :

- Tu commences par ouvrir ce fichier `docs/project_memory/Flow-GH.md`.
- Tu appliques STRICTEMENT les étapes définies dedans.
- Tu ne proposes AUCUNE autre stratégie Git en dehors de ce qui est documenté dans `Flow-GH.md`, sauf si je te demande explicitement une alternative.

---

## 2. Règles sur les commits hors Flow GH

- Tu ne dois JAMAIS proposer ni exécuter de commit EN DEHORS du Flow GH sans me demander mon accord explicite AVANT.
- Si tu estimes qu’un commit serait utile mais qu’on n’est pas dans un Flow GH :
  - Tu expliques d’abord :
    - quels fichiers seraient impactés,
    - quel serait l’objectif du commit,
    - comment il s’intègre dans l’historique Git.
  - Tu attends ensuite ma validation claire avant de lancer la moindre commande Git (`git add`, `git commit`, `git push`, etc.).

---

## 3. Règles sur la création de fichiers `.md`

- Tu ne dois créer AUCUN nouveau fichier `.md` (documentation, notes, logs, TODO, CR, etc.) sans mon accord explicite.
- Si tu juges qu’un fichier `.md` serait utile :
  - Tu expliques d’abord :
    - le nom proposé,
    - l’emplacement exact dans l’arborescence,
    - le contenu prévu (objectif du document).
  - Tu attends ma validation AVANT de créer le fichier ou de le remplir.
- Tu ne dupliques pas la documentation existante si une section appropriée existe déjà.

---

## 4. Règles sur les migrations Supabase / SQL

- Si une modification de schéma est nécessaire (ajout/édition/suppression de colonne, nouvelle table, index, contrainte, vue, etc.) :
  - Tu NE CRÉES PAS de fichiers `.sql` dans le repo sans mon accord explicite.
  - Tu ne configures pas de système de migrations automatique sans que je l’aie validé.
- À la place, tu dois :
  - Me proposer un script SQL complet, clair et commenté, que j’exécuterai moi-même dans le SQL Editor Supabase.
  - Préciser :
    - l’objectif exact de la migration (fonctionnel + technique),
    - les tables/colonnes impactées,
    - les effets possibles sur les données existantes (null, valeurs par défaut, risques).
- Tant que je n’ai pas validé explicitement :
  - Tu ne touches pas aux migrations existantes,
  - Tu ne génères pas de nouveaux fichiers `.sql`,
  - Tu ne supposes pas que la migration a été exécutée : tu dois toujours me laisser confirmer.

---

## 5. Règles sur les commandes terminal

- Avant de lancer une commande dans le terminal (Git, Node, npm, pnpm, bun, artisan, migrations, etc.) :
  - Tu expliques en une ou deux phrases :
    - à quoi sert la commande,
    - sur quoi elle agit (fichiers, branches, dépendances, base de données, etc.),
    - les risques éventuels (ex. : écrasement, suppression, migrations, reset).
  - Tu attends mon accord explicite avant d’exécuter des commandes potentiellement destructrices ou difficiles à annuler :
    - `git reset`, `git rebase`, `git clean`, `git push --force`, suppression de branches/distants, scripts de migration ou de seed, etc.
- Quand tu proposes un bloc de commandes, tu dois préciser clairement :
  - l’ordre d’exécution,
  - sur quelle branche / dans quel dossier elles doivent être lancées.

---

## 6. Comportement général attendu

- Tu privilégies la sécurité, la lisibilité et la traçabilité :
  - aucun commit ou push surprise,
  - aucune création de fichier non validée,
  - aucune commande terminal exécutée sans explication préalable,
  - aucune migration appliquée ou fichier `.sql` créé sans validation.
- Si tu n’es pas sûr du contexte (branche active, remote, environnement, état de la base), tu commences par me demander de confirmer ou de partager les sorties de commande nécessaires (`git status`, `git branch -vv`, informations Supabase, etc.).