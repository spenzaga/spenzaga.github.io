// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBiC7S29mWNiNyusbIwnR-Pha6aIZZTA0o",
  authDomain: "quiziz-30f51.firebaseapp.com",
  databaseURL: "https://quiziz-30f51-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quiziz-30f51",
  storageBucket: "quiziz-30f51.firebasestorage.app",
  messagingSenderId: "335258259474",
  appId: "1:335258259474:web:a89f78bcb592481fb9c8cb",
  measurementId: "G-X6C0SV86SV"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentStudent = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let timerInterval;
let startTime;
let violations = 0;

// Security features
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p'))) {
        e.preventDefault();
        violations++;
        checkViolations();
    }
});
window.addEventListener('blur', () => {
    violations++;
    checkViolations();
});
window.addEventListener('beforeunload', e => {
    if (Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});

function checkViolations() {
    if (violations > 5) {
        submitQuiz();
    }
}

// Login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nis = document.getElementById('nis').value;
        const studentsRef = ref(db, 'students');
        const snapshot = await get(studentsRef);
        const students = snapshot.val();
        const student = Object.values(students).find(s => s.nis === nis);
        if (student) {
            // Check if already taken
            const scoresRef = ref(db, 'scores');
            const scoresSnapshot = await get(scoresRef);
            const scores = scoresSnapshot.val() || {};
            const alreadyTaken = Object.values(scores).some(s => s.student_id === student.student_id);
            if (alreadyTaken) {
                document.getElementById('error').textContent = 'Anda sudah mengerjakan ujian.';
                return;
            }
            localStorage.setItem('student', JSON.stringify(student));
            window.location.href = 'confirm.html';
        } else {
            document.getElementById('error').textContent = 'NIS tidak ditemukan.';
        }
    });
}

// Confirm page
if (document.getElementById('studentData')) {
    currentStudent = JSON.parse(localStorage.getItem('student'));
    document.getElementById('absen').textContent = currentStudent.absen;
    document.getElementById('nis').textContent = currentStudent.nis;
    document.getElementById('name').textContent = currentStudent.name;
    document.getElementById('class').textContent = currentStudent.class;
    document.getElementById('honestyCheck').addEventListener('change', (e) => {
        document.getElementById('startQuiz').disabled = !e.target.checked;
    });
    document.getElementById('startQuiz').addEventListener('click', async () => {
        const questionsRef = ref(db, 'questions');
        const snapshot = await get(questionsRef);
        questions = snapshot.val();
        localStorage.setItem('questions', JSON.stringify(questions));
        window.location.href = 'quiz.html';
    });
}

// Quiz page
if (document.getElementById('questionContainer')) {
    currentStudent = JSON.parse(localStorage.getItem('student'));
    questions = JSON.parse(localStorage.getItem('questions'));
    document.getElementById('studentName').textContent = currentStudent.name;
    document.getElementById('studentClass').textContent = currentStudent.class;
    startTime = Date.now();
    startTimer();
    renderQuestion();
    renderNav();

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
            updateNav();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        saveAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
            updateNav();
        } else {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'inline';
        }
    });

    document.getElementById('submitBtn').addEventListener('click', submitQuiz);

    document.getElementById('toggleNav').addEventListener('click', () => {
        const navGrid = document.getElementById('navGrid');
        navGrid.style.display = navGrid.style.display === 'none' ? 'grid' : 'none';
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function renderQuestion() {
    const q = questions[currentQuestionIndex];
    let html = `<h3>Soal ${currentQuestionIndex + 1}</h3>`;
    if (q.image) html += `<img src="${q.image}" alt="Gambar soal">`;
    if (q.video) html += `<video controls><source src="${q.video}" type="video/mp4"></video>`;
    if (q.audio) html += `<audio controls><source src="${q.audio}" type="audio/mpeg"></audio>`;
    if (q.question_paragraph) html += `<p>${q.question_paragraph}</p>`;
    html += `<p>${q.question_text}</p>`;
    html += '<div class="options">';

    if (q.question_type === 'TF') {
        html += `<label class="option"><input type="radio" name="answer" value="True"> True</label>`;
        html += `<label class="option"><input type="radio" name="answer" value="False"> False</label>`;
    } else if (q.question_type === 'MC') {
        for (let i = 1; i <= 4; i++) {
            if (q[`answer_${i}`]) {
                const value = q[`answer_${i}`].replace('*', '');
                html += `<label class="option"><input type="radio" name="answer" value="${value}"> ${value}</label>`;
            }
        }
    } else if (q.question_type === 'MR') {
        for (let i = 1; i <= 4; i++) {
            if (q[`answer_${i}`]) {
                const value = q[`answer_${i}`].replace('*', '');
                const checked = q[`answer_${i}`].startsWith('*') ? 'checked' : '';
                html += `<label class="option"><input type="checkbox" name="answer" value="${value}" ${checked}> ${value}</label>`;
            }
        }
    } else if (q.question_type === 'TI') {
        html += `<input type="text" name="answer" placeholder="Jawaban Anda">`;
    } else if (q.question_type === 'MG') {
        html += '<div>Match:</div>';
        const pairs = [];
        for (let i = 1; i <= 4; i++) {
            if (q[`answer_${i}`]) {
                pairs.push(q[`answer_${i}`].split('|'));
            }
        }
        const rights = pairs.map(p => p[1]);
        pairs.forEach(([left], index) => {
            html += `<div>${left} <select name="match${index}">`;
            html += `<option value="">Pilih</option>`;
            rights.forEach(right => {
                html += `<option value="${right}">${right}</option>`;
            });
            html += `</select></div>`;
        });
    } else if (q.question_type === 'SEQ') {
        html += '<div>Urutkan dari atas ke bawah:</div>';
        for (let i = 1; i <= 4; i++) {
            if (q[`answer_${i}`]) {
                html += `<div><input type="text" name="seq${i}" placeholder="Item ${i}"></div>`;
            }
        }
    } else if (q.question_type === 'NUMG') {
        html += `<input type="number" name="answer" placeholder="Jawaban numerik">`;
    }

    html += '</div>';
    document.getElementById('questionContainer').innerHTML = html;
    loadAnswer();
}

function saveAnswer() {
    const q = questions[currentQuestionIndex];
    let response = [];
    if (q.question_type === 'TF' || q.question_type === 'MC') {
        const selected = document.querySelector('input[name="answer"]:checked');
        response = selected ? selected.value : '';
    } else if (q.question_type === 'MR') {
        const selected = document.querySelectorAll('input[name="answer"]:checked');
        response = Array.from(selected).map(cb => cb.value);
    } else if (q.question_type === 'TI') {
        response = document.querySelector('input[name="answer"]').value;
    } else if (q.question_type === 'MG') {
        const selects = document.querySelectorAll('select[name^="match"]');
        response = Array.from(selects).map(s => s.value);
    } else if (q.question_type === 'SEQ') {
        const inputs = document.querySelectorAll('input[name^="seq"]');
        response = Array.from(inputs).map(i => i.value);
    } else if (q.question_type === 'NUMG') {
        response = document.querySelector('input[name="answer"]').value;
    }
    answers[q.question_id] = response;
}

function loadAnswer() {
    const q = questions[currentQuestionIndex];
    const ans = answers[q.question_id];
    if (!ans) return;
    if (q.question_type === 'TF' || q.question_type === 'MC') {
        const radio = document.querySelector(`input[name="answer"][value="${ans}"]`);
        if (radio) radio.checked = true;
    } else if (q.question_type === 'MR') {
        ans.forEach(val => {
            const cb = document.querySelector(`input[name="answer"][value="${val}"]`);
            if (cb) cb.checked = true;
        });
    } else if (q.question_type === 'TI') {
        document.querySelector('input[name="answer"]').value = ans;
    } else if (q.question_type === 'MG') {
        const selects = document.querySelectorAll('select[name^="match"]');
        selects.forEach((s, i) => s.value = ans[i] || '');
    } else if (q.question_type === 'SEQ') {
        const inputs = document.querySelectorAll('input[name^="seq"]');
        inputs.forEach((i, idx) => i.value = ans[idx] || '');
    } else if (q.question_type === 'NUMG') {
        document.querySelector('input[name="answer"]').value = ans;
    }
}

function renderNav() {
    const navGrid = document.getElementById('navGrid');
    navGrid.innerHTML = '';
    questions.forEach((_, index) => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.textContent = index + 1;
        item.addEventListener('click', () => {
            saveAnswer();
            currentQuestionIndex = index;
            renderQuestion();
            updateNav();
        });
        navGrid.appendChild(item);
    });
    updateNav();
}

function updateNav() {
    const items = document.querySelectorAll('.nav-item');
    items.forEach((item, index) => {
        item.classList.remove('current', 'answered');
        if (index === currentQuestionIndex) item.classList.add('current');
        if (answers[questions[index].question_id]) item.classList.add('answered');
    });
}

async function submitQuiz() {
    clearInterval(timerInterval);
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let totalScore = 0;
    const answersArray = [];
    questions.forEach(q => {
        const response = answers[q.question_id] || '';
        let correct = false;
        let points = 0;
        if (q.question_type === 'TF' || q.question_type === 'MC') {
            const correctAns = q[`answer_${[1,2,3,4].find(i => q[`answer_${i}`]?.startsWith('*'))}`]?.replace('*', '');
            correct = response === correctAns;
        } else if (q.question_type === 'MR') {
            const correctAns = [1,2,3,4].filter(i => q[`answer_${i}`]?.startsWith('*')).map(i => q[`answer_${i}`].replace('*', ''));
            correct = JSON.stringify(response.sort()) === JSON.stringify(correctAns.sort());
        } else if (q.question_type === 'TI') {
            const correctAns = [1,2,3,4].filter(i => q[`answer_${i}`]?.startsWith('*')).map(i => q[`answer_${i}`].replace('*', ''));
            correct = correctAns.some(ans => ans.toLowerCase() === response.toLowerCase());
        } else if (q.question_type === 'MG') {
            const pairs = q.answer_1.split('|');
            correct = pairs.every((pair, i) => pair.split('|')[1] === response[i]);
        } else if (q.question_type === 'SEQ') {
            const correctOrder = [q.answer_1, q.answer_2, q.answer_3, q.answer_4];
            correct = JSON.stringify(response) === JSON.stringify(correctOrder);
        } else if (q.question_type === 'NUMG') {
            const correctAns = q.answer_1.replace('*', '');
            correct = response == correctAns;
        }
        if (correct) {
            points = parseInt(q.points);
            totalScore += points;
        }
        answersArray.push({
            question_id: q.question_id,
            response: response,
            correct: correct,
            points: points.toString()
        });
    });

    const status = totalScore >= (questions.length * 10 * 0.8) ? 'Memenuhi KKTP' : 'Tidak Memenuhi KKTP';

    const scoreData = {
        student_id: currentStudent.student_id,
        answers: answersArray,
        total_score: totalScore.toString(),
        duration: durationStr,
        status: status
    };

    const scoresRef = ref(db, 'scores');
    await push(scoresRef, scoreData);

    localStorage.setItem('scoreData', JSON.stringify(scoreData));
    window.location.href = 'results.html';
}

// Results page
if (document.getElementById('results-container')) {
    const scoreData = JSON.parse(localStorage.getItem('scoreData'));
    currentStudent = JSON.parse(localStorage.getItem('student'));
    questions = JSON.parse(localStorage.getItem('questions'));

    document.getElementById('absen').textContent = currentStudent.absen;
    document.getElementById('nis').textContent = currentStudent.nis;
    document.getElementById('name').textContent = currentStudent.name;
    document.getElementById('class').textContent = currentStudent.class;
    document.getElementById('score').textContent = scoreData.total_score;
    document.getElementById('duration').textContent = scoreData.duration;
    document.getElementById('status').textContent = scoreData.status;

    if (parseInt(scoreData.total_score) >= (questions.length * 10 * 0.8)) {
        confetti();
    }

    document.getElementById('reviewBtn').addEventListener('click', () => {
        const container = document.getElementById('reviewContainer');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
        if (container.style.display === 'block') {
            renderReview();
        }
    });
}

function renderReview() {
    const container = document.getElementById('reviewContainer');
    container.innerHTML = '';
    questions.forEach((q, index) => {
        const ans = scoreData.answers.find(a => a.question_id === q.question_id);
        let html = `<div class="review-question">`;
        html += `<h4>Soal ${index + 1}</h4>`;
        if (q.question_text) html += `<p>${q.question_text}</p>`;
        html += `<p>Jawaban Anda: ${Array.isArray(ans.response) ? ans.response.join(', ') : ans.response}</p>`;
        html += `<p class="${ans.correct ? 'correct' : 'incorrect'}">${ans.correct ? 'Benar' : 'Salah'}</p>`;
        html += `<p>Points: ${ans.points}</p>`;
        html += `</div>`;
        container.innerHTML += html;
    });
}