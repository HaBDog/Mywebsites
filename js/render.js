/* ========== DOM 渲染 ========== */

// ----- 骨架屏 & 状态切换 -----
function showSkeleton(tabId) {
    document.getElementById(tabId + '-skeleton')?.classList.remove('hidden');
    document.getElementById(tabId + '-container')?.classList.add('hidden');
    document.getElementById(tabId + '-empty')?.classList.add('hidden');
    document.getElementById(tabId + '-error')?.classList.add('hidden');
}

function hideSkeleton(tabId) {
    document.getElementById(tabId + '-skeleton')?.classList.add('hidden');
    document.getElementById(tabId + '-container')?.classList.remove('hidden');
}

function showEmpty(tabId) {
    hideSkeleton(tabId);
    document.getElementById(tabId + '-container')?.classList.add('hidden');
    document.getElementById(tabId + '-empty')?.classList.remove('hidden');
    document.getElementById(tabId + '-error')?.classList.add('hidden');
}

function showError(tabId, msg) {
    hideSkeleton(tabId);
    document.getElementById(tabId + '-container')?.classList.add('hidden');
    document.getElementById(tabId + '-empty')?.classList.add('hidden');
    document.getElementById(tabId + '-error')?.classList.remove('hidden');
    const msgEl = document.getElementById(tabId + '-error-msg');
    if (msgEl) msgEl.textContent = msg || '数据加载失败';
}

// ----- 比赛卡片 -----
function createMatchCard(match, type) {
    const isLive = type === 'live';
    const isResult = type === 'results';

    const winnerA = isResult && (match.scoreA > match.scoreB);
    const winnerB = isResult && (match.scoreB > match.scoreA);

    return `
    <div class="match-card ${isLive ? 'live-card' : ''}${isResult ? 'result-card' : ''}">
        ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
        ${match.tournament ? `<div class="tournament-badge">${match.tournament}</div>` : ''}
        <div class="match-teams">
            <div class="team-row">
                <span class="team-name">${match.teamA}</span>
                <span class="team-score${winnerA ? ' winner' : ''}">${isResult || isLive ? match.scoreA : ''}</span>
            </div>
            <div class="vs-divider">${isResult ? 'VS' : 'VS'}</div>
            <div class="team-row">
                <span class="team-name">${match.teamB}</span>
                <span class="team-score${winnerB ? ' winner' : ''}">${isResult || isLive ? match.scoreB : ''}</span>
            </div>
        </div>
        <div class="match-meta">
            ${isLive && match.map ? `<span class="match-map">📌 ${match.map} ${match.mapScoreA}:${match.mapScoreB} (${match.bestOf})</span>` : ''}
            ${isResult ? `<span class="match-time">${getRelativeTime(match.endTime)}</span>` : ''}
            ${type === 'upcoming' ? `
                <span class="match-time">${toBeijingDateTime(match.startTime)}</span>
                <span class="match-countdown">${getRelativeTime(match.startTime)}</span>
            ` : ''}
        </div>
    </div>`;
}

// ----- 渲染直播 -----
function renderLiveMatches(data) {
    const container = document.getElementById('live-container');
    if (!data || !data.matches || data.matches.length === 0) {
        showEmpty('live');
        return;
    }
    hideSkeleton('live');
    container.innerHTML = data.matches.map(m => createMatchCard(m, 'live')).join('');
}

// ----- 渲染即将开始（按日期分组） -----
function renderUpcomingMatches(data) {
    const container = document.getElementById('upcoming-container');
    if (!data || !data.matches || data.matches.length === 0) {
        showEmpty('upcoming');
        return;
    }
    hideSkeleton('upcoming');

    const groups = {};
    data.matches.forEach(m => {
        const group = getDateGroup(m.startTime);
        if (!groups[group]) groups[group] = [];
        groups[group].push(m);
    });

    let html = '';
    for (const [date, matches] of Object.entries(groups)) {
        html += `<div class="date-group">${date}</div>`;
        html += matches.map(m => createMatchCard(m, 'upcoming')).join('');
    }
    container.innerHTML = html;
}

// ----- 渲染结果 -----
function renderResults(data) {
    const container = document.getElementById('results-container');
    if (!data || !data.matches || data.matches.length === 0) {
        showEmpty('results');
        return;
    }
    hideSkeleton('results');
    container.innerHTML = data.matches.map(m => createMatchCard(m, 'results')).join('');
}

// ----- 渲染排名 -----
function renderRankings(data) {
    const container = document.getElementById('rankings-container');
    if (!data || !data.teams || data.teams.length === 0) {
        showEmpty('rankings');
        return;
    }
    hideSkeleton('rankings');

    const rows = data.teams.map(t => `
        <tr>
            <td class="rank-col">#${t.rank}</td>
            <td class="team-col">${t.team}</td>
            <td class="rating-col">${Math.round(t.rating)}</td>
            <td class="record-col">${t.wins}W - ${t.losses}L</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="rankings-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>战队</th>
                    <th>评分</th>
                    <th>战绩</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}
