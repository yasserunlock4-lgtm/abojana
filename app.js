// --- تهيئة العناصر ---
const wrapper = document.getElementById("game-wrapper");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalText = document.getElementById("finalText");
const tapZone = document.getElementById("tapZone");

let W = 0, H = 0;
const DPR = window.devicePixelRatio || 1;

// --- دالة لضبط حجم الكانفاس ---
function resizeCanvas() {
    W = wrapper.clientWidth;
    H = wrapper.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const groundH = H * 0.15; // ارتفاع الأرضية

// --- حفظ أفضل نتيجة ---
let best = +localStorage.getItem("runnerBestScore") || 0;
bestValue.textContent = best;

// --- متغيرات اللعبة ---
const game = {
    running: false,
    over: false,
    score: 0,
    speed: 5,
    gravity: 0.7,
    spawnTimer: 0,
    obstacles: [],
};

const player = {
    x: 80,
    y: 0,
    w: 50,
    h: 70,
    vy: 0,
    jumpPower: -13,
    onGround: true,
};

// --- دوال التحكم باللعبة ---
function hideAllMenus() {
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
}

function goHome() {
    game.running = false;
    game.over = false;
    hideAllMenus();
    startScreen.classList.remove("hidden");
}

function resetGame() {
    game.running = true;
    game.over = false;
    game.score = 0;
    game.speed = 5;
    game.spawnTimer = 0;
    game.obstacles = [];
    
    player.y = H - groundH - player.h;
    player.vy = 0;
    player.onGround = true;
    
    scoreValue.textContent = "0";
    hideAllMenus();
}

function jump() {
    if (game.running && player.onGround) {
        player.vy = player.jumpPower;
        player.onGround = false;
    }
}

function endGame() {
    if (game.over) return;
    game.running = false;
    game.over = true;
    
    finalText.textContent = "جبت " + game.score + " نقطة";
    if (game.score > best) {
        best = game.score;
        localStorage.setItem("runnerBestScore", best);
        bestValue.textContent = best;
    }
    gameOverScreen.classList.remove("hidden");
}

// --- دوال مساعدة ---
function rand(a, b) { return Math.random() * (b - a) + a; }
function rectsCollide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

// --- إنشاء العقبات ---
function spawnObstacle() {
    const size = rand(30, 60);
    game.obstacles.push({
        x: W + 20,
        y: H - groundH - size,
        w: size,
        h: size,
    });
}

// --- التحديث المستمر للعبة ---
function update() {
    if (!game.running) return;

    // تحديث حركة اللاعب
    player.vy += game.gravity;
    player.y += player.vy;

    const floorY = H - groundH - player.h;
    if (player.y >= floorY) {
        player.y = floorY;
        player.vy = 0;
        player.onGround = true;
    }

    // إنشاء عقبات جديدة
    game.spawnTimer++;
    if (game.spawnTimer > 50) {
        spawnObstacle();
        game.spawnTimer = 0;
    }

    // تحديث العقبات والتحقق من الاصطدام
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
        const o = game.obstacles[i];
        o.x -= game.speed;

        if (rectsCollide(player, o)) {
            endGame();
        }

        if (o.x + o.w < 0) {
            game.obstacles.splice(i, 1);
            game.score++;
            scoreValue.textContent = game.score;
        }
    }
}

// --- دوال الرسم على الكانفاس ---
function drawGround() {
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(0, H - groundH, W, groundH);
}

function drawPlayer() {
    ctx.fillStyle = "#ffd54a"; // لون اللاعب
    ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawObstacles() {
    ctx.fillStyle = "#ff4b7d"; // لون العقبات
    for (const o of game.obstacles) {
        ctx.fillRect(o.x, o.y, o.w, o.h);
    }
}

function render() {
    ctx.clearRect(0, 0, W, H);
    drawGround();
    if (game.running || game.over) {
        drawPlayer();
        drawObstacles();
    }
}

// --- حلقة اللعبة الرئيسية ---
function loop() {
    requestAnimationFrame(loop);
    update();
    render();
}
loop();

// --- ربط الأحداث ---
document.getElementById("startBtn").addEventListener("click", resetGame);
document.getElementById("restartBtn").addEventListener("click", resetGame);
document.getElementById("homeBtn").addEventListener("click", goHome);

tapZone.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
tapZone.addEventListener("mousedown", (e) => { e.preventDefault(); jump(); });
window.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); jump(); } });
