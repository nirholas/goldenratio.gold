function drawGoldenSpiral(ctx, width, height) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let a = width, b = height, c = Math.min(width, height);

    ctx.beginPath();
    ctx.moveTo(a, b);

    for (let i = 0; i < 10; i++) {
        ctx.arc(a, b, c, Math.PI, 1.5 * Math.PI);
        a -= c / phi;
        b -= c / phi;
        c /= phi;
    }
    ctx.stroke();
}

function drawGoldenRectangle(ctx, width, height) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let a = 0, b = 0, c = width, d = height;

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        ctx.rect(a, b, c, d);
        a += c / phi;
        b += d / phi;
        c /= phi;
        d /= phi;
    }
    ctx.stroke();
}

function drawGoldenTriangle(ctx, width, height) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let a = 
