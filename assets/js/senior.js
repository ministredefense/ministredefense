const SENIOR_API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=senior';
const POINTS_API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=points';

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("seniorList");
    const loader = document.getElementById("loader");
    const modal = document.getElementById("infoModal");
    const modalClose = document.getElementById("modalClose");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const themeSlider = document.getElementById('themeSlider');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const overlay = document.getElementById('overlay');
    const searchInput = document.getElementById('searchInput');

    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeSlider.checked = (theme === 'dark');
    }
    setTheme(localStorage.getItem('theme') || 'light');
    themeSlider.addEventListener('change', () => setTheme(themeSlider.checked ? 'dark' : 'light'));

    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", e => e.target === modal && closeModal());
    document.addEventListener("keydown", e => e.key === "Escape" && closeModal());

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        searchInput.focus();
    }
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        searchInput.value = '';
    }
    hamburger.addEventListener('click', () => sidebar.classList.contains('active') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);

    function declOfNum(n, text_forms) {
        n = Math.abs(n) % 100;
        const n1 = n % 10;
        if (n > 10 && n < 20) return text_forms[2];
        if (n1 > 1 && n1 < 5) return text_forms[1];
        if (n1 === 1) return text_forms[0];
        return text_forms[2];
    }

    const normalize = (s) => (s || '').trim().toLowerCase().replace(/_/g, ' ');

    async function loadData() {
        try {
            const [seniorRes, pointsRes] = await Promise.all([
                fetch(SENIOR_API_URL, { cache: "no-store" }),
                fetch(POINTS_API_URL, { cache: "no-store" })
            ]);
            const seniorData = await seniorRes.json();
            const pointsData = await pointsRes.json();

            const pointsMap = new Map();
            if (Array.isArray(pointsData)) {
                pointsData.forEach(user => {
                    let total = 0;
                    if (user.bases) {
                        Object.values(user.bases).forEach(logs => {
                            logs.forEach(log => {
                                const p = parseInt(log.points) || 0;
                                const action = (log.action || '').trim().toLowerCase();
                                if (action === 'выдал') total += p;
                                else if (action === 'снял') total -= p;
                            });
                        });
                    }
                    (user.nicknames || []).forEach(nick => {
                        pointsMap.set(normalize(nick), total);
                    });
                });
            }

            if (Array.isArray(seniorData)) {
                seniorData.forEach(fr => {
                    fr.staff.forEach(m => {
                        const key = normalize(m.nickname);
                        if (pointsMap.has(key)) {
                            m.points = pointsMap.get(key);
                        } else {
                            m.points = parseInt(m.points) || 0;
                        }
                    });
                });
            }

            hideLoader();
            renderList(seniorData);
        } catch (err) {
            list.innerHTML = `<div style="padding:18px; text-align:center; color:#e74c3c;">Ошибка данных</div>`;
            console.error(err);
        }
    }

    function renderList(data) {
        if (!Array.isArray(data)) return;
        list.innerHTML = "";
        data.forEach(fraction => {
            const block = document.createElement("div");
            block.className = "fraction-block";
            block.innerHTML = `<div class="fraction-title">${escape(fraction.fraction)}</div>`;
            const grid = document.createElement("div");
            grid.className = "staff-grid";
            fraction.staff.forEach(member => {
                const warnsCount = (member.warns || []).length;
                const pts = member.points || 0;
                const card = document.createElement("div");
                card.className = "staff-card";
                card.innerHTML = `
                    <div class="staff-nickname">${escape(member.nickname)}</div>
                    <div class="card-footer">
                        <div class="points-label">${pts} ${declOfNum(pts, ["балл", "балла", "баллов"])}</div>
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
        const warnsHTML = warns.length === 0
            ? '<div class="warn-no-warns">Выговоров нет</div>'
            : warns.map(w => `<div class="warn-item"><div class="warn-text">${escape(w.text)}</div><div class="warn-proof">${w.proof && w.proof.includes('<') ? w.proof : `<a href="${escape(w.proof)}" target="_blank">${escape(w.proof)}</a>`}</div></div>`).join('');
        modalBody.innerHTML = `<strong style="display:block; margin:20px 0 12px; font-size:15px; color:var(--color-primary);">Выговоры:</strong>${warnsHTML}`;
        modal.classList.add("active");
    }

    function closeModal() { modal.classList.remove("active"); }
    function hideLoader() { loader.style.display = "none"; }
    function escape(s) { return s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "—"; }

    loadData();
});
