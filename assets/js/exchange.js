window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 600);
    }, 300);
});

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

const lightIcon = document.querySelector('.home-icon.light');
const darkIcon = document.querySelector('.home-icon.dark');

function updateHomeIcon() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    lightIcon.style.display = isDark ? 'none' : 'block';
    darkIcon.style.display = isDark ? 'block' : 'none';
}
updateHomeIcon();

const observer = new MutationObserver(updateHomeIcon);
observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.main-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.main-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.main;
        document.getElementById(target).classList.add('active');
        const firstSection = document.querySelector(`#${target} .section-btn`);
        if (firstSection) firstSection.click();
    });
});

function setupSections(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.content-area').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            document.getElementById(target).classList.add('active');
        });
    });
}

setupSections('earn');
setupSections('exchange');

const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=exchange';

async function loadData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        renderTable('regular-earn', data.получение?.regular || [], 'Награда');
        renderTable('officers-earn', data.получение?.officers || [], 'Награда');
        renderTable('senior-earn', data.получение?.senior || [], 'Награда');
        renderTable('leaders-earn', data.получение?.leaders || [], 'Награда');

        renderTable('regular-exchange', data.обмен?.regular || [], 'Стоимость');
        renderTable('officers-exchange', data.обмен?.officers || [], 'Стоимость');
        renderTable('senior-exchange', data.обмен?.senior || [], 'Стоимость');
        renderTable('leaders-exchange', data.обмен?.leaders || [], 'Стоимость');

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError();
    }
}

function renderTable(tableId, items, costLabel) {
    const tbody = document.querySelector(`#${tableId}-table tbody`);
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        return;
    }

    items.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(row.item)}</td>
            <td class="cost">${escapeHtml(row.cost)} ${costLabel === 'Награда' ? '' : ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError() {
    document.querySelectorAll('.content-area').forEach(area => {
        area.innerHTML = '<p style="text-align:center; color:var(--color-accent); padding:30px;">Ошибка загрузки данных</p>';
    });
}

loadData();