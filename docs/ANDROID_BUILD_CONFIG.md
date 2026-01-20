# Configuration Android - Versions Compatibles

## ⚠️ VERSIONS VERROUILLÉES - NE PAS METTRE À JOUR SANS TESTS

### Gradle Configuration (2026-01-20)
- **Gradle Wrapper**: `8.13` (android/gradle/wrapper/gradle-wrapper.properties)
- **Android Gradle Plugin (AGP)**: `8.13.1` (android/build.gradle)
- **Raison**: AGP 9.0+ introduit des breaking changes incompatibles

### Problèmes connus

#### 1. Gradle 9.0+
- ❌ **Problème**: `getDefaultProguardFile('proguard-android.txt')` n'est plus supporté
- ✅ **Solution**: Rester sur Gradle 8.13 + AGP 8.13.1
- 📋 **Si migration nécessaire**: Utiliser `proguard-android-optimize.txt` et tester tous les builds

#### 2. capacitor-native-biometric@4.2.2
- ❌ **Problème**: Utilise `jcenter()` qui est déprécié et ne fonctionne plus
- ✅ **Solution**: Script automatique `scripts/fix-android-dependencies.ps1` dans postinstall
- 📋 **Alternative**: Attendre une mise à jour du plugin ou utiliser un fork

### Scripts de maintenance

#### fix-android-dependencies.ps1
Exécuté automatiquement après `npm install`. Corrige:
- Remplacement de `jcenter()` par `mavenCentral()` dans capacitor-native-biometric

### Procédure de mise à jour

1. **AVANT toute mise à jour Android Studio ou Gradle:**
   - Créer une branche git dédiée
   - Sauvegarder android/build.gradle et android/gradle/wrapper/gradle-wrapper.properties
   
2. **Test de compatibilité:**
   ```bash
   npm run flow:build
   ```
   
3. **En cas d'erreur:**
   - Revenir aux versions documentées ci-dessus
   - File > Invalidate Caches dans Android Studio
   - Rebuild complet

### Versions testées et validées

✅ **Configuration actuelle (fonctionnelle)**
```
Gradle: 8.13
AGP: 8.13.1
Capacitor: 8.0.0
```

❌ **Configurations problématiques**
```
Gradle: 9.0+
AGP: 9.0.0
→ Build échoue avec erreur proguard-android.txt
```

### Monitoring

- Vérifier les notifications Android Studio "Project update recommended"
- **NE PAS accepter automatiquement** les mises à jour de Gradle/AGP
- Toujours tester dans une branche séparée

### Contact

En cas de blocage critique nécessitant une mise à jour:
1. Documenter l'erreur exacte
2. Rechercher les breaking changes dans les release notes Gradle
3. Adapter les fichiers de configuration Android
4. Mettre à jour cette documentation
