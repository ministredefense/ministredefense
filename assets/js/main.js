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

const API_URL = 'https://script.google.com/macros/s/AKfycby82GxZMeF8BRrKnJQM5dCY-1il6kc0I935eK79Eo7Ne4pbUmCEgBheSQIM6wGSbBYSzQ/exec?type=main';
const container = document.getElementById('adminContainer');
const contentLoader = document.getElementById('contentLoader');
const errorMsg = document.getElementById('errorMessage');

function getInitials(nick) {
    return nick.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
}

function createAvatar(nickname) {
    const avatar = document.createElement('div');
    avatar.className = 'admin-avatar fallback';
    avatar.textContent = getInitials(nickname);

    const cleanNick = nickname.toLowerCase().replace(/[^a-z0-9_-]/g, '').replace(/\s+/g, '');
    const imgPath = `assets/images/main/${cleanNick}.jpg`;

    const img = new Image();
    img.src = imgPath;
    img.alt = nickname;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;top:0;left:0;display:block;';

    img.onload = () => {
        avatar.classList.remove('fallback');
        avatar.textContent = '';
        avatar.appendChild(img);
    };

    img.onerror = () => {
        const placeholder = new Image();
        placeholder.src = 'assets/images/main/placeholder.jpg';
        placeholder.alt = 'Нет фото';
        placeholder.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;top:0;left:0;display:block;';

        placeholder.onload = () => {
            avatar.classList.remove('fallback');
            avatar.textContent = '';
            avatar.appendChild(placeholder);
        };
    };

    avatar.appendChild(img);
    return avatar;
}

function isValidLink(link) {
    return link && link.trim() !== '' && link !== 'вк' && link !== 'форум' && link !== 'link' && !link.includes('example.com');
}

function createCard(person, type = 'admin') {
    const card = document.createElement('div');
    card.className = `admin-card ${type}`;

    let role = 'Администратор';
    if (type === 'senior') role = person.role || 'Старший администратор';
    if (type === 'minister') role = person.role || 'Министр';

    const vk = isValidLink(person.vk) ? person.vk : '#';
    const forum = isValidLink(person.accountId) ? person.accountId : '#';

    card.appendChild(createAvatar(person.nickname));
    card.innerHTML += `
        <div class="admin-role">${role}</div>
        <div class="admin-nick">${person.nickname}</div>
        <div class="admin-links">
            <a href="${vk}" target="_blank" class="admin-link vk ${!isValidLink(person.vk) ? 'disabled' : ''}" ${isValidLink(person.vk) ? 'rel="noopener"' : ''}>
                <span class="material-icons">link</span> ВК
            </a>
            <a href="${forum}" target="_blank" class="admin-link forum ${!isValidLink(person.accountId) ? 'disabled' : ''}" ${isValidLink(person.accountId) ? 'rel="noopener"' : ''}>
                <span class="material-icons">forum</span> Форум
            </a>
        </div>
    `;

    return card;
}

async function loadData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Ошибка сети');
        const data = await res.json();
        if (!data.minister) throw new Error('Нет данных о министре');

        const topContainer = document.createElement('div');
        topContainer.className = 'top-admins';

        let delay = 0.1;
        const addWithDelay = (person, type) => {
            if (person) {
                const card = createCard(person, type);
                card.style.animationDelay = `${delay}s`;
                topContainer.appendChild(card);
                delay += 0.15;
            }
        };

        addWithDelay(data.seniorAdmin, 'senior');
        addWithDelay(data.minister, 'minister');
        container.appendChild(topContainer);

        if (data.admins && Array.isArray(data.admins)) {
            const grid = document.createElement('div');
            grid.className = 'admins-grid';

            data.admins.forEach(admin => {
                const card = createCard(admin);
                card.style.animationDelay = `${delay}s`;
                grid.appendChild(card);
                delay += 0.1;
            });

            container.appendChild(grid);
        }

        contentLoader.style.display = 'none';
    } catch (err) {
        console.error(err);
        errorMsg.textContent = 'Не удалось загрузить данные. Проверьте подключение.';
        errorMsg.style.display = 'block';
        contentLoader.style.display = 'none';
    }
}

setTimeout(loadData, 800);