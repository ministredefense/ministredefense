window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 600);
    }, 300);
});

const state = {
    1: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    2: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    3: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    4: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    5: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    6: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    7: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    8: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    9: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    10: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    11: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 },
    12: { scale:1, panX:0, panY:0, isDragging:false, startX:0, startY:0 }
};

const imageData = {
    ground: [
        { id:1, src:"assets/images/geography/ground1.jpg" },
        { id:2, src:"assets/images/geography/ground2.jpg" },
        { id:3, src:"assets/images/geography/ground3.jpg" }
    ],
    air: [
        { id:4, src:"assets/images/geography/air1.jpg" },
        { id:5, src:"assets/images/geography/air2.jpg" },
        { id:6, src:"assets/images/geography/air3.jpg" }
    ],
    navy: [
        { id:7, src:"assets/images/geography/navy1.jpg" },
        { id:8, src:"assets/images/geography/navy2.jpg" }
    ],
    carrier: [
        { id:9, src:"assets/images/geography/carrier1.jpg" },
        { id:10, src:"assets/images/geography/carrier2.jpg" },
        { id:11, src:"assets/images/geography/carrier3.jpg" },
        { id:12, src:"assets/images/geography/carrier4.jpg" }
    ]
};

function renderContent(target) {
    const container = document.getElementById('dynamicContent');
    container.innerHTML = '';

    const maps = imageData[target];
    if (!maps) return;

    maps.forEach(map => {
        const wrap = document.createElement('div');
        wrap.className = 'wrapper';
        wrap.id = `wrap${map.id}`;

        const inner = document.createElement('div');
        inner.className = 'inner';
        inner.id = `inner${map.id}`;

        const img = document.createElement('img');
        img.src = map.src;
        img.alt = `Карта ${map.id}`;
        inner.appendChild(img);
        wrap.appendChild(inner);

        container.appendChild(wrap);
        initDrag(map.id);
        wrap.addEventListener('wheel', e => wheelZoom(e, map.id), {passive: false});
        wrap.addEventListener('dblclick', e => resetZoom(map.id));

        img.onload = () => applyTransform(map.id);
        if (img.complete) applyTransform(map.id);
    });
}

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

function wheelZoom(e, id) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const s = state[id];
    const oldScale = s.scale;
    const newScale = Math.max(0.2, Math.min(20, oldScale * delta));
    if (newScale === oldScale) return;

    const px = (offsetX - s.panX) / oldScale;
    const py = (offsetY - s.panY) / oldScale;
    s.scale = newScale;
    s.panX = offsetX - px * newScale;
    s.panY = offsetY - py * newScale;
    applyTransform(id);
}

function applyTransform(id) {
    const {scale, panX, panY} = state[id];
    const inner = document.getElementById(`inner${id}`);
    if (inner) {
        inner.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
}

function initDrag(id) {
    const wrap = document.getElementById(`wrap${id}`);
    if (!wrap) return;
    const s = state[id];

    const onDown = e => {
        if (e.button !== 0) return;
        s.isDragging = true;
        s.startX = e.clientX - s.panX;
        s.startY = e.clientY - s.panY;
        wrap.style.cursor = 'grabbing';
        e.preventDefault();
    };
    const onMove = e => {
        if (!s.isDragging) return;
        s.panX = e.clientX - s.startX;
        s.panY = e.clientY - s.startY;
        applyTransform(id);
    };
    const onUp = () => {
        if (s.isDragging) {
            s.isDragging = false;
            wrap.style.cursor = 'grab';
        }
    };

    wrap.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function resetZoom(id) {
    const s = state[id];
    s.scale = 1; s.panX = 0; s.panY = 0;
    applyTransform(id);
}

document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.section-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderContent(btn.dataset.target);
    });
});

document.querySelector('.section-btn').click();

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