const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=leaders';

const LEADER_IMAGES = {
    "Сухопутные Войска": "ground.jpg",
    "Военно Воздушные Силы": "air.jpg",
    "Военно Морской Флот": "navy.jpg"
};

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("leadersList");
    const loader = document.getElementById("loader");
    const themeSlider = document.getElementById("themeSlider");
    const modal = document.getElementById("infoModal");
    const modalClose = document.getElementById("modalClose");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const searchInput = document.getElementById('searchInput');
    const menuList = document.getElementById('menuList');
    const menuItems = menuList.querySelectorAll('li');
    const noResults = document.getElementById('noResults');

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
        filterMenu('');
    }
    hamburger.addEventListener('click', () => sidebar.classList.contains('active') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && sidebar.classList.contains('active')) closeSidebar(); 
    });

    initTheme();
    loadData();

    themeSlider.addEventListener("change", toggleTheme);
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", e => e.target === modal && closeModal());
    document.addEventListener("keydown", e => e.key === "Escape" && closeModal());

    async function loadData() {
        try {
            const res = await fetch(API_URL, { cache: "no-store" });
            const data = await res.json();
            hideLoader();
            renderList(data);
        } catch {
            list.innerHTML = `<div style="padding:18px; text-align:center; color:#e74c3c;">Ошибка загрузки данных</div>`;
        }
    }

    function renderList(data) {
        if (!Array.isArray(data)) return;
        list.innerHTML = "";

        data.forEach((l, i) => {
            const fractionName = (l.fraction || "").trim();
            const filename = LEADER_IMAGES[fractionName] || "default.jpg";
            const img = `assets/images/leaders/${filename}`;

            const card = document.createElement("div");
            card.className = "leader-row";
            if (i === 2) card.style.margin = "0 auto";

            const warnsCount = countWarns(l.warns);
            const warnClass = warnsCount === 0 ? "warn-count zero" : "warn-count";

            card.innerHTML = `
                <img class="leader-img" src="${img}" alt="${escape(l.name)}"
                     onerror="this.src='assets/images/leaders/default.jpg'">

                <div class="leader-info">
                    <div class="leader-name">${escape(l.name)}</div>
                    <div class="leader-extra">${escape(l.fraction)}</div>

                    <div class="more-info">
                        <div><strong>Дата назначения:</strong></div><div>${formatDate(l.date)}</div>
                        <div><strong>Баллы:</strong></div><div>${escape(l.points)}</div>
                        <div><strong>Мороз:</strong></div><div>${formatFreeze(l.freeze)}</div>
                        <div><strong>Доп. мороз:</strong></div><div>${formatFreeze(l.freezePoints)}</div>
                        <div><strong>Предупреждения:</strong></div>
                        <div><span class="${warnClass}">${warnsCount}</span></div>
                    </div>
                </div>

                <a href="${l.vk || '#'}" class="vk-link" target="_blank" onclick="event.stopPropagation()">
                    <img class="vk-icon light" src="assets/icons/vk-light.png" alt="VK">
                    <img class="vk-icon dark" src="assets/icons/vk-dark.png" alt="VK">
                </a>
            `;

            card.addEventListener("click", () => openModal(l, img));
            list.appendChild(card);
        });
    }

    function openModal(l, img) {
        modalTitle.textContent = l.name;
        modalBody.innerHTML = `
            <div class="modal-info-block">
                <img src="${img}" class="modal-info-img" alt="${escape(l.name)}"
                     onerror="this.src='assets/images/leaders/default.jpg'">
                <div class="modal-info-text">
                    <div><strong>Фракция:</strong> ${escape(l.fraction)}</div>
                    <div><strong>Дата назначения:</strong> ${formatDate(l.date)}</div>
                    <div><strong>Баллы:</strong> ${escape(l.points)}</div>
                    <div><strong>Мороз:</strong> ${formatFreeze(l.freeze)}</div>
                </div>
            </div>

            <hr style="margin:20px 0; border:none; border-top:1px solid var(--border);">

            <strong style="display:block; margin-bottom:10px; font-size:15px; color:var(--color-primary);">Предупреждения:</strong>

            <div class="warn-chips">
                ${formatWarnsAsChips(l.warns)}
            </div>
        `;
        modal.classList.add("active");
    }

    function closeModal() {
        modal.classList.remove("active");
    }

    function hideLoader() {
        loader.style.display = "none";
    }

    function toggleTheme() {
        const dark = themeSlider.checked;
        document.body.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("theme", dark ? "dark" : "light");
    }

    function initTheme() {
        const dark = localStorage.getItem("theme") === "dark";
        document.body.setAttribute("data-theme", dark ? "dark" : "light");
        themeSlider.checked = dark;
    }

    function escape(s) {
        return String(s || "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function countWarns(arr) {
        if (!arr) return 0;
        if (!Array.isArray(arr)) return parseFloat(arr) || 0;
        return arr.reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
    }

    function formatWarnsAsChips(arr) {
        if (!arr || (Array.isArray(arr) && arr.length === 0)) {
            return '<span class="warn-no-warns">Предупреждений нет</span>';
        }

        if (!Array.isArray(arr)) {
            const val = parseFloat(arr);
            return `<span class="warn-chip ${val === 0 ? 'zero' : ''}">${val}</span>`;
        }

        return arr
            .filter(w => w != null && !isNaN(parseFloat(w)))
            .map(w => {
                const val = parseFloat(w);
                return `<span class="warn-chip ${val === 0 ? 'zero' : ''}">${val}</span>`;
            })
            .join('');
    }

    function formatFreeze(f) {
        if (!f || f === "-" || f === "0") return "Мороз доступен";
        return `Мороз до: ${formatDate(f)}`;
    }

    function formatDate(d) {
        if (!d) return "—";
        const cleaned = String(d).replace(/T.*$/, '');
        const [day, month, year] = cleaned.split('-');
        if (!day || !month || !year) return "—";
        return `${day.padStart(2, '0')}-${month}-${year}`;
    }
});
