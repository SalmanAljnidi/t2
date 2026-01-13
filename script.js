// مكتبة الأصوات المدمجة (Synthesizer)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'select') {
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'correct') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

// الأرقام العربية
const toArabic = (n) => n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

let correctAnswerIndex = 0;
let isProcessing = false;
let currentCorrectValue = 0;

// حالة وسائل المساعدة
let used50 = false;
let usedFriend = false;
let usedAudience = false;

function generateQuestion() {
    isProcessing = false;
    document.querySelectorAll('.hex-btn').forEach(btn => {
        btn.className = 'hex-btn'; // إعادة ضبط الأزرار
    });

    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    currentCorrectValue = n1 * n2;

    document.getElementById('question-text').innerText = `${toArabic(n1)} × ${toArabic(n2)} = ؟`;

    correctAnswerIndex = Math.floor(Math.random() * 4);
    let answers = [];
    answers[correctAnswerIndex] = currentCorrectValue;

    for (let i = 0; i < 4; i++) {
        if (i !== correctAnswerIndex) {
            let wrong;
            do {
                wrong = Math.floor(Math.random() * 100) + 1;
            } while (wrong === currentCorrectValue || answers.includes(wrong));
            answers[i] = wrong;
        }
    }

    for (let i = 0; i < 4; i++) {
        document.getElementById(`ans${i}`).innerText = toArabic(answers[i]);
    }
}

function selectAnswer(index) {
    if (isProcessing) return;
    isProcessing = true;
    playSound('select');

    const btns = document.querySelectorAll('.hex-btn');
    btns[index].classList.add('selected');

    setTimeout(() => {
        btns[index].classList.remove('selected');
        if (index === correctAnswerIndex) {
            btns[index].classList.add('correct');
            playSound('correct');
            setTimeout(generateQuestion, 2000);
        } else {
            btns[index].classList.add('wrong');
            btns[correctAnswerIndex].classList.add('correct');
            playSound('wrong');
            setTimeout(() => {
                alert("إجابة خاطئة! سنبدأ من جديد.");
                // إعادة ضبط وسائل المساعدة عند الخسارة (اختياري)
                resetLifelines();
                generateQuestion();
            }, 2500);
        }
    }, 1500);
}

// 1. حذف إجابتين
function use5050() {
    if (used50 || isProcessing) return;
    used50 = true;
    document.getElementById('btn-50').classList.add('lifeline-used');
    playSound('select');

    let removedCount = 0;
    const btns = document.querySelectorAll('.hex-btn');
    
    // محاولة إخفاء إجابتين خاطئتين عشوائياً
    for (let i = 0; i < 4; i++) {
        if (i !== correctAnswerIndex && removedCount < 2) {
            if (Math.random() > 0.5 || i === 3) { // عشوائية بسيطة
               btns[i].classList.add('hidden-answer');
               removedCount++;
            }
        }
    }
    // تأكيد حذف اثنتين (في حال العشوائية لم تكمل العدد)
    if (removedCount < 2) {
        for (let i = 0; i < 4; i++) {
            if (i !== correctAnswerIndex && !btns[i].classList.contains('hidden-answer') && removedCount < 2) {
                btns[i].classList.add('hidden-answer');
                removedCount++;
            }
        }
    }
}

// 2. اتصال بصديق
function useCallFriend() {
    if (usedFriend || isProcessing) return;
    usedFriend = true;
    document.getElementById('btn-friend').classList.add('lifeline-used');
    playSound('select');
    
    showModal("اتصال بصديق 📞", `صديقك يقول: "أنا متأكد بنسبة ٩٠٪ أن الإجابة الصحيحة هي ${toArabic(currentCorrectValue)}"`);
}

// 3. رأي الجمهور
function useAudience() {
    if (usedAudience || isProcessing) return;
    usedAudience = true;
    document.getElementById('btn-audience').classList.add('lifeline-used');
    playSound('select');

    const letters = ['أ', 'ب', 'ج', 'د'];
    showModal("رأي الجمهور 📊", `الجمهور صوت بأغلبية للإجابة (${letters[correctAnswerIndex]})`);
}

function resetLifelines() {
    used50 = false; usedFriend = false; usedAudience = false;
    document.querySelectorAll('.lifeline-btn').forEach(btn => btn.classList.remove('lifeline-used'));
}

// إدارة النوافذ المنبثقة
function showModal(title, body) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerText = body;
    document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// PWA
let deferredPrompt;
const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
});

generateQuestion();
