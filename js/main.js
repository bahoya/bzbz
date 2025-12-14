
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

window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingFill = document.getElementById('loading-bar-fill');
    const loadingText = document.getElementById('loading-text');
    let loadedCount = 0;
    const totalAssets = assetList.length;

    // Helper to update progress
    function updateProgress() {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalAssets) * 100);
        loadingFill.style.width = `${percent}%`;
        loadingText.innerText = `${percent}%`;

        if (loadedCount >= totalAssets) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                // Initialize Game
                const game = new Game();
            }, 500); // Small delay for smooth finish
        }
    }

    // Start Loading
    if (totalAssets === 0) {
        loadingScreen.style.display = 'none';
        new Game();
    } else {
        assetList.forEach(src => {
            const ext = src.split('.').pop().toLowerCase();
            let asset;

            if (['png', 'jpg', 'jpeg'].includes(ext)) {
                asset = new Image();
                asset.onload = updateProgress;
                asset.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    updateProgress(); // Continue anyway
                };
                asset.src = getAsset(src); // Handle base64 logic if any
            } else if (['wav', 'mp3'].includes(ext)) {
                // For audio, we can use fetch/Audio. Audio is simpler but sometimes doesn't fire events if cached.
                // We'll use new Audio().
                asset = new Audio();
                // 'canplaythrough' is good, but 'loadeddata' might be faster for "loaded enough".
                // However, for pure preloading, just creating it might not trigger download unless we play?
                // Actually 'preload="auto"' logic.
                // Better approach for reliably tracking: fetch.

                // Let's stick to Audio for simplicity, but attach multiple events.
                asset.src = getAsset(src);
                asset.preload = 'auto'; // Force load

                // Fallback timeout in case event never fires (common issue)
                let handled = false;
                const onLoaded = () => {
                    if (!handled) {
                        handled = true;
                        updateProgress();
                    }
                };

                asset.addEventListener('canplaythrough', onLoaded);
                asset.addEventListener('error', () => {
                    console.error(`Failed to load sound: ${src}`);
                    onLoaded();
                });

                // 3s timeout per asset to prevent hanging
                setTimeout(onLoaded, 3000);
            } else {
                // Unknown type?
                updateProgress();
            }
        });
    }
});
