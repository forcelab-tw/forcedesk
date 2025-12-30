# Electron + React 桌面小工具開發指南

## 技術棧

- **前端**: React 19 + TypeScript + Vite
- **後端**: Electron + TypeScript
- **樣式**: 純 CSS（深色玻璃擬態風格）
- **系統資訊**: systeminformation 套件

## 專案結構

```
desktop-widget/
├── electron/
│   ├── main.ts          # Electron 主進程
│   ├── preload.ts       # 預載腳本（IPC 橋接）
│   └── system-info.ts   # 系統資訊收集
├── src/
│   ├── App.tsx          # 主應用組件
│   ├── App.css          # 全域樣式
│   ├── types.ts         # TypeScript 類型定義
│   └── components/      # UI 組件
├── package.json
├── tsconfig.json
├── tsconfig.electron.json
└── vite.config.ts
```

## 核心設計模式

### 1. IPC 通訊架構

**主進程 → 渲染進程（推送數據）**
```typescript
// main.ts - 發送數據
mainWindow.webContents.send('event-name', data);

// preload.ts - 暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  onEventName: (callback: (data: DataType) => void) => {
    ipcRenderer.on('event-name', (_event, data) => callback(data));
  },
});

// React 組件 - 接收數據
useEffect(() => {
  window.electronAPI?.onEventName((data) => {
    setState(data);
  });
}, []);
```

**渲染進程 → 主進程（請求數據）**
```typescript
// preload.ts
getData: () => ipcRenderer.send('get-data');

// main.ts
ipcMain.on('get-data', async () => {
  const data = await fetchData();
  mainWindow.webContents.send('data-update', data);
});
```

### 2. 定時更新模式

```typescript
// main.ts
function startDataUpdates() {
  // 立即執行一次
  sendDataUpdate();

  // 定時更新
  setInterval(() => {
    sendDataUpdate();
  }, UPDATE_INTERVAL);
}
```

### 3. 彈窗視窗模式

```typescript
let popupWindow: BrowserWindow | null = null;

function showPopup(): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.focus();
    return;
  }

  popupWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: '彈窗標題',
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `<!DOCTYPE html>...`;
  popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}
```

### 4. Menu Bar Tray 選單

```typescript
function createTray(): void {
  const icon = nativeImage.createFromBuffer(iconBuffer);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('App Name');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '選項一',
      click: () => { /* 動作 */ },
    },
    {
      label: '子選單',
      submenu: [
        { label: '子選項', click: () => {} },
      ],
    },
    { type: 'separator' },
    { label: '結束', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
}
```

## UI 組件設計模式

### 1. 卡片組件

```tsx
function WidgetCard({ title, children }: Props) {
  return (
    <div className="widget">
      <div className="widget-title">{title}</div>
      {children}
    </div>
  );
}
```

### 2. 環形進度條

```tsx
function GaugeRing({ value, max, size, color, label }: Props) {
  const progress = (value / max) * 100;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 100 100">
      <circle className="bg" cx="50" cy="50" r="45" />
      <circle
        className="progress"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress / 100)}
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
}
```

### 3. 固定高度列表（避免跳動）

```css
.list-item {
  min-height: 28px;
  box-sizing: border-box;
}

.list-item-placeholder {
  background: rgba(255, 255, 255, 0.02);
}
```

```tsx
// 固定顯示 N 個項目
{Array.from({ length: MAX_COUNT }).map((_, i) => {
  const item = items[i];
  return item
    ? <Item key={i} data={item} />
    : <div key={i} className="placeholder" />;
})}
```

### 4. 文字截斷

```css
.text-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;  /* 最多 2 行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: calc(font-size * line-height * 2);  /* 固定高度 */
}
```

## 外部 API 整合

### 1. 天氣 API（Open-Meteo）

```typescript
// IP 地理定位
const geo = await fetchJson('http://ip-api.com/json/?fields=city,lat,lon');

// 天氣數據
const weather = await fetchJson(
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
);

// 空氣品質
const aqi = await fetchJson(
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`
);
```

### 2. 股市 API（Yahoo Finance）

```typescript
const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
const data = await fetchJson(url);
```

### 3. 新聞 API（NewsAPI）

```typescript
const url = `https://newsapi.org/v2/everything?q=${keywords}&apiKey=${API_KEY}`;
```

## 樣式設計（深色玻璃擬態）

### 基礎變數

```css
:root {
  --bg-primary: rgba(20, 20, 30, 0.85);
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-hover: rgba(255, 255, 255, 0.1);
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.6);
  --border: rgba(255, 255, 255, 0.1);
}
```

### 卡片樣式

```css
.widget {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
}
```

### 台灣股市顏色慣例

```css
.stock-up { color: #ef4444; }   /* 漲：紅色 */
.stock-down { color: #22c55e; } /* 跌：綠色 */
```

## 開發指令

```bash
# 開發模式（前端 + Electron）
npm run dev:electron

# 僅前端開發
npm run dev

# 編譯 Electron TypeScript
npx tsc -p tsconfig.electron.json

# 打包應用
npm run build:electron
```

## 注意事項

1. **修改 Electron 後端代碼後需重新編譯**
   ```bash
   npx tsc -p tsconfig.electron.json
   ```

2. **preload.ts 中的介面必須與 main.ts 保持同步**

3. **使用 `contextBridge` 安全暴露 API，避免直接使用 `nodeIntegration`**

4. **彈窗視窗使用 `data:text/html` URL 載入動態 HTML**

5. **Tray 圖示在 macOS 上需設置 `setTemplateImage(true)`**

6. **避免在 iframe 中載入外部網站（會被 X-Frame-Options 阻擋），改用 BrowserWindow 直接導航**
