const AUDIO_ROOT = 'audio/';
const ROUGE_OFFICIEL = "#930707";

var currentAudio = null;
var currentPlaylist = [];
var currentIndex = 0;
var isDragging = false;

// Fonction pour préparer la playlist dynamique à partir des sessionStorage
function preparerPlaylistDynamique(office) {
    console.log('=== DEBUT preparerPlaylistDynamique ===');
    console.log('Office:', office);
    
    const prefixe = Prefixe_office(office);
    const labels = Labels_office(office);
    const playlist = [];
    
    console.log('Prefixe:', prefixe);
    console.log('Labels:', labels);
    
    // Ajouter les labels communs
    const labelsCommuns = ['temporal', 'sanctoral', 'introduction'];
    
    // Pour laudes, ajouter l'invitatoire
    if (office === 'laudes') {
        const invitatoireLabels = ['antienne_inv', 'psaume_inv', 'antienne_invb'];
        invitatoireLabels.forEach(label => {
            const fichier = sessionStorage.getItem(prefixe + label);
            if (fichier && fichier !== '' && fichier !== 'empty.html') {
                playlist.push({
                    path: convertirHtmlVersAudio(fichier),
                    nom: extraireNomFichier(fichier)
                });
            }
        });
    }
    
    // Parcourir tous les labels de l'office
    labelsCommuns.concat(labels).forEach(label => {
        const fichier = sessionStorage.getItem(prefixe + label);
        console.log(`Label: ${prefixe}${label}, Fichier: ${fichier}`);
        if (fichier && fichier !== '' && fichier !== 'empty.html') {
            const audioPath = convertirHtmlVersAudio(fichier);
            console.log(`  -> Chemin audio: ${audioPath}`);
            playlist.push({
                path: audioPath,
                nom: extraireNomFichier(fichier)
            });
        }
    });
    
    // Gérer la répétition des antiennes si activée
    const repeter = (localStorage.getItem("repeter_antiennes") === 'true');
    if (repeter) {
        // Ajouter les antiennes répétées (suffixe 'b')
        const antienneLabels = labels.filter(l => l.includes('antienne'));
        antienneLabels.forEach(label => {
            const fichier = sessionStorage.getItem(prefixe + label);
            if (fichier && fichier !== '' && fichier !== 'empty.html') {
                playlist.push({
                    path: convertirHtmlVersAudio(fichier),
                    nom: extraireNomFichier(fichier) + ' (répétition)'
                });
            }
        });
    }
    
    // Lancer la lecture si la playlist n'est pas vide
    console.log('Playlist finale:', playlist);
    console.log('Nombre de pistes:', playlist.length);
    
    if (playlist.length > 0) {
        console.log('Lancement de la playlist...');
        startPlaylist(playlist, office.charAt(0).toUpperCase() + office.slice(1));
    } else {
        console.log('AUCUNE PISTE DANS LA PLAYLIST - Le lecteur ne sera pas affiché');
    }
    console.log('=== FIN preparerPlaylistDynamique ===');
}

// Convertir un chemin HTML en chemin audio
function convertirHtmlVersAudio(fichierHtml) {
    if (!fichierHtml || fichierHtml === 'empty.html') return null;
    
    // Remplacer .html par .opus
    let audioPath = fichierHtml.replace('.html', '.opus');
    
    // Si le chemin commence par un dossier d'office (laudes/, vepres/, etc.)
    // on extrait juste le nom du fichier pour les psaumes et cantiques
    // car ils sont dans le dossier audio/psaumes/ ou audio/cantiques/
    
    // Vérifier si c'est un psaume
    if (audioPath.includes('psaumes/psaume')) {
        // Extraire juste le nom du fichier psaume
        const psaumeMatch = audioPath.match(/psaume(.+)\.opus$/);
        if (psaumeMatch) {
            audioPath = 'psaumes/psaume' + psaumeMatch[1] + '.opus';
        }
    }
    
    // Vérifier si c'est un cantique
    if (audioPath.includes('cantiques/')) {
        // Extraire juste le nom du fichier cantique
        const cantiqueMatch = audioPath.match(/cantiques\/(.+)\.opus$/);
        if (cantiqueMatch) {
            audioPath = 'cantiques/' + cantiqueMatch[1] + '.opus';
        }
    }
    
    // Si le chemin ne commence pas par audio/, l'ajouter
    if (!audioPath.startsWith('audio/')) {
        audioPath = AUDIO_ROOT + audioPath;
    }
    
    return audioPath;
}

// Extraire un nom lisible du fichier
function extraireNomFichier(fichier) {
    if (!fichier) return '';
    
    // Extraire le nom du fichier sans le chemin et l'extension
    const nomComplet = fichier.split('/').pop();
    const nomSansExt = nomComplet.replace('.html', '').replace('.opus', '');
    
    // Remplacer les underscores par des espaces et capitaliser
    return nomSansExt
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Démarrer la lecture d'une playlist
function startPlaylist(playlist, titre) {
    currentPlaylist = playlist;
    currentIndex = 0;
    
    // Créer ou afficher le lecteur
    showMiniPlayer(titre);
    
    // Lancer la lecture du premier élément
    playCurrentTrack();
}

// Lire la piste actuelle
function playCurrentTrack() {
    if (currentIndex >= currentPlaylist.length) {
        // Fin de la playlist
        hideMiniPlayer();
        return;
    }
    
    const track = currentPlaylist[currentIndex];
    
    // Créer un nouvel élément audio si nécessaire
    if (!currentAudio) {
        currentAudio = new Audio();
        setupAudioEvents();
    }
    
    // Mettre à jour le nom du fichier affiché
    updateTrackName(track.nom);
    
    // Charger et lire
    currentAudio.src = track.path;
    currentAudio.load();
    currentAudio.play().catch(err => {
        console.warn("Fichier audio manquant ou erreur : " + track.path);
        // Passer au suivant automatiquement
        nextTrack();
    });
}

// Configurer les événements audio
function setupAudioEvents() {
    if (!currentAudio) return;
    
    currentAudio.onended = () => {
        nextTrack();
    };
    
    currentAudio.ontimeupdate = () => {
        const progress = document.getElementById('audio-progress');
        const timeDisplay = document.getElementById('audio-time');
        
        if (progress && !isDragging && !isNaN(currentAudio.duration)) {
            progress.value = (currentAudio.currentTime / currentAudio.duration) * 100;
            timeDisplay.textContent = formatTime(currentAudio.currentTime) + " / " + formatTime(currentAudio.duration);
        }
    };
    
    currentAudio.onplay = () => updatePlayPauseIcon();
    currentAudio.onpause = () => updatePlayPauseIcon();
}

// Piste suivante
function nextTrack() {
    currentIndex++;
    playCurrentTrack();
}

// Piste précédente
function previousTrack() {
    if (currentIndex > 0) {
        currentIndex--;
        playCurrentTrack();
    }
}

// Afficher le mini-lecteur
function showMiniPlayer(titre) {
    let player = document.getElementById('mini-player');
    
    if (!player) {
        player = document.createElement('div');
        player.id = 'mini-player';
        player.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: ${ROUGE_OFFICIEL};
            color: white;
            padding: 15px;
            z-index: 9999;
            border-radius: 15px 15px 0 0;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
        `;
        
        player.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <b id="player-title" style="text-transform: uppercase; font-size: 14px;"></b>
                <div id="audio-time" style="font-size: 12px;">0:00 / 0:00</div>
            </div>
            <div id="track-name" style="font-size: 11px; margin-bottom: 8px; opacity: 0.9; font-style: italic;"></div>
            <input type="range" id="audio-progress" value="0" max="100" 
                   style="width: 100%; accent-color: white; margin-bottom: 10px;"
                   onmousedown="isDragging=true" 
                   onmouseup="isDragging=false; seekAudio(this.value)"
                   ontouchstart="isDragging=true"
                   ontouchend="isDragging=false; seekAudio(this.value)">
            <div style="display: flex; justify-content: center; align-items: center; gap: 40px;">
                <ons-icon icon="md-skip-previous" size="30px" onclick="previousTrack()" style="cursor: pointer;"></ons-icon>
                <ons-icon id="play-pause-icon" icon="md-pause" size="40px" onclick="togglePlay()" style="cursor: pointer;"></ons-icon>
                <ons-icon icon="md-skip-next" size="30px" onclick="nextTrack()" style="cursor: pointer;"></ons-icon>
            </div>
        `;
        
        document.body.appendChild(player);
    }
    
    player.style.display = 'block';
    document.getElementById('player-title').textContent = titre;
}

// Masquer le mini-lecteur
function hideMiniPlayer() {
    const player = document.getElementById('mini-player');
    if (player) {
        player.style.display = 'none';
    }
    
    // Arrêter l'audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
    
    // Réinitialiser la playlist
    currentPlaylist = [];
    currentIndex = 0;
}

// Mettre à jour le nom de la piste
function updateTrackName(nom) {
    const trackNameEl = document.getElementById('track-name');
    if (trackNameEl) {
        trackNameEl.textContent = nom || '';
    }
}

// Mettre à jour l'icône play/pause
function updatePlayPauseIcon() {
    const icon = document.getElementById('play-pause-icon');
    if (icon && currentAudio) {
        icon.setAttribute('icon', currentAudio.paused ? 'md-play' : 'md-pause');
    }
}

// Basculer play/pause
function togglePlay() {
    if (!currentAudio) return;
    
    if (currentAudio.paused) {
        currentAudio.play();
    } else {
        currentAudio.pause();
    }
}

// Rechercher dans l'audio
function seekAudio(value) {
    if (currentAudio && !isNaN(currentAudio.duration)) {
        currentAudio.currentTime = (value / 100) * currentAudio.duration;
    }
}

// Formater le temps
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return min + ":" + (sec < 10 ? "0" : "") + sec;
}

// Arrêter l'audio (appelé lors du changement de page)
function stopAudio() {
    hideMiniPlayer();
}
