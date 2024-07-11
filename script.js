let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let scale = 1;
let flip = false;
let invert = false;
let originalImage = null;
const overlays = [];
const textOverlays = [];
let currentOverlay = null;
let currentTextOverlay = null;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Variables for touch gestures
let initialDistance = 0;
let initialAngle = 0;

canvas.addEventListener('mousedown', (e) => {
    const handleIndex = getHandleUnderMouse(e);
    if (handleIndex !== -1) {
        resizing = true;
        resizingHandle = handleIndex;
        startX = e.clientX;
        startY = e.clientY;
    } else if (isOverlaySelected(e)) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    }
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    resizing = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        if (currentOverlay) {
            currentOverlay.x += e.clientX - startX;
            currentOverlay.y += e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
        } else if (currentTextOverlay) {
            currentTextOverlay.x += e.clientX - startX;
            currentTextOverlay.y += e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
        } else {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
        }
        drawImageWithOverlays(currentImage);
    } else if (resizing) {
        if (resizingHandle === 0) { // Top-left
            currentOverlay.width += startX - e.clientX;
            currentOverlay.height += startY - e.clientY;
            startX = e.clientX;
            startY = e.clientY;
        } else if (resizingHandle === 1) { // Top-right
            currentOverlay.width += e.clientX - startX;
            currentOverlay.height += startY - e.clientY;
            startX = e.clientX;
            startY = e.clientY;
        } else if (resizingHandle === 2) { // Bottom-left
            currentOverlay.width += startX - e.clientX;
            currentOverlay.height += e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
        } else if (resizingHandle === 3) { // Bottom-right
            currentOverlay.width += e.clientX - startX;
            currentOverlay.height += e.clientY - startY;
            startX = e.clientX;
            startY = e.clientY;
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
    } else if (currentTextOverlay) {
        currentTextOverlay.fontSize += zoom * 10;
        currentTextOverlay.fontSize = Math.min(Math.max(10, currentTextOverlay.fontSize), 100);
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
        } else if (currentTextOverlay) {
            currentTextOverlay.x += touch.clientX - startX;
            currentTextOverlay.y += touch.clientY - startY;
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
    textOverlays.forEach(textOverlay => drawTextOverlay(ctx, textOverlay));
    ctx.restore();
}

function drawOverlay(ctx, overlay) {
    ctx.save();
    ctx.translate(overlay.x, overlay.y);
    ctx.scale(overlay.scale, overlay.scale);
    ctx.rotate(overlay.rotation * Math.PI / 180);
    const img = new Image();
    img.src = overlay.src;
    img.onload = function() {
        ctx.drawImage(img, 0, 0, overlay.width, overlay.height);
        if (overlay.inverted) {
            invertColorsOnOverlay(ctx, overlay.width, overlay.height);
        }
        drawResizeHandles(ctx, overlay);
    };
    ctx.restore();
}

function drawResizeHandles(ctx, overlay) {
    const handleSize = 8; // Size of the corner box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black
    // Top-left corner
    ctx.fillRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);
    // Top-right corner
    ctx.fillRect(overlay.width - handleSize / 2, -handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(overlay.width - handleSize / 2, -handleSize / 2, handleSize, handleSize);
    // Bottom-left corner
    ctx.fillRect(-handleSize / 2, overlay.height - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(-handleSize / 2, overlay.height - handleSize / 2, handleSize, handleSize);
    // Bottom-right corner
    ctx.fillRect(overlay.width - handleSize / 2, overlay.height - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(overlay.width - handleSize / 2, overlay.height - handleSize / 2, handleSize, handleSize);
}

function invertColorsOnOverlay(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
    }
    ctx.putImageData(imageData, 0, 0);
}

function addOverlay(src) {
    const overlay = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        width: canvas.width,
        height: canvas.height,
        src: src,
        inverted: false // Add this line
    };
    overlays.push(overlay);
    currentOverlay = overlay;
    drawImageWithOverlays(currentImage);
}

function addTextOverlay() {
    const textInput = document.getElementById('textInput').value;
    const fontSize = document.getElementById('fontSizeSlider').value;
    const fontFamily = document.getElementById('fontSelect').value;
    if (textInput.trim() !== "") {
        const textOverlay = {
            text: textInput,
            x: canvas.width / 2,
            y: canvas.height / 2,
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: "#000000"
        };
        textOverlays.push(textOverlay);
        currentTextOverlay = textOverlay;
        drawImageWithOverlays(currentImage);
    }
}

function isOverlaySelected(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return overlays.some(overlay => {
        const overlayX = overlay.x;
        const overlayY = overlay.y;
        const overlayWidth = overlay.width * overlay.scale;
        const overlayHeight = overlay.height * overlay.scale;
        const isSelected = x >= overlayX && x <= overlayX + overlayWidth &&
                           y >= overlayY && y <= overlayY + overlayHeight;
        if (isSelected) currentOverlay = overlay;
        return isSelected;
    }) || textOverlays.some(textOverlay => {
        const textWidth = ctx.measureText(textOverlay.text).width;
        const textHeight = textOverlay.fontSize;
        const isSelected = x >= textOverlay.x && x <= textOverlay.x + textWidth &&
                           y >= textOverlay.y - textHeight && y <= textOverlay.y;
        if (isSelected) currentTextOverlay = textOverlay;
        return isSelected;
    });
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = 'golden_celestial_ratio.png';
    link.href = canvas.toDataURL();
    link.click();
}

function flipAxis() {
    flip = !flip;
    drawImageWithOverlays(currentImage);
}

function invertOverlayColors() {
    if (currentOverlay) {
        currentOverlay.inverted = !currentOverlay.inverted;
        drawImageWithOverlays(currentImage);
    }
}

function resetCanvas() {
    flip = false;
    invert = false;
    translateX = 0;
    translateY = 0;
    scale = 1;
    overlays.length = 0;
    textOverlays.length = 0;
    currentOverlay = null;
    currentTextOverlay = null;
    currentImage = originalImage;
    drawImageWithOverlays(currentImage);
}

document.getElementById('upload').addEventListener('change', handleImage, false);
document.getElementById('addOverlayBtn').addEventListener('click', () => addOverlay('overlay.png'), false);
document.getElementById('addMiladyRatioBtn').addEventListener('click', () => addOverlay('miladyratio.png'), false);
document.getElementById('addMiladyEyesBtn').addEventListener('click', () => addOverlay('eyes.png'), false);
document.getElementById('downloadBtn').addEventListener('click', downloadImage, false);
document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
});
document.getElementById('addTextBtn').addEventListener('click', addTextOverlay, false);
document.getElementById('addToCollectionBtn').addEventListener('click', function() {
    window.location.href = 'https://memedepot.com/d/golden-celestial-ratio';
});

function getHandleUnderMouse(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const handleSize = 10;
    const areas = [
        {x: currentOverlay.x - handleSize / 2, y: currentOverlay.y - handleSize / 2}, // Top-left
        {x: currentOverlay.x + currentOverlay.width - handleSize / 2, y: currentOverlay.y - handleSize / 2}, // Top-right
        {x: currentOverlay.x - handleSize / 2, y: currentOverlay.y + currentOverlay.height - handleSize / 2}, // Bottom-left
        {x: currentOverlay.x + currentOverlay.width - handleSize / 2, y: currentOverlay.y + currentOverlay.height - handleSize / 2} // Bottom-right
    ];
    return areas.findIndex(area => 
        mouseX > area.x && mouseX < area.x + handleSize &&
        mouseY > area.y && mouseY < area.y + handleSize);
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
        // Perform undo operation based on action type
        switch(action.type) {
            case 'addOverlay':
                overlays.pop();
                break;
            case 'addTextOverlay':
                textOverlays.pop();
                break;
            case 'flipAxis':
                flip = !action.state;
                break;
            case 'invertColors':
                invert = !action.state;
                break;
            case 'resetCanvas':
                resetCanvas();
                break;
        }
        actionIndex--;
        drawImageWithOverlays(currentImage);
    }
}

function redo() {
    if (actionIndex < actionStack.length - 1) {
        actionIndex++;
        const action = actionStack[actionIndex];
        // Perform redo operation based on action type
        switch(action.type) {
            case 'addOverlay':
                overlays.push(action.overlay);
                break;
            case 'addTextOverlay':
                textOverlays.push(action.textOverlay);
                break;
            case 'flipAxis':
                flip = action.state;
                break;
            case 'invertColors':
                invert = action.state;
                break;
            case 'resetCanvas':
                resetCanvas();
                break;
        }
        drawImageWithOverlays(currentImage);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        undo();
    }
    if (e.ctrlKey && e.key === 'y') {
        redo();
    }
});
