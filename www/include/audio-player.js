const AUDIO_ROOT = 'audio/';
const ROUGE_OFFICIEL = "#930707";

var currentAudio = null;
var currentPlaylist = [];
var currentIndex = 0;
var isDragging = false;

// --- FONCTIONS DE CÂBLAGE POUR accueil.html ---

/**
 * Appelé par actionOffice('laudes') dans accueil.html
 */
function playOffice(office) {
    console.log("Lecture de l'office propre :", office);
    // On lance la mécanique de Philoux pour charger le texte
    if (typeof Remplir_office === "function") {
        Remplir_office(office);
    }
    // On lance la playlist audio
    preparerPlaylistDynamique(office);
}

/**
 * Appelé par actionOffice pour les Communs (Marie, Apôtre, etc.)
 */
function playCommun(categorie, office) {
    console.log("Lecture du commun :", categorie, "pour l'office :", office);
    // Ici on pourrait ajouter la logique de chargement de texte du commun
    // Pour l'instant, on lance l'audio
    preparerPlaylistDynamique(office);
}

// --- LOGIQUE DU LECTEUR ---

function preparerPlaylistDynamique(office) {
    const prefixe = Prefixe_office(office);
    const labels = Labels_office(office);
    const playlist = [];
    
    // 1. Invitatoire (Laudes uniquement)
    if (office === 'laudes') {
        ['antienne_inv', 'psaume_inv'].forEach(label => {
            const fichier = sessionStorage.getItem(prefixe + label);
            if (fichier && fichier !== 'empty.html') {
                playlist.push({
                    path: convertirHtmlVersAudio(fichier, label),
                    nom: extraireNomFichier(fichier)
                });
            }
        });
    }
    
    // 2. Corps de l'office
    labels.forEach(label => {
        if (office === 'laudes' && (label === 'antienne_inv' || label === 'psaume_inv')) return;

        const fichier = sessionStorage.getItem(prefixe + label);
        if (fichier && fichier !== '' && fichier !== 'empty.html') {
            const audioPath = convertirHtmlVersAudio(fichier, label);
            if (audioPath) {
                playlist.push({
                    path: audioPath,
                    nom: extraireNomFichier(fichier)
                });
                
                // Répétition des antiennes
                const repeter = (localStorage.getItem("repeter_antiennes") === 'true');
                if (label.includes('antienne') && repeter) {
                    playlist.push({
                        path: audioPath,
                        nom: extraireNomFichier(fichier) + ' (Bis)'
                    });
                }
            }
        }
    });
    
    if (playlist.length > 0) {
        startPlaylist(playlist, office.charAt(0).toUpperCase() + office.slice(1));
    }
}

function convertirHtmlVersAudio(fichier, label) {
    if (!fichier || fichier === 'empty.html') return null;
    let audioPath = "";

    if (label.includes('psaume')) {
        let num = fichier.replace('psaumes/psaume', '').replace('.html', '');
        audioPath = 'audio/psaumes/psaume' + num + '.opus';
    } 
    else if (label.includes('cantique')) {
        let num = fichier.replace('cantiques/', '').replace('.html', '');
        audioPath = 'audio/cantiques/' + num + '.opus';
    }
    else {
        audioPath = AUDIO_ROOT + fichier.replace('.html', '.opus');
    }
    return audioPath;
}

function extraireNomFichier(fichier) {
    if (!fichier) return '';
    return fichier.split('/').pop().replace('.html', '').replace(/_/g, ' ').toUpperCase();
}

function startPlaylist(playlist, titre) {
    currentPlaylist = playlist;
    currentIndex = 0;
    showMiniPlayer(titre);
    playCurrentTrack();
}

function playCurrentTrack() {
    if (currentIndex >= currentPlaylist.length) return;
    
    const track = currentPlaylist[currentIndex];
    if (!currentAudio) {
        currentAudio = new Audio();
        setupAudioEvents();
    }
    
    const trackNameElement = document.getElementById('track-name');
    if (trackNameElement) trackNameElement.textContent = track.nom;

    currentAudio.src = track.path;
    currentAudio.play().catch(() => nextTrack());
}

function setupAudioEvents() {
    currentAudio.onended = () => nextTrack();
    currentAudio.ontimeupdate = () => {
        const progress = document.getElementById('audio-progress');
        if (progress && !isDragging && !isNaN(currentAudio.duration)) {
            progress.value = (currentAudio.currentTime / currentAudio.duration) * 100;
        }
    };
}

function nextTrack() {
    currentIndex++;
    if (currentIndex < currentPlaylist.length) playCurrentTrack();
    else hideMiniPlayer();
}

function previousTrack() {
    if (currentIndex > 0) {
        currentIndex--;
        playCurrentTrack();
    }
}

function showMiniPlayer(titre) {
    let player = document.getElementById('mini-player');
    if (!player) {
        player = document.createElement('div');
        player.id = 'mini-player';
        // Z-INDEX très élevé pour passer au dessus de Onsen UI
        player.style.cssText = `position:fixed;bottom:0;left:0;right:0;background:${ROUGE_OFFICIEL};color:white;padding:15px;z-index:99999;border-radius:15px 15px 0 0;box-shadow:0 -2px 10px rgba(0,0,0,0.3);`;
        player.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <b id="player-title" style="text-transform:uppercase;font-size:14px;"></b>
                <ons-icon icon="md-close" onclick="hideMiniPlayer()"></ons-icon>
            </div>
            <div id="track-name" style="font-size:11px;margin-bottom:8px;opacity:0.8;"></div>
            <input type="range" id="audio-progress" value="0" max="100" style="width:100%;margin-bottom:10px;" oninput="seekAudio(this.value)">
            <div style="display:flex;justify-content:center;gap:30px;align-items:center;">
                <ons-icon icon="md-skip-previous" size="25px" onclick="previousTrack()"></ons-icon>
                <ons-icon id="play-pause-icon" icon="md-pause" size="35px" onclick="togglePlay()"></ons-icon>
                <ons-icon icon="md-skip-next" size="25px" onclick="nextTrack()"></ons-icon>
            </div>`;
        document.body.appendChild(player);
    }
    player.style.display = 'block';
    document.getElementById('player-title').textContent = titre;
}

function hideMiniPlayer() {
    const player = document.getElementById('mini-player');
    if (player) player.style.display = 'none';
    if (currentAudio) currentAudio.pause();
}

function togglePlay() {
    if (!currentAudio) return;
    const icon = document.getElementById('play-pause-icon');
    if (currentAudio.paused) {
        currentAudio.play();
        icon.setAttribute('icon', 'md-pause');
    } else {
        currentAudio.pause();
        icon.setAttribute('icon', 'md-play');
    }
}

function seekAudio(value) {
    if (currentAudio) currentAudio.currentTime = (value / 100) * currentAudio.duration;
}