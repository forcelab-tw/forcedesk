# 快速開始

> 5 分鐘快速上手 ForceDesk

## 系統需求

- macOS 12.0 或更新版本
- 至少 200MB 可用磁碟空間
- Node.js 18+ （僅開發時需要）

## 安裝

### 方式 1：下載發行版（推薦）

1. 前往 [Releases 頁面](https://github.com/YOUR_USERNAME/forcedesk/releases)
2. 下載最新版本的 `ForceDesk-{version}.dmg`
3. 開啟 DMG 檔案
4. 將 ForceDesk 拖曳到「應用程式」資料夾
5. 開啟應用程式

### 方式 2：從原始碼建置

```bash
# 1. Clone 專案
git clone https://github.com/YOUR_USERNAME/forcedesk.git
cd forcedesk

# 2. 安裝依賴
npm install

# 3. 編譯 Electron
npx tsc -p tsconfig.electron.json

# 4. 啟動應用程式
npm run dev:electron
```

## 首次使用

### 1. 啟動應用程式

雙擊 ForceDesk 圖示，應用程式會在桌面上顯示 Widget。

### 2. 系統權限

首次啟動時，系統可能會要求以下權限：

- **提醒事項存取** - 用於顯示待辦事項（可選）
- **網路存取** - 用於取得天氣、股市等資料

### 3. 控制選單

點擊選單列的 ForceDesk 圖示（📊），可以：

- **重新載入** - 刷新所有資料
- **顯示/隱藏** - 切換 Widget 顯示
- **退出** - 關閉應用程式

## Widget 介紹

### 系統監控類

#### CPU 使用率
- 顯示目前 CPU 使用百分比
- 多核心使用狀況
- 即時更新（每 2 秒）

#### 記憶體監控
- 已用 / 總容量
- 使用百分比視覺化
- 顏色警示（綠→黃→紅）

#### 網路流量
- 即時上傳/下載速度
- 單位自動轉換（KB/s, MB/s）

#### 磁碟空間
- 主要磁碟剩餘空間
- 使用量百分比

### 資訊類 Widget

#### 天氣
- 即時溫度
- 天氣描述
- 空氣品質指數 (AQI)
- 自動定位
- 每 15 分鐘更新

#### 股市行情
- 台灣加權指數 (TWII)
- 美股三大指數（S&P 500、道瓊、NASDAQ）
- 漲跌幅顯示（紅漲綠跌）
- 每 5 分鐘更新

#### AI 新聞
- 自動抓取 AI 相關新聞
- Claude CLI 翻譯成繁體中文
- 智慧摘要
- 每 30 分鐘更新

#### 星座運勢
- 今日運勢
- 幸運指數
- 每日更新

### 生產力工具

#### 待辦事項
- 整合 macOS 提醒事項
- 顯示今日待辦
- 已完成項目標記
- 每分鐘更新

**設定方法：**
1. 開啟「提醒事項」App
2. 建立待辦事項並設定到期日為今天
3. ForceDesk 會自動顯示

**或使用檔案模式：**
```bash
# 建立 ~/.todos 檔案
cat > ~/.todos << 'EOF'
- [ ] 09:00|早會
- [ ] 14:00|完成專案文件
- [x] 已完成的事項
EOF
```

#### 番茄鐘
- 25 分鐘專注計時器
- 視覺倒數顯示
- 結束提示音

#### 行事曆
- 當月日曆檢視
- 今日標記

### 工程師專屬

#### Vibe Coding 吉凶
- 每日開發運勢
- Claude CLI 生成
- 宜做事項 / 忌做事項
- 每天更新

#### Claude Usage Monitor
- 追蹤 Claude API 使用量
- 顯示剩餘額度
- 使用趨勢

#### Dino Tamagotchi
- 電子恐龍寵物
- 互動小遊戲

### 視覺效果

#### Matrix Rain
- 駭客風格背景動畫
- 可從選單開關
- 影響效能（建議關閉以省電）

#### RGB 氛圍燈
- 可調色彩背景光效
- 多種預設模式

## 設定與自訂

### 待辦事項檔案格式

編輯 `~/.todos`：

```markdown
# 這是註解，會被忽略

- [ ] 未完成事項
- [x] 已完成事項
- [ ] 09:00|有時間的事項
```

### 關閉不需要的 Widget

目前需要手動編輯程式碼：

1. 開啟 `src/App.tsx`
2. 註解掉不需要的 Widget：
```typescript
{/* <Weather /> */}
```
3. 重新編譯

### 調整更新頻率

編輯 `electron/main.ts` 的 `startDataUpdates()` 函數：

```typescript
// 天氣更新頻率（預設 15 分鐘）
setInterval(() => sendWeatherUpdate(mainWindow), 15 * 60 * 1000);

// 改成 30 分鐘
setInterval(() => sendWeatherUpdate(mainWindow), 30 * 60 * 1000);
```

## 常見問題

### Widget 沒有顯示？

1. 檢查選單是否設定為「顯示」
2. 重新啟動應用程式
3. 查看 Console 是否有錯誤訊息

### 待辦清單是空的？

1. 確認已授予「提醒事項」權限
2. 或建立 `~/.todos` 檔案
3. 待辦事項需要設定到期日為今天

### 天氣資料不準確？

天氣資料來自 Open-Meteo API，根據 IP 自動定位可能有誤差。

### 應用程式很耗電？

1. 關閉 Matrix Rain 動畫
2. 調整更新頻率（減少 API 呼叫）
3. 關閉不需要的 Widget

### Claude CLI 功能無法使用？

1. 確認已安裝 Claude CLI
2. 執行 `claude --version` 確認
3. 確認已登入：`claude login`

## 解除安裝

1. 關閉 ForceDesk
2. 將應用程式移到垃圾桶
3. （選填）刪除設定檔：
```bash
rm -rf ~/Library/Application\ Support/desktop-widget
rm ~/.todos  # 如果有建立
```

## 下一步

- 閱讀[完整文件](../README.md)
- 查看[架構設計](../development/architecture.md)
- 學習[開發 Widget](../development/widget-development.md)
- 參與[貢獻](../development/contributing.md)

---

需要協助？請建立 [Issue](https://github.com/YOUR_USERNAME/forcedesk/issues)
