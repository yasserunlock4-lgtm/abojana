document.addEventListener('DOMContentLoaded', () => {
    // --- تهيئة Firebase ---
    const firebaseConfig = {
        apiKey: "AIzaSyDiCrZhKVpkYE3HUeeDkAo7xA9I88uZ1i0", // استبدل هذا بمفتاحك الحقيقي
        authDomain: "abojana-3f0c2.firebaseapp.com",
        databaseURL: "https://abojana-3f0c2-default-rtdb.firebaseio.com",
        projectId: "abojana-3f0c2",
        storageBucket: "abojana-3f0c2.firebasestorage.app",
        messagingSenderId: "819681544560",
        appId: "1:819681544560:web:be2249a51d0c79ee21a7b5",
    };

    firebase.initializeApp(firebaseConfig );
    const database = firebase.database();

    // --- تهيئة تطبيق تليجرام المصغر ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // توسيع التطبيق لملء الشاشة

    const user = tg.initDataUnsafe?.user;
    const userId = user ? user.id.toString() : 'test_user_123';

    // --- عناصر الواجهة الرسومية ---
    const subscriptionOverlay = document.getElementById('subscription-overlay');
    const mainContent = document.getElementById('main-content');
    const confirmSubscriptionBtn = document.getElementById('confirm-subscription-btn');
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const userPointsSpan = document.getElementById('user-points');

    // --- منطق الاشتراك الوهمي ---
    function showMainContent() {
        subscriptionOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadUserData(); // تحميل بيانات المستخدم فقط بعد تأكيد الاشتراك
    }

    // التحقق إذا كان المستخدم قد "أكد" الاشتراك من قبل
    if (localStorage.getItem('isSubscribed_' + userId) === 'true') {
        showMainContent();
    } else {
        subscriptionOverlay.classList.remove('hidden');
    }

    // عند الضغط على زر "لقد اشتركت"
    confirmSubscriptionBtn.addEventListener('click', () => {
        // حفظ الاختيار في التخزين المحلي لمنع ظهور الشاشة مرة أخرى
        localStorage.setItem('isSubscribed_' + userId, 'true');
        showMainContent();
    });

    // --- بقية منطق التطبيق (عجلة الحظ و Firebase) ---
    const prizes = [10, 50, 20, 0, 100, 5, 200, 25];
    let userPoints = 0;
    let isSpinning = false;

    function loadUserData() {
        const userRef = database.ref('users/' + userId);
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                userPoints = data.points || 0;
            } else {
                const username = user ? user.first_name : 'زائر';
                userRef.set({ username: username, points: 0 });
                userPoints = 0;
            }
            userPointsSpan.textContent = userPoints;
        });
    }

    function updateUserPoints(newPoints) {
        const totalPoints = userPoints + newPoints;
        database.ref('users/' + userId).update({ points: totalPoints });
    }

    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        isSpinning = true;
        spinBtn.textContent = '...';
        spinBtn.style.pointerEvents = 'none';

        const randomDegree = Math.floor(Math.random() * 4000) + 360;
        wheel.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheel.style.transform = `rotate(${randomDegree}deg)`;

        setTimeout(() => {
            const actualDegree = randomDegree % 360;
            const prizeIndex = Math.floor(8 - actualDegree / 45) % 8;
            const prizeValue = prizes[prizeIndex];

            tg.HapticFeedback.notificationOccurred(prizeValue > 0 ? 'success' : 'error');

            if (prizeValue > 0) {
                updateUserPoints(prizeValue);
                tg.showAlert(`مبروك! لقد ربحت ${prizeValue} نقطة!`);
            } else {
                tg.showAlert("حظ أوفر في المرة القادمة!");
            }

            isSpinning = false;
            spinBtn.textContent = 'لف';
            spinBtn.style.pointerEvents = 'auto';
        }, 5000);
    });
});
