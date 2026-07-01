/* ========== 应用主控制器 ========== */

const appState = {
    activeTab: 'live',
    lastUpdate: null,
    refreshTimer: null,
    updateTimer: null,
};

// ----- 标签切换 -----
const tabLinks = document.querySelectorAll('.nav-links a[data-tab]');
const tabContents = document.querySelectorAll('.tab-content');

tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.dataset.tab;
        switchTab(tab);
    });
});

function switchTab(tab) {
    appState.activeTab = tab;

    tabLinks.forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    tabContents.forEach(s => s.classList.remove('active'));
    document.getElementById('tab-' + tab)?.classList.add('active');

    fetchDataForTab(tab);
}

// ----- 数据获取 -----
async function fetchDataForTab(tab) {
    showSkeleton(tab);

    try {
        let data;
        switch (tab) {
            case 'live':     data = await fetchLiveMatches(); break;
            case 'upcoming': data = await fetchUpcomingMatches(); break;
            case 'results':  data = await fetchResults(); break;
            case 'rankings': data = await fetchRankings(); break;
        }

        if (data && data.error) throw new Error(data.message);

        switch (tab) {
            case 'live':     renderLiveMatches(data); break;
            case 'upcoming': renderUpcomingMatches(data); break;
            case 'results':  renderResults(data); break;
            case 'rankings':
                rankingData = data;
                filterRankings(document.querySelector('.region-btn.active')?.dataset?.region || 'all');
                break;
        }

        appState.lastUpdate = new Date();
        updateTimeDisplay();

    } catch (err) {
        showError(tab, err.message);
    }
}

// ----- 更新时间显示 -----
function updateTimeDisplay() {
    if (!appState.lastUpdate) return;
    const seconds = Math.floor((new Date() - appState.lastUpdate) / 1000);
    const text = seconds < 10 ? '刚刚更新' : `${seconds}秒前更新`;
    document.getElementById('update-text').textContent = text;
}

// ----- 自动刷新 -----
function startAutoRefresh() {
    if (appState.refreshTimer) clearInterval(appState.refreshTimer);
    if (appState.updateTimer) clearInterval(appState.updateTimer);

    // 每 45 秒刷新当前标签的数据
    appState.refreshTimer = setInterval(() => {
        fetchDataForTab(appState.activeTab);
    }, 45000);

    // 每秒更新 "X秒前更新" 文字
    appState.updateTimer = setInterval(updateTimeDisplay, 1000);
}

// ----- 重试按钮 -----
document.querySelectorAll('.btn-retry').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) fetchDataForTab(tab);
    });
});

// ----- 移动端菜单 -----
const menuBtn = document.querySelector('.menu-btn');
const navMenu = document.querySelector('.nav-links');
menuBtn?.addEventListener('click', () => navMenu?.classList.toggle('open'));
navMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navMenu.classList.remove('open')));

// ----- 离线检测 -----
const offlineBanner = document.getElementById('offline-banner');
window.addEventListener('offline', () => offlineBanner?.classList.remove('hidden'));
window.addEventListener('online', () => {
    offlineBanner?.classList.add('hidden');
    fetchDataForTab(appState.activeTab);
});

// ----- 排名区域筛选 -----
let rankingData = null;

document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterRankings(btn.dataset.region);
    });
});

function filterRankings(region) {
    if (!rankingData) return;
    if (region === 'all') {
        renderRankings(rankingData);
        return;
    }
    const filtered = {
        ...rankingData,
        teams: rankingData.teams?.filter(t =>
            (t.region || '').toLowerCase().includes(region.toLowerCase())
        ) || []
    };
    if (filtered.teams.length === 0) {
        showEmpty('rankings');
    } else {
        renderRankings(filtered);
    }
}

// ----- 初始化 -----
function init() {
    fetchDataForTab(appState.activeTab);
    startAutoRefresh();
}

init();

// 如果离线就显示提示
if (!navigator.onLine) {
    offlineBanner?.classList.remove('hidden');
}
