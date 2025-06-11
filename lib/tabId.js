// 生成唯一的標籤頁 ID
export function generateTabId() {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// 獲取或創建標籤頁 ID
export function getTabId() {
    if (typeof window === 'undefined') return null;
    
    let tabId = localStorage.getItem('tabId');
    if (!tabId) {
        tabId = generateTabId();
        localStorage.setItem('tabId', tabId);
    }
    return tabId;
}

// 清除標籤頁 ID
export function clearTabId() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('tabId');
} 