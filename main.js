var CIRCLE_COLOR = "#803080";
var CIRCLE_LW = 2;
var POINT_COLOR = "#300080";
var POINT_SIZE = 5;
var SEGMENT_WIDTH = 2;
var ARROW_MARGIN = 20;
var ARROW_CAPLEN = 12;
var ARROW_CAPWIDTH = 10;

var DRAW_ARROWS = true;

var MULTIPLIER = 5;
var MODULUS = 100;

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
        this.drawNPoints(modulus);

        let cycles = calculateCycles(modulus, multiplier);
        for (const cycle of cycles) {
            for (let index = 0; index < cycle.length - 1; index++) {
                this.drawSegment(cycle[index], cycle[index + 1], modulus);
            }
        }
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

    drawSegment(a, b, N, arrow=DRAW_ARROWS) {
        let [ax, ay] = this.getPointCoords(a, N);
        let [bx, by] = this.getPointCoords(b, N);

        let ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.strokeStyle = "#000000";
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
            ctx.fillStyle = "#000000";
            ctx.fill();
        }
    }
}
