# ForceDesk - macOS 桌面小工具
## Cursor 開發者聚會分享

---

## 關於我

- 專案背景
- 為什麼做這個專案
- 使用的 AI 開發工具

---

## 專案 Demo

### 一句話介紹
**macOS 桌面透明覆蓋層 + 系統監控 + 實用工具集合**

### 實際畫面展示
- 展示運行中的應用程式
- 各個 widget 互動操作
- 系統托盤功能

---

## 功能面：有哪些 Widgets？

### 系統監控類
- **CPU 使用率** - 即時顯示多核心使用狀況
- **記憶體監控** - 已用/總容量視覺化
- **網路流量** - 上傳/下載速度追蹤
- **磁碟空間** - 剩餘空間警示

### 資訊類 Widgets
- **天氣預報** - Open-Meteo API + 自動定位
- **股市行情** - 台股 + 美股三大指數（遵循台灣紅漲綠跌慣例）
- **AI 新聞** - NewsAPI + Claude CLI 自動翻譯與摘要
- **星座運勢** - 每日運勢與幸運指數

### 生產力工具
- **待辦事項** - 整合 macOS 提醒事項
- **番茄鐘** - 專注計時器
- **行事曆** - 當月日曆檢視

### 工程師專屬
- **Vibe Coding 吉凶** - 用 Claude CLI 生成每日開發運勢
- **Claude Usage Monitor** - 追蹤 API 使用量
- **Dino Tamagotchi** - 電子恐龍寵物（互動遊戲）

### 視覺效果
- **Matrix Rain** - 駭客風背景動畫
- **RGB 氛圍燈** - 可調色彩效果

---

## 技術面：架構設計

### 技術棧
```
前端: React 19 + TypeScript + Vite
桌面: Electron
樣式: 純 CSS（無框架）
系統: systeminformation
```

### 三層架構

#### 1️⃣ Electron Main Process (`electron/`)
```typescript
main.ts          // 視窗管理、IPC handlers、外部 API
preload.ts       // Context Bridge 安全橋接
system-info.ts   // 系統資訊收集（CPU/RAM/Network/Disk）
```

#### 2️⃣ React Renderer (`src/`)
```typescript
App.tsx          // 雙欄佈局主畫面
components/      // 16+ 個獨立 widget 元件
types.ts         // 共用 TypeScript 型別定義
```

#### 3️⃣ IPC 通訊模式
```typescript
// Main → Renderer (Push)
mainWindow.webContents.send('system-stats', data)

// Renderer → Main (Request-Response)
window.electronAPI.getWeather()
```

---

## 技術亮點 1：透明穿透視窗

### 挑戰：如何做到桌面級別的透明覆蓋層？

```typescript
const mainWindow = new BrowserWindow({
  transparent: true,      // 視窗透明
  frame: false,           // 無邊框
  hasShadow: false,       // 無陰影
  type: 'desktop',        // 桌面級別 z-index
  focusable: false,       // 不可聚焦
  // ...
})

// 完全穿透滑鼠事件
mainWindow.setIgnoreMouseEvents(true)
```

### 結果
- 不干擾其他應用程式操作
- 永遠顯示在桌面層
- 系統托盤控制開關

---

## 技術亮點 2：系統資訊收集

### 使用 `systeminformation` 庫

```typescript
// 每 2 秒更新一次
setInterval(async () => {
  const cpu = await si.currentLoad()
  const mem = await si.mem()
  const network = await si.networkStats()
  const disk = await si.fsSize()

  mainWindow.webContents.send('system-stats', {
    cpu: cpu.currentLoad,
    cpuCores: cpu.cpus,
    memory: { used: mem.used, total: mem.total },
    network: { upload, download },
    disk: { used, size }
  })
}, 2000)
```

### 視覺化元件
- 自製 `GaugeRing` 環形進度條
- 即時動畫更新
- 漸層色彩編碼（綠→黃→紅）

---

## 技術亮點 3：AI 深度整合

### Claude CLI 的創意應用

#### 用途 1：AI 新聞處理
```typescript
// 1. 抓取原始新聞（NewsAPI）
// 2. Claude CLI 過濾 + 翻譯 + 摘要
const processedNews = await claudeCLI.process({
  articles: rawNews,
  task: '篩選 AI 相關新聞，翻譯成繁體中文，生成摘要'
})
```

#### 用途 2：Vibe Coding 吉凶
```typescript
// 每天生成工程師專屬運勢
const vibeResult = await claudeCLI.generate({
  prompt: '生成今日寫 code 的吉凶運勢、適合做的事、避免的事'
})
```

### 為什麼用 Claude CLI？
- 快速原型驗證
- 無需處理 API key 管理
- 可追蹤使用量（透過 `ClaudeUsage` widget）

---

## 技術亮點 4：模組化架構

### 新增 Widget 只需 6 步驟

```typescript
// 1. 建立元件
src/components/YourWidget.tsx

// 2. 匯出
src/components/index.ts

// 3. 定義型別
src/types.ts
electron/preload.ts

// 4. 新增 IPC handler
electron/main.ts

// 5. 暴露 API
electron/preload.ts → window.electronAPI.yourFeature()

// 6. 加到佈局
src/App.tsx
```

### 優點
- 高內聚低耦合
- 每個 widget 獨立運作
- 易於測試與維護

---

## 技術亮點 5：資料更新策略

### 不同資料源的更新頻率

| 資料類型 | 更新頻率 | 原因 |
|---------|---------|------|
| 系統資訊 | 2 秒 | 即時性要求高 |
| 天氣 | 15 分鐘 | API 限制 + 變化慢 |
| 股市 | 5 分鐘 | 交易時間需即時 |
| 新聞 | 30 分鐘 | 內容更新慢 |
| 星座/Vibe | 每日 | 一天一次即可 |

### 實作技巧
```typescript
// Main process 統一管理
setupPeriodicFetch(fetchWeather, 15 * 60 * 1000)
setupPeriodicFetch(fetchStocks, 5 * 60 * 1000)
setupPeriodicFetch(fetchNews, 30 * 60 * 1000)
```

---

## 開發體驗：與 AI 協作

### 使用的 AI 工具
- **Cursor** - 程式碼編輯與重構
- **Claude Code** - 架構設計與除錯
- **Claude CLI** - 動態內容生成

### AI 輔助開發的實際案例

#### 案例 1：模組化重構
```
我：「幫我把所有 widget 的共用邏輯抽取成 hooks」
Cursor：自動識別重複模式 → 生成 custom hooks
```

#### 案例 2：型別安全
```
我：「確保所有 IPC 通訊都有正確的 TypeScript 型別」
Claude Code：分析整個專案 → 統一型別定義
```

#### 案例 3：CSS 設計系統
```
我：「建立 CSS 變數系統，統一顏色和間距」
AI：生成設計 token → 重構所有元件樣式
```

---

## 開發挑戰與解決

### 挑戰 1：ES Module vs CommonJS 衝突
**問題：**
- 專案使用 `"type": "module"` (ES Module)
- Electron 編譯輸出 CommonJS
- 啟動錯誤：`exports is not defined`

**解決方案：**
```json
// dist-electron/package.json
{
  "type": "commonjs"
}
```

### 挑戰 2：股市顏色慣例差異
**問題：** 台灣紅漲綠跌 vs 美國綠漲紅跌

**解決方案：**
```typescript
// 遵循台灣慣例，所有市場統一
const colors = {
  up: '#ef4444',    // 紅色
  down: '#22c55e'   // 綠色
}
```

### 挑戰 3：macOS 提醒事項整合
**問題：** 需要 AppleScript 權限

**解決方案：**
```typescript
// 使用 JXA (JavaScript for Automation)
const { stdout } = await exec(`osascript -l JavaScript -e '...'`)
```

---

## 設計理念

### 視覺設計
- **深色玻璃擬態** (Glassmorphism)
- **低飽和度配色** - 不干擾主要工作
- **動態效果** - Matrix Rain、RGB 燈效
- **一致性** - 所有 widget 統一設計語言

### 互動設計
- **非侵入式** - 完全穿透，不影響操作
- **快速存取** - 系統托盤一鍵開關
- **資訊密度** - 在有限空間展示最多實用資訊

### 程式碼品質
- **TypeScript 嚴格模式** - 完整型別覆蓋
- **模組化** - 每個 widget 獨立元件
- **註解** - 繁體中文註解，易於維護

---

## 專案統計

```bash
# 程式碼行數
src/         ~2000 行 TypeScript + TSX
electron/    ~1500 行 TypeScript
styles/      ~1000 行 CSS

# 元件數量
Widgets:     16 個
Utilities:   8 個模組
Types:       完整型別定義

# 外部整合
APIs:        5 個（天氣、股市、新聞、星座、定位）
CLI Tools:   Claude CLI
System:      macOS 提醒事項、系統資訊
```

---

## 未來計畫

### 功能擴充
- [ ] Windows/Linux 支援
- [ ] 自訂 widget 位置與大小
- [ ] 主題切換（多種配色方案）
- [ ] Widget 插件系統
- [ ] 資料匯出與分析

### 技術優化
- [ ] 效能優化（降低 CPU 使用率）
- [ ] 測試覆蓋（Unit + E2E）
- [ ] 錯誤監控與回報
- [ ] 自動更新機制

### 社群功能
- [ ] Widget 分享平台
- [ ] 使用者自訂 API
- [ ] 多語言支援

---

## 開源與授權

- **授權：** MIT License
- **原始碼：** [GitHub Repository]
- **貢獻歡迎：** Issues & Pull Requests

### 如何參與
```bash
git clone [repo-url]
npm install
npx tsc -p tsconfig.electron.json
npm run dev:electron
```

---

## 學到的經驗

### 技術面
1. **Electron 架構設計** - Main/Renderer 分離的重要性
2. **TypeScript 嚴格模式** - 前期投資，長期受益
3. **IPC 通訊模式** - 單向資料流的優雅
4. **系統整合** - 如何安全地存取系統資源

### 工具面
5. **AI 輔助開發** - Cursor 的最佳實踐
6. **Claude CLI 整合** - 動態內容生成的創意應用
7. **模組化設計** - 易於擴充的架構

### 流程面
8. **漸進式開發** - 先 MVP 再迭代
9. **即時回饋** - 開發工具的重要性
10. **文件驅動** - CLAUDE.md 讓 AI 更懂專案

---

## Q&A

### 常見問題

**Q: 為什麼選擇 Electron 而不是 Tauri？**
A: Electron 生態成熟，systeminformation 支援完善，快速驗證想法

**Q: 效能影響？**
A: 閒置 ~100MB RAM，CPU < 1%（關閉 Matrix Rain 後）

**Q: 如何處理 API Rate Limit？**
A: 本地快取 + 智慧更新頻率 + 錯誤重試機制

**Q: Claude CLI 的成本？**
A: 每日新聞+Vibe Coding 約 ~0.05 USD/day

**Q: 最喜歡的 widget？**
A: Vibe Coding 吉凶 - 每天開工前的小確幸 😄

---

## 感謝聆聽！

### 聯絡方式
- GitHub: [your-github]
- Email: [your-email]
- Twitter: [your-twitter]

### 相關資源
- [專案 Repository]
- [技術文件]
- [開發日誌]

**歡迎交流與合作！**
