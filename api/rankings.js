let cache = { data: null, timestamp: 0 };
const TTL = 120000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < TTL) {
    return res.status(200).json(cache.data);
  }
  try {
    const html = await fetch('https://www.vlr.gg/rankings', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'VCT-Fan-Site/1.0' }
    }).then(r => { if (!r.ok) throw new Error('vlr.gg returned ' + r.status); return r.text(); });
    const teams = parseRankings(html);
    const result = { teams, count: teams.length, updatedAt: new Date().toISOString() };
    cache = { data: result, timestamp: now };
    return res.status(200).json(result);
  } catch (err) {
    if (cache.data) return res.status(200).json({ ...cache.data, _stale: true });
    return res.status(502).json({ error: true, message: '排名数据暂时无法加载，请稍后重试' });
  }
}

function parseRankings(html) {
  const teams = [];
  // Find ranking rows - vlr.gg uses a table with team name and rating
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>[^<]*<a[^>]*>([^<]+)<\/a>/g;
  let match;
  let rank = 0;
  while ((match = rowRegex.exec(html)) !== null && rank < 30) {
    rank++;
    teams.push({
      rank: parseInt(match[1]) || rank,
      team: match[2].trim(),
      rating: 0,
      wins: 0,
      losses: 0,
      region: '',
    });
  }

  // If regex didn't work, try alternative: extract from rank-item patterns
  if (teams.length === 0) {
    const blocks = html.split('rank-item');
    for (let i = 1; i < blocks.length && i <= 30; i++) {
      const block = blocks[i];
      const nameMatch = block.match(/<a[^>]*>([^<]+)<\/a>/);
      const ratingMatch = block.match(/rating[^>]*>\s*([\d.]+)\s*</);
      if (nameMatch) {
        teams.push({
          rank: i,
          team: nameMatch[1].trim(),
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
          wins: 0, losses: 0, region: '',
        });
      }
    }
  }

  return teams;
}
