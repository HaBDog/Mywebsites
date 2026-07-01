let cache = { data: null, timestamp: 0 };
const TTL = 45000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const now = Date.now();

  if (cache.data && (now - cache.timestamp) < TTL) {
    return res.status(200).json(cache.data);
  }

  try {
    const response = await fetch(
      'https://esport.is/api/matches/upcoming?game=valorant',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);

    const raw = await response.json();
    const transformed = transformUpcoming(raw);
    cache = { data: transformed, timestamp: now };
    return res.status(200).json(transformed);
  } catch (err) {
    if (cache.data) {
      return res.status(200).json({ ...cache.data, _stale: true });
    }
    return res.status(502).json({ error: true, message: '赛程数据暂时无法加载，请稍后重试' });
  }
}

function transformUpcoming(raw) {
  const matches = (raw.data || raw.matches || raw || []).map(m => ({
    id: m.id || m.match_id || '',
    teamA: m.team_a?.name || m.team1?.name || m.home?.name || 'Team A',
    teamB: m.team_b?.name || m.team2?.name || m.away?.name || 'Team B',
    startTime: m.start_time || m.scheduled_at || m.date || '',
    tournament: m.tournament?.name || m.event?.name || m.league?.name || '',
    bestOf: m.best_of || m.format || 'BO3',
  }));
  return { matches, count: matches.length, updatedAt: new Date().toISOString() };
}
