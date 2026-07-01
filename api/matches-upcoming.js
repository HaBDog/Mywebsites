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
    const matches = parseMatches(html).filter(m => m.status === 'upcoming');
    const result = { matches, count: matches.length, updatedAt: new Date().toISOString() };
    cache = { data: result, timestamp: now };
    return res.status(200).json(result);
  } catch (err) {
    if (cache.data) return res.status(200).json({ ...cache.data, _stale: true });
    return res.status(502).json({ error: true, message: '赛程数据暂时无法加载，请稍后重试' });
  }
}

function parseMatches(html) {
  const matches = [];
  const blocks = html.split('wf-module-item match-item');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      const hrefMatch = block.match(/href="\/(\d+)\/([^"]+)"/);
      const id = hrefMatch ? hrefMatch[1] : '';
      const isLive = block.includes('mod-live');
      const hasDash = block.includes('&ndash;') || /mod-upcoming/.test(block);
      const status = (isLive ? 'live' : (hasDash ? 'upcoming' : 'completed'));
      const teamNames = [];
      const nameRegex = /match-item-vs-team-name[^]*?text-of[^>]*>([^<]+(?:<[^>]+>[^<]*)?)/g;
      let nm;
      while ((nm = nameRegex.exec(block)) !== null) teamNames.push(nm[1].replace(/<[^>]+>/g, '').trim());
      const timeMatch = block.match(/match-item-time[^>]*>\s*([^<]+)\s*</);
      const time = timeMatch ? timeMatch[1].trim() : '';
      const etaMatch = block.match(/ml-eta[^>]*>\s*([^<]+)\s*</);
      const eta = etaMatch ? etaMatch[1].trim() : '';
      let event = '';
      const seriesMatch = block.match(/match-item-event-series[^>]*>\s*([^<]+)\s*</);
      if (seriesMatch) event = seriesMatch[1].trim();
      const eventMatch = block.match(/match-item-event text-of[^>]*>\s*(?:<[^>]+>)*\s*([^<]+)/);
      const mainEvent = eventMatch ? eventMatch[1].trim() : '';
      if (event) event = mainEvent + ' - ' + event; else event = mainEvent;
      if (teamNames.length >= 2) {
        const now = new Date();
        const matchDate = time ? new Date(time) : now;
        matches.push({
          id, teamA: teamNames[0], teamB: teamNames[1],
          startTime: matchDate.toISOString(), time, eta, status,
          tournament: event || '', bestOf: 'BO3',
        });
      }
    } catch (e) {}
  }
  return matches;
}
