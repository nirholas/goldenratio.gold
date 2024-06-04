let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let scale = 1;
let currentPattern = 'spiral';
let flip = false;
let invert = false;
let originalImage = null;
const overlayImg = new Image();
overlayImg.src = 'overlay.png';  // Load the golden ratio overlay

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.addEventListener('mousedown', (e) => {
    if (isOverlaySelected(e)) {
        isDraggingOverlay = true;
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
    isDraggingOverlay = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        drawImageWithGoldenRatio(currentImage);
    } else if (isDraggingOverlay) {
        overlayTranslateX += e.clientX - startX;
        overlayTranslateY += e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        drawImageWithGoldenRatio(currentImage);
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoom = e.deltaY * -0.01;
    if (isOverlaySelected(e)) {
        overlayScale += zoom;
        overlayScale = Math.min(Math.max(0.5, overlayScale), 3);
    } else {
        scale += zoom;
        scale = Math.min(Math.max(0.5, scale), 3);
    }
    drawImageWithGoldenRatio(currentImage);
});

let currentImage;
let overlayTranslateX = 0, overlayTranslateY = 0;
let overlayScale = 1;
let overlayRotation = 0;
let isDraggingOverlay = false;

function handleImage(event) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            originalImage = img;
            drawImageWithGoldenRatio(img);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function drawImageWithGoldenRatio(img) {
    const width = img.width * scale;
    const height = img.height * scale;

    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(translateX, translateY);
    ctx.scale(scale, scale);
    if (flip) {
        ctx.scale(-1, 1);
        ctx.translate(-img.width, 0);
    }
    ctx.drawImage(img, 0, 0, width, height);
    if (currentPattern === 'spiral') {
        drawOverlay(ctx, width, height);
    }
    drawGoldenPattern(ctx, width, height);
    drawAnnotations(ctx);
    if (invert) {
        invertColorsOnCanvas();
    }
    ctx.restore();
}

function drawOverlay(ctx, width, height) {
    ctx.save();
    ctx.translate(overlayTranslateX, overlayTranslateY);
    ctx.scale(overlayScale, overlayScale);
    ctx.rotate(overlayRotation * Math.PI / 180);
    ctx.drawImage(overlayImg, 0, 0, width, height);
    ctx.restore();
}

function isOverlaySelected(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Check if the click is within the overlay bounds
    // Adjust the bounds check based on your specific needs
    return x >= overlayTranslateX && x <= overlayTranslateX + overlayImg.width * overlayScale &&
           y >= overlayTranslateY && y <= overlayTranslateY + overlayImg.height * overlayScale;
}

function drawGoldenPattern(ctx, width, height) {
    const color = document.getElementById('colorPicker').value;
    ctx.strokeStyle = `#${color}`;

    switch(currentPattern) {
        case 'spiral':
            drawGoldenSpiral(ctx, width, height);
            break;
        case 'rectangle':
            drawGoldenRectangle(ctx, width, height);
            break;
        case 'triangle':
            drawGoldenTriangle(ctx, width, height);
            break;
    }
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

function setPattern(pattern) {
    currentPattern = pattern;
    drawImageWithGoldenRatio(currentImage);
}

function flipAxis() {
    flip = !flip;
    drawImageWithGoldenRatio(currentImage);
}

function invertColors() {
    invert = !invert;
    drawImageWithGoldenRatio(currentImage);
}

function resetCanvas() {
    flip = false;
    invert = false;
    translateX = 0;
    translateY = 0;
    scale = 1;
    overlayTranslateX = 0;
    overlayTranslateY = 0;
    overlayScale = 1;
    overlayRotation = 0;
    currentImage = originalImage;
    drawImageWithGoldenRatio(currentImage);
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

document.getElementById('upload').addEventListener('change', handleImage, false);
document.getElementById('downloadBtn').addEventListener('click', downloadImage, false);
