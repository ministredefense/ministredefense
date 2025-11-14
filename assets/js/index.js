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

function filterMenu(query) {
    query = query.toLowerCase().trim();
    let visible = 0;
    menuItems.forEach(item => {
        const text = item.getAttribute('data-title').toLowerCase();
        const link = item.querySelector('a');
        const originalText = item.getAttribute('data-title');
        if (query === '' || text.includes(query)) {
            item.classList.remove('hidden');
            visible++;
            if (query !== '') {
                const regex = new RegExp(`(${query})`, 'gi');
                link.innerHTML = originalText.replace(regex, '<mark>$1</mark>');
            } else {
                link.textContent = originalText;
            }
        } else {
            item.classList.add('hidden');
        }
    });
    noResults.classList.toggle('show', visible === 0 && query !== '');
}
searchInput.addEventListener('input', () => filterMenu(searchInput.value));

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 97;
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;
        const inc = target / speed;
        if (count < target) {
            counter.innerText = Math.ceil(count + inc);
            setTimeout(animateCounters, 20);
        } else {
            counter.innerText = target;
        }
    });
}

const statsSection = document.querySelector('.stats-section');
let animated = false;
window.addEventListener('scroll', () => {
    if (!animated && statsSection.getBoundingClientRect().top < window.innerHeight * 0.8) {
        animateCounters();
        animated = true;
    }
});

const statsIntro = document.querySelector('.intro-content');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

if (statsIntro) observer.observe(statsIntro);