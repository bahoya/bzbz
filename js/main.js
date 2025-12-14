
const assetList = [
    // Images
    'assets/ali.png', 'assets/alik.png', 'assets/ambulans.png', 'assets/axe.png',
    'assets/baho.png', 'assets/cobansalata.png', 'assets/dgkn.png', 'assets/efe.png',
    'assets/fuze.png', 'assets/heart.png', 'assets/kemer.png', 'assets/kizilay.png',
    'assets/mayonez.png', 'assets/ofoedu.png', 'assets/omer.png', 'assets/oncu.png',
    'assets/rf.png', 'assets/rock.png', 'assets/sigara.png', 'assets/spagetti.png',
    'assets/tank.png', 'assets/thr.png', 'assets/top.png', 'assets/tras.png',
    'assets/tree.png', 'assets/ziraat.png',
    // Sounds (WAV/MP3)
    'assets/alikolum.WAV', 'assets/aliolum.WAV', 'assets/ambulans.WAV',
    'assets/bahoolum.WAV', 'assets/dgknolum.WAV', 'assets/duman.WAV',
    'assets/dusmanolmesi.WAV', 'assets/efeolum.WAV', 'assets/kizilay.WAV',
    'assets/music.mp3', 'assets/omerolum.WAV', 'assets/playerolum.WAV',
    'assets/sigara.WAV', 'assets/tekbzt.WAV', 'assets/throlum.WAV',
    'assets/thrulti.WAV', 'assets/tras.WAV', 'assets/ulti.WAV'
];

// Global variable to prevent double initialization
let gameStarted = false;

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingFill = document.getElementById('loading-bar-fill');
    const loadingText = document.getElementById('loading-text');

    // Safety check: if elements missing (e.g. single file build might have structure differences), just start
    if (!loadingScreen || !loadingFill) {
        if (!gameStarted) { gameStarted = true; new Game(); }
        return;
    }

    let loadedCount = 0;
    const totalAssets = assetList.length;

    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        // Fade out
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            new Game();
        }, 500);
    }

    // Helper to update progress
    function updateProgress() {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalAssets) * 100);

        if (loadingFill) loadingFill.style.width = `${percent}%`;
        if (loadingText) loadingText.innerText = `${percent}%`;

        if (loadedCount >= totalAssets) {
            startGame();
        }
    }

    // Global Failsafe: Force start after 7 seconds if stuck
    setTimeout(() => {
        if (!gameStarted) {
            console.warn("Loading timed out, forcing game start.");
            startGame();
        }
    }, 7000);

    // Start Loading
    if (totalAssets === 0) {
        startGame();
    } else {
        assetList.forEach(src => {
            const ext = src.split('.').pop().toLowerCase();
            let asset;
            const absoluteSrc = getAsset(src);

            // Define handleLoad once to avoid duplication
            let handled = false;
            const onLoaded = () => {
                if (!handled) {
                    handled = true;
                    updateProgress();
                    // Clean up listeners? Not strictly necessary for oneshot loading
                }
            };

            if (['png', 'jpg', 'jpeg'].includes(ext)) {
                asset = new Image();
                asset.onload = onLoaded;
                asset.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    onLoaded();
                };
                asset.src = absoluteSrc;
            } else if (['wav', 'mp3'].includes(ext)) {
                asset = new Audio();

                // Audio events can be tricky. We use multiple just in case.
                // 'loadeddata' is usually enough for "it exists and we can play".
                asset.addEventListener('loadeddata', onLoaded);
                asset.addEventListener('error', () => {
                    console.error(`Failed to load sound: ${src}`);
                    onLoaded();
                });

                // Some browsers won't load audio until user interaction unless we force it?
                // But we just need metadata or first frame.
                asset.src = absoluteSrc;
                asset.preload = 'auto'; // Force buffer
            } else {
                // Unknown type, just skip
                onLoaded();
            }

            // Individual Timeout (Backup)
            setTimeout(onLoaded, 2000);
        });
    }
});
