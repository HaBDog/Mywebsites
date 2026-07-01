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
    const html = await fetch('https://www.vlr.gg/matches', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'VCT-Fan-Site/1.0' }
    }).then(r => { if (!r.ok) throw new Error('vlr.gg returned ' + r.status); return r.text(); });

    const matches = parseMatches(html).filter(m => m.status === 'live');
    const result = { matches, count: matches.length, updatedAt: new Date().toISOString() };
    cache = { data: result, timestamp: now };
    return res.status(200).json(result);
  } catch (err) {
    if (cache.data) return res.status(200).json({ ...cache.data, _stale: true });
    return res.status(502).json({ error: true, message: '赛事数据暂时无法加载，请稍后重试' });
  }
}

function parseMatches(html) {
  const matches = [];
  // Find all match item blocks
  const blocks = html.split('wf-module-item match-item');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      // Extract href and match ID
      const hrefMatch = block.match(/href="\/(\d+)\/([^"]+)"/);
      const id = hrefMatch ? hrefMatch[1] : '';

      // Check status
      const isLive = block.includes('mod-live');
      const isUpcoming = block.includes('mod-upcoming') || block.includes('mod-upcoming');
      const isCompleted = !isLive && !block.includes('mod-upcoming') && !block.includes('&ndash;');

      let status = 'completed';
      if (isLive) status = 'live';
      else if (block.includes('&ndash;') && !block.includes('mod-live')) status = 'upcoming';

      // Team names
      const teamNames = [];
      const nameRegex = /match-item-vs-team-name[^]*?text-of[^>]*>([^<]+(?:<[^>]+>[^<]*)?)/g;
      let nameMatch;
      while ((nameMatch = nameRegex.exec(block)) !== null) {
        teamNames.push(nameMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      // Scores
      const scoreRegex = /match-item-vs-team-score[^>]*>\s*([\d\–\-\—]+)\s*</g;
      const scores = [];
      let scoreMatch;
      while ((scoreMatch = scoreRegex.exec(block)) !== null) {
        const s = scoreMatch[1].trim();
        scores.push(s === '–' || s === '-' || s === '—' ? null : parseInt(s));
      }

      // Time
      const timeMatch = block.match(/match-item-time[^>]*>\s*([^<]+)\s*</);
      const time = timeMatch ? timeMatch[1].trim() : '';

      // ETA / countdown
      const etaMatch = block.match(/ml-eta[^>]*>\s*([^<]+)\s*</);
      const eta = etaMatch ? etaMatch[1].trim() : '';

      // Status text
      const statusMatch = block.match(/ml-status[^>]*>\s*([^<]+)\s*</);
      const statusText = statusMatch ? statusMatch[1].trim() : '';

      // Event / tournament
      const eventMatch = block.match(/match-item-event text-of[^>]*>\s*(?:<[^>]+>)*\s*([^<]+)/);
      let event = '';
      if (block.includes('match-item-event-series')) {
        const seriesMatch = block.match(/match-item-event-series[^>]*>\s*([^<]+)\s*</);
        event = seriesMatch ? seriesMatch[1].trim() : '';
      }
      if (!event) {
        event = eventMatch ? eventMatch[1].trim() : '';
      } else {
        const mainEvent = eventMatch ? eventMatch[1].trim() : '';
        event = mainEvent ? mainEvent + ' - ' + event : event;
      }

      if (teamNames.length >= 2) {
        matches.push({
          id,
          teamA: teamNames[0] || 'Team A',
          teamB: teamNames[1] || 'Team B',
          scoreA: status === 'upcoming' ? 0 : (scores[0] ?? 0),
          scoreB: status === 'upcoming' ? 0 : (scores[1] ?? 0),
          status,
          statusText: statusText || (status === 'live' ? 'LIVE' : status === 'upcoming' ? 'Upcoming' : ''),
          time,
          eta,
          tournament: event || '',
          bestOf: 'BO3',
        });
      }
    } catch (e) { /* skip bad blocks */ }
  }
  return matches;
}
