const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(freq, type, duration, startTime = 0) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime + startTime;
    gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now); osc.stop(now + duration);
}
function playSound(effect) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (effect === 'select') playNote(800, 'sine', 0.1);
    else if (effect === 'correct') { playNote(523.25, 'triangle', 0.6, 0); playNote(659.25, 'triangle', 0.6, 0.1); playNote(783.99, 'triangle', 0.8, 0.2); }
    else if (effect === 'wrong') { playNote(150, 'sawtooth', 0.8, 0); playNote(140, 'sawtooth', 0.8, 0); }
    else if (effect === 'milestone') { playNote(523.25, 'square', 0.3, 0); playNote(659.25, 'square', 0.3, 0.15); playNote(783.99, 'square', 0.3, 0.30); playNote(1046.50, 'square', 1.0, 0.45); }
    else if (effect === 'win_million') { [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((t, i) => playNote(523.25 + (i*100), 'square', 0.5, t)); setTimeout(() => playSound('milestone'), 1200); }
}

const toArabic = (n) => n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
const prizes = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
let currentLevel = 0;
let correctIndex = 0;
let correctVal = 0;
let isLocked = false;
let playerName = "المتسابق";

function startGame() {
    const inputName = document.getElementById('player-name-input').value.trim();
    if (inputName) playerName = inputName;
    document.getElementById('start-screen').style.display = 'none';
    const gameDiv = document.getElementById('main-game');
    gameDiv.style.opacity = '1'; gameDiv.style.pointerEvents = 'all';
    document.getElementById('player-display').innerText = `المتسابق: ${playerName}`;
    renderLadder(); newQuestion();
}

// --- التعديل هنا: تحسين وظيفة الزر وتغيير الأيقونة ---
function toggleMobileLadder() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('mobile-menu-btn');
    
    sidebar.classList.toggle('active');
    
    // إذا كلاس active موجود، نغير الأيقونة لـ X، وإذا لا نرجعها قائمة
    if (sidebar.classList.contains('active')) {
        btn.innerHTML = '<i class="fas fa-times"></i>'; // علامة إكس
    } else {
        btn.innerHTML = '<i class="fas fa-list-ol"></i>'; // علامة القائمة
    }
}

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
    
    document.querySelectorAll('.answer-btn').forEach(b => {
        b.classList.remove('selected', 'correct', 'wrong');
        b.className = 'shape-body answer-btn';
        b.style.visibility = 'visible';
    });

    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    correctVal = n1 * n2;
    document.getElementById('question-text').innerText = `${toArabic(n1)} × ${toArabic(n2)} = ؟`;

    correctIndex = Math.floor(Math.random() * 4);
    let answers = [];
    answers[correctIndex] = correctVal;
    for(let i=0; i<4; i++) {
        if(i !== correctIndex) {
            let w; do { w = Math.floor(Math.random()*100)+1; } while(w===correctVal || answers.includes(w));
            answers[i] = w;
        }
    }
    for(let i=0; i<4; i++) document.getElementById(`ans${i}`).innerText = toArabic(answers[i]);
}

function selectAnswer(idx) {
    if(isLocked) return;
    isLocked = true;
    playSound('select');
    
    const btn = document.getElementById(`btn${idx}`);
    btn.classList.add('selected');

    setTimeout(() => {
        if (!isLocked) return;
        
        btn.classList.remove('selected');
        if(idx === correctIndex) {
            btn.classList.add('correct');
            if (currentLevel === 4 || currentLevel === 9) playSound('milestone');
            else if (currentLevel === 14) { playSound('win_million'); startConfetti(); }
            else playSound('correct');
            setTimeout(() => {
                currentLevel++;
                if(currentLevel >= prizes.length) {
                    showModal('🎉 مبروك المليون 🎉', `ألف مبروك يا ${playerName}! حصلت على المليون!`);
                    currentLevel = 0; stopConfetti();
                } else {
                    newQuestion();
                }
            }, 2500);
        } else {
            btn.classList.add('wrong');
            document.getElementById(`btn${correctIndex}`).classList.add('correct');
            playSound('wrong');
            setTimeout(() => {
                showModal('حظاً أوفر', `للأسف إجابة خاطئة يا ${playerName}.`);
                currentLevel = 0;
                document.querySelectorAll('.lifeline-item').forEach(l => l.classList.remove('used-lifeline'));
                newQuestion();
            }, 3000);
        }
    }, 2000);
}

function use5050() {
    const el = document.getElementById('ll-50'); if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline'); playSound('select');
    let removed = 0;
    for(let i=0; i<4; i++) { if(i !== correctIndex && removed < 2) { if(Math.random() > 0.4 || i===3) { document.getElementById(`btn${i}`).style.visibility = 'hidden'; removed++; }}}
}
function usePhone() {
    const el = document.getElementById('ll-friend'); if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline'); playSound('select');
    showModal('اتصال بصديق', `<div class="phone-icon"><i class="fas fa-phone"></i></div><p>جاري الاتصال...</p>`);
    setTimeout(() => { document.getElementById('modal-content').innerHTML = `<div style="font-size:40px">🤠</div><p>هلا والله يا <b>${playerName}</b>!<br>أنا متأكد إن الجواب هو <b>${toArabic(correctVal)}</b></p>`; }, 3000);
}
function useAudience() {
    const el = document.getElementById('ll-audience'); if(el.classList.contains('used-lifeline') || isLocked) return;
    el.classList.add('used-lifeline'); playSound('select');
    let p = [0,0,0,0], rem = 100; p[correctIndex] = Math.floor(Math.random() * 30) + 40; rem -= p[correctIndex];
    for(let i=0; i<4; i++){ if(i!==correctIndex){ if(i===3) p[i]=rem; else { let v=Math.floor(Math.random()*rem); p[i]=v; rem-=v; }}}
    const chars = ['أ','ب','ج','د'];
    let html = '<div class="audience-chart">';
    p.forEach((val, i) => html += `<div style="display:flex; flex-direction:column; align-items:center; width:20%; justify-content:flex-end; height:100%"><div style="height:${val}%; width:100%; background:#d4af37;" class="bar"></div><div>${chars[i]}</div></div>`);
    html += '</div>';
    showModal('رأي الجمهور', html);
}
function showModal(title, content) { document.getElementById('modal-title').innerText = title; document.getElementById('modal-content').innerHTML = content; document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
const canvas = document.getElementById("confetti-canvas"); const ctx = canvas.getContext("2d"); let confetti = []; let animationId = null; canvas.width = window.innerWidth; canvas.height = window.innerHeight;
function startConfetti() { confetti = []; for(let i=0; i<100; i++) confetti.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height - canvas.height, color: `hsl(${Math.random()*360}, 100%, 50%)`, size: Math.random()*10+5, speed: Math.random()*5+2 }); animateConfetti(); }
function animateConfetti() { ctx.clearRect(0,0,canvas.width, canvas.height); confetti.forEach((p, i) => { p.y += p.speed; if(p.y > canvas.height) p.y = -10; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); }); animationId = requestAnimationFrame(animateConfetti); }
function stopConfetti() { cancelAnimationFrame(animationId); ctx.clearRect(0,0,canvas.width,canvas.height); }
let deferredPrompt; const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.style.display='inline-block';});
installBtn.addEventListener('click',()=>{installBtn.style.display='none';deferredPrompt.prompt();});
