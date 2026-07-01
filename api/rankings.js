let cache = { data: null, timestamp: 0 };
const TTL = 120000; // rankings update less frequently

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const now = Date.now();

  if (cache.data && (now - cache.timestamp) < TTL) {
    return res.status(200).json(cache.data);
  }

  try {
    const response = await fetch(
      'https://esport.is/api/rankings/valorant',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);

    const raw = await response.json();
    const transformed = transformRankings(raw);
    cache = { data: transformed, timestamp: now };
    return res.status(200).json(transformed);
  } catch (err) {
    if (cache.data) {
      return res.status(200).json({ ...cache.data, _stale: true });
    }
    return res.status(502).json({ error: true, message: '排名数据暂时无法加载，请稍后重试' });
  }
}

function transformRankings(raw) {
  const teams = (raw.data || raw.rankings || raw || []).map((t, i) => ({
    rank: t.rank || i + 1,
    team: t.team?.name || t.name || '',
    rating: t.rating || t.score || t.points || 0,
    wins: t.wins || t.w || 0,
    losses: t.losses || t.l || 0,
    region: t.region || '',
  }));
  return { teams, count: teams.length, updatedAt: new Date().toISOString() };
}
