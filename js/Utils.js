function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.radius + c2.radius;
}

function createImageMask(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const mask = [];
    for (let i = 3; i < imageData.data.length; i += 4) {
        mask.push(imageData.data[i] > 0); // true if not transparent
    }
    return mask;
}

function checkPixelCollision(entity1, entity2) {
    // 1. Bounding Box Check (Optimization)
    if (entity1.x + entity1.width < entity2.x ||
        entity1.x > entity2.x + entity2.width ||
        entity1.y + entity1.height < entity2.y ||
        entity1.y > entity2.y + entity2.height) {
        return false;
    }

    // If no mask, fall back to box collision (should be covered by above, but safe to return true if box collided and no mask logic exist yet)
    if (!entity1.mask || !entity2.mask) {
        return true;
    }

    // 2. Pixel Perfect Check
    const xMin = Math.max(entity1.x, entity2.x);
    const xMax = Math.min(entity1.x + entity1.width, entity2.x + entity2.width);
    const yMin = Math.max(entity1.y, entity2.y);
    const yMax = Math.min(entity1.y + entity1.height, entity2.y + entity2.height);

    for (let y = yMin; y < yMax; y++) {
        for (let x = xMin; x < xMax; x++) {
            // Calculate local coordinates for each entity
            const x1 = Math.floor(x - entity1.x);
            const y1 = Math.floor(y - entity1.y);
            const x2 = Math.floor(x - entity2.x);
            const y2 = Math.floor(y - entity2.y);

            // Access mask with scaling
            if (!entity1.image || !entity2.image) continue;

            const srcX1 = Math.floor(x1 * (entity1.image.width / entity1.width));
            const srcY1 = Math.floor(y1 * (entity1.image.height / entity1.height));

            const srcX2 = Math.floor(x2 * (entity2.image.width / entity2.width));
            const srcY2 = Math.floor(y2 * (entity2.image.height / entity2.height));

            const i1 = srcY1 * entity1.image.width + srcX1;
            const i2 = srcY2 * entity2.image.width + srcX2;

            // Safe check bounds
            if (i1 >= 0 && i1 < entity1.mask.length && i2 >= 0 && i2 < entity2.mask.length) {
                if (entity1.mask[i1] && entity2.mask[i2]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getAsset(path) {
    // If global ASSETS object exists (injected by bundler)
    if (window.ASSETS) {
        // key is the filename (e.g. 'player.png')
        const name = path.split('/').pop();
        if (window.ASSETS[name]) {
            return window.ASSETS[name];
        } else {
            console.warn('Asset not found in bundle:', name);
        }
    }
    // Fallback to original path
    return path;
}
