/* --- ESTADO E DADOS --- */
const defaultSubjects = [
    { id: 'portugues', name: 'Português', icon: 'fa-book' },
    { id: 'matematica', name: 'Matemática', icon: 'fa-calculator' },
    { id: 'fisica', name: 'Física', icon: 'fa-atom' },
    { id: 'quimica', name: 'Química', icon: 'fa-flask' },
    { id: 'biologia', name: 'Biologia', icon: 'fa-dna' },
    { id: 'ingles', name: 'Inglês', icon: 'fa-flag-usa' },
];

// Estrutura Inicial do Usuário
let userState = {
    streak: 0,
    lastStudyDate: null,
    dailyGoal: 5, // Número de exercícios por dia
    todayCount: 0,
    data: {} // Onde ficam as questões e notas
};

// Inicializa ou carrega do LocalStorage
function initApp() {
    const saved = localStorage.getItem('eamStudyState');
    if (saved) {
        userState = JSON.parse(saved);
    } else {
        // Popula estrutura vazia para cada matéria
        defaultSubjects.forEach(sub => {
            userState.data[sub.id] = { questions: [], notes: [] };
        });
        saveState();
    }
    
    checkStreak();
    renderHome();
    updateUI();
}

function saveState() {
    localStorage.setItem('eamStudyState', JSON.stringify(userState));
    updateUI();
}

/* --- LÓGICA DE GAMIFICAÇÃO --- */
function checkStreak() {
    const today = new Date().toDateString();
    if (userState.lastStudyDate !== today) {
        // Se a data for diferente, resetamos o contador diário (mas não o streak ainda)
        userState.todayCount = 0;
        
        // Lógica simples de quebra de streak (se passou mais de 1 dia)
        // (Aqui poderia ser mais robusto com datas reais)
    }
}

function updateDailyProgress() {
    userState.todayCount++;
    userState.lastStudyDate = new Date().toDateString();
    
    // Se bateu a meta
    if (userState.todayCount === userState.dailyGoal) {
        userState.streak++;
        fireConfetti();
        alert("🎉 Meta diária batida! +1 dia de ofensiva!");
    }
    saveState();
}

function fireConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

function updateUI() {
    // Atualiza Streak
    document.getElementById('streak-display').innerText = userState.streak;
    
    // Atualiza Barra de Progresso Diária
    const pct = Math.min((userState.todayCount / userState.dailyGoal) * 100, 100);
    document.getElementById('daily-progress').style.width = pct + '%';
    
    const btn = document.getElementById('btn-daily-start');
    if (pct >= 100) {
        btn.innerText = "META CONCLUÍDA ✓";
        btn.style.backgroundColor = "var(--green)";
        btn.style.boxShadow = "0 4px 0 var(--green-dark)";
    } else {
        btn.innerText = "INICIAR ESTUDOS DO DIA";
        btn.style.backgroundColor = "var(--navy)";
    }
}

/* --- NAVEGAÇÃO --- */
let currentSubject = null;

function navigate(viewId) {
    document.querySelectorAll('main > section').forEach(el => {
        el.classList.add('hidden-view');
        el.classList.remove('active-view');
    });
    
    if (viewId === 'home') {
        document.getElementById('view-home').classList.remove('hidden-view');
        document.getElementById('view-home').classList.add('active-view');
        renderHome();
    } else if (viewId === 'subject') {
        document.getElementById('view-subject').classList.remove('hidden-view');
        document.getElementById('view-subject').classList.add('active-view');
    } else if (viewId === 'study') {
        document.getElementById('view-study').classList.remove('hidden-view');
        document.getElementById('view-study').classList.add('active-view');
    }
}

/* --- RENDERIZAÇÃO --- */
function renderHome() {
    const grid = document.querySelector('.subjects-grid');
    grid.innerHTML = '';
    
    defaultSubjects.forEach(sub => {
        const count = userState.data[sub.id].questions.length + userState.data[sub.id].notes.length;
        
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => openSubject(sub.id);
        card.innerHTML = `
            <div class="subject-icon"><i class="fas ${sub.icon}"></i></div>
            <h4>${sub.name}</h4>
            <small style="color:#aaa">${count} itens</small>
        `;
        grid.appendChild(card);
    });
}

function openSubject(id) {
    currentSubject = id;
    const subName = defaultSubjects.find(s => s.id === id).name;
    document.getElementById('subject-title').innerText = subName;
    document.getElementById('modal-subject-name').innerText = subName;
    
    renderSubjectContent();
    navigate('subject');
}

function renderSubjectContent() {
    const list = document.getElementById('subject-content-list');
    list.innerHTML = '';
    
    const items = [...userState.data[currentSubject].notes, ...userState.data[currentSubject].questions];
    
    if (items.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#aaa; margin-top:20px;">Nenhum conteúdo adicionado ainda.</p>';
        return;
    }

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.padding = "15px";
        div.style.borderBottom = "1px solid #eee";
        
        if (item.type === 'question') {
            div.innerHTML = `<b>Questão:</b> ${item.text.substring(0, 40)}...`;
        } else {
            div.innerHTML = `<b>Resumo:</b> ${item.title}`;
        }
        list.appendChild(div);
    });
}

/* --- ADICIONAR CONTEÚDO --- */
let currentAddType = 'question';

function openAddModal() {
    document.getElementById('modal-add').classList.remove('hidden');
    setAddType('question');
}

function closeAddModal() {
    document.getElementById('modal-add').classList.add('hidden');
    // Limpar campos...
}

function setAddType(type) {
    currentAddType = type;
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    // Estilo simples de toggle (pode ser melhorado no CSS)
    
    if (type === 'question') {
        document.getElementById('form-question').classList.remove('hidden');
        document.getElementById('form-note').classList.add('hidden');
    } else {
        document.getElementById('form-question').classList.add('hidden');
        document.getElementById('form-note').classList.remove('hidden');
    }
}

function saveContent() {
    const subjectData = userState.data[currentSubject];
    
   if (currentAddType === 'question') {
    const q = {
        type: 'question',
        text: document.getElementById('inp-q-text').value,
        options: {
            a: document.getElementById('inp-q-a').value,
            b: document.getElementById('inp-q-b').value,
            c: document.getElementById('inp-q-c').value,
            d: document.getElementById('inp-q-d').value,
        },
        correct: document.getElementById('inp-q-correct').value,
        explanation: document.getElementById('inp-q-explanation').value
    };

    // 🔥 AUTO-DETECÇÃO DO GABARITO NO TEXTO
    const autoMatch = q.text.match(/(resposta|gabarito|correta)\s*[:\-]?\s*([abcd])/i);

    if (autoMatch) {
        q.correct = autoMatch[2].toLowerCase();
    }

    if(!q.text || !q.options.a)
        return alert("Preencha os campos!");

    userState.data[currentSubject].questions.push(q);
}else {
        const n = {
            type: 'note',
            title: document.getElementById('inp-n-title').value,
            body: document.getElementById('inp-n-text').value
        };
        if(!n.title) return alert("Preencha o título!");
        subjectData.notes.push(n);
    }
    
    saveState();
    closeAddModal();
    renderSubjectContent();
    alert("Salvo com sucesso!");
}

/* --- MODO ESTUDO (A Lógica Principal) --- */
let studyQueue = [];
let currentQuestionIndex = 0;

function startSubjectStudy() {
    // Pega questões dessa matéria
    const qs = userState.data[currentSubject].questions;
    if (qs.length === 0) return alert("Adicione questões primeiro!");
    
    // Embaralha e seleciona
    studyQueue = qs.sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuestionIndex = 0;
    
    navigate('study');
    showQuestion();
}

// Botão "Iniciar Estudos do Dia" (Pega de todas as matérias)
document.getElementById('btn-daily-start').onclick = () => {
    let allQs = [];
    defaultSubjects.forEach(sub => {
        allQs = [...allQs, ...userState.data[sub.id].questions];
    });
    
    if (allQs.length === 0) return alert("Você precisa adicionar questões em alguma matéria primeiro!");
    
    studyQueue = allQs.sort(() => 0.5 - Math.random()).slice(0, 10); // Meta diária sugerida
    currentQuestionIndex = 0;
    navigate('study');
    showQuestion();
};

function showQuestion() {
    if (currentQuestionIndex >= studyQueue.length) {
        // Fim da sessão
        fireConfetti();
        alert("Sessão concluída!");
        navigate('home');
        return;
    }
    
    const q = studyQueue[currentQuestionIndex];
    const container = document.getElementById('study-container');
    const feedback = document.getElementById('feedback-area');
    feedback.classList.add('hidden'); // Esconde feedback anterior
    feedback.className = 'feedback-area hidden'; // Reseta classes de cor

    // Atualiza barra de progresso da sessão
    const pct = (currentQuestionIndex / studyQueue.length) * 100;
    document.getElementById('study-progress-bar').style.width = pct + '%';

    container.innerHTML = `
        <div class="question-card">${q.text}</div>
        <button class="option-btn" onclick="checkAnswer('a', '${q.correct}')">A) ${q.options.a}</button>
        <button class="option-btn" onclick="checkAnswer('b', '${q.correct}')">B) ${q.options.b}</button>
        <button class="option-btn" onclick="checkAnswer('c', '${q.correct}')">C) ${q.options.c}</button>
        <button class="option-btn" onclick="checkAnswer('d', '${q.correct}')">D) ${q.options.d}</button>
    `;
}

function checkAnswer(selected, correct) {
    const feedback = document.getElementById('feedback-area');
    const title = document.getElementById('feedback-title');
    const text = document.getElementById('feedback-text');
    const q = studyQueue[currentQuestionIndex];
    
    feedback.classList.remove('hidden');
    
    if (selected === correct) {
        feedback.classList.add('correct');
        title.innerText = "Correto!";
        // Som de acerto (opcional)
        updateDailyProgress(); // Soma na meta global
    } else {
        feedback.classList.add('wrong');
        title.innerText = "Incorreto...";
    }
    
    text.innerText = q.explanation || `A resposta certa era a letra ${correct.toUpperCase()}.`;
    
    document.getElementById('btn-next-question').onclick = () => {
        currentQuestionIndex++;
        showQuestion();
    };
}

// Inicializar
initApp();