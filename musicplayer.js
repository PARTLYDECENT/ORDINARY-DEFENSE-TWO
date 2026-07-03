document.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio();
    const playlist = Array.from({length: 10}, (_, i) => `assets/music/${i + 1}.mp3`);
    let currentTrackIndex = -1;
    audio.muted = false;

    function playRandomSong() {
        let newTrackIndex;
        do {
            newTrackIndex = Math.floor(Math.random() * playlist.length);
        } while (playlist.length > 1 && newTrackIndex === currentTrackIndex);
        
        currentTrackIndex = newTrackIndex;
        const track = playlist[currentTrackIndex];
        audio.src = track;

        audio.play().catch(error => {
            console.error("Error playing audio. Autoplay might be blocked. User interaction needed.", error);
        });
    }

    // Expose the function to the global scope so it can be called from other scripts
    window.playNewMusicTrack = playRandomSong;

    audio.addEventListener('ended', playRandomSong);

    window.toggleMusicMute = () => {
        audio.muted = !audio.muted;
        const musicIcon = document.getElementById('music-icon');
        if (musicIcon) {
            musicIcon.className = `fa-solid ${audio.muted ? 'fa-volume-xmark' : 'fa-music'} text-lg`;
        }
    };

    playRandomSong();
});
