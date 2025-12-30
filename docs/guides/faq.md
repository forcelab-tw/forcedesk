# 常見問題 (FAQ)

## 一般問題

### ForceDesk 是什麼？

ForceDesk 是一個 macOS 桌面 Widget 應用程式，在桌面上以透明覆蓋層顯示系統監控、天氣、股市、新聞等實用資訊。

### 支援哪些作業系統？

目前僅支援 macOS 12.0 或更新版本。

未來計畫：
- Windows 支援
- Linux 支援

### 開源嗎？授權是什麼？

是的，ForceDesk 是開源專案，採用 MIT License。

### 需要付費嗎？

完全免費，無內購，無廣告。

部分功能（AI 新聞、Vibe Coding）使用 Claude CLI，需要 Claude 帳號，產生的費用由使用者自行承擔（通常每月 < $1 USD）。

## 安裝與設定

### 如何安裝？

請參考[快速開始指南](./quick-start.md#安裝)。

### 需要哪些系統權限？

- **提醒事項存取**（選填）- 顯示待辦事項
- **網路存取**（必要）- 取得外部資料

### 如何設定待辦事項？

兩種方式：

**方式 1：使用 macOS 提醒事項**
1. 開啟「提醒事項」App
2. 建立待辦並設定到期日為今天
3. ForceDesk 會自動顯示

**方式 2：使用檔案**
```bash
# 建立 ~/.todos 檔案
nano ~/.todos

# 格式
- [ ] 待辦事項
- [x] 已完成事項
- [ ] 09:00|有時間的事項
```

### 如何關閉不需要的 Widget？

目前需要手動編輯程式碼（未來會加入 UI 設定）：

1. 編輯 `src/App.tsx`
2. 註解掉不需要的 Widget
3. 重新編譯並啟動

## 功能問題

### 天氣資料不準確？

天氣資料來自 Open-Meteo API，使用 IP 定位可能有誤差（±10km）。

### 股市資料多久更新？

- 交易時間：每 5 分鐘
- 非交易時間：顯示最後收盤價

### 為什麼股市漲是紅色、跌是綠色？

ForceDesk 遵循**台灣股市慣例**：
- 紅色 = 上漲
- 綠色 = 下跌

這與美國股市相反（美國綠漲紅跌）。

### AI 新聞功能如何運作？

1. 從 NewsAPI 抓取 AI 相關新聞
2. 使用 Claude CLI 進行：
   - 篩選相關性
   - 翻譯成繁體中文
   - 生成摘要
3. 本地快取（含圖片）
4. 每 30 分鐘更新

### Vibe Coding 是什麼？

工程師專屬的每日開發運勢，由 Claude CLI 生成：
- 今日吉凶
- 宜做事項（適合的任務）
- 忌做事項（避免的操作）
- 運勢說明

純娛樂性質，增添開發樂趣 😄

### Claude Usage Monitor 顯示什麼？

追蹤您的 Claude API 使用量：
- 本月已用額度
- 剩餘額度
- 使用趨勢

需要安裝並登入 Claude CLI。

## 效能問題

### 應用程式很耗電？

**優化建議：**

1. **關閉 Matrix Rain**
   - 選單 → 關閉背景動畫
   - 可節省 ~30% CPU

2. **調整更新頻率**
   - 編輯 `electron/main.ts`
   - 延長 API 呼叫間隔

3. **關閉不需要的 Widget**
   - 減少資料處理負擔

### 記憶體使用量多少？

典型使用：
- 閒置：~100MB
- 活躍：~150MB

這是 Electron 應用的正常範圍。

### CPU 使用率高？

**可能原因：**
- Matrix Rain 動畫（建議關閉）
- 過多 Widget 同時運作
- 系統資訊更新頻率過高（預設 2 秒）

**解決方式：**
```typescript
// electron/main.ts
// 調整系統資訊更新頻率從 2 秒改為 5 秒
setInterval(() => {
  sendSystemInfo(mainWindow);
}, 5000);  // 原本是 2000
```

## 技術問題

### 如何查看錯誤訊息？

**Main Process（終端機）：**
```bash
npm run dev:electron
# 錯誤會顯示在終端機
```

**Renderer Process（DevTools）：**
```typescript
// 暫時加入 electron/main.ts
mainWindow.webContents.openDevTools();
```

### 修改程式碼後沒有效果？

**前端程式碼（React）：**
- 自動熱重載，檢查是否有編譯錯誤

**後端程式碼（Electron）：**
```bash
# 需要重新編譯
npx tsc -p tsconfig.electron.json

# 然後重啟應用程式
```

### TypeScript 編譯錯誤？

常見問題：

1. **型別不匹配**
   - 檢查 `src/types.ts` 和 `electron/preload.ts` 定義是否一致

2. **找不到模組**
   - 確認 import 路徑正確
   - 執行 `npm install`

3. **嚴格模式錯誤**
   - 避免使用 `any`
   - 處理 `null`/`undefined` 情況

### IPC 通訊不通？

**檢查清單：**

- [ ] `electron/preload.ts` 有暴露 API？
- [ ] `electron/main.ts` 有註冊 handler？
- [ ] 事件名稱一致？（如 'todo-update'）
- [ ] 型別定義正確？

**除錯技巧：**
```typescript
// Main Process
console.log('[IPC] Sending:', eventName, data);

// Renderer
window.electronAPI?.onUpdate?.((data) => {
  console.log('[IPC] Received:', data);
});
```

## Claude CLI 相關

### 如何安裝 Claude CLI？

```bash
# 使用 npm
npm install -g @anthropic-ai/claude-cli

# 或使用 Homebrew
brew install anthropic/tap/claude-cli

# 登入
claude login
```

### Claude CLI 功能無法使用？

**檢查步驟：**

1. **確認已安裝**
   ```bash
   claude --version
   ```

2. **確認已登入**
   ```bash
   claude whoami
   ```

3. **測試功能**
   ```bash
   echo "Hello" | claude
   ```

### 如何控制 Claude CLI 成本？

**預估成本：**
- AI 新聞（每次）：~$0.01
- Vibe Coding（每天）：~$0.005
- 每月總計：約 $1-2 USD

**節省技巧：**
1. 延長新聞更新間隔（30分→60分）
2. 使用本地快取
3. 關閉不常用的 AI 功能

## 進階問題

### 如何新增自訂 Widget？

請參考 [Widget 開發指南](../development/widget-development.md)。

### 如何整合自己的 API？

範例：整合天氣 API

1. 建立模組 `electron/modules/my-weather.ts`
2. 定義型別 `src/shared/types/my-weather.ts`
3. 建立元件 `src/components/MyWeather.tsx`
4. 註冊 IPC handler
5. 暴露 API 到渲染進程

詳細步驟請參考開發文件。

### 可以在 Windows/Linux 運行嗎？

目前不行，但技術上可行。

**需要調整：**
- 視窗管理（無 `type: 'desktop'`）
- 系統資訊 API（跨平台支援）
- AppleScript → PowerShell/Bash
- 路徑處理

歡迎貢獻跨平台支援！

### 如何打包成 .app？

```bash
# 建置專案
npm run build

# 打包 Electron
npm run build:electron

# 輸出在 dist/ 目錄
```

## 貢獻與支援

### 如何回報 Bug？

請到 [GitHub Issues](https://github.com/YOUR_USERNAME/forcedesk/issues) 建立 Issue，包含：
- 清楚的問題描述
- 重現步驟
- 環境資訊
- 螢幕截圖（如適用）

### 如何提議新功能？

建立 Feature Request Issue，說明：
- 功能描述
- 使用場景
- 可能的實作方式

### 如何參與開發？

請參考[貢獻指南](../development/contributing.md)。

### 在哪裡獲得協助？

- 搜尋[文件](../README.md)
- 查看[現有 Issues](https://github.com/YOUR_USERNAME/forcedesk/issues)
- 建立新的 Issue

## 其他問題

### 為什麼叫 ForceDesk？

Force（力量）+ Desk（桌面），象徵為桌面工作帶來效率與力量。

### 專案的未來計畫？

- [ ] Widget 設定 UI
- [ ] 主題切換
- [ ] 跨平台支援
- [ ] 插件系統
- [ ] 雲端同步

### 可以商業使用嗎？

可以！MIT License 允許商業使用，但請保留原始授權聲明。

---

**找不到答案？** 請建立 [Issue](https://github.com/YOUR_USERNAME/forcedesk/issues) 提問！
