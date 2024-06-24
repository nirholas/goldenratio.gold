let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let scale = 1;
let flip = false;
let invert = false;
let originalImage = null;
const overlays = [];
const overlayImgSrc = 'overlay.png';  // Default overlay image
let currentOverlay = null;

// Variables for touch gestures
let initialDistance = 0;
let initialAngle = 0;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('mousedown', (e) => {
    if (isOverlaySelected(e)) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    } else {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    }
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        if (currentOverlay) {
            currentOverlay.x += e.clientX - startX;
            currentOverlay.y += e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
        } else {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
        }
        drawImageWithOverlays(currentImage);
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoom = e.deltaY * -0.01;
    if (currentOverlay) {
        currentOverlay.scale += zoom;
        currentOverlay.scale = Math.min(Math.max(0.5, currentOverlay.scale), 3);
    } else {
        scale += zoom;
        scale = Math.min(Math.max(0.5, scale), 3);
    }
    drawImageWithOverlays(currentImage);
});

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && isOverlaySelected(e.touches[0])) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        canvas.style.cursor = 'grabbing';
    } else if (e.touches.length === 2 && currentOverlay) {
        initialDistance = getDistance(e.touches);
        initialAngle = getAngle(e.touches);
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        if (currentOverlay) {
            currentOverlay.x += touch.clientX - startX;
            currentOverlay.y += touch.clientY - startY;
            startX = touch.clientX;
            startY = touch.clientY;
        } else {
            translateX = touch.clientX - startX;
            translateY = touch.clientY - startY;
        }
        drawImageWithOverlays(currentImage);
    } else if (e.touches.length === 2 && currentOverlay) {
        const newDistance = getDistance(e.touches);
        const newAngle = getAngle(e.touches);

        currentOverlay.scale *= newDistance / initialDistance;
        currentOverlay.rotation += newAngle - initialAngle;

        initialDistance = newDistance;
        initialAngle = newAngle;

        drawImageWithOverlays(currentImage);
    }
});

canvas.addEventListener('touchend', (e) => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

function getDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function getAngle(touches) {
    const [touch1, touch2] = touches;
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

let currentImage;

function handleImage(event) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            originalImage = img;
            canvas.width = img.width;
            canvas.height = img.height;
            drawImageWithOverlays(img);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function drawImageWithOverlays(img) {
    const width = img.width * scale;
    const height = img.height * scale;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);
    if (flip) {
        ctx.scale(-1, 1);
        ctx.translate(-img.width, 0);
    }
    ctx.drawImage(img, 0, 0, width, height);
    overlays.forEach(overlay => drawOverlay(ctx, overlay));
    if (invert) {
        invertColorsOnCanvas();
    }
    ctx.restore();
}

function drawOverlay(ctx, overlay) {
    ctx.save();
    ctx.translate(overlay.x, overlay.y);
    ctx.scale(overlay.scale, overlay.scale);
    ctx.rotate(overlay.rotation * Math.PI / 180);
    const img = new Image();
    img.src = overlay.src;
    ctx.drawImage(img, 0, 0, overlay.width, overlay.height);
    ctx.restore();
}

function addOverlay(src) {
    const overlay = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        width: canvas.width,
        height: canvas.height,
        src: src
    };
    overlays.push(overlay);
    currentOverlay = overlay;
    drawImageWithOverlays(currentImage);
}

function isOverlaySelected(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Check if the click is within any overlay bounds
    return overlays.some(overlay => {
        const overlayX = overlay.x;
        const overlayY = overlay.y;
        const overlayWidth = overlay.width * overlay.scale;
        const overlayHeight = overlay.height * overlay.scale;
        const isSelected = x >= overlayX && x <= overlayX + overlayWidth &&
                           y >= overlayY && y <= overlayY + overlayHeight;
        if (isSelected) currentOverlay = overlay;
        return isSelected;
    });
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = 'golden_celestial_ratio.png';
    link.href = canvas.toDataURL();
    link.click();
}

function applyFilter(filter) {
    canvas.style.filter = filter;
}

function flipAxis() {
    flip = !flip;
    drawImageWithOverlays(currentImage);
}

function invertColors() {
    invert = !invert;
    drawImageWithOverlays(currentImage);
}

function resetCanvas() {
    flip = false;
    invert = false;
    translateX = 0;
    translateY = 0;
    scale = 1;
    overlays.length = 0;
    currentOverlay = null;
    currentImage = originalImage;
    drawImageWithOverlays(currentImage);
}

function invertColorsOnCanvas() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
    }
    ctx.putImageData(imageData, 0, 0);
}

// Function to toggle fullscreen mode for the canvas
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.getElementById('upload').addEventListener('change', handleImage, false);
document.getElementById('addOverlayBtn').addEventListener('click', () => addOverlay('overlay.png'), false);
document.getElementById('addMiladyRatioBtn').addEventListener('click', () => addOverlay('miladyratio.png'), false);
document.getElementById('addMiladyEyesBtn').addEventListener('click', () => addOverlay('eyes.png'), false);
document.getElementById('downloadBtn').addEventListener('click', downloadImage, false);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullScreen);
document.getElementById('undoBtn').addEventListener('click', undo, false);
document.getElementById('redoBtn').addEventListener('click', redo, false);

// Event listener for swipe gestures
let touchstartX = 0;
let touchendX = 0;

canvas.addEventListener('touchstart', (e) => {
    touchstartX = e.changedTouches[0].screenX;
});

canvas.addEventListener('touchend', (e) => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipeGesture();
});

function handleSwipeGesture() {
    if (touchendX < touchstartX) {
        // Swipe left action
    }
    if (touchendX > touchstartX) {
        // Swipe right action
    }
}

// Undo/Redo functionality
const actionStack = [];
let actionIndex = -1;

function pushAction(action) {
    actionStack.splice(actionIndex + 1);
    actionStack.push(action);
    actionIndex++;
}

function undo() {
    if (actionIndex >= 0) {
        const action = actionStack[actionIndex];
        // Perform undo operation based on action
        actionIndex--;
    }
}

function redo() {
    if (actionIndex < actionStack.length - 1) {
        actionIndex++;
        const action = actionStack[actionIndex];
        // Perform redo operation based on action
    }
}

// Remove save and load project functionality
