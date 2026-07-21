document.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio();
    const playlist = Array.from({length: 7}, (_, i) => `assets/music/${i + 1}.mp3`);
    let currentTrackIndex = -1;
    audio.muted = false;
    let inMenu = true;

    function playRandomSong() {
        let newTrackIndex;
        do {
            newTrackIndex = Math.floor(Math.random() * playlist.length);
        } while (playlist.length > 1 && newTrackIndex === currentTrackIndex);
        
        currentTrackIndex = newTrackIndex;
        const track = playlist[currentTrackIndex];
        audio.loop = false;
        audio.src = track;

        audio.play().catch(error => {
            console.error("Error playing audio. Autoplay might be blocked. User interaction needed.", error);
        });
    }

    function playMenuMusic() {
        audio.src = 'assets/music/bgmenu.mp3';
        audio.loop = true;
        audio.play().catch(error => {
            console.error("Menu audio blocked:", error);
        });
    }

    // Expose the functions to the global scope
    window.playNewMusicTrack = () => {
        if (inMenu) {
            inMenu = false;
            playRandomSong();
        } else {
            playRandomSong();
        }
    };

    window.switchToGameplayMusic = () => {
        if (inMenu) {
            inMenu = false;
            playRandomSong();
        }
    };

    window.isMusicMuted = () => {
        return audio.muted;
    };

    audio.addEventListener('ended', () => {
        if (!inMenu) {
            playRandomSong();
        }
    });

    window.toggleMusicMute = () => {
        audio.muted = !audio.muted;
        const musicIcon = document.getElementById('music-icon');
        if (musicIcon) {
            musicIcon.className = `fa-solid ${audio.muted ? 'fa-volume-xmark' : 'fa-music'} text-lg`;
        }
    };

    playMenuMusic();
});
