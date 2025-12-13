class SoundManager {
    constructor() {
        this.sounds = {};
    }

    load() {
        const soundFiles = [
            { name: 'throw', src: 'assets/tekbzt.WAV', volume: 0.2 },
            { name: 'enemyDeath', src: 'assets/dusmanolmesi.WAV', volume: 0.6 },
            { name: 'playerDeath', src: 'assets/omerolum.WAV', volume: 1.0 },
            { name: 'playerolum', src: 'assets/playerolum.WAV', volume: 0.8 }, // Player death sound
            { name: 'omerolum', src: 'assets/omerolum.WAV', volume: 0.6 }, // Specific enemy omer sound
            { name: 'ulti', src: 'assets/ulti.WAV', volume: 1.0 },
            { name: 'music', src: 'assets/music.mp3', volume: 0.1, loop: true },
            { name: 'throlum', src: 'assets/throlum.WAV', volume: 0.4 },
            { name: 'efeolum', src: 'assets/efeolum.WAV', volume: 0.6 },
            { name: 'dgknolum', src: 'assets/dgknolum.WAV', volume: 1 },
            { name: 'bahoolum', src: 'assets/bahoolum.WAV', volume: 0.6 },
            { name: 'aliolum', src: 'assets/aliolum.WAV', volume: 0.8 },
            { name: 'alikolum', src: 'assets/alikolum.WAV', volume: 1 },
            { name: 'duman', src: 'assets/duman.WAV', volume: 0.5 }
        ];

        soundFiles.forEach(s => {
            const audio = new Audio(getAsset(s.src));
            audio.volume = s.volume;
            if (s.loop) audio.loop = true;
            this.sounds[s.name] = audio;
        });
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0; // Rewind to start
            sound.play().catch(e => console.warn(`Error playing sound ${name}:`, e));
        }
    }
    setMusicVolume(vol) {
        const music = this.sounds['music'];
        if (music) {
            music.volume = vol;
        }
    }
}
