// --- إعداد Firebase (الإصدار 9+) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
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
const missionsList = document.getElementById('missions-list');
const closeMissionsButton = document.getElementById('close-missions-button');

// --- متغيرات اللعبة ---
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameInterval;
let obstacleInterval;
let isGameOver = true;

// --- منطق اللعبة ---
function startGame() {
    score = 0;
    isGameOver = false;
    scoreDisplay.textContent = score;
    gameOverMenu.classList.add('hidden');
    player.style.left = '50%';
    document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
    gameInterval = setInterval(updateGame, 20);
    obstacleInterval = setInterval(createObstacle, 1000);
}

function updateGame() {
    if (isGameOver) return;
    score++;
    scoreDisplay.textContent = score;
    document.querySelectorAll('.obstacle').forEach(obstacle => {
        const obstacleBottom = parseInt(window.getComputedStyle(obstacle).getPropertyValue('bottom'));
        obstacle.style.bottom = (obstacleBottom - 5) + 'px';
        if (checkCollision(player, obstacle)) {
            endGame();
        }
        if (obstacleBottom < -50) {
            obstacle.remove();
        }
    });
}

function createObstacle() {
    if (isGameOver) return;
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.style.left = Math.floor(Math.random() * (gameBoard.clientWidth - 50)) + 'px';
    gameBoard.appendChild(obstacle);
}

function checkCollision(player, obstacle) {
    const playerRect = player.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();
    return !(playerRect.top > obstacleRect.bottom || playerRect.right < obstacleRect.left || playerRect.bottom < obstacleRect.top || playerRect.left > obstacleRect.right);
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearInterval(obstacleInterval);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }
    finalScoreDisplay.textContent = score;
    gameOverMenu.classList.remove('hidden');
    checkMissionsCompletion(score);
}

// --- التحكم باللاعب ---
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    const playerLeft = parseInt(window.getComputedStyle(player).getPropertyValue('left'));
    if (e.key === 'ArrowLeft' && playerLeft > 0) {
        player.style.left = (playerLeft - 30) + 'px';
    }
    if (e.key === 'ArrowRight' && playerLeft < (gameBoard.clientWidth - player.clientWidth)) {
        player.style.left = (playerLeft + 30) + 'px';
    }
});

// --- منطق المهمات (Firebase v9+) ---
async function fetchMissions() {
    missionsList.innerHTML = '<li>جاري التحميل...</li>';
    try {
        const missionsCol = collection(db, 'missions');
        const missionSnapshot = await getDocs(missionsCol);
        missionsList.innerHTML = '';
        missionSnapshot.forEach(doc => {
            const mission = doc.data();
            const li = document.createElement('li');
            li.textContent = mission.description;
            li.dataset.missionId = doc.id;
            li.dataset.missionType = mission.type;
            li.dataset.missionTarget = mission.target;
            missionsList.appendChild(li);
        });
    } catch (error) {
        console.error("خطأ في جلب المهمات: ", error);
        missionsList.innerHTML = '<li>حدث خطأ أثناء تحميل المهمات.</li>';
    }
}

function checkMissionsCompletion(finalScore) {
    document.querySelectorAll('#missions-list li').forEach(li => {
        const type = li.dataset.missionType;
        const target = parseInt(li.dataset.missionTarget);
        if (type === 'score' && finalScore >= target) {
            li.classList.add('completed');
            console.log(`Mission completed: ${li.textContent}`);
        }
    });
}

// --- ربط الأحداث ---
restartButton.addEventListener('click', startGame);
missionsButton.addEventListener('click', () => {
    missionsModal.classList.remove('hidden');
    fetchMissions();
});
closeMissionsButton.addEventListener('click', () => {
    missionsModal.classList.add('hidden');
});

// --- تهيئة أولية ---
highScoreDisplay.textContent = highScore;
gameOverMenu.classList.remove('hidden');
finalScoreDisplay.parentElement.innerHTML = "<h2>مستعد للبدء؟</h2>";
