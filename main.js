var CIRCLE_COLOR = "#000000";
var CIRCLE_LW = 2;
var POINT_COLOR = "#000000";
var POINT_SIZE = 0.5;
var SEGMENT_WIDTH = 0.2;
var ARROW_MARGIN = 20;
var ARROW_CAPLEN = 12;
var ARROW_CAPWIDTH = 10;

var DRAW_ARROWS = false;
var LEN_BASED_COLOR = true;
var LOOP_BASED_COLOR = false;

var MULTIPLIER = 33;
var MODULUS = 567;


function colorChannelToHex(v) {
    let result = Math.round(255 * v).toString(16);
    while (result.length < 2) result = "0" + result;
    return result;
}

function color(r, g, b) {
    let result = (
        "#"
        + colorChannelToHex(r)
        + colorChannelToHex(g)
        + colorChannelToHex(b)
    );
    return result;
}


// Taken from: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately#17243070
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return color(r, g, b);
}


function genColorList(N) {
    let result = Array(N);
    for (let index = 0; index < result.length; index++) {
        result[index] = HSVtoRGB(index / N, 0.9, 0.9);
    }
    return result;
}

class CMap {
    constructor(vals, r, g, b) {
        this.vals = vals;
        this.r = r;
        this.g = g;
        this.b = b;
    }

    get(v) {
        if (v <= this.vals[0]) {
            return color(this.r[0], this.g[0], this.b[0]);
        }
        if (v >= this.vals[this.vals.length - 1]) {
            return color(this.r[this.vals.length - 1], this.g[this.vals.length - 1], this.b[this.vals.length - 1]);
        }
        let id = 1;
        while (v > this.vals[id]) id++;

        let alpha = (v - this.vals[id - 1]) / (this.vals[id] - this.vals[id - 1]);
        let r = this.r[id - 1] * (1 - alpha) + this.r[id] * alpha;
        let g = this.g[id - 1] * (1 - alpha) + this.g[id] * alpha;
        let b = this.b[id - 1] * (1 - alpha) + this.b[id] * alpha;

        return color(r, g, b);
    }
}

let cmap = new CMap(
    [0.1, 0.9],
    [0.8, 0.0],
    [0.8, 0.8],
    [0.0, 0.8]
);

function calculateCycles(modulus, multiplier) {
    let flags = Array.from({length: modulus - 1}, (x, i) => false);
    let numbers_left = modulus - 1;

    let result = [[]];
    let current_id = 1;
    while (numbers_left > 0) {
        result[result.length - 1].push(current_id)
        flags[current_id - 1] = true;
        numbers_left--;
        current_id = (current_id * multiplier) % modulus;

        if ((current_id == 0) || (flags[current_id - 1])) {
            result[result.length - 1].push(current_id);

            if (numbers_left == 0) break;

            if (current_id == 0) current_id = 1;
            let ii = 0;
            while (flags[current_id - 1]) {
                ii++;
                current_id = (current_id % (modulus - 1)) + 1;
            }
            result.push([]);
        }
    }
    return result;
}

function onLoad() {
    var mp = new MainPainter();
    mp.drawAll();
}

function length(x1, y1, x2, y2) {
    return Math.sqrt(
        Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)
    );
}

function line2vecs(x1, y1, x2, y2) {
    let len = length(x1, y1, x2, y2);
    let vx = (x2 - x1) / len;
    let vy = (y2 - y1) / len;
    let ortho_x = -vy;
    let ortho_y = vx;
    return [vx, vy, ortho_x, ortho_y, len];
}

class MainPainter {
    constructor(eid="diagram") {
        this.canvas = document.getElementById(eid);
        this.ctx = this.canvas.getContext("2d");
        this.center_X = this.canvas.width / 2;
        this.center_Y = this.canvas.height / 2;
        this.R = Math.min(this.center_X, this.center_Y) * 0.95;
    }

    drawAll(modulus=MODULUS, multiplier=MULTIPLIER) {
        this.drawCircle();

        let cycles = calculateCycles(modulus, multiplier);
        let listed_colors = genColorList(cycles.length);

        for (let c_idx = 0; c_idx < cycles.length; c_idx++) {
            let cycle = cycles[c_idx];
            for (let index = 0; index < cycle.length - 1; index++) {
                if (LOOP_BASED_COLOR) {
                    this.drawSegment(cycle[index], cycle[index + 1], modulus, DRAW_ARROWS, listed_colors[c_idx]);
                } else {
                    this.drawSegment(cycle[index], cycle[index + 1], modulus);
                }
            }
        }

        this.drawNPoints(modulus);
    }

    drawCircle() {
        let ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(
            this.center_X,
            this.center_Y,
            this.R, 0, 2 * Math.PI, false
        );
        ctx.closePath();
        ctx.lineWidth = CIRCLE_LW;
        ctx.strokeStyle = CIRCLE_COLOR;
        ctx.stroke();
    }

    drawPoint(x, y, r=POINT_SIZE) {
        let ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(
            x, y, r, 0, 2 * Math.PI, false
        );
        ctx.closePath();
        ctx.fillStyle = POINT_COLOR;
        ctx.fill();
    }

    getPointCoords(n, N) {
        let alpha = Math.PI * 2 * n / N;
        let x = this.center_X + this.R * Math.sin(alpha);
        let y = this.center_X - this.R * Math.cos(alpha);
        return [x, y];
    }

    drawNPoints(N) {
        for (let index = 0; index < N; index++) {
            let [x, y] = this.getPointCoords(index, N);
            this.drawPoint(x, y);
        }
    }

    drawSegment(a, b, N, arrow=DRAW_ARROWS, force_color=null) {
        let [ax, ay] = this.getPointCoords(a, N);
        let [bx, by] = this.getPointCoords(b, N);

        let ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.strokeStyle = "#000000";
        if (!force_color) {
            if (LEN_BASED_COLOR) {
                let len = length(ax, ay, bx, by);
                ctx.strokeStyle = cmap.get(
                    len / (this.R * 2)
                );
            }
        } else {
            ctx.strokeStyle = force_color;
        }
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = SEGMENT_WIDTH;
        ctx.stroke();

        if (arrow) {
            let [vx, vy, ox, oy, len] = line2vecs(ax, ay, bx, by);
            let x1 = bx - vx * ARROW_MARGIN;
            let y1 = by - vy * ARROW_MARGIN;
            let x2 = x1 - vx * ARROW_CAPLEN;
            let y2 = y1 - vy * ARROW_CAPLEN;
            let x3 = x2 + ox * ARROW_CAPWIDTH / 2;
            let y3 = y2 + oy * ARROW_CAPWIDTH / 2;
            let x4 = x2 - ox * ARROW_CAPWIDTH / 2;
            let y4 = y2 - oy * ARROW_CAPWIDTH / 2;
            ctx.beginPath();
            ctx.moveTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
        }
    }
}
