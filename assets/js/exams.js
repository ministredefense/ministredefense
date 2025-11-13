const API_STATS = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=exams';
const API_PAGE = p => `https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=exams${p}`;

let allExams = [];
let currentType = 'Курс Молодого Бойца';
let statsChart = null;
let loadingStats = false;
let nextPageToLoad = 10;
let cachedStats = null;

let currentPage = 1;
const PAGE_SIZE = 300;

let loader, examsContainer, statsModal, statsBtn, statsClose, searchInput;
let themeSlider, loadMore, pagination, prevPage, nextPage, pageInfo;

document.addEventListener('DOMContentLoaded', () => {
  loader = document.getElementById('loader');
  examsContainer = document.getElementById('exams');
  statsModal = document.getElementById('statsModal');
  statsBtn = document.getElementById('statsBtn');
  statsClose = document.getElementById('statsClose');
  searchInput = document.getElementById('searchInput');
  themeSlider = document.getElementById('themeSlider');
  loadMore = document.getElementById('loadMore');
  pagination = document.getElementById('pagination');
  prevPage = document.getElementById('prevPage');
  nextPage = document.getElementById('nextPage');
  pageInfo = document.getElementById('pageInfo');

  const setTheme = t => {
    document.body.dataset.theme = t;
    localStorage.setItem('theme', t);
    themeSlider.checked = t === 'dark';
    if (statsChart) renderChart(cachedStats);
  };
  setTheme(localStorage.getItem('theme') || 'light');
  themeSlider.addEventListener('change', () => setTheme(themeSlider.checked ? 'dark' : 'light'));

  statsClose.onclick = () => statsModal.classList.remove('active');
  statsModal.onclick = e => e.target === statsModal && statsModal.classList.remove('active');
  statsBtn.onclick = () => {
    if (cachedStats) showStats(cachedStats);
    else if (!loadingStats) renderStats();
    statsModal.classList.add('active');
  };

  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      currentPage = 1;
      renderCurrent();
    };
  });

  searchInput.oninput = debounce(() => {
    currentPage = 1;
    renderCurrent();
  }, 300);

  prevPage.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrent();
      scrollToTop();
    }
  };

  nextPage.onclick = () => {
    const totalPages = Math.ceil(getFilteredData().length / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrent();
      scrollToTop();
    }
  };

  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !loadMore.classList.contains('loading') &&
        nextPageToLoad >= 1) {
      loadNextPage();
    }
  });

  loadNextPage();
  loader.classList.add('hidden');
});

async function loadNextPage() {
  if (loadMore.classList.contains('loading')) return;
  loadMore.classList.add('loading');
  loadMore.style.display = 'block';

  try {
    const response = await fetch(API_PAGE(nextPageToLoad));
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const formatted = data.map(entry => {
        const dt = new Date(entry.date);
        const passed = entry.total === '+';
        let type = entry.type;
        if (type === 'Контрактная служба') type = 'Контракт';
        return {
          ...entry,
          type,
          base: entry.base || '—',
          dateFormatted: dt.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }),
          passed
        };
      });

      allExams.push(...formatted);
      renderCurrent();
    }

    nextPageToLoad--;

    if (nextPageToLoad < 1) {
      loadMore.style.display = 'none';
    }
  } catch (err) {
    nextPageToLoad--;
    if (nextPageToLoad < 1) {
      loadMore.style.display = 'none';
    }
  } finally {
    loadMore.classList.remove('loading');
    if (nextPageToLoad >= 1 && loadMore.style.display !== 'none') {
      loadNextPage();
    }
  }
}

function getFilteredData() {
  const query = searchInput.value.trim().toLowerCase();
  return allExams.filter(e => e.type === currentType && (!query || e.nickname.toLowerCase().includes(query)));
}

function renderCurrent() {
  const data = getFilteredData();
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, data.length);
  const pageData = data.slice(start, end);

  renderCards(pageData);

  pageInfo.textContent = `Страница ${currentPage} из ${totalPages || 1}`;
  prevPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === totalPages || totalPages === 0;
  pagination.style.display = totalPages > 1 ? 'flex' : 'none';
}

function renderCards(data) {
  examsContainer.innerHTML = '';

  if (!data.length) {
    examsContainer.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--color-primary);
        font-size: 1.4rem;
        font-weight: 600;
        opacity: 0.7;
      ">
        Нет данных для отображения
      </div>`;
    return;
  }

  data.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'exam-card';
    card.innerHTML = `
      <div class="exam-nick">${escape(entry.nickname)}</div>
      <div class="exam-type">${entry.type}</div>
      ${entry.type === 'Контракт' ? `<div class="exam-base">База: ${escape(entry.base)}</div>` : ''}
      <div class="exam-date">${entry.dateFormatted}</div>
      <div class="exam-result ${entry.passed ? 'pass' : 'fail'}">
        <span>${entry.passed ? 'Сдал' : 'Провал'}</span>
        <span class="exam-exp">Баллы: ${entry.exp}</span>
      </div>`;
    examsContainer.appendChild(card);
  });
}

function scrollToTop() {
  window.scrollTo({ top: document.querySelector('.controls').offsetTop - 100, behavior: 'smooth' });
}

async function renderStats() {
  if (loadingStats || cachedStats) return;
  loadingStats = true;
  document.getElementById('statsBody').innerHTML = `
    <div class="stats-loading">
      <div class="spinner"></div>
      <p>Идёт подсчёт статистики... Пожалуйста, подождите пару секунд.</p>
    </div>`;

  try {
    const resp = await fetch(API_STATS);
    const data = await resp.json();
    cachedStats = data;
    setTimeout(() => { showStats(data); loadingStats = false; }, 1200);
  } catch (err) {
    document.getElementById('statsBody').innerHTML =
      '<p style="color:var(--danger);text-align:center;">Ошибка загрузки статистики</p>';
    loadingStats = false;
  }
}

function showStats(data) {
  document.getElementById('statsBody').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card total"><div class="stat-value">${data.total}</div><div class="stat-label">Всего попыток</div></div>
      <div class="stat-card passed"><div class="stat-value">${data.passed}</div><div class="stat-label">Сдано</div></div>
      <div class="stat-card failed"><div class="stat-value">${data.failed}</div><div class="stat-label">Провалено</div></div>
      <div class="stat-card percent"><div class="stat-value">${data.percentPassed}%</div><div class="stat-label">Успешность</div></div>
    </div>
    <div class="chart-wrapper">
      <canvas id="examChart"></canvas>
    </div>
    <div class="type-stats">
      <h3>По типам</h3>
      <div id="typeStatsList"></div>
    </div>`;

  const list = document.getElementById('typeStatsList');
  list.innerHTML = Object.entries(data.types)
    .map(([type, s]) => `<div><strong>${type}</strong><span>${s.passed}/${s.total} (${s.percentPassed}%)</span></div>`)
    .join('');

  renderChart(data);
}

function renderChart(data) {
  const ctx = document.getElementById('examChart').getContext('2d');
  const dark = document.body.dataset.theme === 'dark';
  if (statsChart) statsChart.destroy();

  statsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['КМБ', 'БОЗ', 'Контракт'],
      datasets: [
        {
          label: 'Сдано',
          data: [
            data.types['Курс Молодого Бойца']?.passed || 0,
            data.types['Большой Офицерский Зачёт']?.passed || 0,
            data.types['Контракт']?.passed || 0
          ],
          backgroundColor: dark ? '#2ecc71' : '#27ae60'
        },
        {
          label: 'Провалено',
          data: [
            data.types['Курс Молодого Бойца']?.failed || 0,
            data.types['Большой Офицерский Зачёт']?.failed || 0,
            data.types['Контракт']?.failed || 0
          ],
          backgroundColor: dark ? '#ff6b6b' : '#e74c3c'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: dark ? '#ccc' : '#555' } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: dark ? '#ccc' : '#555' } },
        x: { ticks: { color: dark ? '#ccc' : '#555' } }
      }
    }
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escape(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}