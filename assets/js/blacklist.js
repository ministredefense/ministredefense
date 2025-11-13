const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=blacklist';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    const blacklistContainer = document.getElementById('blacklist');
    const modal = document.getElementById('pointModal');
    const closeBtn = document.getElementById('modalClose');
    const themeSlider = document.getElementById('themeSlider');

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeSlider.checked = (theme === 'dark');
    }
    setTheme(localStorage.getItem('theme') || 'light');
    themeSlider.addEventListener('change', () => setTheme(themeSlider.checked ? 'dark' : 'light'));

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', e => e.target === modal && modal.classList.remove('active'));

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data || !Array.isArray(data)) {
            blacklistContainer.innerHTML = '<p style="text-align:center; color:var(--danger);">Ошибка загрузки данных.</p>';
            return;
        }

        data.sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));

        blacklistContainer.innerHTML = '';
        data.forEach(item => blacklistContainer.appendChild(createCard(item)));

    } catch (err) {
        console.error(err);
        blacklistContainer.innerHTML = '<p style="text-align:center; color:var(--danger);">Не удалось загрузить данные.</p>';
    } finally {
        setTimeout(() => loader.classList.add('hidden'), 300);
    }

    function createCard(item) {
        const card = document.createElement('div');
        card.className = 'card';

        const dateIn = formatDate(item.dateIn);
        const dateOut = item.dateOut === '-' ? '<span class="permanent">Навсегда</span>' : formatDate(item.dateOut);

        card.innerHTML = `
            <div class="card-nickname">${escapeHtml(item.nickname)}</div>
            <div class="card-id">Номер аккаунта: ${escapeHtml(item.accountId)}</div>
            <div class="card-date">Попал: ${dateIn}</div>
            <div class="card-date">Выход: ${dateOut}</div>
            <div class="card-reason">${escapeHtml(item.reason)}</div>
        `;

        card.addEventListener('click', () => openModal(item));
        return card;
    }

    function openModal(item) {
        document.getElementById('modalTitle').textContent = item.nickname;
        document.getElementById('modalId').textContent = item.accountId;
        document.getElementById('modalDateIn').textContent = formatDate(item.dateIn);
        document.getElementById('modalDateOut').textContent = item.dateOut === '-' ? 'Навсегда' : formatDate(item.dateOut);
        document.getElementById('modalReason').textContent = item.reason;

        const link = document.getElementById('modalLink');
        const hasLink = item.socialLink && item.socialLink.trim() && item.socialLink !== '—' && item.socialLink.startsWith('http');
        link.href = hasLink ? item.socialLink : '#';
        link.textContent = hasLink ? 'Перейти в профиль' : 'Ссылка отсутствует';
        link.style.pointerEvents = hasLink ? 'auto' : 'none';
        link.style.opacity = hasLink ? '1' : '0.5';

        modal.classList.add('active');
    }

    function formatDate(isoString) {
        if (!isoString || isoString === '-') return '—';
        const date = new Date(isoString);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
