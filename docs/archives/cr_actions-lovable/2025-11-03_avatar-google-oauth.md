# Compte-Rendu : Tentative d'implémentation Avatar Google OAuth

**Date** : 3 Novembre 2025  
**Statut** : ❌ ÉCHEC  
**Crédits consommés** : ~8-10 échanges

---

## 🎯 Objectif Initial

Récupérer automatiquement l'avatar du compte Google lors de la connexion OAuth et l'afficher dans le profil utilisateur.

---

## ⚙️ Actions Réalisées

### 1. Migrations Base de Données (3 migrations)

#### Migration 1 : Fonction handle_new_user()

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      split_part(NEW.raw_user_meta_data->>'name', ' ', 2)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$;
```

**Résultat** : ✅ Fonction créée  
**Problème** : Le champ `picture` n'est jamais renvoyé par Google via Supabase OAuth

#### Migration 2 : Création profil existant

```sql
INSERT INTO public.profiles (id, first_name, last_name, created_at, updated_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'first_name', split_part(raw_user_meta_data->>'name', ' ', 1)),
  COALESCE(raw_user_meta_data->>'last_name', split_part(raw_user_meta_data->>'name', ' ', 2)),
  NOW(),
  NOW()
FROM auth.users
WHERE id = '1f054f62-1788-4881-8d09-61fa4c9f4993'
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();
```

**Résultat** : ✅ Profil créé pour l'utilisateur existant

#### Migration 3 : Fonction sync_google_avatar_to_profile

```sql
CREATE OR REPLACE FUNCTION public.sync_google_avatar_to_profile(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  avatar_url_value text;
  first_name_value text;
  last_name_value text;
BEGIN
  SELECT
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)),
    raw_user_meta_data->>'last_name'
  INTO avatar_url_value, first_name_value, last_name_value
  FROM auth.users
  WHERE id = user_uuid;

  UPDATE public.profiles
  SET
    avatar_url = COALESCE(avatar_url_value, avatar_url),
    first_name = COALESCE(first_name_value, first_name),
    last_name = COALESCE(last_name_value, last_name),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$;
```

**Résultat** : ✅ Fonction créée mais inutile (pas d'avatar dans les métadonnées)

---

### 2. Modifications Code OAuth

#### Tentative 1 : Ajout scopes dans queryParams

```typescript
// src/hooks/useAuth.tsx
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        scope:
          "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email openid",
      },
    },
  });
  return { error };
};
```

**Résultat** : ❌ Erreur 403 (Forbidden)  
**Rollback effectué**

---

### 3. Création Hook useGoogleAvatar

#### Fichier créé puis supprimé : src/hooks/useGoogleAvatar.tsx

```typescript
import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleAvatar() {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!user || !session) return;

    const fetchGoogleAvatar = async () => {
      try {
        const providerToken = session.provider_token;

        if (!providerToken) {
          console.log("❌ Pas de provider_token disponible");
          return;
        }

        const response = await fetch(
          "https://people.googleapis.com/v1/people/me?personFields=photos",
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
            },
          },
        );

        if (!response.ok) return;

        const data = await response.json();
        const photoUrl = data.photos?.[0]?.url;

        if (!photoUrl) return;

        const { error } = await supabase
          .from("profiles")
          .update({
            avatar_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (!error) {
          window.location.reload();
        }
      } catch (error) {
        console.error("❌ Erreur récupération avatar Google:", error);
      }
    };

    fetchGoogleAvatar();
  }, [user, session]);
}
```

**Résultat** : ❌ Hook créé puis supprimé (non fonctionnel)  
**Raison** : `provider_token` non disponible ou API Google People inaccessible

---

## ❌ Problèmes Identifiés

### Cause Racine

Supabase OAuth avec Google **ne renvoie PAS le champ `picture`** dans `raw_user_meta_data`, même avec les scopes correctement configurés côté Google Cloud.

### Données Actuelles Reçues

```json
{
  "email": "antonymasson.dev@gmail.com",
  "email_verified": true,
  "full_name": "Antony Masson",
  "name": "Antony Masson",
  "phone_verified": false,
  "provider_id": "103845676141317993704",
  "sub": "103845676141317993704",
  "iss": "https://accounts.google.com"
}
```

### Données Manquantes

- ❌ `picture: "https://lh3.googleusercontent.com/..."`
- ❌ `avatar_url`

### Configuration Google Cloud Vérifiée

- ✅ Scopes OAuth configurés :
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- ✅ Application en production
- ✅ URIs de redirection corrects
- ✅ Domaines autorisés configurés

---

## ✅ Ce Qui Fonctionne

1. **Connexion Google OAuth** : ✅ Opérationnelle
2. **Création automatique profil** : ✅ Nom, prénom, email récupérés
3. **Upload manuel d'avatar** : ✅ Fonctionnel
   - Bouton "Modifier" sur le profil
   - Clic sur l'icône caméra
   - Upload d'image locale

---

## 📊 Bilan

| Élément                    | Statut | Notes                     |
| -------------------------- | ------ | ------------------------- |
| Connexion Google OAuth     | ✅     | Fonctionne parfaitement   |
| Récupération nom/email     | ✅     | Automatique via trigger   |
| Récupération avatar Google | ❌     | **ÉCHEC TOTAL**           |
| Upload manuel avatar       | ✅     | Alternative fonctionnelle |
| Temps consommé             | ❌     | ~30-40 minutes            |
| Crédits Lovable            | ❌     | ~8-10 échanges perdus     |

---

## 🔧 Solutions Alternatives

### Solution 1 : Upload Manuel (IMPLÉMENTÉE)

L'utilisateur peut uploader son propre avatar :

1. Aller sur le profil
2. Cliquer sur "Modifier"
3. Cliquer sur l'icône caméra sur l'avatar
4. Sélectionner une image

### Solution 2 : Edge Function (NON TENTÉE)

Créer une edge function Supabase qui :

1. Intercepte le callback OAuth
2. Utilise le `provider_token` pour appeler l'API Google People
3. Stocke l'avatar dans le profil

**Risque** : Même problématique de `provider_token` potentiellement absent

### Solution 3 : Configuration Serveur Supabase (NON ACCESSIBLE)

Vérifier si une configuration serveur spécifique existe dans Supabase Dashboard > Authentication > Providers > Google pour forcer la récupération de l'avatar.

---

## 🚨 Avertissement Sécurité

1 warning Supabase détecté (non critique) :

- **Leaked Password Protection Disabled** : Protection contre les mots de passe compromis désactivée

---

## 📝 Fichiers Modifiés

### Créés puis Supprimés

- ❌ `src/hooks/useGoogleAvatar.tsx` (supprimé)

### Modifiés puis Restaurés

- ↩️ `src/hooks/useAuth.tsx` (retour version initiale)
- ↩️ `src/pages/auth/Auth.tsx` (import useGoogleAvatar retiré)

### Migrations Appliquées

- ✅ `handle_new_user()` fonction
- ✅ Trigger `on_auth_user_created`
- ✅ `sync_google_avatar_to_profile()` fonction

---

## 💡 Conclusion

**La fonctionnalité demandée n'a PAS été implémentée.**

Malgré 3 migrations base de données, 2 tentatives de configuration OAuth, et 1 hook custom, l'avatar Google ne peut pas être récupéré automatiquement avec l'implémentation actuelle de Supabase OAuth.

**Recommandation** : Utiliser l'upload manuel d'avatar qui fonctionne parfaitement, ou consulter un expert Supabase pour vérifier si une configuration serveur spécifique est requise.

---

**Créé par** : Lovable AI  
**Date** : 2025-11-03 17:15  
**Statut final** : ❌ ÉCHEC
