(function() {
    // =================================================
    // ⚙️ إعدادات Firebase - ضع معلومات الربط الخاصة بك هنا
    // =================================================
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        databaseURL: "YOUR_DATABASE_URL",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // تهيئة Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // =================================================
    // ⚙️ إعدادات اللعبة العامة
    // =================================================
    const WIN_TARGET = 20;
    const INITIAL_ATTEMPTS = 3;
    const COOLDOWN_HOURS = 1;

    // =================================================
    //  DOM Elements
    // =================================================
    const wrapper = document.getElementById("w");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const scoreValue = document.getElementById("scoreValue");
    const bestValue = document.getElementById("bestValue");
    const goalValue = document.getElementById("goalValue");

    const startScreen = document.getElementById("startScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const winScreen = document.getElementById("winScreen");
    const boardScreen = document.getElementById("boardScreen");
    const tapZone = document.getElementById("tapZone");
    const leaderboardList = document.getElementById("leaderboardList");
    const finalText = document.getElementById("finalText");
    const winText = document.getElementById("winText");

    // عناصر نظام المحاولات والمهمات
    const attemptsDisplay = document.querySelector("#attemptsDisplay .value");
    const timerDisplay = document.querySelector("#timerDisplay .value");
    const timerBadge = document.getElementById("timerDisplay");
    const attemptsBadge = document.getElementById("attemptsDisplay");
    const startBtn = document.getElementById("startBtn");
    const getAttemptsBtn = document.getElementById("getAttemptsBtn");
    const taskModal = document.getElementById("taskModal");
    const taskTitle = document.getElementById("taskTitle");
    const taskDescription = document.getElementById("taskDescription");
    const taskActionBtn = document.getElementById("taskActionBtn");
    const closeTaskBtn = document.getElementById("closeTaskBtn");

    // =================================================
    // تحميل الصور (تم التعديل هنا)
    // =================================================
    const imgFoury = new Image();
    imgFoury.src = "foury.jpg"; // سيتم تحميل الصورة من ملف foury.jpg في نفس المجلد

    // =================================================
    // نظام المحاولات والمؤقت
    // =================================================
    let timerInterval;

    function getPlayerData() {
        let data = JSON.parse(localStorage.getItem("playerData_v2") || "{}");
        if (!data.attempts && data.attempts !== 0) {
            data = { attempts: INITIAL_ATTEMPTS, cooldownUntil: null };
            savePlayerData(data);
        }
        return data;
    }

    function savePlayerData(data) {
        localStorage.setItem("playerData_v2", JSON.stringify(data));
    }

    function updateUI() {
        const data = getPlayerData();
        clearInterval(timerInterval); // إيقاف أي مؤقت سابق

        if (data.cooldownUntil && new Date() < new Date(data.cooldownUntil)) {
            startBtn.disabled = true;
            attemptsBadge.classList.add("hidden");
            timerBadge.classList.remove("hidden");

            timerInterval = setInterval(() => {
                const now = new Date();
                const distance = new Date(data.cooldownUntil) - now;

                if (distance < 0) {
                    clearInterval(timerInterval);
                    let currentData = getPlayerData();
                    currentData.attempts = INITIAL_ATTEMPTS;
                    currentData.cooldownUntil = null;
                    savePlayerData(currentData);
                    updateUI();
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }, 1000);
        } else {
            startBtn.disabled = false;
            attemptsBadge.classList.remove("hidden");
            timerBadge.classList.add("hidden");
            attemptsDisplay.textContent = data.attempts;
        }
    }

    // =================================================
    // نظام المهمات
    // =================================================
    let currentTask = null;

    function fetchTask() {
        database.ref('task').once('value').then((snapshot) => {
            if (snapshot.exists()) {
                currentTask = snapshot.val();
                taskTitle.textContent = currentTask.title || "مهمة جديدة!";
                taskDescription.textContent = currentTask.description || "أكمل المهمة للحصول على محاولات.";
                taskActionBtn.textContent = currentTask.buttonText || "تنفيذ المهمة";
                taskModal.classList.remove("hidden");
            } else {
                alert("لا توجد مهمات متاحة حالياً.");
            }
        }).catch((error) => {
            console.error("Firebase Error:", error);
            alert("حدث خطأ أثناء جلب المهمة.");
        });
    }

    getAttemptsBtn.addEventListener("click", fetchTask);
    closeTaskBtn.addEventListener("click", () => taskModal.classList.add("hidden"));

    taskActionBtn.addEventListener("click", () => {
        if (!currentTask || !currentTask.link) return;

        window.open(currentTask.link, "_blank");

        let data = getPlayerData();
        data.attempts += currentTask.reward || 1;
        savePlayerData(data);
        updateUI();

        taskModal.classList.add("hidden");
        alert(`شكراً لك! لقد حصلت على ${currentTask.reward || 1} محاولات إضافية.`);
    });


    // =================================================
    // منطق اللعبة الرئيسي
    // =================================================
    let W = 0, H = 0;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resizeCanvas() {
        W = wrapper.clientWidth;
        H = wrapper.clientHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const groundH = () => Math.max(70, H * 0.14);

    goalValue.textContent = WIN_TARGET;

    let best = +localStorage.getItem("abuJannaFourioBest") || 0;
    bestValue.textContent = best;

    function saveLeaderboard(score) {
        let b = JSON.parse(localStorage.getItem("abuJannaLeaderboard") || "[]");
        b.push({ name: "لاعب", score, time: new Date().toLocaleDateString("ar") });
        b.sort((a, c) => c.score - a.score);
        b = b.slice(0, 10);
        localStorage.setItem("abuJannaLeaderboard", JSON.stringify(b));
    }

    function renderLeaderboard() {
        const b = JSON.parse(localStorage.getItem("abuJannaLeaderboard") || "[]");
        if (!b.length) {
            leaderboardList.innerHTML = '<div class="leader-item"><span>لا توجد نتائج بعد</span><span>—</span></div>';
            return;
        }
        leaderboardList.innerHTML = b.map((item, i) => '<div class="leader-item"><span>#' + (i + 1) + ' - ' + item.name + '</span><span>' + item.score + ' نقطة</span></div>').join("");
    }

    function hideAllMenus() {
        [startScreen, gameOverScreen, winScreen, boardScreen, taskModal].forEach(s => s.classList.add("hidden"));
    }

    function goHome() {
        game.running = false;
        game.over = false;
        hideAllMenus();
        startScreen.classList.remove("hidden");
        render();
    }

    const game = { running: false, over: false, started: false, won: false, score: 0, speed: 5.8, gravity: 0.8, spawnTimer: 0, pickupTimer: 0, bgOffset: 0, particles: [], obstacles: [], pickups: [], flashes: [] };
    const player = { x: 80, y: 0, w: 70, h: 92, vy: 0, jumpPower: -14.5, onGround: true, bounce: 0 };

    function resetGame() {
        game.running = true; game.over = false; game.started = true; game.won = false;
        game.score = 0; game.speed = 5.8; game.spawnTimer = 0; game.pickupTimer = 0; game.bgOffset = 0;
        game.particles = []; game.obstacles = []; game.pickups = []; game.flashes = [];
        player.x = 80;
        player.w = Math.min(74, W * 0.17); player.h = player.w * 1.35;
        player.y = H - groundH() - player.h; player.vy = 0; player.onGround = true; player.bounce = 0;
        scoreValue.textContent = "0"; hideAllMenus();
    }

    function startGameFlow() {
        let data = getPlayerData();
        if (data.cooldownUntil && new Date() < new Date(data.cooldownUntil)) {
            alert("لقد نفدت محاولاتك! انتظر حتى تتمكن من اللعب مجدداً.");
            return;
        }
        if (data.attempts > 0) {
            data.attempts--;
            if (data.attempts === 0) {
                data.cooldownUntil = new Date(new Date().getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
            }
            savePlayerData(data);
            updateUI();
            resetGame();
            jump();
        } else {
             alert("لقد نفدت محاولاتك! أكمل مهمة للحصول على المزيد.");
        }
    }

    function jump() {
        if (!game.running) return;
        if (player.onGround) {
            player.vy = player.jumpPower;
            player.onGround = false;
        } else {
            player.vy -= 1.6;
        }
    }

    function endGame() {
        if (game.over) return;
        game.running = false; game.over = true; game.won = false;
        finalText.textContent = "جبت " + game.score + " نقطة";
        if (game.score > best) {
            best = game.score;
            localStorage.setItem("abuJannaFourioBest", best);
            bestValue.textContent = best;
        }
        saveLeaderboard(game.score);
        gameOverScreen.classList.remove("hidden");
    }

    function winGame() {
        if (game.over) return;
        game.running = false; game.over = true; game.won = true;
        winText.textContent = "وصلت إلى " + game.score + " نقطة وفزت 🔥";
        if (game.score > best) {
            best = game.score;
            localStorage.setItem("abuJannaFourioBest", best);
            bestValue.textContent = best;
        }
        saveLeaderboard(game.score);
        winScreen.classList.remove("hidden");
    }

    function rand(a, b) { return Math.random() * (b - a) + a; }
    function rectsCollide(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

    function spawnObstacle() {
        const scale = rand(0.9, 1.15);
        let o = { x: W + 30, w: 74 * scale, h: 54 * scale };
        o.y = H - groundH() - o.h + 8;
        game.obstacles.push(o);
    }

    function spawnPickup() {
        const size = rand(36, 46);
        const minY = H - groundH() - player.h - 80,
            maxY = H - groundH() - 40;
        game.pickups.push({ x: W + 20, y: rand(minY, maxY), w: size, h: size * 1.9, bob: rand(0, Math.PI * 2) });
    }
    
    function update() {
        if (!game.running) return;
        game.bgOffset += game.speed * 0.6;
        game.speed += 0.0015;
        player.vy += game.gravity;
        player.y += player.vy;
        player.bounce += 0.15;

        const floorY = H - groundH() - player.h;
        if (player.y >= floorY) {
            player.y = floorY;
            player.vy = 0;
            player.onGround = true;
        }

        game.spawnTimer++;
        game.pickupTimer++;
        const obstacleRate = Math.max(52, 90 - Math.floor(game.score * 0.7));
        if (game.spawnTimer >= obstacleRate) {
            spawnObstacle();
            game.spawnTimer = 0;
        }
        if (game.pickupTimer >= 65) {
            spawnPickup();
            game.pickupTimer = 0;
        }

        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const o = game.obstacles[i];
            o.x -= game.speed;
            const hp = { x: player.x + 10, y: player.y + 8, w: player.w - 20, h: player.h - 10 };
            const ho = { x: o.x + 6, y: o.y + 6, w: o.w - 12, h: o.h - 10 };
            if (rectsCollide(hp, ho)) {
                endGame();
            }
            if (o.x + o.w < -40) game.obstacles.splice(i, 1);
        }

        for (let i = game.pickups.length - 1; i >= 0; i--) {
            const p = game.pickups[i];
            p.x -= game.speed * 1.02;
            p.bob += 0.08;
            const hp = { x: player.x + 10, y: player.y + 8, w: player.w - 20, h: player.h - 10 };
            const hpu = { x: p.x + 4, y: p.y + 4, w: p.w - 8, h: p.h - 8 };
            if (rectsCollide(hp, hpu)) {
                game.score++;
                scoreValue.textContent = game.score;
                game.pickups.splice(i, 1);
                if (game.score >= WIN_TARGET) winGame();
                continue;
            }
            if (p.x + p.w < -40) game.pickups.splice(i, 1);
        }
    }

    function roundRect(x, y, w, h, r, fill = false, stroke = false) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function drawBackground() {
        for (let i = 0; i < 16; i++) {
            const x = ((i * 170) - (game.bgOffset * (0.15 + i * 0.005))) % (W + 200);
            const y = 40 + (i * 37) % (H * 0.55);
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,.08)";
            ctx.arc(x, y, (i % 3) + 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        const gy = H - groundH();
        const grd = ctx.createLinearGradient(0, gy, 0, H);
        grd.addColorStop(0, "#4b2a18");
        grd.addColorStop(1, "#25160e");
        ctx.fillStyle = grd;
        ctx.fillRect(0, gy, W, groundH());
    }

    function drawPlayer() {
        const x = player.x, y = player.y, w = player.w, h = player.h;
        ctx.save();
        ctx.fillStyle = "#f3c89d";
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }

    function drawPickup(p) {
        const x = p.x, y = p.y + Math.sin(p.bob) * 5, w = p.w, h = p.h;
        ctx.save();
        if (imgFoury.complete && imgFoury.naturalWidth > 0) {
            ctx.drawImage(imgFoury, x, y, w, h);
        } else {
            ctx.fillStyle = "#13d38f";
            ctx.fillRect(x, y, w, h);
        }
        ctx.restore();
    }

    function drawObstacle(o) {
        const x = o.x, y = o.y, w = o.w, h = o.h;
        ctx.fillStyle = "#ff4b7d";
        ctx.fillRect(x, y, w, h);
    }

    function render() {
        ctx.clearRect(0, 0, W, H);
        drawBackground();
        for (const p of game.pickups) drawPickup(p);
        for (const o of game.obstacles) drawObstacle(o);
        drawPlayer();
    }

    let lastTime = 0;
    function loop(ts) {
        requestAnimationFrame(loop);
        const dt = ts - lastTime;
        if (dt < 16) return;
        lastTime = ts;
        update();
        render();
    }
    requestAnimationFrame(loop);

    function handleTap() {
        if (!game.started) return;
        if (game.running) jump();
    }

    tapZone.addEventListener("touchstart", (e) => { e.preventDefault(); handleTap(); }, { passive: false });
    tapZone.addEventListener("mousedown", (e) => { e.preventDefault(); handleTap(); });
    window.addEventListener("keydown", (e) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); handleTap(); } });

    startBtn.addEventListener("click", startGameFlow);
    document.getElementById("restartBtn").addEventListener("click", startGameFlow);
    document.getElementById("playAgainBtn").addEventListener("click", startGameFlow);

    ["homeBtn", "homeWinBtn", "closeBoardBtn"].forEach(id => document.getElementById(id).addEventListener("click", goHome));
    document.getElementById("showBoardBtn").addEventListener("click", () => {
        renderLeaderboard();
        hideAllMenus();
        boardScreen.classList.remove("hidden");
    });

    // Initial UI update
    updateUI();
    render();
})();
