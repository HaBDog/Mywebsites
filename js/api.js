/* ========== API 调用层 ========== */

const API_BASE = '/api';

async function fetchFromAPI(endpoint) {
    const res = await fetch(`${API_BASE}/${endpoint}`);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `请求失败 (${res.status})`);
    }
    return await res.json();
}

async function fetchLiveMatches() {
    return await retryFetch(() => fetchFromAPI('matches-live'));
}

async function fetchUpcomingMatches() {
    return await retryFetch(() => fetchFromAPI('matches-upcoming'));
}

async function fetchResults() {
    return await retryFetch(() => fetchFromAPI('matches-results'));
}

async function fetchRankings() {
    return await retryFetch(() => fetchFromAPI('rankings'));
}
