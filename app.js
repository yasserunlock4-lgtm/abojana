// --- إعداد Firebase (الإصدار 9+) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ضع إعدادات Firebase الخاصة بك هنا
const firebaseConfig = {
  apiKey: "AIzaSyDiCrZhKVpkYE3HUeeDkAo7xA9I88uZ1i0",
  authDomain: "abojana-3f0c2.firebaseapp.com",
  databaseURL: "https://abojana-3f0c2-default-rtdb.firebaseio.com",
  projectId: "abojana-3f0c2",
  storageBucket: "abojana-3f0c2.appspot.com",
  messagingSenderId: "819681544560",
  appId: "1:819681544560:web:be2249a51d0c79ee21a7b5",
  measurementId: "G-23EYSF1BE0"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig );
const db = getFirestore(app);

// --- عناصر واجهة المستخدم ---
const player = document.getElementById('player');
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const missionsButton = document.getElementById('missions-button');
const missionsModal = document.getElementById('missions-modal');
const closeMissionsButton = document.getElementById('close-missions-button');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverText = document.getElementById('game-over-text');

// --- متغيرات اللعبة ---
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameInterval;
let obstacleGenerator;
let isGameOver = true;
let gameSpeed = 2; // سرعة حركة العقبات الأولية

// --- منطق اللعبة ---
function startGame() {
    score = 0;
    gameSpeed = 2;
    isGameOver = false;
    scoreDisplay.textContent = score;
    gameOverMenu.classList.add('hidden');
    
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());

    gameInterval = setInterval(updateGame, 20);
    obstacleGenerator = setTimeout(createObstacle, 1500);
}

function updateGame() {
    if (isGameOver) return;
    
    score++;
    scoreDisplay.textContent = score;
    
    // زيادة سرعة اللعبة تدريجيًا
    if (score % 200 === 0) {
        gameSpeed += 0.2;
    }

    document.querySelectorAll('.obstacle').forEach(obstacle => {
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

    // تحريك العقبة باستخدام JavaScript
    let obstaclePosition = gameBoard.clientWidth + 50;
    const moveObstacle = setInterval(() => {
        if (isGameOver) {
            clearInterval(moveObstacle);
            return;
        }
        obstaclePosition -= gameSpeed;
        obstacle.style.right = (gameBoard.clientWidth - obstaclePosition) + 'px';

        if (obstaclePosition < -50) {
            clearInterval(moveObstacle);
            obstacle.remove();
        }
    }, 5);

    const randomTime = Math.random() * 1500 + (1500 / gameSpeed);
    obstacleGenerator = setTimeout(createObstacle, randomTime);
}

function checkCollision(player, obstacle) {
    const playerRect = player.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();

    return (
        playerRect.right > obstacleRect.left &&
        playerRect.left < obstacleRect.right &&
        playerRect.bottom > obstacleRect.top &&
        playerRect.top < obstacleRect.bottom
    );
}

function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    
    clearInterval(gameInterval);
    clearTimeout(obstacleGenerator);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    finalScoreDisplay.textContent = score;
    gameOverTitle.textContent = "انتهت الجولة";
    gameOverText.innerHTML = `لقد حصلت على <span id="final-score">${score}</span> نقطة`;
    gameOverMenu.classList.remove('hidden');
    
    // checkMissionsCompletion(score); // يمكنك تفعيل هذا لاحقًا
}

// --- التحكم باللاعب (القفز) ---
function jump() {
    if (isGameOver || player.classList.contains('jump')) return;
    
    player.classList.add('jump');
    setTimeout(() => {
        player.classList.remove('jump');
    }, 500); // مدة الأنيميشن في CSS
}

function handleInteraction() {
    if (isGameOver) {
        startGame();
    } else {
        jump();
    }
}

// ربط التحكم بالأحداث
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        handleInteraction();
    }
});
document.addEventListener('touchstart', handleInteraction);
restartButton.addEventListener('click', startGame);

// --- أزرار القوائم ---
missionsButton.addEventListener('click', () => {
    missionsModal.classList.remove('hidden');
    // fetchMissions(); // يمكنك تفعيل هذا لاحقًا
});
closeMissionsButton.addEventListener('click', () => {
    missionsModal.classList.add('hidden');
});

// --- تهيئة أولية ---
highScoreDisplay.textContent = highScore;
gameOverTitle.textContent = "لعبة الركض";
gameOverText.innerHTML = "اضغط 'مسافة' أو المس الشاشة للبدء";
gameOverMenu.classList.remove('hidden');
