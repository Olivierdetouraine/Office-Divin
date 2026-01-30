# Exemples de fichiers audio pour l'office du Milieu

Pour tester le lecteur audio de l'office du Milieu, voici les types de fichiers qui peuvent être lus :

## Structure des dossiers
Les fichiers audio doivent être placés dans : `www/audio/milieu/`

## Types de fichiers attendus

### 1. Introduction
- **Chemin HTML source** : `hymnes/introduction.html`
- **Chemin audio attendu** : `www/audio/milieu/hymnes/introduction.opus`

### 2. Hymnes (selon le temps liturgique)
Exemples pour Tierce (option 1) :
- **Chemin HTML source** : `milieu/hymnes/hymne1_1.html`
- **Chemin audio attendu** : `www/audio/milieu/hymnes/hymne1_1.opus`

Autres exemples :
- `www/audio/milieu/hymnes/hymne1_2.opus` (Tierce - temps 2)
- `www/audio/milieu/hymnes/hymne2_1.opus` (Sexte - temps 1)
- `www/audio/milieu/hymnes/hymne3_1.opus` (None - temps 1)

### 3. Antiennes
Exemples (selon le temps liturgique, semaine et jour) :
- **Chemin HTML source** : `milieu/antiennes/antienne_1_1_0_1.html`
- **Chemin audio attendu** : `www/audio/milieu/antiennes/antienne_1_1_0_1.opus`

Format du nom : `antienne_[temps]_[semaine]_[jour]_[numéro].opus`
- temps : 1=Avent, 2=Noël, 3=Ordinaire, 4=Carême, 5=Pâques
- semaine : 1-4
- jour : 0=dimanche, 1=lundi, ..., 6=samedi
- numéro : 1, 2 ou 3 (pour les 3 antiennes)

### 4. Psaumes
Les psaumes sont dans un dossier commun :
- **Chemin HTML source** : `psaumes/psaume119-I.html`
- **Chemin audio attendu** : `www/audio/psaumes/psaume119-I.opus`

Autres exemples :
- `www/audio/psaumes/psaume21-I.opus`
- `www/audio/psaumes/psaume21-II.opus`

### 5. Capitules, Répons, Oraisons
- **Capitules** : `www/audio/milieu/capitules/capitule1_1_0.opus`
- **Répons** : `www/audio/milieu/repons/repons1_1_0.opus`
- **Oraisons** : `www/audio/milieu/oraisons/oraison1_1_0.opus`

## Pour tester rapidement

Créez un fichier audio de test (même vide ou avec un son court) :

```bash
# Créer les dossiers nécessaires
mkdir -p "www/audio/milieu/hymnes"
mkdir -p "www/audio/milieu/antiennes"
mkdir -p "www/audio/psaumes"

# Exemple : copier un fichier audio existant pour tester
# Si vous avez déjà un fichier .opus quelque part :
cp votre_fichier_test.opus "www/audio/milieu/hymnes/hymne1_1.opus"
cp votre_fichier_test.opus "www/audio/milieu/antiennes/antienne_3_1_0_1.opus"
cp votre_fichier_test.opus "www/audio/psaumes/psaume119-I.opus"
```

## Comment vérifier quels fichiers sont recherchés

1. Ouvrez l'application dans votre navigateur
2. Ouvrez la console (F12)
3. Cliquez sur "Milieu"
4. Dans la console, vous verrez des logs comme :
   ```
   === DEBUT preparerPlaylistDynamique ===
   Office: milieu
   Label: m_introduction, Fichier: hymnes/introduction.html
     -> Chemin audio: audio/milieu/hymnes/introduction.opus
   Label: m_antienne_1, Fichier: milieu/antiennes/antienne_3_1_0_1.html
     -> Chemin audio: audio/milieu/antiennes/antienne_3_1_0_1.opus
   ...
   ```

Ces logs vous indiquent exactement quels fichiers audio sont recherchés pour la date actuelle.
