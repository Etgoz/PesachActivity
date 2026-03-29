let teamData = {};
let familyData = {};
let currentMode = localStorage.getItem('pesachMode') || 'team'; // 'team' or 'family'

let currentCategory = "";
let currentLevel = "";
let lastQuestions = {}; // To prevent back-to-back repeats

async function loadData() {
    try {
        const [teamRes, familyRes] = await Promise.all([
            fetch('TeamQuestions.json'),
            fetch('FamilyQuestions.json')
        ]);

        const teamJson = await teamRes.json();
        const familyJson = await familyRes.json();

        teamJson.categories.forEach(cat => {
            teamData[cat.title] = {
                id: cat.id,
                description: cat.description,
                shallow: cat.shallow,
                deep: cat.deep
            };
        });

        familyJson.categories.forEach(cat => {
            familyData[cat.title] = {
                id: cat.id,
                description: cat.description,
                shallow: cat.shallow,
                deep: cat.deep
            };
        });

        initUI();
        initGrid();
    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('main-grid').innerHTML = '<p style="text-align:center;width:100%;">שגיאה בטעינת הנתונים. אנא נסו שוב.</p>';
    }
}

function initUI() {
    const toggle = document.getElementById('mode-toggle');
    toggle.checked = (currentMode === 'family');
    updateModeUI();
}

function updateModeUI() {
    const isFamily = (currentMode === 'family');
    document.getElementById('label-team').classList.toggle('active', !isFamily);
    document.getElementById('label-family').classList.toggle('active', isFamily);
    
    const subtitle = document.getElementById('mode-subtitle');
    subtitle.innerText = isFamily ? "רגע של חיבור לכל המשפחה" : "פעילות גיבוש לצוות";
}

function initGrid() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';
    
    const activeData = (currentMode === 'team' ? teamData : familyData);
    const inactiveData = (currentMode === 'team' ? familyData : teamData);

    Object.keys(activeData).forEach((catTitle, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const catActive = activeData[catTitle];
        const catInactive = inactiveData[catTitle];

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <h3>${catTitle}</h3>
                    <h4>${catActive.description}</h4>
                    <div class="btn-group">
                        <button class="btn-shallow" onclick="openQuestion('${catTitle}', 'shallow')">קליל</button>
                        <button class="btn-deep" onclick="openQuestion('${catTitle}', 'deep')">עמוק</button>
                    </div>
                </div>
                <div class="card-back">
                    <h3>${catTitle}</h3>
                    <h4>${catInactive.description}</h4>
                    <div class="btn-group">
                        <button class="btn-shallow" onclick="openQuestion('${catTitle}', 'shallow')">קליל</button>
                        <button class="btn-deep" onclick="openQuestion('${catTitle}', 'deep')">עמוק</button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function toggleMode() {
    currentMode = (currentMode === 'team' ? 'family' : 'team');
    localStorage.setItem('pesachMode', currentMode);
    
    updateModeUI();

    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Wavy effect: stagger the flip
        setTimeout(() => {
            card.classList.toggle('flipped');
            
            // After flip finishes, we might want to ensure buttons work for new mode
            // Actually, because we flipped the WHOLE card and both sides have buttons,
            // we should make sure the buttons on the "now visible" side are the ones being clicked.
            // In our HTML structure, both card-front and card-back have identical buttons
            // but the logic relies on `currentMode`.
        }, index * 60);
    });

    // If overlay is open, refresh question
    const overlay = document.getElementById('overlay');
    if (overlay.classList.contains('show')) {
        generateQuestion();
    }
}

function openQuestion(cat, level) {
    currentCategory = cat;
    currentLevel = level;

    const levelText = level === 'shallow' ? 'קליל' : 'עמוק';
    document.getElementById('overlay-title').innerText = `${cat} • ${levelText}`;
    generateQuestion();

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    document.getElementById('how-to-play-btn').style.display = 'none';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    });
}

function generateQuestion() {
    const activeData = (currentMode === 'team' ? teamData : familyData);
    const questions = activeData[currentCategory][currentLevel];
    
    let questionText;
    const key = `${currentCategory}-${currentLevel}-${currentMode}`;
    
    // No-repeat logic
    do {
        const randomIdx = Math.floor(Math.random() * questions.length);
        questionText = questions[randomIdx];
    } while (questionText === lastQuestions[key] && questions.length > 1);
    
    lastQuestions[key] = questionText;

    const qElement = document.getElementById('question-text');

    if (document.getElementById('overlay').classList.contains('show')) {
        qElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        qElement.style.opacity = '0';
        qElement.style.transform = 'translateY(10px)';

        setTimeout(() => {
            qElement.innerText = questionText;
            qElement.style.opacity = '1';
            qElement.style.transform = 'translateY(0)';
        }, 200);
    } else {
        qElement.innerText = questionText;
        qElement.style.transition = 'none';
        qElement.style.opacity = '1';
        qElement.style.transform = 'translateY(0)';
    }
}

function closeOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('show');
    document.getElementById('how-to-play-btn').style.display = 'block';

    setTimeout(() => {
        if (!overlay.classList.contains('show')) {
            overlay.style.display = 'none';
        }
    }, 400);
}

function openInstructions() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.style.display = 'flex';
    document.getElementById('how-to-play-btn').style.display = 'none';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    });
}

function closeInstructions() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.classList.remove('show');
    document.getElementById('how-to-play-btn').style.display = 'block';

    setTimeout(() => {
        if (!overlay.classList.contains('show')) {
            overlay.style.display = 'none';
        }
    }, 400);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const qOverlay = document.getElementById('overlay');
        const iOverlay = document.getElementById('instructions-overlay');
        if (qOverlay.classList.contains('show')) closeOverlay();
        if (iOverlay.classList.contains('show')) closeInstructions();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeOverlay();
    if (e.target.id === 'instructions-overlay') closeInstructions();
});

loadData();

