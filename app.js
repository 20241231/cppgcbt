// LocalStorage 기반 오답노트 관리
const WRONG_STORAGE_KEY = 'cppg_wrong_answers';

let currentQuizSet = [];
let currentIndex = 0;
let userAnswers = [];
let selectedOption = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('total-db-count').innerText = QUESTION_BANK.length;
  updateWrongCount();
});

function getWrongList() {
  return JSON.parse(localStorage.getItem(WRONG_STORAGE_KEY) || '[]');
}

function updateWrongCount() {
  document.getElementById('wrong-count').innerText = getWrongList().length;
}

// 중복 및 돌려막기 방지 셔플 알고리즘 (Fisher-Yates Shuffle)
function getShuffledArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startQuiz(count) {
  if (QUESTION_BANK.length === 0) return alert('문제 데이터가 없습니다.');
  
  // 중복 없이 원하는 문제 수만큼 랜더링
  const shuffled = getShuffledArray(QUESTION_BANK);
  currentQuizSet = shuffled.slice(0, Math.min(count, QUESTION_BANK.length));
  
  initQuizState();
}

function startWrongQuiz() {
  const wrongIds = getWrongList();
  if (wrongIds.length === 0) return alert('저장된 오답이 없습니다.');

  currentQuizSet = QUESTION_BANK.filter(q => wrongIds.includes(q.id));
  initQuizState();
}

function initQuizState() {
  currentIndex = 0;
  userAnswers = [];
  selectedOption = null;
  
  document.getElementById('menu-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('quiz-screen').classList.remove('hidden');
  
  renderQuestion();
}

function renderQuestion() {
  selectedOption = null;
  const q = currentQuizSet[currentIndex];
  
  // 진행률 계산
  const progressPercent = ((currentIndex) / currentQuizSet.length) * 100;
  document.getElementById('progress').style.width = `${progressPercent}%`;
  document.getElementById('quiz-status').innerText = `문제 ${currentIndex + 1} / ${currentQuizSet.length}`;
  
  // 문제 및 보기 표시
  document.getElementById('question-box').innerHTML = `<strong>Q${currentIndex + 1}. ${q.question}</strong>`;
  
  const optionsBox = document.getElementById('options-box');
  optionsBox.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = `${idx + 1}. ${opt}`;
    btn.onclick = () => selectOption(idx, btn);
    optionsBox.appendChild(btn);
  });

  document.getElementById('explanation-box').classList.add('hidden');
  document.getElementById('submit-btn').classList.remove('hidden');
  document.getElementById('next-btn').classList.add('hidden');
}

function selectOption(index, element) {
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
  selectedOption = index;
}

function checkAnswer() {
  if (selectedOption === null) return alert('답을 선택해주세요.');

  const q = currentQuizSet[currentIndex];
  const isCorrect = selectedOption === q.answer;
  
  userAnswers.push({ questionId: q.id, isCorrect });

  // 오답 데이터 핸들링
  let wrongList = getWrongList();
  if (!isCorrect) {
    if (!wrongList.includes(q.id)) {
      wrongList.push(q.id);
      localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(wrongList));
    }
  } else {
    // 맞춘 문제는 오답노트에서 자동 제거
    wrongList = wrongList.filter(id => id !== q.id);
    localStorage.setItem(WRONG_STORAGE_KEY, JSON.stringify(wrongList));
  }
  updateWrongCount();

  // 정답 / 오답 스타일 및 해설 UI
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.answer) btn.classList.add('correct');
    if (idx === selectedOption && !isCorrect) btn.classList.add('incorrect');
  });

  const expBox = document.getElementById('explanation-box');
  expBox.innerHTML = `<strong>${isCorrect ? '⭕ 정답입니다!' : '❌ 오답입니다.'}</strong><br><br>${q.explanation}`;
  expBox.classList.remove('hidden');

  document.getElementById('submit-btn').classList.add('hidden');
  document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < currentQuizSet.length) {
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  document.getElementById('quiz-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  const totalCount = currentQuizSet.length;
  const percent = Math.round((correctCount / totalCount) * 100);

  document.getElementById('final-score').innerText = correctCount;
  document.getElementById('max-score').innerText = totalCount;
  document.getElementById('score-percent').innerText = percent;
}

function showMenu() {
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('quiz-screen').classList.add('hidden');
  document.getElementById('menu-screen').classList.remove('hidden');
}

function exitQuiz() {
  if (confirm('진행중인 시험을 종료하시겠습니까?')) {
    showMenu();
  }
}