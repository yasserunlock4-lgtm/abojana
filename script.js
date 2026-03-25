document.addEventListener('DOMContentLoaded', () => {
    // عناصر الواجهة
    const characterSelectionScreen = document.getElementById('character-selection');
    const chatScreen = document.getElementById('chat-screen');
    const characterCards = document.querySelectorAll('.character-card');
    const backButton = document.getElementById('back-button');
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatCharacterName = document.getElementById('chat-character-name');
    const subscriptionModal = document.getElementById('subscription-modal');
    const closeModalButton = document.getElementById('close-modal-button');

    let currentCharacter = null;
    let messageCount = 0;
    const MESSAGE_LIMIT = 5;

    // --- قاعدة بيانات الردود ---
    // يمكنك تعديلها وإضافة المزيد من الردود بسهولة
    const responses = {
        ali: {
            name: "علي",
            responses: {
                "مرحبا": "أهلاً وسهلاً بك!",
                "كيف حالك": "أنا بخير، شكراً لسؤالك. كيف يمكنني مساعدتك؟",
                "من اين انت": "أنا من العراق.",
                "ما اسمك": "اسمي علي.",
                "default": "لم أفهم سؤالك، هل يمكنك توضيحه؟" // رد افتراضي
            }
        },
        fatima: {
            name: "فاطمة",
            responses: {
                "مرحبا": "مرحباً بك، يسعدني التحدث معك.",
                "كيف حالك": "بأفضل حال، وأنت؟",
                "من اين انت": "أنا من مصر.",
                "ما اسمك": "اسمي فاطمة.",
                "default": "عذراً، لم أفهم ما تقصد."
            }
        },
        zainab: {
            name: "زينب",
            responses: {
                "مرحبا": "أهلاً بك يا صديقي.",
                "كيف حالك": "الحمد لله، كل شيء على ما يرام.",
                "من اين انت": "أنا من سوريا.",
                "ما اسمك": "اسمي زينب.",
                "default": "يبدو أن هذا السؤال صعب قليلاً، جرب سؤالاً آخر."
            }
        }
    };

    // وظيفة لإضافة رسالة إلى صندوق الدردشة
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // للتمرير لأسفل تلقائياً
    }

    // وظيفة للحصول على رد البوت
    function getBotResponse(userText) {
        const characterResponses = responses[currentCharacter].responses;
        // البحث عن تطابق في الردود (مع تجاهل الفراغات الزائدة)
        const cleanedUserText = userText.trim();
        return characterResponses[cleanedUserText] || characterResponses['default'];
    }

    // التعامل مع إرسال الرسالة
    function handleSendMessage() {
        const userText = userInput.value;
        if (userText.trim() === "") return;

        // التحقق من حد الرسائل
        if (messageCount >= MESSAGE_LIMIT) {
            subscriptionModal.classList.remove('hidden');
            return;
        }

        addMessage(userText, 'user');
        messageCount++;

        // محاكاة تأخير في الرد
        setTimeout(() => {
            const botReply = getBotResponse(userText);
            addMessage(botReply, 'bot');
        }, 500);

        userInput.value = '';
    }

    // الانتقال إلى شاشة الدردشة
    characterCards.forEach(card => {
        card.addEventListener('click', () => {
            currentCharacter = card.dataset.character;
            const characterName = responses[currentCharacter].name;
            
            chatCharacterName.textContent = `الدردشة مع ${characterName}`;
            characterSelectionScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            
            // إضافة رسالة ترحيبية من البوت
            addMessage(`مرحباً! أنا ${characterName}. كيف يمكنني مساعدتك اليوم؟`, 'bot');
        });
    });

    // العودة إلى شاشة اختيار الشخصية
    backButton.addEventListener('click', () => {
        chatScreen.classList.add('hidden');
        characterSelectionScreen.classList.remove('hidden');
        // إعادة تعيين الدردشة
        chatBox.innerHTML = '';
        messageCount = 0;
        currentCharacter = null;
    });

    // إغلاق نافذة الاشتراك ومتابعة الدردشة
    closeModalButton.addEventListener('click', () => {
        subscriptionModal.classList.add('hidden');
        // إعادة تعيين العداد أو زيادته (هنا نعيد تعيينه للسماح بـ 5 رسائل أخرى)
        messageCount = 0; 
        addMessage("شكراً لاشتراكك! يمكنك الآن إرسال 5 رسائل أخرى.", 'bot');
    });

    // ربط الأحداث بالأزرار
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});
