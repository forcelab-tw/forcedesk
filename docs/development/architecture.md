# ForceDesk 架構設計

> 本文件說明 ForceDesk 的系統架構、設計理念與技術決策。

## 目錄

- [概述](#概述)
- [三層架構](#三層架構)
- [資料流](#資料流)
- [設計理念](#設計理念)
- [技術選型](#技術選型)

## 概述

ForceDesk 採用 Electron + React 架構，實現 macOS 桌面透明覆蓋層的 Widget 系統。

### 核心特性
- **透明穿透視窗** - 不干擾其他應用程式操作
- **模組化 Widget** - 每個功能獨立封裝
- **多資料源整合** - 系統資訊、外部 API、AI 生成內容
- **即時更新** - 不同資料源的智慧更新策略

## 三層架構

### 1. Electron Main Process (`electron/`)

**職責：**
- 視窗管理與系統整合
- IPC 通訊處理
- 外部 API 呼叫
- 系統資訊收集

**核心模組：**
```typescript
electron/
├── main.ts              // 主進程入口、視窗管理
├── preload.ts           // Context Bridge 安全橋接
├── system-info.ts       // 系統資訊收集
└── modules/             // 功能模組
    ├── weather.ts       // 天氣資料
    ├── stocks.ts        // 股市資料
    ├── news/            // 新聞處理（含 AI）
    ├── todos.ts         // 待辦事項
    ├── horoscope.ts     // 星座運勢
    ├── vibe-coding.ts   // Vibe Coding
    ├── claude-usage.ts  // Claude 使用量
    └── tray.ts          // 系統托盤選單
```

### 2. React Renderer (`src/`)

**職責：**
- UI 渲染與互動
- 狀態管理
- 視覺效果

**元件架構：**
```typescript
src/
├── App.tsx              // 主佈局（雙欄）
├── components/          // Widget 元件
│   ├── SystemStats.tsx  // 系統監控類
│   ├── Weather.tsx      // 資訊類
│   ├── TodoList.tsx     // 生產力工具
│   ├── MatrixRain.tsx   // 視覺效果
│   └── Widget.tsx       // 共用 Widget 容器
├── hooks/               // 共用 Hooks
├── utils/               // 工具函數
└── types.ts             // TypeScript 型別定義
```

### 3. IPC 通訊層

**通訊模式：**

```typescript
// Main → Renderer (Push)
mainWindow.webContents.send('event-name', data);

// Renderer → Main (Request)
window.electronAPI.methodName();

// Renderer 監聽 (Callback)
window.electronAPI.onEventName((data) => { ... });
```

**安全設計：**
- 所有 API 透過 `preload.ts` 的 Context Bridge 暴露
- 不直接暴露 Node.js 或 Electron API
- 型別定義雙重驗證（`src/types.ts` + `electron/preload.ts`）

## 資料流

### 系統資訊流 (即時推送)

```
┌─────────────┐
│ Main Process│
│  (2秒輪詢)  │
└──────┬──────┘
       │ systeminformation
       ↓
┌─────────────────┐
│ system-info.ts  │
│ CPU/RAM/Net/Disk│
└────────┬────────┘
         │ IPC send
         ↓
    ┌─────────┐
    │ Renderer│
    │ (即時更新)│
    └─────────┘
```

### 外部 API 流 (定時拉取)

```
┌─────────────┐
│ Main Process│
│(定時觸發器) │
└──────┬──────┘
       │
       ├─→ Weather (15分鐘)
       ├─→ Stocks  (5分鐘)
       ├─→ News    (30分鐘)
       └─→ Horoscope (每日)
       │
       ↓ API fetch
┌──────────────┐
│ 外部 API      │
│ + Claude CLI  │
└──────┬───────┘
       │ 處理 & 快取
       ↓
    ┌─────────┐
    │ Renderer│
    │ (更新顯示)│
    └─────────┘
```

## 設計理念

### 1. 非侵入式體驗

**視窗配置：**
```typescript
{
  transparent: true,      // 視窗透明
  frame: false,           // 無邊框
  type: 'desktop',        // 桌面層級
  focusable: false,       // 不可聚焦
  setIgnoreMouseEvents()  // 完全穿透
}
```

**結果：**
- 使用者可以正常點擊桌面與應用程式圖示
- Widget 作為背景資訊層，不干擾工作流程

### 2. 模組化設計

**新增 Widget 只需 6 步驟：**

1. 建立元件：`src/components/NewWidget.tsx`
2. 匯出元件：`src/components/index.ts`
3. 定義型別：`src/types.ts`
4. 新增 IPC Handler：`electron/main.ts`
5. 暴露 API：`electron/preload.ts`
6. 加入佈局：`src/App.tsx`

### 3. 效能優先

**更新策略：**

| 資料類型 | 更新頻率 | 快取策略 | 原因 |
|---------|---------|---------|------|
| 系統資訊 | 2秒 | 無 | 即時性要求高 |
| 天氣 | 15分鐘 | 記憶體 | API 限制 + 變化慢 |
| 股市 | 5分鐘 | 記憶體 | 交易時間需即時 |
| 新聞 | 30分鐘 | 檔案 + 記憶體 | 包含圖片快取 |
| 星座/Vibe | 每日 | 檔案 | 一天一次即可 |

**最佳化技巧：**
- React.memo() 避免不必要的重新渲染
- 圖片本地快取（新聞圖片）
- 懶載入非關鍵元件

## 技術選型

### 為什麼選 Electron？

**優點：**
- ✅ 成熟的桌面應用框架
- ✅ systeminformation 完整支援
- ✅ 快速開發與迭代
- ✅ 豐富的生態系統

**缺點：**
- ❌ 記憶體佔用較大 (~100MB)
- ❌ 打包體積較大

**替代方案考量：**
- **Tauri**：更輕量，但生態較新，systeminformation 支援有限
- **原生開發**：開發成本高，跨平台困難

### 為什麼用純 CSS？

**決策原因：**
- 專案規模小，不需要 CSS-in-JS 或 Tailwind
- 設計系統一致（CSS 變數統一管理）
- 效能最佳（無執行時開銷）

**CSS 變數系統：**
```css
:root {
  /* 顏色 */
  --color-bg: #0a0e1a;
  --color-glass: rgba(255, 255, 255, 0.05);

  /* 間距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;

  /* 效果 */
  --blur: 10px;
  --border-radius: 12px;
}
```

### 為什麼整合 Claude CLI？

**使用場景：**
1. **AI 新聞處理** - 篩選、翻譯、摘要
2. **Vibe Coding** - 動態生成每日開發運勢

**優勢：**
- 快速原型驗證
- 無需管理 API key（使用本機 Claude CLI）
- 可追蹤使用量

**限制：**
- 需要使用者安裝 Claude CLI
- 成本控制依賴使用者帳號

## 安全性考量

### Context Isolation

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // 只暴露必要的 API
  getWeather: () => ipcRenderer.invoke('get-weather'),
  // 避免暴露整個 ipcRenderer
});
```

### macOS 權限

**需要的權限：**
- 提醒事項存取（TodoList Widget）
- 網路存取（外部 API）

**處理方式：**
- AppleScript 請求權限
- 失敗時 fallback 到本地檔案

## 未來架構考量

### 插件系統

**目標：**
- 允許使用者自訂 Widget
- 動態載入第三方 Widget

**挑戰：**
- 安全性（沙箱化）
- API 穩定性
- 版本相容性

### 跨平台支援

**Windows/Linux 適配：**
- 視窗管理差異（無 `type: 'desktop'`）
- 系統資訊 API 差異
- AppleScript 替代方案

---

**相關文件：**
- [Widget 開發指南](./widget-development.md)
- [貢獻指南](./contributing.md)
