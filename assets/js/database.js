const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=database';

document.addEventListener("DOMContentLoaded", () => {
    const databaseList = document.getElementById("databaseList");
    const loader = document.getElementById("loader");
    const modal = document.getElementById("infoModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    const modalClose = document.getElementById("modalClose");

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

    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", e => e.target === modal && closeModal());
    document.addEventListener("keydown", e => e.key === "Escape" && closeModal());

    async function loadDatabase() {
        try {
            const res = await fetch(API_URL, { cache: "no-store" });
            const database = await res.json();
            hideLoader();
            renderDatabase(database);
        } catch (err) {
            databaseList.innerHTML = `<div style="padding:20px; text-align:center; color:var(--danger);">Ошибка загрузки</div>`;
            console.error(err);
        }
    }

    function renderDatabase(database) {
        if (!database || typeof database !== 'object') return;
        databaseList.innerHTML = "";

        Object.values(database).forEach(faction => {
            const checkData = faction.work[0] || {};
            const filledCount = Object.values(checkData).filter(v => v?.trim()).length;

            const block = document.createElement("div");
            block.className = "fraction-block";

            const firstThree = Object.keys(checkData).slice(0, 3).map(k => checkData[k] || "—");

            block.innerHTML = `
                <div class="fraction-header">
                    <div class="fraction-title">${escape(faction.title)}</div>
                    <div class="fraction-leader">${escape(faction.nickname)}</div>
                    <div class="comments-badge">${escape(faction.comments)} комм.</div>
                </div>
                <div class="check-grid">
                    <div class="check-card">
                        <div class="check-number">Проверка</div>
                        <div class="check-count ${filledCount === 0 ? 'zero' : ''}">${filledCount}</div>
                        <div class="check-preview">
                            ${firstThree.map((v, i) => i === 0 ? v : `<br>${v}`).join("")}
                        </div>
                    </div>
                </div>
            `;

            block.querySelector(".check-card").addEventListener("click", () => openModal(faction, checkData));
            databaseList.appendChild(block);
        });
    }

    function openModal(faction, checkData) {
        modalTitle.textContent = faction.title;

        const keys = [];
        for (let i = 1; i <= 15; i++) {
            const key = `название${i}`;
            if (key in checkData) keys.push(key);
        }

        const gridHTML = Array.from({ length: 15 }, (_, i) => {
            const key = `название${i + 1}`;
            const label = key in checkData ? key : "";
            const value = checkData[key]?.trim() || "";
            return `
                <div class="work-item">
                    ${label ? `<div class="work-label">${escape(label)}</div>` : ""}
                    <div class="work-value">${value ? escape(value) : ""}</div>
                </div>
            `;
        }).join('');

        modalBody.innerHTML = `
            <div style="margin-bottom:20px; color:var(--color-accent); font-size:0.95rem; text-align:center;">
                Комментарий: ${escape(faction.comments)}
            </div>
            <div class="modal-works-grid">
                ${gridHTML}
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

    function escape(str) {
        if (!str) return "—";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    loadDatabase();
});