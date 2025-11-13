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

const slides = document.getElementById('slides');
const dotsContainer = document.getElementById('dots');
const allImages = slides.querySelectorAll('img');
let currentZoomIndex = 0;
let currentSlideIndex = 0;
let zoomCaption = null;
const state = {};

allImages.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'gallery-dot';
    dot.onclick = () => openZoom(allImages[i], i);
    dotsContainer.appendChild(dot);
    const id = i + 1;
    if (!state[id]) state[id] = { scale: 1, panX: 0, panY: 0, isDragging: false };
});

function updateDots(index) {
    document.querySelectorAll('.gallery-dot').forEach((d, i) => d.classList.toggle('active', i === index));
}

function showSlide(index) {
    currentSlideIndex = (index + allImages.length) % allImages.length;
    slides.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    updateDots(currentSlideIndex);
}

function openZoom(img, index) {
    const zoomModal = document.getElementById('zoomModal');
    const zoomImg = document.getElementById('zoomImg');
    const container = zoomModal.querySelector('.zoom-container');

    if (zoomCaption) zoomCaption.remove();

    zoomCaption = document.createElement('div');
    zoomCaption.className = 'photo-caption';
    zoomCaption.textContent = img.alt;
    container.insertBefore(zoomCaption, zoomImg);

    currentZoomIndex = index;
    zoomImg.src = img.src;
    zoomModal.classList.add('active');
    resetTransform(currentZoomIndex + 1);
}

function closeZoom() {
    const zoomModal = document.getElementById('zoomModal');
    zoomModal.classList.remove('active');
    if (zoomCaption) {
        zoomCaption.remove();
        zoomCaption = null;
    }
}

function prevSlide() { showSlide(currentSlideIndex - 1); }
function nextSlide() { showSlide(currentSlideIndex + 1); }
function zoomIn() { const id = currentZoomIndex + 1; state[id].scale += 0.2; applyTransform(); }
function zoomOut() { const id = currentZoomIndex + 1; state[id].scale = Math.max(0.5, state[id].scale - 0.2); applyTransform(); }

function resetTransform() {
    const id = currentZoomIndex + 1;
    state[id].scale = 1; state[id].panX = 0; state[id].panY = 0;
    applyTransform();
}

function applyTransform() {
    const id = currentZoomIndex + 1;
    const img = document.getElementById('zoomImg');
    img.style.transform = `translate(${state[id].panX}px, ${state[id].panY}px) scale(${state[id].scale})`;
}

function wheelZoom(e) {
    e.preventDefault();
    const id = currentZoomIndex + 1;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    state[id].scale = Math.max(0.5, state[id].scale + delta);
    applyTransform();
}

function initDrag() {
    const img = document.getElementById('zoomImg');
    let startX, startY;
    img.addEventListener('mousedown', (e) => {
        const id = currentZoomIndex + 1;
        if (state[id].scale <= 1) return;
        e.preventDefault();
        state[id].isDragging = true;
        img.classList.add('dragging');
        startX = e.clientX - state[id].panX;
        startY = e.clientY - state[id].panY;
    });
    document.addEventListener('mousemove', (e) => {
        const id = currentZoomIndex + 1;
        if (!state[id].isDragging) return;
        state[id].panX = e.clientX - startX;
        state[id].panY = e.clientY - startY;
        applyTransform();
    });
    document.addEventListener('mouseup', () => {
        const id = currentZoomIndex + 1;
        state[id].isDragging = false;
        img.classList.remove('dragging');
    });
}

function zoomPrev() {
    currentZoomIndex = (currentZoomIndex - 1 + allImages.length) % allImages.length;
    openZoom(allImages[currentZoomIndex], currentZoomIndex);
}

function zoomNext() {
    currentZoomIndex = (currentZoomIndex + 1) % allImages.length;
    openZoom(allImages[currentZoomIndex], currentZoomIndex);
}

document.getElementById('zoomImg').addEventListener('wheel', (e) => {
    if (document.getElementById('zoomModal').classList.contains('active')) {
        wheelZoom(e);
    }
});

document.addEventListener('keydown', e => {
    if (!document.getElementById('zoomModal').classList.contains('active')) return;
    if (e.key === 'Escape') closeZoom();
    if (e.key === 'ArrowLeft') zoomPrev();
    if (e.key === 'ArrowRight') zoomNext();
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
});

document.getElementById('zoomModal').addEventListener('click', e => {
    if (e.target.id === 'zoomModal' || e.target.classList.contains('modal-close')) closeZoom();
});

showSlide(0);
initDrag();

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

window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.zoomPrev = zoomPrev;
window.zoomNext = zoomNext;
window.closeZoom = closeZoom;