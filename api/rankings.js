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
    // 先尝试抓取主排名页（多栏布局，包含所有区域概览）
    const html = await fetch('https://www.vlr.gg/rankings', {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'VCT-Fan-Site/1.0' }
    }).then(r => { if (!r.ok) throw new Error('vlr.gg returned ' + r.status); return r.text(); });

    const regions = parseRankings(html);

    if (Object.keys(regions).length === 0) {
      throw new Error('未能解析到排名数据');
    }

    const result = { regions, updatedAt: new Date().toISOString() };
    cache = { data: result, timestamp: now };
    return res.status(200).json(result);

  } catch (err) {
    if (cache.data) return res.status(200).json({ ...cache.data, _stale: true });
    return res.status(502).json({ error: true, message: '排名数据暂时无法加载，请稍后重试' });
  }
}

function parseRankings(html) {
  const regions = {};

  // 按 world-rankings-col 分割，每个块代表一个区域
  const colBlocks = html.split('world-rankings-col');

  for (let i = 1; i < colBlocks.length; i++) {
    const block = colBlocks[i];

    // 提取区域名称：<h2 class="wf-label mod-large mod-world">REGION</h2>
    const headingMatch = block.match(/wf-label\s+mod-large\s+mod-world[^>]*>\s*([^<]+)\s*</);
    if (!headingMatch) continue;
    const regionName = headingMatch[1].trim();

    // 提取该区域下的所有队伍行
    const teams = [];
    const rows = block.split('wf-card mod-hover');

    for (let j = 1; j < rows.length; j++) {
      const row = rows[j];

      // 排名：从 a 标签显示文本获取（1, 2, 3...），不用 data-sort-value（1000, 999...）
      const rankMatch = row.match(/rank-item-rank[^>]*>[\s\S]*?<a[^>]*>\s*(\d+)\s*</);
      let rank = rankMatch ? parseInt(rankMatch[1]) : 0;

      // 队伍名：从 data-sort-value 属性（不含 flag 等干扰），显示文本可能含额外信息
      const teamSortMatch = row.match(/rank-item-team[^>]*data-sort-value="([^"]*)"/);
      let teamName = teamSortMatch ? teamSortMatch[1].trim() : '';
      // 备选方案：从 div 内的第一段文本提取
      if (!teamName) {
        const divMatch = row.match(/rank-item-team[^>]*>[\s\S]*?<div[^>]*>\s*([^<\n]+)/);
        if (divMatch) teamName = divMatch[1].trim();
      }

      // 国家/地区：rank-item-team-country 内的文本
      const countryMatch = row.match(/rank-item-team-country[^>]*>\s*([^<]+)\s*</);
      const country = countryMatch ? countryMatch[1].trim() : '';

      // Logo 图片
      const logoMatch = row.match(/rank-item-team[^>]*>[\s\S]*?<img\s+src="([^"]*)"/);
      const logo = logoMatch ? logoMatch[1].trim() : '';

      // Rating：取 a 标签内显示的数值（2000），不是 data-sort-value（1944）
      const ratingMatch = row.match(/rank-item-rating[^>]*>[\s\S]*?<a[^>]*>\s*(\d+)\s*</);
      let rating = ratingMatch ? parseInt(ratingMatch[1]) : 0;

      if (teamName) {
        teams.push({
          rank: rank || teams.length + 1,
          team: teamName,
          country,
          logo,
          rating,
          region: regionName,
        });
      }
    }

    if (teams.length > 0) {
      regions[regionName] = teams;
    }
  }

  return regions;
}
