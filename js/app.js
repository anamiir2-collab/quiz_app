/* ========== بيانات الأسئلة ========== */
const SURAH_NAME = window.QUIZ_SURAH_NAME || 'يس';
const SURAH_LABEL = `سورة ${SURAH_NAME}`;
const SURAH_SLUG = SURAH_NAME === 'الرحمن' ? 'الرحمن' : 'يس';
const rawQuestions = window.QUIZ_QUESTIONS;


/* ========== دوال مساعدة ========== */
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestionOptions(item){
  const optWithIndex = item.options.map((text, idx) => ({text, isCorrect: idx === item.correct}));
  const shuffled = shuffle(optWithIndex);
  return {
    q: item.q,
    options: shuffled.map(o => o.text),
    correct: shuffled.findIndex(o => o.isCorrect)
  };
}

/* ========== حالة اللعبة ========== */
let questions = rawQuestions.map(shuffleQuestionOptions);
const TOTAL = questions.length;
const POINTS_PER_Q = 100 / TOTAL;
const letters = ['أ','ب','ج','د'];

let current = 0;
let score = 0;
let selected = null;
let answered = false;
const userAnswers = [];
let helpsRemaining = 3;
let userName = '';

/* ========== عناصر DOM ========== */
const content = document.getElementById('content');
const dotsRow = document.getElementById('dotsRow');
const helpText = document.getElementById('helpText');
const progressWrap = document.getElementById('progressWrap');

/* ========== دعم لوحة المفاتيح ========== */
function handleKeydown(e){
  if(answered){
    if(e.key === 'Enter'){
      e.preventDefault();
      nextQuestion();
    }
    return;
  }
  const keyMap = {
    '1':0, '2':1, '3':2, '4':3,
    'ا':0, 'ب':1, 'ج':2, 'د':3,
    'أ':0
  };
  if(keyMap[e.key] !== undefined){
    e.preventDefault();
    selectOption(keyMap[e.key]);
  }
  if(e.key === 'Enter' && selected !== null){
    e.preventDefault();
    confirmAnswer();
  }
}

function attachKeyHandler(){
  document.addEventListener('keydown', handleKeydown);
}
function detachKeyHandler(){
  document.removeEventListener('keydown', handleKeydown);
}

/* ========== شريط التقدم ========== */
function updateHelpText(){
  helpText.textContent = `🌙 المساعدات المتبقية: ${helpsRemaining}`;
}

function buildDots(){
  dotsRow.innerHTML = '';
  for(let i = 0; i < TOTAL; i++){
    const d = document.createElement('div');
    d.className = 'dot';
    d.id = 'dot-' + i;
    dotsRow.appendChild(d);
  }
}

function updateDots(forResult){
  for(let i = 0; i < TOTAL; i++){
    const d = document.getElementById('dot-' + i);
    if(!d) continue;
    d.classList.remove('done','current','wrong-dot');
    if(i < current){
      if(forResult){
        const ans = userAnswers.find(a => a.idx === i);
        d.classList.add(ans && ans.correct ? 'done' : 'wrong-dot');
      } else {
        d.classList.add('done');
      }
    } else if(i === current && !forResult){
      d.classList.add('current');
    }
  }
}

/* ========== أنيميشن الانتقال ========== */
function triggerAnimation(){
  content.classList.remove('animate-in');
  void content.offsetWidth;
  content.classList.add('animate-in');
}

/* ========== شاشة المقدمة ========== */
function renderIntro(){
  progressWrap.style.display = 'none';
  detachKeyHandler();
  content.innerHTML = `
    <div class="intro">
      <h2>✦ بسم الله نبدأ ✦</h2>
      <p>قبل أن تبدأ اختبار ${SURAH_LABEL}، اكتب اسمك ليظهر في نتيجتك النهائية:</p>
      <input type="text" id="nameInput" class="name-input" placeholder="اكتب اسمك هنا" maxlength="30">
      <p class="keyboard-hint">💡 يمكنك استخدام لوحة المفاتيح: أرقام 1-4 أو حروف أ ب ج د للإجابة، و Enter للتأكيد والانتقال</p>
      <div class="controls" style="justify-content:center;">
        <button class="btn" onclick="startQuiz()">ابدأ الاختبار ←</button>
      </div>
    </div>
  `;
  const nameInput = document.getElementById('nameInput');
  nameInput.focus();
  nameInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      startQuiz();
    }
  });
}

function startQuiz(){
  const val = document.getElementById('nameInput').value.trim();
  userName = val || 'الطالب';
  progressWrap.style.display = 'block';
  buildDots();
  renderQuestion();
}

/* ========== عرض السؤال ========== */
function renderQuestion(){
  answered = false;
  selected = null;
  const item = questions[current];

  updateDots(false);
  updateHelpText();
  triggerAnimation();
  attachKeyHandler();

  let optionsHtml = item.options.map((opt, i) => `
    <div class="option" data-idx="${i}" onclick="selectOption(${i})">
      <span class="letter">${letters[i]}</span>
      <span class="opt-text">${opt}</span>
    </div>
  `).join('');

  const helpBtnHtml = helpsRemaining > 0
    ? `<div class="help-bar"><button class="help-btn" id="helpBtn" onclick="useHelp()">🌙 حذف إجابة خاطئة (${helpsRemaining} متبقية)</button></div>`
    : '';

  content.innerHTML = `
    <div class="question-box">
      <div class="question-num">السؤال ${current + 1} من ${TOTAL}</div>
      <div class="question-text">${item.q}</div>
    </div>
    ${helpBtnHtml}
    <div class="options" id="optionsWrap">${optionsHtml}</div>
    <div class="feedback" id="feedback"></div>
    <div class="controls">
      <button class="btn btn-ghost" id="confirmBtn" onclick="confirmAnswer()" disabled>تأكيد الإجابة</button>
      <button class="btn" id="nextBtn" onclick="nextQuestion()" style="display:none;">
        ${current === TOTAL - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي ←'}
      </button>
    </div>
  `;
}

/* ========== المساعدة ========== */
function useHelp(){
  if(helpsRemaining <= 0 || answered) return;
  const item = questions[current];
  const wrongIndices = [];
  for(let i = 0; i < item.options.length; i++){
    if(i !== item.correct){
      const el = document.querySelector(`.option[data-idx="${i}"]`);
      if(el && !el.classList.contains('removed')) wrongIndices.push(i);
    }
  }
  if(wrongIndices.length === 0) return;

  const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  const el = document.querySelector(`.option[data-idx="${pick}"]`);
  el.classList.add('removed');
  el.onclick = null;

  helpsRemaining--;
  updateHelpText();

  if(helpsRemaining <= 0){
    const bar = document.querySelector('.help-bar');
    if(bar) bar.remove();
  } else {
    const btn = document.getElementById('helpBtn');
    if(btn) btn.textContent = `🌙 حذف إجابة خاطئة (${helpsRemaining} متبقية)`;
  }
}

/* ========== اختيار إجابة ========== */
function selectOption(idx){
  if(answered) return;
  const el = document.querySelector(`.option[data-idx="${idx}"]`);
  if(el && el.classList.contains('removed')) return;

  selected = idx;
  document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  const target = document.querySelector(`.option[data-idx="${idx}"]`);
  if(target) target.classList.add('selected');
  document.getElementById('confirmBtn').disabled = false;
}

/* ========== تأكيد الإجابة ========== */
function confirmAnswer(){
  if(selected === null || answered) return;
  answered = true;
  detachKeyHandler();

  const item = questions[current];
  const isCorrect = selected === item.correct;
  if(isCorrect) score += POINTS_PER_Q;
  userAnswers.push({idx: current, correct: isCorrect, chosen: selected});

  document.querySelectorAll('.option').forEach((el, i) => {
    el.onclick = null;
    if(i === selected){
      el.classList.remove('selected');
      el.classList.add('locked');
    } else {
      el.classList.add('disabled');
    }
  });

  const fb = document.getElementById('feedback');
  fb.classList.add('show', 'neutral-fb');
  fb.innerHTML = '✔ تم تسجيل إجابتك — ستعرف نتيجتك في النهاية';

  document.getElementById('confirmBtn').style.display = 'none';
  document.getElementById('nextBtn').style.display = 'inline-block';
}

/* ========== السؤال التالي ========== */
function nextQuestion(){
  current++;
  if(current >= TOTAL){
    showResult();
  } else {
    renderQuestion();
  }
}

/* ========== نتيجة الاختبار ========== */
let lastResult = null;

function showResult(){
  detachKeyHandler();

  updateDots(true);
  progressWrap.style.display = 'none';

  const finalScore = Math.round(score);
  const correctCount = userAnswers.filter(a => a.correct).length;
  const wrongCount = TOTAL - correctCount;

  let title, msg, emoji;
  if(finalScore >= 90){
    emoji = '🌟';
    title = 'ممتاز، بارك الله فيك!';
    msg = `حفظٌ متقن وفهمٌ عميق لآيات ${SURAH_LABEL}. أنت على الطريق الصحيح، فاستمر في المراجعة الدائمة، وجعل الله هذه السورة نوراً لك في الدنيا والآخرة.`;
  } else if(finalScore >= 70){
    emoji = '✨';
    title = 'جيد جدًا، أحسنت!';
    msg = 'نتيجة طيبة تدل على حفظ جيد. راجع الآيات التي أخطأت فيها مرة أخرى بتمعن، فبقليل من المراجعة تصل إلى الإتقان الكامل بإذن الله.';
  } else if(finalScore >= 50){
    emoji = '📖';
    title = 'جيد، وتحتاج إلى مزيد من المراجعة';
    msg = `بداية طيبة، لكن ${SURAH_LABEL} تستحق منك وقتاً أطول في الحفظ والتدبر. اقرأها بترتيل واستمع إليها من قارئ متقن، وستجد تحسناً ملحوظاً في المرة القادمة.`;
  } else {
    emoji = '🕌';
    title = 'لا بأس، البداية دائماً هي الأصعب';
    msg = `لا تحزن، فكل حافظ للقرآن بدأ من الصفر. خصص وقتاً يومياً لتلاوة ${SURAH_LABEL} وتكرارها، وستجد نفسك قريباً تحفظها عن ظهر قلب بإذن الله تعالى.`;
  }

  lastResult = {finalScore, correctCount, wrongCount, title, msg, emoji};

  const reviewHtml = userAnswers.map(ans => {
    const item = questions[ans.idx];
    const rowClass = ans.correct ? 'correct-fb' : 'incorrect-fb';
    const yourAnswer = `(${letters[ans.chosen]}) ${item.options[ans.chosen]}`;
    const correctAnswer = `(${letters[item.correct]}) ${item.options[item.correct]}`;
    return `
      <div class="review-item ${rowClass}">
        <div class="review-q">${ans.idx + 1}. ${item.q}</div>
        <div class="review-a">إجابتك: ${yourAnswer} ${ans.correct ? '✔' : '✘'}</div>
        ${ans.correct ? '' : `<div class="review-correct-answer">الإجابة الصحيحة: ${correctAnswer}</div>`}
      </div>
    `;
  }).join('');

  triggerAnimation();

  content.innerHTML = `
    <div class="result" id="resultMain">
      <p style="font-family:'Reem Kufi', sans-serif; color:var(--terracotta); margin-bottom:6px; font-size:1.05rem;">نتيجة الطالب: ${userName}</p>
      <div class="score-circle">
        <div class="num">${finalScore}</div>
        <div class="den">من 100</div>
      </div>
      <h2>${emoji} ${title} ${emoji}</h2>
      <div class="stats">
        <span style="color:#1e6b3a;">✔ صحيحة: ${correctCount}</span>
        <span style="color:#8a3b28;">✘ خاطئة: ${wrongCount}</span>
      </div>
      <div class="divider"></div>
      <p class="msg">${msg}</p>
      <div class="controls" style="justify-content:center; flex-wrap:wrap; gap:10px;">
        <button class="btn" onclick="restartQuiz()">🔄 إعادة الاختبار</button>
        <button class="btn btn-ghost" onclick="toggleReview()">📋 مراجعة الإجابات</button>
        <button class="btn" id="pdfBtn" onclick="downloadQuestionsPDF()">📄 تحميل الأسئلة PDF</button>
      </div>
      <div id="reviewList" style="display:none; text-align:right; margin-top:20px;">
        ${reviewHtml}
        <div class="controls" style="justify-content:center; margin-top:14px;">
          <button class="btn btn-ghost" onclick="toggleReview()">↩ رجوع للنتيجة</button>
        </div>
      </div>
    </div>
  `;
}

function toggleReview(){
  const el = document.getElementById('reviewList');
  const main = document.getElementById('resultMain');
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? 'block' : 'none';
  if(!isHidden) main.scrollIntoView({behavior:'smooth', block:'start'});
}

/* ========== تحميل الأسئلة كملف PDF ========== */
function downloadQuestionsPDF(){
  const btn = document.getElementById('pdfBtn');
  if(!btn) return;
  btn.classList.add('loading');
  btn.textContent = '⏳ جارٍ تجهيز الملف...';

  /* بناء عنصر HTML مؤقت لتحويله إلى PDF */
  const pdfContainer = document.createElement('div');
  pdfContainer.setAttribute('dir', 'rtl');
  pdfContainer.style.cssText = `
    position: fixed;
    top: -9999px;
    left: 0;
    width: 210mm;
    padding: 18mm 16mm;
    background: #fff;
    font-family: 'Amiri', 'Traditional Arabic', 'Times New Roman', serif;
    color: #2c211a;
    line-height: 2;
    font-size: 13px;
  `;

  /* بناء محتوى الأسئلة */
  let questionsHTML = '';
  for(let i = 0; i < rawQuestions.length; i++){
    const item = rawQuestions[i];
    const correctText = item.options[item.correct];

    questionsHTML += `
      <div style="margin-bottom: 14px; page-break-inside: avoid;">
        <div style="font-weight: bold; color: #073331; font-size: 14px; margin-bottom: 4px; line-height: 2.2;">
          ${i + 1}. ${item.q}
        </div>
        <div style="padding-right: 16px;">
          ${item.options.map((opt, oi) => {
            const isCorrect = oi === item.correct;
            return `<div style="
              padding: 2px 0;
              color: ${isCorrect ? '#1e6b3a' : '#2c211a'};
              font-weight: ${isCorrect ? 'bold' : 'normal'};
            ">${isCorrect ? '✔ ' : '&nbsp;&nbsp;&nbsp;'}${opt}</div>`;
          }).join('')}
        </div>
      </div>
      ${i < rawQuestions.length - 1 ? '<div style="border-bottom: 1px dashed #e0d5c0; margin: 10px 0;"></div>' : ''}
    `;
  }

  pdfContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 22px; font-weight: bold; color: #073331; margin-bottom: 6px;">
        ✦ أسئلة اختبار ${SURAH_LABEL} ✦
      </div>
      <div style="font-size: 14px; color: #b5563a; margin-bottom: 4px;">
        ${TOTAL} سؤالاً مع الإجابات الصحيحة
      </div>
      <div style="font-size: 12px; color: #888; margin-bottom: 10px;">
        تصميم وإعداد: أمير أنور — 01066227553
      </div>
      <div style="width: 80px; height: 2px; background: #c9a34e; margin: 10px auto;"></div>
      <div style="font-size: 11px; color: #999; margin-bottom: 16px;">
        (الإجابة الصحيحة مُشار إليها بعلامة ✔ باللون الأخضر)
      </div>
    </div>
    ${questionsHTML}
    <div style="border-top: 2px solid #c9a34e; margin-top: 24px; padding-top: 14px; text-align: center;">
      <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
        ✦  تصميم وإعداد: أمير أنور محمد ✦
      </div>
      <div style="font-size: 11px; color: #aaa; direction: ltr;">01066227553</div>
      <div style="font-size: 11px; color: #999; margin-top: 8px; max-width: 400px; margin-left: auto; margin-right: auto;">
        اللهم اجعل القرآن العظيم ربيع قلوبنا ونور صدورنا وجلاء أحزاننا
      </div>
    </div>
  `;

  document.body.appendChild(pdfContainer);

  const opt = {
    margin:       [8, 8, 8, 8],
    filename:     `أسئلة-اختبار-${SURAH_SLUG}.pdf`,
    image:        {type: 'jpeg', quality: 0.98},
    html2canvas:  {scale: 2, useCORS: true, letterRendering: true},
    jsPDF:        {unit: 'mm', format: 'a4', orientation: 'portrait'},
    pagebreak:    {mode: ['avoid-all', 'css', 'legacy']}
  };

  html2pdf().set(opt).from(pdfContainer).save().then(function(){
    document.body.removeChild(pdfContainer);
    btn.classList.remove('loading');
    btn.textContent = '📄 تحميل الأسئلة PDF';
  }).catch(function(){
    document.body.removeChild(pdfContainer);
    btn.classList.remove('loading');
    btn.textContent = '📄 تحميل الأسئلة PDF';
    alert('حدث خطأ أثناء تحميل الملف، حاول مرة أخرى');
  });
}

/* ========== إعادة الاختبار ========== */
function restartQuiz(){
  questions = rawQuestions.map(shuffleQuestionOptions);

  current = 0;
  score = 0;
  userAnswers.length = 0;
  helpsRemaining = 3;
  lastResult = null;

  progressWrap.style.display = 'block';
  buildDots();
  renderQuestion();
}

/* ========== البدء ========== */
renderIntro();
