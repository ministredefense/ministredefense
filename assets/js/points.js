const SENIOR_API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=senior';
const POINTS_API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=points';

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("seniorList");
    const loader = document.getElementById("loader");
    const modal = document.getElementById("infoModal");
    const modalClose = document.getElementById("modalClose");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    // --- Управление темой ---
    const themeSlider = document.getElementById('themeSlider');
    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeSlider) themeSlider.checked = (theme === 'dark');
    }
    setTheme(localStorage.getItem('theme') || 'light');
    if (themeSlider) {
        themeSlider.addEventListener('change', () => setTheme(themeSlider.checked ? 'dark' : 'light'));
    }

    // --- Модальное окно ---
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", e => e.target === modal && closeModal());
    document.addEventListener("keydown", e => e.key === "Escape" && closeModal());

    // --- Загрузка данных ---
    async function loadData() {
        try {
            const [seniorRes, pointsRes] = await Promise.all([
                fetch(SENIOR_API_URL, { cache: "no-store" }),
                fetch(POINTS_API_URL, { cache: "no-store" })
            ]);
            
            const seniorData = await seniorRes.json();
            const pointsData = await pointsRes.json();
            
            if (loader) loader.style.display = "none";
            renderList(seniorData, pointsData);
        } catch (err) {
            list.innerHTML = `<div style="padding:18px; text-align:center; color:#e74c3c;">Ошибка связи с базой</div>`;
            console.error(err);
        }
    }

    // Правильное склонение
    function getPointsWord(num) {
        const n = Math.abs(num);
        const last = n % 10;
        const lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return "баллов";
        if (last === 1) return "балл";
        if (last >= 2 && last <= 4) return "балла";
        return "баллов";
    }

    function renderList(seniorData, pointsData) {
        if (!Array.isArray(seniorData)) return;
        list.innerHTML = "";

        seniorData.forEach(fraction => {
            const block = document.createElement("div");
            block.className = "fraction-block";

            const title = document.createElement("div");
            title.className = "fraction-title";
            title.textContent = fraction.fraction;
            block.appendChild(title);

            const grid = document.createElement("div");
            grid.className = "staff-grid";

            fraction.staff.forEach(member => {
                // СЧИТАЕМ БАЛЛЫ С НУЛЯ ПО ИСТОРИИ
                let totalPoints = 0;
                const memberNick = member.nickname.trim().toLowerCase();

                if (Array.isArray(pointsData)) {
                    pointsData.forEach(entry => {
                        // Проверяем, совпадает ли ник в записи истории с ником в карточке
                        const entryNick = (entry.nickname || entry.name || entry['Никнейм'] || "").trim().toLowerCase();
                        
                        if (entryNick === memberNick) {
                            const pts = parseInt(entry.points || entry['Баллы'] || 0);
                            const action = String(entry.action || entry['Действие'] || "").trim().toLowerCase();
                            
                            if (action === "выдал") {
                                totalPoints += pts;
                            } else if (action === "снял") {
                                totalPoints -= pts;
                            }
                        }
                    });
                }

                const warnsCount = (member.warns || []).length;
                const card = document.createElement("div");
                card.className = "staff-card";
                card.innerHTML = `
                    <div class="staff-nickname">${member.nickname}</div>
                    <div class="card-footer">
                        <div class="points-label">${totalPoints} ${getPointsWord(totalPoints)}</div>
                        <div class="warn-label ${warnsCount === 0 ? 'zero' : ''}">${warnsCount}</div>
                    </div>
                    <a href="${member.vk || '#'}" class="vk-link" target="_blank" onclick="event.stopPropagation()">
                        <img class="vk-icon light" src="assets/icons/vk-light.png" alt="VK">
                        <img class="vk-icon dark" src="assets/icons/vk-dark.png" alt="VK">
                    </a>
                `;

                card.addEventListener("click", () => openModal(member));
                grid.appendChild(card);
            });

            block.appendChild(grid);
            list.appendChild(block);
        });
    }

    function openModal(member) {
        modalTitle.textContent = member.nickname;
        const warns = member.warns || [];
        modalBody.innerHTML = `
            <strong style="display:block; margin:20px 0 12px; font-size:15px; color:var(--color-primary);">Выговоры:</strong>
            ${warns.length === 0 ? '<div class="warn-no-warns">Чист</div>' : warns.map(w => `
                <div class="warn-item">
                    <div class="warn-text">${w.text}</div>
                    <div class="warn-proof"><a href="${w.proof}" target="_blank">${w.proof}</a></div>
                </div>
            `).join('')}
        `;
        modal.classList.add("active");
    }

    function closeModal() { modal.classList.remove("active"); }

    loadData();
});
