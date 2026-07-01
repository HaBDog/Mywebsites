# 无畏契约赛事中心 (Valorant Esports Hub)

## 项目概述
实时无畏契约电竞比赛信息网站，支持正在直播、即将开始、比赛结果、战队排名四个板块。

## 技术架构
- **前端**: 纯 HTML/CSS/JS（无框架）
- **后端 API**: Vercel Serverless Functions（Node.js，抓取 vlr.gg）
- **数据源**: 直接从 vlr.gg 抓取 HTML 并解析
- **部署**: Vercel（自动从 GitHub 部署）

## 关键文件
```
index.html          - 主页面结构（4 个 tab 板块）
css/style.css       - Valorant 暗色电竞主题
js/utils.js         - 时间格式化、相对时间、重试逻辑
js/api.js           - 前端 API 调用层（fetch /api/*）
js/render.js        - DOM 渲染（比赛卡片、排名表格、骨架屏）
js/main.js          - 应用控制器（标签切换、45s 自动刷新）
api/matches-live.js     - Vercel 函数：从 vlr.gg 抓取并解析直播比赛
api/matches-upcoming.js - Vercel 函数：抓取即将开始的比赛
api/matches-results.js  - Vercel 函数：抓取比赛结果
api/rankings.js         - Vercel 函数：抓取战队排名
vercel.json         - Vercel 部署配置
```

## 部署信息
- **GitHub 仓库**: https://github.com/HaBDog/Mywebsites
- **Vercel 域名**: https://mywebsites-nine.vercel.app/
- **GitHub 用户**: HaBDog
- **推送方式**: GitHub Desktop（避免网络问题）

## 工作流程
1. 本地修改文件
2. GitHub Desktop 中 commit + push
3. Vercel 自动检测 GitHub push 并重新部署

## 数据抓取逻辑
所有 API 函数抓取 `https://www.vlr.gg/matches` 页面，根据 CSS class 解析：
- `match-item` → 比赛条目
- `mod-live` → 直播中的比赛
- `mod-upcoming` / `&ndash;` → 即将开始的比赛
- 数字比分 → 已完成的比赛
- `match-item-vs-team-name` → 队伍名
- `match-item-event` → 赛事名称

缓存策略：每个函数 45 秒内存缓存，降级返回旧数据。
