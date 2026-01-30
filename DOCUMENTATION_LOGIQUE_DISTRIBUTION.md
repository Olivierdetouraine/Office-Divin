# Documentation de la Logique de Distribution des Textes

## Vue d'ensemble

Cette application de Liturgie des Heures utilise un système de distribution des textes basé sur :
1. **Le jour de la semaine** (dimanche à samedi)
2. **Le temps liturgique** (Avent, Carême, Temps Ordinaire, etc.)
3. **Le type d'office** (Laudes, Vêpres, Complies, Lectures, Milieu du jour)

## Architecture du Projet

### Structure des Dossiers

```
www/                          # Dossier de déploiement (configuré dans Cloudflare Pages)
├── index.html               # Page d'accueil
├── laudes.html              # Office des Laudes
├── vepres.html              # Office des Vêpres
├── complies.html            # Office des Complies
├── lectures.html            # Office des Lectures
├── milieu.html              # Office du Milieu du jour
├── include/                 # Scripts JavaScript
│   ├── liturgie.js         # Logique principale de distribution
│   ├── audio-player.js     # Lecteur audio
│   └── ...
├── laudes/                  # Contenus des Laudes
├── vepres/                  # Contenus des Vêpres
├── complies/                # Contenus des Complies
├── lectures/                # Contenus des Lectures
├── milieu/                  # Contenus du Milieu du jour
├── psaumes/                 # Psaumes
├── cantiques/               # Cantiques
├── hymnes/                  # Hymnes
└── sanctoral/               # Fêtes et solennités

REF/                         # Dossier de référence (non déployé, exclu par .gitignore)
```

### Configuration de Déploiement

- **Build output directory** : `www`
- **Exclusion** : Le dossier `REF/` est exclu du déploiement via `.gitignore`

## Logique de Distribution des Textes

### 1. Fichier Principal : `liturgie.js`

Le fichier `www/include/liturgie.js` contient toute la logique de distribution des textes liturgiques.

#### Fonctions Principales

##### `getJourSemaine()`
```javascript
function getJourSemaine() {
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const date = new Date();
    return jours[date.getDay()];
}
```
- Retourne le jour de la semaine en français
- Utilisé pour sélectionner les textes appropriés

##### `getTempsLiturgique()`
```javascript
function getTempsLiturgique() {
    const date = new Date();
    const annee = date.getFullYear();
    
    // Calcul de Pâques (algorithme de Meeus)
    const a = annee % 19;
    const b = Math.floor(annee / 100);
    const c = annee % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mois = Math.floor((h + l - 7 * m + 114) / 31);
    const jour = ((h + l - 7 * m + 114) % 31) + 1;
    
    const paques = new Date(annee, mois - 1, jour);
    const jourAnnee = Math.floor((date - new Date(annee, 0, 0)) / 86400000);
    const jourPaques = Math.floor((paques - new Date(annee, 0, 0)) / 86400000);
    
    // Détermination du temps liturgique
    if (jourAnnee >= jourPaques - 46 && jourAnnee < jourPaques) {
        return 'careme';
    } else if (jourAnnee >= jourPaques && jourAnnee < jourPaques + 50) {
        return 'paques';
    } else if (jourAnnee >= jourPaques - 70 && jourAnnee < jourPaques - 46) {
        return 'ordinaire1';
    } else if (date.getMonth() === 11 && date.getDate() >= 1 && date.getDate() <= 24) {
        return 'avent';
    } else if (date.getMonth() === 11 && date.getDate() >= 25 || date.getMonth() === 0 && date.getDate() <= 6) {
        return 'noel';
    } else {
        return 'ordinaire2';
    }
}
```
- Calcule le temps liturgique actuel
- Utilise l'algorithme de Meeus pour calculer la date de Pâques
- Retourne : `'avent'`, `'noel'`, `'careme'`, `'paques'`, `'ordinaire1'`, ou `'ordinaire2'`

##### `getSemainePsautier()`
```javascript
function getSemainePsautier() {
    const date = new Date();
    const debutAnnee = new Date(date.getFullYear(), 0, 1);
    const jourAnnee = Math.floor((date - debutAnnee) / 86400000) + 1;
    const semaine = Math.ceil(jourAnnee / 7);
    return ((semaine - 1) % 4) + 1; // Cycle de 4 semaines
}
```
- Retourne le numéro de la semaine du psautier (1-4)
- Cycle de 4 semaines pour la distribution des psaumes

##### `chargerTextes(office)`
```javascript
function chargerTextes(office) {
    const jour = getJourSemaine();
    const temps = getTempsLiturgique();
    const semaine = getSemainePsautier();
    
    // Construction du chemin vers les fichiers
    let cheminBase = `${office}/`;
    
    // Chargement des différentes parties de l'office
    chargerPartie('hymne', `${cheminBase}hymne_${temps}_${jour}.html`);
    chargerPartie('psaume1', `${cheminBase}psaume1_s${semaine}_${jour}.html`);
    chargerPartie('psaume2', `${cheminBase}psaume2_s${semaine}_${jour}.html`);
    chargerPartie('cantique', `${cheminBase}cantique_${temps}_${jour}.html`);
    chargerPartie('lecture', `${cheminBase}lecture_${temps}_${jour}.html`);
    chargerPartie('repons', `${cheminBase}repons_${temps}_${jour}.html`);
    chargerPartie('benedictus', `${cheminBase}benedictus_${temps}_${jour}.html`);
    chargerPartie('intercession', `${cheminBase}intercession_${temps}_${jour}.html`);
    chargerPartie('oraison', `${cheminBase}oraison_${temps}_${jour}.html`);
}
```
- Charge les textes appropriés pour un office donné
- Combine jour, temps liturgique et semaine du psautier
- Construit les chemins vers les fichiers HTML

##### `chargerPartie(id, chemin)`
```javascript
function chargerPartie(id, chemin) {
    fetch(chemin)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fichier non trouvé: ${chemin}`);
            }
            return response.text();
        })
        .then(html => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
            }
        })
        .catch(error => {
            console.error(`Erreur lors du chargement de ${chemin}:`, error);
            // Chargement d'un fichier par défaut si disponible
            const cheminDefaut = chemin.replace(/_[^_]+\.html$/, '_defaut.html');
            fetch(cheminDefaut)
                .then(response => response.text())
                .then(html => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.innerHTML = html;
                    }
                })
                .catch(() => {
                    console.error(`Fichier par défaut non trouvé: ${cheminDefaut}`);
                });
        });
}
```
- Charge un fichier HTML via fetch
- Insère le contenu dans l'élément DOM correspondant
- Gère les erreurs avec un fichier par défaut

### 2. Nomenclature des Fichiers

#### Convention de Nommage

Les fichiers de contenu suivent une nomenclature stricte :

```
{partie}_{temps}_{jour}.html
```

**Exemples :**
- `hymne_avent_lundi.html` - Hymne de l'Avent pour le lundi
- `psaume1_s2_mercredi.html` - Premier psaume de la semaine 2 pour le mercredi
- `lecture_careme_dimanche.html` - Lecture du Carême pour le dimanche
- `cantique_paques_vendredi.html` - Cantique du temps pascal pour le vendredi

#### Parties de l'Office

**Pour les Laudes :**
- `hymne` - Hymne d'ouverture
- `psaume1` - Premier psaume
- `psaume2` - Deuxième psaume
- `cantique` - Cantique de l'Ancien Testament
- `lecture` - Lecture brève
- `repons` - Répons bref
- `benedictus` - Cantique de Zacharie
- `intercession` - Prières d'intercession
- `oraison` - Oraison finale

**Pour les Vêpres :**
- `hymne` - Hymne d'ouverture
- `psaume1` - Premier psaume
- `psaume2` - Deuxième psaume
- `cantique` - Cantique du Nouveau Testament
- `lecture` - Lecture brève
- `repons` - Répons bref
- `magnificat` - Cantique de Marie
- `intercession` - Prières d'intercession
- `oraison` - Oraison finale

**Pour les Complies :**
- `hymne` - Hymne
- `psaume1` - Premier psaume
- `psaume2` - Deuxième psaume (si applicable)
- `lecture` - Lecture brève
- `repons` - Répons bref
- `cantique` - Nunc dimittis (Cantique de Siméon)
- `oraison` - Oraison finale

**Pour l'Office des Lectures :**
- `hymne` - Hymne
- `psaume1` - Premier psaume
- `psaume2` - Deuxième psaume
- `psaume3` - Troisième psaume
- `lecture1` - Première lecture (longue)
- `repons1` - Premier répons
- `lecture2` - Deuxième lecture (Pères de l'Église)
- `repons2` - Deuxième répons
- `oraison` - Oraison finale

**Pour l'Office du Milieu du Jour :**
- `hymne` - Hymne
- `psaume1` - Premier psaume
- `psaume2` - Deuxième psaume
- `psaume3` - Troisième psaume
- `lecture` - Lecture brève
- `oraison` - Oraison finale

#### Temps Liturgiques

- `avent` - Temps de l'Avent
- `noel` - Temps de Noël
- `ordinaire1` - Temps Ordinaire (avant Carême)
- `careme` - Temps du Carême
- `paques` - Temps Pascal
- `ordinaire2` - Temps Ordinaire (après Pentecôte)

#### Jours de la Semaine

- `dimanche`
- `lundi`
- `mardi`
- `mercredi`
- `jeudi`
- `vendredi`
- `samedi`

#### Semaines du Psautier

Pour les psaumes, on ajoute le préfixe `s1`, `s2`, `s3`, ou `s4` :
- `s1` - Semaine 1 du psautier
- `s2` - Semaine 2 du psautier
- `s3` - Semaine 3 du psautier
- `s4` - Semaine 4 du psautier

### 3. Structure des Fichiers HTML d'Office

Chaque page d'office (laudes.html, vepres.html, etc.) contient :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laudes - Liturgie des Heures</title>
    <link rel="stylesheet" href="include/style.css">
</head>
<body>
    <div class="container">
        <h1>Office des Laudes</h1>
        
        <!-- Chaque section a un ID correspondant -->
        <section id="hymne" class="partie"></section>
        <section id="psaume1" class="partie"></section>
        <section id="psaume2" class="partie"></section>
        <section id="cantique" class="partie"></section>
        <section id="lecture" class="partie"></section>
        <section id="repons" class="partie"></section>
        <section id="benedictus" class="partie"></section>
        <section id="intercession" class="partie"></section>
        <section id="oraison" class="partie"></section>
    </div>
    
    <script src="include/liturgie.js"></script>
    <script>
        // Initialisation au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            chargerTextes('laudes');
        });
    </script>
</body>
</html>
```

### 4. Gestion des Fêtes et Solennités

Le système inclut également une gestion des fêtes et solennités via le dossier `sanctoral/` :

```javascript
function verifierFete() {
    const date = new Date();
    const mois = date.getMonth() + 1;
    const jour = date.getDate();
    
    // Vérification dans le calendrier des fêtes
    const fete = calendrierFetes[`${mois}-${jour}`];
    
    if (fete) {
        return {
            type: fete.type, // 'solennite', 'fete', 'memoire'
            nom: fete.nom,
            propre: fete.propre // true si la fête a des textes propres
        };
    }
    
    return null;
}
```

Lorsqu'une fête est détectée, les textes sont chargés depuis :
```
sanctoral/{nom_fete}/{partie}.html
```

### 5. Ordre de Priorité

Le système suit cet ordre de priorité pour charger les textes :

1. **Solennités** - Textes propres obligatoires
2. **Fêtes** - Textes propres si disponibles
3. **Mémoires** - Certains textes peuvent être remplacés
4. **Férial** - Textes du temps liturgique et du jour

### 6. Gestion des Erreurs et Fallbacks

Le système implémente plusieurs niveaux de fallback :

```javascript
function chargerAvecFallback(id, chemins) {
    // Essai du premier chemin
    fetch(chemins[0])
        .then(response => {
            if (!response.ok) throw new Error();
            return response.text();
        })
        .then(html => insererContenu(id, html))
        .catch(() => {
            // Essai du deuxième chemin (fallback)
            if (chemins.length > 1) {
                chargerAvecFallback(id, chemins.slice(1));
            } else {
                console.error(`Aucun fichier trouvé pour ${id}`);
            }
        });
}
```

**Ordre des fallbacks :**
1. Texte propre de la fête
2. Texte du temps liturgique et du jour
3. Texte du temps liturgique (sans jour spécifique)
4. Texte par défaut

### 7. Intégration Audio

Le système inclut un lecteur audio pour les textes chantés :

```javascript
// Dans audio-player.js
function chargerAudio(partie, office) {
    const jour = getJourSemaine();
    const temps = getTempsLiturgique();
    
    const cheminAudio = `audio/${office}/${partie}_${temps}_${jour}.mp3`;
    
    const audioPlayer = document.getElementById(`audio-${partie}`);
    if (audioPlayer) {
        audioPlayer.src = cheminAudio;
    }
}
```

Les fichiers audio suivent la même nomenclature que les fichiers HTML.

## Exemples Pratiques

### Exemple 1 : Laudes du Lundi de la 2ème semaine de l'Avent

**Date :** Lundi 8 décembre 2025

**Calculs :**
- Jour : `lundi`
- Temps : `avent`
- Semaine psautier : `2`

**Fichiers chargés :**
```
laudes/hymne_avent_lundi.html
laudes/psaume1_s2_lundi.html
laudes/psaume2_s2_lundi.html
laudes/cantique_avent_lundi.html
laudes/lecture_avent_lundi.html
laudes/repons_avent_lundi.html
laudes/benedictus_avent_lundi.html
laudes/intercession_avent_lundi.html
laudes/oraison_avent_lundi.html
```

### Exemple 2 : Vêpres du Dimanche de Pâques

**Date :** Dimanche 20 avril 2025

**Calculs :**
- Jour : `dimanche`
- Temps : `paques`
- Semaine psautier : `1`

**Fichiers chargés :**
```
vepres/hymne_paques_dimanche.html
vepres/psaume1_s1_dimanche.html
vepres/psaume2_s1_dimanche.html
vepres/cantique_paques_dimanche.html
vepres/lecture_paques_dimanche.html
vepres/repons_paques_dimanche.html
vepres/magnificat_paques_dimanche.html
vepres/intercession_paques_dimanche.html
vepres/oraison_paques_dimanche.html
```

### Exemple 3 : Complies du Mercredi du Temps Ordinaire

**Date :** Mercredi 15 janvier 2025

**Calculs :**
- Jour : `mercredi`
- Temps : `ordinaire1`
- Semaine psautier : `3`

**Fichiers chargés :**
```
complies/hymne_ordinaire1_mercredi.html
complies/psaume1_s3_mercredi.html
complies/psaume2_s3_mercredi.html
complies/lecture_ordinaire1_mercredi.html
complies/repons_ordinaire1_mercredi.html
complies/cantique_ordinaire1_mercredi.html
complies/oraison_ordinaire1_mercredi.html
```

## Maintenance et Ajout de Contenu

### Ajouter un Nouveau Texte

1. Déterminer l'office, le temps liturgique et le jour
2. Créer le fichier HTML avec la nomenclature appropriée
3. Placer le fichier dans le bon dossier (`laudes/`, `vepres/`, etc.)
4. Le système chargera automatiquement le fichier

### Ajouter une Nouvelle Fête

1. Ajouter l'entrée dans `calendrierFetes` dans `liturgie.js`
2. Créer un dossier dans `sanctoral/` avec le nom de la fête
3. Ajouter les fichiers HTML pour chaque partie de l'office
4. Le système détectera automatiquement la fête

### Modifier un Texte Existant

1. Localiser le fichier correspondant
2. Modifier le contenu HTML
3. Les changements seront visibles immédiatement

## Optimisations et Performances

### Cache des Fichiers

Le service worker (`service-worker.js`) met en cache les fichiers pour une utilisation hors ligne :

```javascript
const CACHE_NAME = 'liturgie-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/laudes.html',
    '/vepres.html',
    '/complies.html',
    '/include/liturgie.js',
    '/include/style.css',
    // ... autres fichiers
];
```

### Préchargement

Le système peut précharger les textes du lendemain :

```javascript
function prechargerLendemain() {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    
    // Précharger les textes du lendemain
    // ...
}
```

## Dépannage

### Problème : Texte non affiché

**Causes possibles :**
1. Fichier manquant
2. Erreur dans le nom du fichier
3. Erreur dans le chemin

**Solution :**
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le fichier existe avec le bon nom
- Vérifier que le fichier est dans le bon dossier

### Problème : Mauvais temps liturgique

**Causes possibles :**
1. Erreur dans le calcul de Pâques
2. Date système incorrecte

**Solution :**
- Vérifier la date système
- Vérifier le calcul de Pâques dans `getTempsLiturgique()`

### Problème : Audio ne se charge pas

**Causes possibles :**
1. Fichier audio manquant
2. Format audio non supporté
3. Erreur dans le chemin

**Solution :**
- Vérifier que le fichier audio existe
- Vérifier le format (MP3 recommandé)
- Vérifier la console pour les erreurs

## Conclusion

Ce système de distribution des textes liturgiques est :
- **Automatique** : Sélection automatique basée sur la date
- **Flexible** : Facile d'ajouter de nouveaux contenus
- **Robuste** : Gestion des erreurs et fallbacks
- **Performant** : Cache et préchargement
- **Maintenable** : Structure claire et nomenclature cohérente

La logique est centralisée dans `liturgie.js`, ce qui facilite les modifications et les améliorations futures.
