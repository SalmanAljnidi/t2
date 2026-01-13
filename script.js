// الصوتيات
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if(type === 'win') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.5); // C6
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    } else { // Select
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    }
    osc.start();
    osc.stop(audioCtx.currentTime + (type==='select'?0.1:0.8));
}

// تحويل الأرقام
const toArabic = (n) => n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

const prizes = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
let currentLevel = 0;
let correctIndex = 0;
let correctVal = 0;
let isLocked = false;

// بناء السلم
function renderLadder() {
    const container = document.getElementById('money-ladder');
    container.innerHTML = '';
    prizes.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = `ladder-step ${i===4||i===9||i===14?'safe-station':''}`;
        if(i === currentLevel) div.classList.add('active-step');
        div.innerHTML = `<span>${i+1}</span> <span>${toArabic(p)}</span>`;
        container.appendChild(div);
    });
}

function newQuestion() {
    isLocked = false;
    renderLadder();
    
    // Reset styling
    document.querySelectorAll('.answer-btn').forEach(b => {
        b.className = 'shape-body answer-btn';
        b.style.visibility = 'visible';
    });

    // Logic
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    correctVal = n1 * n2;
    document.getElementById('question-text').innerText = `${toArabic(n1)} × ${toArabic(n2)} = ؟`;

    correctIndex = Math.floor(Math.random() * 4);
    let answers = [];
    answers[correctIndex] = correctVal;

    for(let i=0; i<4; i++) {
        if(i !== correctIndex) {
            let w;
            do { w = Math.floor(Math.random()*100)+1; } while(w===correctVal || answers.includes(w));
            answers[i] = w;
        }
    }

    for(let i=0; i<4; i++) {
        document.getElementById(`ans${i}`).innerText = toArabic(answers[i]);
    }
}

function selectAnswer(idx) {
    if(isLocked) return;
    isLocked = true;
    playTone('select');
    
    const btn = document.getElementById(`btn${idx}`);
    btn.classList.add('selected');

    // Suspense
    setTimeout(() => {
        btn.classList.remove('selected');
        if(idx === correctIndex) {
            btn.classList.add('correct');
            playTone('win');
            setTimeout(() => {
                currentLevel++;
                if(currentLevel >= prizes.length) {
                    alert("مبروك المليون!");
                    currentLevel = 0;
                }
                newQuestion();
            }, 2000);
        } else {
            btn.classList.add('wrong');
            document.getElementById(`btn${correctIndex}`).classList.add('correct');
            playTone('lose');
            setTimeout(() => {
                alert("حظاً أوفر!");
                currentLevel = 0;
                // Reset Lifelines
                document.querySelectorAll('.lifeline-item').forEach(l => l.classList.remove('used-lifeline'));
                newQuestion();
            }, 2500);
        }
    }, 1500);
}

// --- وسائل المساعدة ---

// 1. حذف إجابتين
function use5050() {
    const el = document.getElementById('ll-50');
    if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline');
    playTone('select');

    let removed = 0;
    for(let i=0; i<4; i++) {
        if(i !== correctIndex && removed < 2) {
            if(Math.random() > 0.4 || i===3) {
                document.getElementById(`btn${i}`).style.visibility = 'hidden';
                removed++;
            }
        }
    }
}

// 2. اتصال بصديق
function usePhone() {
    const el = document.getElementById('ll-friend');
    if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline');
    playTone('select');

    showModal('اتصال بصديق', `
        <div class="phone-icon"><i class="fas fa-phone"></i></div>
        <p>جاري الاتصال...</p>
    `);

    setTimeout(() => {
        document.getElementById('modal-content').innerHTML = `
            <div style="font-size:40px">🤠</div>
            <p>أهلاً سلمان! أعتقد أن الإجابة هي <b>${toArabic(correctVal)}</b></p>
        `;
    }, 2500);
}

// 3. رأي الجمهور (أعمدة بيانية)
function useAudience() {
    const el = document.getElementById('ll-audience');
    if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline');
    playTone('select');

    // حساب نسب عشوائية تكون الإجابة الصحيحة أعلاها
    let p = [0,0,0,0];
    let remaining = 100;
    p[correctIndex] = Math.floor(Math.random() * 30) + 40; // 40-70%
    remaining -= p[correctIndex];
    
    for(let i=0; i<4; i++){
        if(i !== correctIndex){
            if(i === 3) p[i] = remaining; // الباقي للأخير
            else {
                let val = Math.floor(Math.random() * remaining);
                p[i] = val;
                remaining -= val;
            }
        }
    }

    const chars = ['أ','ب','ج','د'];
    let html = '<div class="audience-chart">';
    p.forEach((val, i) => {
        html += `
            <div class="bar-container">
                <div style="height:${val}%" class="bar"></div>
                <div class="bar-label">${chars[i]}</div>
                <div style="font-size:10px">${toArabic(val)}%</div>
            </div>
        `;
    });
    html += '</div>';

    showModal('رأي الجمهور', html);
}

function showModal(title, content) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-content').innerHTML = content;
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

newQuestion();
