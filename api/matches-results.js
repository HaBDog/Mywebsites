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
      'https://esport.is/api/results?game=valorant',
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);

    const raw = await response.json();
    const transformed = transformResults(raw);
    cache = { data: transformed, timestamp: now };
    return res.status(200).json(transformed);
  } catch (err) {
    if (cache.data) {
      return res.status(200).json({ ...cache.data, _stale: true });
    }
    return res.status(502).json({ error: true, message: '比赛结果暂时无法加载，请稍后重试' });
  }
}

function transformResults(raw) {
  const matches = (raw.data || raw.matches || raw || []).map(m => ({
    id: m.id || m.match_id || '',
    teamA: m.team_a?.name || m.team1?.name || m.home?.name || 'Team A',
    teamB: m.team_b?.name || m.team2?.name || m.away?.name || 'Team B',
    scoreA: m.team_a?.score ?? m.team1?.score ?? m.home?.score ?? 0,
    scoreB: m.team_b?.score ?? m.team2?.score ?? m.away?.score ?? 0,
    winner: m.winner || (m.team_a?.score > m.team_b?.score ? 'a' : 'b'),
    tournament: m.tournament?.name || m.event?.name || m.league?.name || '',
    endTime: m.end_time || m.finished_at || m.date || '',
  }));
  return { matches, count: matches.length, updatedAt: new Date().toISOString() };
}
