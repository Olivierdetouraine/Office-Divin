const AUDIO_ROOT = 'audio/';
const ROUGE_OFFICIEL = "#930707";

var currentAudio = null;
var currentPlaylist = [];
var currentIndex = 0;
var isDragging = false;

function preparerPlaylistDynamique(office) {
    console.log('=== LECTEUR AUDIO : Préparation playlist ===');
    const prefixe = Prefixe_office(office);
    const labels = Labels_office(office);
    const playlist = [];
    
    // 1. Gérer l'invitatoire pour les Laudes uniquement
    if (office === 'laudes') {
        const invLabels = ['antienne_inv', 'psaume_inv']; 
        invLabels.forEach(label => {
            const fichier = sessionStorage.getItem(prefixe + label);
            if (fichier && fichier !== '' && fichier !== 'empty.html') {
                playlist.push({
                    path: convertirHtmlVersAudio(fichier, label),
                    nom: extraireNomFichier(fichier)
                });
            }
        });
    }
    
    // 2. Parcourir les labels standards de l'office
    labels.forEach(label => {
        // On évite de rajouter l'invitatoire deux fois s'il est dans Labels_office
        if (office === 'laudes' && (label === 'antienne_inv' || label === 'psaume_inv')) return;

        const fichier = sessionStorage.getItem(prefixe + label);
        if (fichier && fichier !== '' && fichier !== 'empty.html') {
            const audioPath = convertirHtmlVersAudio(fichier, label);
            if (audioPath) {
                playlist.push({
                    path: audioPath,
                    nom: extraireNomFichier(fichier)
                });
                
                // Gérer la répétition des antiennes (si activée)
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

    // CAS 1 : PSAUMES (ex: "118-19", "9A-I")
    if (label.includes('psaume')) {
        // On nettoie le nom : si lh.js a mis "psaumes/psaume118.html", on garde juste "118"
        let num = fichier.replace('psaumes/psaume', '').replace('.html', '');
        audioPath = 'audio/psaumes/psaume' + num + '.opus';
    } 
    // CAS 2 : CANTIQUES (AT ou NT)
    else if (label.includes('cantique')) {
        let num = fichier.replace('cantiques/', '').replace('.html', '');
        audioPath = 'audio/cantiques/' + num + '.opus';
    }
    // CAS 3 : TOUT LE RESTE (Hymnes, Oraisons, etc.)
    else {
        // On transforme le chemin relatif en chemin audio
        // ex: "laudes/hymnes/hymne_1_1_1.html" -> "audio/laudes/hymnes/hymne_1_1_1.opus"
        audioPath = AUDIO_ROOT + fichier.replace('.html', '.opus');
    }

    return audioPath;
}

function extraireNomFichier(fichier) {
    if (!fichier) return '';
    const nomComplet = fichier.split('/').pop();
    return nomComplet.replace('.html', '').replace(/_/g, ' ').toUpperCase();
}

function startPlaylist(playlist, titre) {
    currentPlaylist = playlist;
    currentIndex = 0;
    showMiniPlayer(titre);
    playCurrentTrack();
}

function playCurrentTrack() {
    if (currentIndex >= currentPlaylist.length) {
        hideMiniPlayer();
        return;
    }
    
    const track = currentPlaylist[currentIndex];
    if (!currentAudio) {
        currentAudio = new Audio();
        setupAudioEvents();
    }
    
    updateTrackName(track.nom);
    currentAudio.src = track.path;
    currentAudio.load();
    
    let playPromise = currentAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Fichier manquant : " + track.path);
            nextTrack(); // Passe au suivant si le fichier n'existe pas
        });
    }
}

function setupAudioEvents() {
    currentAudio.onended = () => nextTrack();
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

function nextTrack() {
    currentIndex++;
    playCurrentTrack();
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
        player.style.cssText = `position:fixed;bottom:0;left:0;right:0;background:${ROUGE_OFFICIEL};color:white;padding:15px;z-index:9999;border-radius:15px 15px 0 0;box-shadow:0 -2px 10px rgba(0,0,0,0.3);`;
        player.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <b id="player-title" style="text-transform:uppercase;font-size:14px;"></b>
                <div id="audio-time" style="font-size:12px;">0:00 / 0:00</div>
            </div>
            <div id="track-name" style="font-size:11px;margin-bottom:8px;opacity:0.9;font-style:italic;"></div>
            <input type="range" id="audio-progress" value="0" max="100" style="width:100%;accent-color:white;margin-bottom:10px;"
                   onmousedown="isDragging=true" onmouseup="isDragging=false;seekAudio(this.value)"
                   ontouchstart="isDragging=true" ontouchend="isDragging=false;seekAudio(this.value)">
            <div style="display:flex;justify-content:center;align-items:center;gap:40px;">
                <ons-icon icon="md-skip-previous" size="30px" onclick="previousTrack()" style="cursor:pointer;"></ons-icon>
                <ons-icon id="play-pause-icon" icon="md-pause" size="40px" onclick="togglePlay()" style="cursor:pointer;"></ons-icon>
                <ons-icon icon="md-skip-next" size="30px" onclick="nextTrack()" style="cursor:pointer;"></ons-icon>
            </div>`;
        document.body.appendChild(player);
    }
    player.style.display = 'block';
    document.getElementById('player-title').textContent = titre;
}

function hideMiniPlayer() {
    const player = document.getElementById('mini-player');
    if (player) player.style.display = 'none';
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
    }
}

function updateTrackName(nom) {
    const el = document.getElementById('track-name');
    if (el) el.textContent = nom;
}

function updatePlayPauseIcon() {
    const icon = document.getElementById('play-pause-icon');
    if (icon && currentAudio) icon.setAttribute('icon', currentAudio.paused ? 'md-play' : 'md-pause');
}

function togglePlay() {
    if (!currentAudio) return;
    currentAudio.paused ? currentAudio.play() : currentAudio.pause();
}

function seekAudio(value) {
    if (currentAudio && !isNaN(currentAudio.duration)) currentAudio.currentTime = (value / 100) * currentAudio.duration;
}

function formatTime(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
}

function stopAudio() { hideMiniPlayer(); }

// Fonction appelée depuis accueil.html pour lancer un office
function playOffice(office) {
    console.log('=== playOffice appelé avec:', office);
    
    // Charger la page de l'office
    Charge_page(office + '.html');
}

// Fonction appelée depuis accueil.html pour lancer un commun
function playCommun(categorie, office) {
    console.log('=== playCommun appelé avec:', categorie, office);
    
    // Charger la page des communs
    Charge_page('communs.html');
}
