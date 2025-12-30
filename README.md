# ForceDesk

macOS 桌面小工具應用程式，以透明覆蓋層顯示各種實用資訊。

![ForceDesk 截圖](./docs/screenshot.png)

## 功能特色

### 系統監控
- CPU 使用率與核心數
- 記憶體使用量
- 網路上傳/下載速度
- 磁碟使用空間

### 資訊小工具
- **天氣** - 即時溫度、天氣狀況、空氣品質指數（AQI）
- **股市** - 台灣加權指數、美股三大指數（S&P 500、道瓊、NASDAQ）
- **AI 新聞** - 自動抓取並翻譯 AI 相關新聞
- **星座運勢** - 今日運勢與幸運指數
- **Vibe Coding 吉凶** - 工程師專屬的每日開發運勢

### 生產力工具
- **行事曆** - 當月日曆檢視
- **待辦事項** - 整合 macOS 提醒事項
- **番茄鐘** - 專注計時器

### 視覺效果
- Matrix Rain 背景動畫
- 深色玻璃擬態設計風格
- RGB 氛圍燈效果

## 技術架構

- **前端**: React 19 + TypeScript + Vite
- **桌面框架**: Electron
- **系統資訊**: systeminformation
- **樣式**: 純 CSS（深色玻璃擬態風格）

## 安裝

```bash
# 安裝依賴
npm install

# 編譯 Electron TypeScript
npx tsc -p tsconfig.electron.json
```

## 開發

```bash
# 開發模式（前端 + Electron）
npm run dev:electron

# 僅前端開發
npm run dev

# 程式碼檢查
npm run lint
```

## 建置

```bash
# 建置專案
npm run build

# 打包 Electron 應用程式
npm run build:electron
```

## 專案結構

```
forcedesk/
├── electron/           # Electron 主進程
│   ├── main.ts         # 視窗管理、IPC、外部 API
│   ├── preload.ts      # Context Bridge
│   └── system-info.ts  # 系統資訊收集
├── src/                # React 前端
│   ├── components/     # UI 元件
│   ├── App.tsx         # 主佈局
│   └── types.ts        # TypeScript 型別
└── package.json
```

## 外部服務

- [Open-Meteo](https://open-meteo.com/) - 天氣與空氣品質 API
- [Yahoo Finance](https://finance.yahoo.com/) - 股市資料
- [NewsAPI](https://newsapi.org/) - 新聞來源
- [Claude CLI](https://claude.ai/) - AI 新聞翻譯與 Vibe Coding 生成

## 文件

### 使用指南
- **[快速開始](./docs/guides/quick-start.md)** - 5 分鐘快速上手
- **[常見問題](./docs/guides/faq.md)** - 疑難排解與 FAQ

### 開發文件
- **[架構設計](./docs/development/architecture.md)** - 系統架構深入解析
- **[Widget 開發指南](./docs/development/widget-development.md)** - 如何新增自訂 Widget
- **[貢獻指南](./docs/development/contributing.md)** - 參與專案開發
- **[Claude Code 指引](./CLAUDE.md)** - AI 開發工具專用

### 簡報資料
- **[Cursor 開發者聚會 2025](./docs/presentations/2025-cursor-meetup.md)** - 技術分享簡報

📚 **[完整文件索引](./docs/README.md)**

## 授權

MIT License
