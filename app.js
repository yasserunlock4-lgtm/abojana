// --- إعداد Firebase (يبقى كما هو) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
const firebaseConfig = { /* ... إعداداتك هنا ... */ };
const app = initializeApp(firebaseConfig );
const db = getFirestore(app);

// --- عناصر واجهة المستخدم (تبقى كما هي) ---
const player = document.getElementById('player');
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
// ... باقي العناصر

// --- متغيرات اللعبة (مُحدّثة) ---
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameInterval;
let obstacleGenerator;
let isGameOver = true;

// --- منطق اللعبة الجديد (ركض جانبي) ---

function startGame() {
    score = 0;
    isGameOver = false;
    scoreDisplay.textContent = score;
    gameOverMenu.classList.add('hidden');
    
    // إزالة العقبات القديمة
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());

    // بدء اللعبة
    gameInterval = setInterval(updateGame, 50); // فحص الاصطدام وتحديث النتيجة
    obstacleGenerator = setTimeout(createObstacle, 1000); // إنشاء أول عقبة
}

function updateGame() {
    if (isGameOver) return;
    
    score++;
    scoreDisplay.textContent = score;

    // فحص الاصطدام مع كل عقبة موجودة
    const obstacles = document.querySelectorAll('.obstacle');
    obstacles.forEach(obstacle => {
        if (checkCollision(player, obstacle)) {
            endGame();
        }
    });
}

function createObstacle() {
    if (isGameOver) return;

    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    gameBoard.appendChild(obstacle);

    // عندما تنتهي حركة العقبة وتختفي، قم بإزالتها من DOM
    obstacle.addEventListener('animationend', () => {
        obstacle.remove();
    });

    // إنشاء عقبة جديدة بعد فترة زمنية عشوائية
    const randomTime = Math.random() * 2000 + 1000; // بين 1 و 3 ثواني
    obstacleGenerator = setTimeout(createObstacle, randomTime);
}

function checkCollision(player, obstacle) {
    const playerRect = player.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();

    // فحص بسيط للتصادم الأفقي والعمودي
    return (
        playerRect.right > obstacleRect.left &&
        playerRect.left < obstacleRect.right &&
        playerRect.bottom > obstacleRect.top
    );
}

function endGame() {
    if (isGameOver) return; // منع تكرار النهاية
    isGameOver = true;
    
    // إيقاف كل شيء
    clearInterval(gameInterval);
    clearTimeout(obstacleGenerator);

    // إيقاف حركة كل العقبات الموجودة
    document.querySelectorAll('.obstacle').forEach(obs => {
        obs.style.animationPlayState = 'paused';
    });

    // تحديث أفضل رقم
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    finalScoreDisplay.textContent = score;
    gameOverMenu.classList.remove('hidden');
    
    // (منطق المهمات يبقى كما هو)
    // checkMissionsCompletion(score);
}

// --- التحكم باللاعب (القفز) ---
function jump() {
    if (isGameOver || player.classList.contains('jump')) {
        return; // لا تقفز إذا كانت اللعبة منتهية أو إذا كان اللاعب يقفز بالفعل
    }
    player.classList.add('jump');
    // إزالة الكلاس بعد انتهاء الأنيميشن للسماح بالقفز مرة أخرى
    setTimeout(() => {
        player.classList.remove('jump');
    }, 500); // يجب أن تكون المدة مطابقة لمدة الأنيميشن في CSS
}

// ربط القفز بالضغط على مفتاح المسافة أو النقر على الشاشة
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (isGameOver) {
            startGame(); // ابدأ اللعبة بالضغط على المسافة إذا كانت منتهية
        } else {
            jump();
        }
    }
});

document.addEventListener('touchstart', () => {
    if (isGameOver) return;
    jump();
});

// --- ربط الأحداث والأزرار (تبقى كما هي) ---
restartButton.addEventListener('click', startGame);
// ... باقي الأزرار

// --- تهيئة أولية ---
highScoreDisplay.textContent = highScore;
gameOverMenu.classList.remove('hidden');
finalScoreDisplay.parentElement.innerHTML = "<h2>اضغط 'مسافة' للبدء</h2>";
