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
        measurementId: "G-23EYSF1BE0"
    };

    // تهيئة تطبيق Firebase
    firebase.initializeApp(firebaseConfig );
    const database = firebase.database();

    // --- تهيئة تطبيق تليجرام المصغر ---
    const tg = window.Telegram.WebApp;
    tg.ready(); // إعلام تليجرام بأن التطبيق جاهز

    // الحصول على بيانات المستخدم من تليجرام
    const user = tg.initDataUnsafe?.user;
    const userId = user ? user.id : 'test_user_123'; // استخدام ID حقيقي أو ID للاختبار
    const username = user ? user.first_name : 'زائر';

    // --- عناصر الواجهة الرسومية ---
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const userPointsSpan = document.getElementById('user-points');
    const usernameSpan = document.getElementById('username');
    const subscriptionCheck = document.getElementById('subscription-check');
    const mainContent = document.getElementById('main-content');
    const checkSubscriptionBtn = document.getElementById('check-subscription-button');

    usernameSpan.textContent = username;

    // --- قيم الجوائز على العجلة ---
    const prizes = [10, 50, 20, 0, 100, 5, 200, 25]; // القيمة 0 تمثل "حاول مرة أخرى"
    let userPoints = 0;
    let isSpinning = false;

    // --- منطق الاشتراك ---
    // في البداية، نخفي المحتوى الرئيسي ونظهر شاشة الاشتراك
    mainContent.classList.add('hidden');
    subscriptionCheck.classList.remove('hidden');

    checkSubscriptionBtn.addEventListener('click', () => {
        // هنا يجب عليك إضافة منطق التحقق الفعلي عبر بوت التليجرام
        // حالياً، سنقوم بمحاكاة النجاح وإظهار المحتوى
        console.log("التحقق من الاشتراك...");
        // لنفترض أن التحقق ناجح
        subscriptionCheck.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadUserData(); // تحميل بيانات المستخدم بعد "التحقق"
    });

    // --- وظائف Firebase ---
    function loadUserData() {
        const userRef = database.ref('users/' + userId);
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.points) {
                userPoints = data.points;
            } else {
                // إنشاء مستخدم جديد إذا لم يكن موجوداً
                userRef.set({
                    username: username,
                    points: 0
                });
                userPoints = 0;
            }
            userPointsSpan.textContent = userPoints;
        });
    }

    function updateUserPoints(newPoints) {
        const totalPoints = userPoints + newPoints;
        database.ref('users/' + userId).update({
            points: totalPoints
        });
    }

    // --- منطق عجلة الحظ ---
    spinBtn.addEventListener('click', () => {
        if (isSpinning) return;
        isSpinning = true;

        // حساب زاوية دوران عشوائية
        const randomDegree = Math.floor(Math.random() * 3600) + 360; // دوران عدة مرات
        wheel.style.transform = `rotate(${randomDegree}deg)`;

        // بعد انتهاء الدوران
        setTimeout(() => {
            const actualDegree = randomDegree % 360;
            const prizeIndex = Math.floor(actualDegree / 45); // 360 / 8 sectors = 45 degrees per sector
            const prizeValue = prizes[prizeIndex];

            if (prizeValue > 0) {
                alert(`مبروك! لقد ربحت ${prizeValue} نقطة!`);
                updateUserPoints(prizeValue);
            } else {
                alert("حظ أوفر في المرة القادمة!");
            }

            isSpinning = false;
        }, 5000); // مدة الدوران 5 ثواني
    });
});
