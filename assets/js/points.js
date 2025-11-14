const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=points';
const BASE_VARIANTS = { 'СВ': 'СВ', 'Сухопутные войска': 'СВ', 'Сухопутные Войска': 'СВ', 'ВВС': 'ВВС', 'Военно-воздушные силы': 'ВВС', 'Военно Воздушные Силы': 'ВВС', 'ВМФ': 'ВМФ', 'Военно-морской флот': 'ВМФ', 'Военно Морской Флот': 'ВМФ' };
const BASE_FULL_NAMES = { 'СВ': 'Сухопутные войска', 'ВВС': 'Военно-воздушные силы', 'ВМФ': 'Военно-морской флот' };
let allUsers = [], statsChart = null, currentBase = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('loader');
    const pointsContainer = document.getElementById('points');
    const topModal = document.getElementById('topModal');
    const chartModal = document.getElementById('chartModal');
    const pointModal = document.getElementById('pointModal');
    const topClose = document.getElementById('topClose');
    const chartClose = document.getElementById('chartClose');
    const modalClose = document.getElementById('modalClose');
    const topBtn = document.getElementById('topBtn');
    const chartBtn = document.getElementById('chartBtn');
    const mainSearchInput = document.getElementById('mainSearchInput');
    const sidebarSearchInput = document.getElementById('sidebarSearchInput');
    const themeSlider = document.getElementById('themeSlider');
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuList = document.getElementById('menuList');
    const menuItems = menuList.querySelectorAll('li');
    const noResults = document.getElementById('noResults');

    function setTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        themeSlider.checked = theme === 'dark';
        updateChartColors();
    }
    setTheme(localStorage.getItem('theme') || 'light');
    themeSlider.addEventListener('change', () => setTheme(themeSlider.checked ? 'dark' : 'light'));

    topClose.onclick = () => topModal.classList.remove('active');
    chartClose.onclick = () => chartModal.classList.remove('active');
    modalClose.onclick = () => pointModal.classList.remove('active');
    topModal.onclick = e => e.target === topModal && topModal.classList.remove('active');
    chartModal.onclick = e => e.target === chartModal && chartModal.classList.remove('active');
    pointModal.onclick = e => e.target === pointModal && pointModal.classList.remove('active');

    topBtn.onclick = () => { renderTops(); topModal.classList.add('active'); };
    chartBtn.onclick = () => { renderGlobalChart(); chartModal.classList.add('active'); };

    document.querySelectorAll('#topModal .tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('#topModal .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#topModal .tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            renderTops();
        };
    });

    document.querySelectorAll('.base-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.base-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBase = btn.dataset.base;
            filterUsers(mainSearchInput.value.trim().toLowerCase());
            renderGlobalChart();
        };
    });

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        sidebarSearchInput.focus();
    }
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        sidebarSearchInput.value = '';
        filterMenu('');
    }
    hamburger.addEventListener('click', () => sidebar.classList.contains('active') ? closeSidebar() : openSidebar());
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) closeSidebar();
    });

    function filterMenu(q) {
        let hasResults = false;
        menuItems.forEach(item => {
            const title = item.dataset.title.toLowerCase();
            const match = title.includes(q);
            item.classList.toggle('hidden', !match);
            if (match) hasResults = true;
        });
        noResults.classList.toggle('show', q !== '' && !hasResults);
    }
    sidebarSearchInput.oninput = () => filterMenu(sidebarSearchInput.value.trim().toLowerCase());

    mainSearchInput.oninput = () => filterUsers(mainSearchInput.value.trim().toLowerCase());

    function filterUsers(q) {
        let filtered = allUsers;
        if (currentBase !== 'all') {
            filtered = allUsers.filter(u => u.basesMap[currentBase] && u.basesMap[currentBase].history.length > 0);
        }
        if (q !== '') {
            filtered = filtered.filter(u => {
                const id = u.accountId.toLowerCase();
                const nicks = u.nicknames.map(n => n.toLowerCase()).join(' ');
                return id.includes(q) || nicks.includes(q);
            });
        }
        filtered.sort((a, b) => {
            const aPoints = currentBase === 'all' ? a.totalPoints : (a.basesMap[currentBase]?.points || 0);
            const bPoints = currentBase === 'all' ? b.totalPoints : (b.basesMap[currentBase]?.points || 0);
            return bPoints - aPoints;
        });
        renderCards(filtered);
    }

    function renderCards(users) {
        pointsContainer.innerHTML = '';
        if (!users.length) return void(pointsContainer.innerHTML = '<p style="text-align:center;color:#aaa;">Нет данных</p>');
        users.forEach(u => pointsContainer.appendChild(createCard(u)));
    }

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid data');

        allUsers = data.map(user => {
            const basesMap = { 'СВ': { points:0, earned:0, spent:0, history:[] }, 'ВВС': { points:0, earned:0, spent:0, history:[] }, 'ВМФ': { points:0, earned:0, spent:0, history:[] } };
            let totalPoints = 0, totalEarned = 0, totalSpent = 0;

            Object.entries(user.bases || {}).forEach(([k, entries]) => {
                const short = BASE_VARIANTS[k.trim()];
                if (!short) return;
                const b = basesMap[short];
                entries.forEach(e => {
                    const pts = parseInt(e.points) || 0;
                    if (e.action === 'выдал') { b.earned += pts; b.points += pts; }
                    else { b.spent += pts; b.points -= pts; }
                    b.history.push(e);
                });
                totalPoints += b.points; totalEarned += b.earned; totalSpent += b.spent;
            });

            return { ...user, basesMap, totalPoints, totalEarned, totalSpent };
        });

        filterUsers('');
        loader.classList.add('hidden');
    } catch (e) {
        console.error(e);
        pointsContainer.innerHTML = '<p style="text-align:center;color:var(--danger);">Ошибка загрузки</p>';
        loader.classList.add('hidden');
    }

    function createCard(u) {
        const card = document.createElement('div');
        card.className = 'point-card';
        const lastNick = u.nicknames.length ? u.nicknames[u.nicknames.length-1] : u.accountId;
        const shortNick = lastNick.length > 25 ? lastNick.slice(0,22)+'...' : lastNick;
        const points = currentBase === 'all' ? u.totalPoints : (u.basesMap[currentBase]?.points || 0);
        const earned = currentBase === 'all' ? u.totalEarned : (u.basesMap[currentBase]?.earned || 0);
        const spent = currentBase === 'all' ? u.totalSpent : (u.basesMap[currentBase]?.spent || 0);
        card.innerHTML = `
            <div class="point-nick">${escapeHtml(shortNick)}</div>
            <div class="point-id">Номер аккаунта: ${escapeHtml(u.accountId)}</div>
            <div class="point-total">Баллов: <strong>${points}</strong> (+${earned}/-${spent})</div>
        `;
        card.onclick = () => openPointModal(u);
        return card;
    }

    function openPointModal(u) {
        document.getElementById('pointModalTitle').textContent = u.nicknames[u.nicknames.length-1] || u.accountId;
        document.getElementById('modalId').textContent = u.accountId;
        document.getElementById('modalCount').textContent = `${u.totalPoints} (+${u.totalEarned}/-${u.totalSpent})`;

        const nickList = document.getElementById('nickList');
        nickList.innerHTML = u.nicknames.map(n => `<div>${escapeHtml(n)}</div>`).join('') || '<div style="color:#aaa;">—</div>';

        const historyHTML = Object.entries(u.basesMap).map(([short, d]) => {
            if (!d.history.length) return '';
            const full = BASE_FULL_NAMES[short];
            const sorted = [...d.history].sort((a,b) => new Date(b.date) - new Date(a.date));
            return `
                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <strong style="color:var(--color-primary);font-size:1.1rem;">${full}</strong>
                        <span style="background:#1a1a1a;color:#fff;padding:6px 12px;border-radius:8px;font-size:.9rem;font-weight:700;">
                            ${d.points} (+${d.earned}/-${d.spent})
                        </span>
                    </div>
                    <ul style="margin:0;padding-left:20px;list-style:disc;font-size:.9rem;">
                        ${sorted.map(e => {
                            const date = new Date(e.date).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
                            const color = e.action === 'выдал' ? '#2ecc71' : '#e74c3c';
                            const sign = e.action === 'выдал' ? '+' : '-';
                            return `<li style="margin:4px 0;"><span style="color:${color};font-weight:600;">${sign}${e.points}</span> — ${escapeHtml(e.rank)}, ${date}</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }).join('<hr style="margin:16px 0;border:none;border-top:1px solid var(--border);">');

        document.getElementById('pointHistoryList').innerHTML = historyHTML || '<p style="color:#aaa;text-align:center;font-style:italic;">Нет активности</p>';
        pointModal.classList.add('active');
    }

    function renderTops() {
        const active = document.querySelector('#topModal .tab-btn.active').dataset.tab;
        document.querySelectorAll('#topModal .tab-content').forEach(c => c.innerHTML = '');
        if (active === 'total') renderTopList('total', allUsers, 'totalPoints', 'Общий топ');
        else if (active === 'earned') renderTopList('earned', allUsers, 'totalEarned', 'Топ по полученным');
        else renderTopList('spent', allUsers, 'totalSpent', 'Топ по потраченным');
    }

    function renderTopList(id, users, key, title) {
        const cont = document.getElementById(id);
        const sorted = [...users].sort((a,b) => b[key] - a[key]).slice(0,10);
        let html = `<div class="leaderboard"><h3>${title}</h3><ol>`;
        sorted.forEach(u => {
            const last = u.nicknames.length ? u.nicknames[u.nicknames.length-1] : 'Без имени';
            const short = last.length > 25 ? last.slice(0,22)+'...' : last;
            html += `<li><div class="rank-name">${escapeHtml(short)}</div><div class="rank-points">${u[key]} баллов</div></li>`;
        });
        html += `</ol></div>`;
        cont.innerHTML = sorted.length ? html : `<p style="text-align:center;color:#aaa;padding:20px;">Нет данных</p>`;
    }

    function renderGlobalChart() {
        const ctx = document.getElementById('statsChart').getContext('2d');
        const base = document.querySelector('.base-btn.active').dataset.base;
        const totals = { points:0, earned:0, spent:0 };
        allUsers.forEach(u => {
            if (base === 'all') {
                totals.points += u.totalPoints;
                totals.earned += u.totalEarned;
                totals.spent += u.totalSpent;
            } else {
                const b = u.basesMap[base];
                if (b && b.history.length) {
                    totals.points += b.points;
                    totals.earned += b.earned;
                    totals.spent += b.spent;
                }
            }
        });

        const dark = document.body.dataset.theme === 'dark';
        const barBg = dark ? '#2ecc71' : '#27ae60';
        const earnedBg = '#3498db';
        const spentBg = '#e74c3c';

        if (statsChart) statsChart.destroy();

        statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Текущие баллы', 'Получено', 'Потрачено'],
                datasets: [{
                    data: [totals.points, totals.earned, totals.spent],
                    backgroundColor: [barBg, earnedBg, spentBg],
                    borderColor: [barBg, earnedBg, spentBg],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: dark ? '#fff' : '#333',
                        font: { weight: 'bold' }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: dark ? '#ccc' : '#555' } },
                    x: { ticks: { color: dark ? '#ccc' : '#555' } }
                }
            },
            plugins: [{
                id: 'datalabels',
                afterDatasetsDraw(chart) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const data = dataset.data[index];
                            ctx.fillStyle = dark ? '#fff' : '#333';
                            ctx.font = 'bold 13px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(data, bar.x, bar.y - 5);
                        });
                    });
                }
            }]
        });
    }

    function updateChartColors() { if (statsChart) renderGlobalChart(); }
    function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
});