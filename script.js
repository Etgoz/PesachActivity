// =====================
//   State
// =====================
const HOLIDAYS = {
    pesach: {
        id: 'pesach',
        label: 'פסח',
        icon: '🍷',
        teamFile: 'pesach_team.json',
        familyFile: 'pesach_family.json',
        cssClass: '' // default (maroon/gold) theme
    },
    shavuot: {
        id: 'shavuot',
        label: 'שבועות',
        icon: '🌾',
        teamFile: 'shavuot_team.json',
        familyFile: 'shavuot_family.json',
        cssClass: 'shavuot-mode'
    }
};

let activeHoliday = null;  // set on holiday selection
let teamData = {};
let familyData = {};
let currentMode = localStorage.getItem('talkHolidaysMode') || 'team';

let currentCategory = '';
let currentLevel = '';
let lastQuestions = {};

// =====================
//   Navigation
// =====================
function selectHoliday(holidayId) {
    const holiday = HOLIDAYS[holidayId];
    if (!holiday) return;

    activeHoliday = holiday;

    // Update game screen theme
    const gameScreen = document.getElementById('game-screen');
    gameScreen.className = holiday.cssClass;

    // Update title
    document.getElementById('game-title').innerText = `${holiday.icon} מדברים ${holiday.label}`;

    // Show game, hide welcome
    document.getElementById('welcome-screen').style.display = 'none';
    gameScreen.style.display = 'flex';

    loadData(holiday);
}

function goHome() {
    // Close any open overlays
    const qOverlay = document.getElementById('overlay');
    const iOverlay = document.getElementById('instructions-overlay');
    if (qOverlay.classList.contains('show')) forceCloseOverlay(qOverlay);
    if (iOverlay.classList.contains('show')) forceCloseOverlay(iOverlay);

    // Clear grid & state
    document.getElementById('main-grid').innerHTML = '';
    teamData = {};
    familyData = {};
    activeHoliday = null;

    // Restore how-to-play btn visibility
    document.getElementById('how-to-play-btn').style.display = 'block';

    // Switch screens with a smooth fade
    const gameScreen = document.getElementById('game-screen');
    gameScreen.style.opacity = '0';
    gameScreen.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
        gameScreen.style.display = 'none';
        gameScreen.style.opacity = '';
        gameScreen.style.transition = '';

        const welcome = document.getElementById('welcome-screen');
        welcome.style.display = 'flex';
        welcome.style.opacity = '0';
        welcome.style.transition = 'opacity 0.4s ease';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { welcome.style.opacity = '1'; });
        });
        setTimeout(() => { welcome.style.transition = ''; welcome.style.opacity = ''; }, 500);
    }, 300);
}

function forceCloseOverlay(overlay) {
    overlay.classList.remove('show');
    overlay.style.display = 'none';
}

// =====================
//   Data Loading
// =====================
async function loadData(holiday) {
    try {
        const [teamRes, familyRes] = await Promise.all([
            fetch(holiday.teamFile),
            fetch(holiday.familyFile)
        ]);

        const teamJson = await teamRes.json();
        const familyJson = await familyRes.json();

        teamData = {};
        familyData = {};

        teamJson.categories.forEach(cat => {
            teamData[cat.title] = { id: cat.id, description: cat.description, shallow: cat.shallow, deep: cat.deep };
        });

        familyJson.categories.forEach(cat => {
            familyData[cat.title] = { id: cat.id, description: cat.description, shallow: cat.shallow, deep: cat.deep };
        });

        initUI();
        initGrid();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('main-grid').innerHTML = '<p style="text-align:center;width:100%;">שגיאה בטעינת הנתונים. אנא נסו שוב.</p>';
    }
}

// =====================
//   UI Init
// =====================
function initUI() {
    const toggle = document.getElementById('mode-toggle');
    toggle.checked = (currentMode === 'family');
    updateModeUI();
}

function updateModeUI() {
    const isFamily = (currentMode === 'family');
    document.getElementById('label-team').classList.toggle('active', !isFamily);
    document.getElementById('label-family').classList.toggle('active', isFamily);
    document.getElementById('mode-subtitle').innerText = isFamily
        ? 'רגע של חיבור לכל המשפחה'
        : 'פעילות גיבוש לצוות';
}

function initGrid() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = '';

    const activeData = currentMode === 'team' ? teamData : familyData;
    const inactiveData = currentMode === 'team' ? familyData : teamData;

    Object.keys(activeData).forEach((catTitle, index) => {
        const catActive = activeData[catTitle];
        const catInactive = inactiveData[catTitle] || catActive;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.05}s`;

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

// =====================
//   Mode Toggle
// =====================
function toggleMode() {
    currentMode = currentMode === 'team' ? 'family' : 'team';
    localStorage.setItem('talkHolidaysMode', currentMode);

    updateModeUI();

    document.querySelectorAll('.card').forEach((card, index) => {
        setTimeout(() => { card.classList.toggle('flipped'); }, index * 60);
    });

    if (document.getElementById('overlay').classList.contains('show')) {
        generateQuestion();
    }
}

// =====================
//   Question Modal
// =====================
function openQuestion(cat, level) {
    currentCategory = cat;
    currentLevel = level;

    document.getElementById('overlay-title').innerText = `${cat} • ${level === 'shallow' ? 'קליל' : 'עמוק'}`;
    generateQuestion();

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    document.getElementById('how-to-play-btn').style.display = 'none';

    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));
}

function generateQuestion() {
    const activeData = currentMode === 'team' ? teamData : familyData;
    const questions = activeData[currentCategory][currentLevel];
    const key = `${currentCategory}-${currentLevel}-${currentMode}-${activeHoliday ? activeHoliday.id : ''}`;

    let questionText;
    do {
        questionText = questions[Math.floor(Math.random() * questions.length)];
    } while (questionText === lastQuestions[key] && questions.length > 1);

    lastQuestions[key] = questionText;

    const qEl = document.getElementById('question-text');

    if (document.getElementById('overlay').classList.contains('show')) {
        qEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        qEl.style.opacity = '0';
        qEl.style.transform = 'translateY(10px)';
        setTimeout(() => {
            qEl.innerText = questionText;
            qEl.style.opacity = '1';
            qEl.style.transform = 'translateY(0)';
        }, 200);
    } else {
        qEl.innerText = questionText;
        qEl.style.transition = 'none';
        qEl.style.opacity = '1';
        qEl.style.transform = 'translateY(0)';
    }
}

function closeOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('show');
    document.getElementById('how-to-play-btn').style.display = 'block';
    setTimeout(() => { if (!overlay.classList.contains('show')) overlay.style.display = 'none'; }, 400);
}

// =====================
//   Instructions Modal
// =====================
function openInstructions() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.style.display = 'flex';
    document.getElementById('how-to-play-btn').style.display = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));
}

function closeInstructions() {
    const overlay = document.getElementById('instructions-overlay');
    overlay.classList.remove('show');
    document.getElementById('how-to-play-btn').style.display = 'block';
    setTimeout(() => { if (!overlay.classList.contains('show')) overlay.style.display = 'none'; }, 400);
}

// =====================
//   Global Listeners
// =====================
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

// Keyboard support for holiday cards
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('holiday-card')) {
        e.target.click();
    }
});
