# Widget 開發指南

> 如何為 ForceDesk 開發新的 Widget

## 目錄

- [快速開始](#快速開始)
- [Widget 範例](#widget-範例)
- [開發流程](#開發流程)
- [最佳實踐](#最佳實踐)

## 快速開始

### 開發環境準備

```bash
# 安裝依賴
npm install

# 啟動開發模式
npm run dev:electron
```

### Widget 類型

ForceDesk 支援三種類型的 Widget：

1. **純前端 Widget** - 不需要後端資料（如時鐘、行事曆）
2. **系統資訊 Widget** - 顯示系統狀態（CPU、記憶體等）
3. **外部資料 Widget** - 整合外部 API（天氣、股市、新聞等）

## Widget 範例

### 範例：建立一個天氣 Widget

#### 步驟 1：定義型別

**`src/shared/types/weather.ts`**
```typescript
export interface WeatherData {
  temperature: number;
  description: string;
  aqi?: number;
  location: string;
}
```

**匯出型別**
```typescript
// src/shared/types/index.ts
export * from './weather';
```

#### 步驟 2：建立 React 元件

**`src/components/Weather.tsx`**
```typescript
import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // 監聽來自 Electron 的天氣更新
    window.electronAPI?.onWeatherUpdate?.((data) => {
      setWeather(data);
    });

    // 請求載入天氣
    window.electronAPI?.getWeather?.();
  }, []);

  if (!weather) {
    return <div className="weather loading">載入中...</div>;
  }

  return (
    <div className="weather">
      <div className="temperature">{weather.temperature}°C</div>
      <div className="description">{weather.description}</div>
      <div className="location">{weather.location}</div>
      {weather.aqi && (
        <div className="aqi">AQI: {weather.aqi}</div>
      )}
    </div>
  );
}
```

**匯出元件**
```typescript
// src/components/index.ts
export { Weather } from './Weather';
```

#### 步驟 3：建立後端模組

**`electron/modules/weather.ts`**
```typescript
import type { BrowserWindow } from 'electron';
import type { WeatherData } from '../../src/shared/types/weather';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

/**
 * 取得天氣資料
 */
async function fetchWeather(): Promise<WeatherData> {
  // 1. 取得位置
  const locationRes = await fetch('http://ip-api.com/json/');
  const { lat, lon, city } = await locationRes.json();

  // 2. 取得天氣
  const weatherRes = await fetch(
    `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current_weather=true`
  );
  const weatherData = await weatherRes.json();

  return {
    temperature: Math.round(weatherData.current_weather.temperature),
    description: getWeatherDescription(weatherData.current_weather.weathercode),
    location: city,
  };
}

/**
 * 發送天氣更新到渲染進程
 */
export async function sendWeatherUpdate(
  mainWindow: BrowserWindow | null
): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    const weather = await fetchWeather();
    mainWindow.webContents.send('weather-update', weather);
  } catch (error) {
    console.error('[Weather] Failed to fetch:', error);
  }
}

function getWeatherDescription(code: number): string {
  // 天氣代碼對應描述
  const descriptions: Record<number, string> = {
    0: '晴朗',
    1: '大致晴朗',
    2: '局部多雲',
    3: '多雲',
    // ... 更多代碼
  };
  return descriptions[code] || '未知';
}
```

**匯出模組**
```typescript
// electron/modules/index.ts
export { sendWeatherUpdate } from './weather';
```

#### 步驟 4：註冊 IPC Handler

**`electron/main.ts`**
```typescript
import { sendWeatherUpdate } from './modules';

// 在 startDataUpdates() 中加入定時更新
function startDataUpdates(): void {
  // 天氣更新
  sendWeatherUpdate(mainWindow);
  setInterval(() => sendWeatherUpdate(mainWindow), 15 * 60 * 1000); // 15分鐘
}

// 註冊 IPC handler
ipcMain.on('get-weather', () => {
  sendWeatherUpdate(mainWindow);
});
```

#### 步驟 5：暴露 API 到渲染進程

**`electron/preload.ts`**
```typescript
import type { WeatherData } from '../src/shared/types/weather';

contextBridge.exposeInMainWorld('electronAPI', {
  // ... 其他 API

  // 天氣 API
  onWeatherUpdate: (callback: (data: WeatherData) => void) => {
    ipcRenderer.on('weather-update', (_event, data) => callback(data));
  },
  getWeather: () => {
    ipcRenderer.send('get-weather');
  },
});
```

**更新型別定義**
```typescript
// electron/preload.ts（在底部的型別聲明）
declare global {
  interface Window {
    electronAPI: {
      // ... 其他 API
      onWeatherUpdate?: (callback: (data: WeatherData) => void) => void;
      getWeather?: () => void;
    };
  }
}
```

#### 步驟 6：加入主佈局

**`src/App.tsx`**
```typescript
import { Weather } from './components';

function App() {
  return (
    <div className="app">
      <div className="widgets-left">
        <Weather />
        {/* 其他 widgets */}
      </div>
    </div>
  );
}
```

#### 步驟 7：新增樣式

**`src/styles/components/weather.css`**
```css
.weather {
  padding: var(--spacing-md);
  background: var(--color-glass);
  backdrop-filter: blur(var(--blur));
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.weather .temperature {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-primary);
}

.weather .description {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.weather .loading {
  opacity: 0.5;
}
```

## 開發流程

### 1. 規劃 Widget

- [ ] 確定資料來源（前端計算 / 系統資訊 / 外部 API）
- [ ] 設計 UI 介面
- [ ] 定義資料結構（TypeScript 介面）
- [ ] 規劃更新頻率

### 2. 型別定義

```typescript
// src/shared/types/your-widget.ts
export interface YourWidgetData {
  // 定義資料結構
}
```

### 3. 前端元件

```typescript
// src/components/YourWidget.tsx
export function YourWidget() {
  const [data, setData] = useState<YourWidgetData | null>(null);

  useEffect(() => {
    window.electronAPI?.onYourWidgetUpdate?.((newData) => {
      setData(newData);
    });

    window.electronAPI?.loadYourWidget?.();
  }, []);

  return <div className="your-widget">{/* UI */}</div>;
}
```

### 4. 後端邏輯（如需要）

```typescript
// electron/modules/your-widget.ts
export async function sendYourWidgetUpdate(
  mainWindow: BrowserWindow | null
): Promise<void> {
  // 資料處理邏輯
  mainWindow?.webContents.send('your-widget-update', data);
}
```

### 5. IPC 橋接

```typescript
// electron/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  onYourWidgetUpdate: (callback) => {
    ipcRenderer.on('your-widget-update', (_, data) => callback(data));
  },
  loadYourWidget: () => {
    ipcRenderer.send('load-your-widget');
  },
});
```

### 6. 測試

```bash
# 重新編譯 Electron
npx tsc -p tsconfig.electron.json

# 啟動開發模式
npm run dev:electron
```

## 最佳實踐

### 1. 錯誤處理

```typescript
try {
  const data = await fetchData();
  mainWindow.webContents.send('update', data);
} catch (error) {
  console.error('[YourWidget] Error:', error);
  // 發送空資料或錯誤狀態
  mainWindow.webContents.send('update', null);
}
```

### 2. 載入狀態

```typescript
export function YourWidget() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI?.onUpdate?.((newData) => {
      setData(newData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">載入中...</div>;
  if (!data) return <div className="error">載入失敗</div>;

  return <div>{/* 正常顯示 */}</div>;
}
```

### 3. 記憶體管理

```typescript
useEffect(() => {
  const cleanup = window.electronAPI?.onUpdate?.(callback);

  return () => {
    cleanup?.(); // 清理監聽器
  };
}, []);
```

### 4. 效能優化

```typescript
// 使用 React.memo 避免不必要的重新渲染
export const YourWidget = React.memo(function YourWidget() {
  // ...
});

// 使用 useMemo 快取計算結果
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 5. CSS 設計系統

```css
/* 使用 CSS 變數保持一致性 */
.your-widget {
  padding: var(--spacing-md);
  background: var(--color-glass);
  backdrop-filter: blur(var(--blur));
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
}

/* 使用語義化顏色 */
.value-positive {
  color: var(--color-success);
}

.value-negative {
  color: var(--color-error);
}
```

### 6. TypeScript 嚴格模式

```typescript
// 避免使用 any
❌ const data: any = await fetchData();
✅ const data: YourWidgetData = await fetchData();

// 處理可選值
❌ return <div>{data.value}</div>;
✅ return <div>{data?.value ?? '載入中'}</div>;

// 使用類型守衛
function isValidData(data: unknown): data is YourWidgetData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data
  );
}
```

## 除錯技巧

### Console 輸出

```typescript
// Main Process（顯示在終端機）
console.log('[YourWidget] Data:', data);

// Renderer Process（顯示在 DevTools）
console.log('[YourWidget] Rendering:', data);
```

### 開啟 DevTools

```typescript
// electron/main.ts
mainWindow.webContents.openDevTools(); // 暫時加入此行
```

### 檢查 IPC 通訊

```typescript
// 監聽所有 IPC 訊息
ipcRenderer.on('*', (event, ...args) => {
  console.log('IPC Event:', event, args);
});
```

## 範例 Widgets

查看現有的 Widget 實作作為參考：

- **簡單前端** - `src/components/Clock.tsx`
- **系統資訊** - `src/components/NetworkStats.tsx`
- **外部 API** - `src/components/Weather.tsx`
- **AI 整合** - `src/components/VibeCoding.tsx`

---

**相關文件：**
- [架構設計](./architecture.md)
- [貢獻指南](./contributing.md)
