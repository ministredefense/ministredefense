const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=reprimands';

const BASE_FULL_NAMES = {
    'СВ': 'Сухопутные войска',
    'ВВС': 'Военно-воздушные силы',
    'ВМФ': 'Военно-морской флот'
};

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    const reprimandsContainer = document.getElementById('reprimands');
    const modal = document.getElementById('pointModal');
    const closeBtn = document.getElementById('modalClose');

    const themeSlider = document.getElementById('themeSlider');
    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeSlider.checked = (theme === 'dark');
    }
    setTheme(localStorage.getItem('theme') || 'light');
    themeSlider.addEventListener('change', () => {
        setTheme(themeSlider.checked ? 'dark' : 'light');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data || !Array.isArray(data)) {
            reprimandsContainer.innerHTML = '<p style="text-align:center; color:var(--danger);">Ошибка загрузки данных.</p>';
            return;
        }

        data.sort((a, b) => b.reprimands.length - a.reprimands.length);

        reprimandsContainer.innerHTML = '';
        data.forEach(item => {
            const card = createCard(item);
            reprimandsContainer.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        reprimandsContainer.innerHTML = '<p style="text-align:center; color:var(--danger);">Не удалось загрузить данные.</p>';
    } finally {
        setTimeout(() => loader.classList.add('hidden'), 300);
    }
});

function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card';

    const count = item.reprimands.length;
    const badgeColor = count >= 3 ? 'var(--danger)' : count >= 2 ? '#ff9f1c' : 'var(--color-primary)';
    const fullBase = BASE_FULL_NAMES[item.base] || item.base;

    card.innerHTML = `
        <div class="card-nickname">${escapeHtml(item.nickname)}</div>
        <div class="card-base">База: <strong>${escapeHtml(fullBase)}</strong></div>
        <div class="card-id">Номер аккаунта: ${escapeHtml(item.accountId)}</div>
        <div class="card-count" style="margin-top: 8px;">
            <span style="color: ${badgeColor}; font-weight: 600;">
                Выговоров: ${count}
            </span>
        </div>
    `;

    card.addEventListener('click', () => openModal(item));
    return card;
}

function openModal(item) {
    const fullBase = BASE_FULL_NAMES[item.base] || item.base;

    document.getElementById('modalTitle').textContent = item.nickname;
    document.getElementById('modalBase').textContent = fullBase;
    document.getElementById('modalId').textContent = item.accountId;
    document.getElementById('modalCount').textContent = item.reprimands.length;

    const listContainer = document.getElementById('modalReprimandsList');

    listContainer.innerHTML = `
        <strong style="color: var(--color-primary); display: block; margin-bottom: 8px;">
            Список выговоров:
        </strong>
        <ul style="margin: 0; padding-left: 20px; list-style: disc; color: var(--font-color);">
            ${item.reprimands.map(rep => {
                const isValidProof = rep.proof && 
                                    rep.proof.trim() !== '' && 
                                    rep.proof !== 'док-ва выговора' && 
                                    rep.proof.startsWith('http');

                const proofPart = isValidProof
                    ? ` — <a href="${rep.proof}" target="_blank" style="color: var(--color-accent); text-decoration: underline;">доказательство</a>`
                    : '';

                return `<li style="margin: 6px 0;">${escapeHtml(rep.text)}${proofPart}</li>`;
            }).join('')}
        </ul>
    `;

    document.getElementById('pointModal').classList.add('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
