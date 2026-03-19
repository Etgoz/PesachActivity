let data = {};

let currentCategory = "";
let currentLevel = "";

async function loadData() {
    try {
        const response = await fetch('questions.json');
        const json = await response.json();

        json.categories.forEach(cat => {
            data[cat.title] = {
                shallow: cat.shallow,
                deep: cat.deep
            };
        });

        init();
    } catch (error) {
        console.error("Error loading questions.json:", error);
        document.getElementById('main-grid').innerHTML = '<p style="text-align:center;width:100%;">שגיאה בטעינת הנתונים. אנא נסו שוב.</p>';
    }
}

function init() {
    const grid = document.getElementById('main-grid');
    Object.keys(data).forEach((cat, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        // Staggered animation effect
        card.style.animationDelay = `${index * 0.08}s`;
        card.innerHTML = `
            <h3>${cat}</h3>
            <div class="btn-group">
                <button class="btn-shallow" onclick="openQuestion('${cat}', 'shallow')">קליל</button>
                <button class="btn-deep" onclick="openQuestion('${cat}', 'deep')">עמוק</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openQuestion(cat, level) {
    currentCategory = cat;
    currentLevel = level;

    const levelText = level === 'shallow' ? 'קליל' : 'עמוק';
    document.getElementById('overlay-title').innerText = `${cat} • ${levelText}`;
    generateQuestion();

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';

    // Small delay to ensure display: flex applies before animating opacity
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    });
}

function generateQuestion() {
    const questions = data[currentCategory][currentLevel];
    const randomIdx = Math.floor(Math.random() * questions.length);
    const questionText = questions[randomIdx];

    const qElement = document.getElementById('question-text');

    // Add fade out-in effect when generating a new question while overlay is open
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

    // Wait for CSS transition (0.4s) before hiding
    setTimeout(() => {
        if (!overlay.classList.contains('show')) {
            overlay.style.display = 'none';
        }
    }, 400);
}

// Close overlay on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('overlay');
        if (overlay.classList.contains('show')) {
            closeOverlay();
        }
    }
});

// Close overlay if clicking outside question box
document.getElementById('overlay').addEventListener('click', (e) => {
    if (e.target.id === 'overlay') {
        closeOverlay();
    }
});

loadData();
