/* ========== 工具函数 ========== */

// UTC时间 → 北京时间显示 (HH:mm)
function toBeijingTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit', minute: '2-digit'
    });
}

// UTC时间 → 完整日期 (月月/日日 HH:mm)
function toBeijingDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

// 相对时间描述
function getRelativeTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);
    const diffMin = Math.floor(absDiffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // 未来时间
    if (diffMs > 0) {
        if (diffDay > 1) return `${diffDay}天后`;
        if (diffDay === 1) return '明天 ' + toBeijingTime(isoString);
        if (diffHour >= 1) return `${diffHour}小时后`;
        if (diffMin >= 1) return `${diffMin}分钟后`;
        return '即将开始';
    }
    // 过去时间
    if (diffDay > 7) {
        return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit' });
    }
    if (diffDay >= 1) return `${diffDay}天前`;
    if (diffHour >= 1) return `${diffHour}小时前`;
    if (diffMin >= 1) return `${diffMin}分钟前`;
    return '刚刚';
}

// 日期分组标签
function getDateGroup(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDay = Math.round((target - today) / 86400000);

    if (diffDay === 0) return '今天';
    if (diffDay === 1) return '明天';
    if (diffDay === -1) return '昨天';
    return d.toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric'
    });
}

// 指数退避重试
async function retryFetch(fetchFn, maxRetries = 3, baseDelay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fetchFn();
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
