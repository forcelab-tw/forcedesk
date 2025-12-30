---
name: frontend-design
description: 指導前端設計決策、元件架構、CSS 優化和 UI/UX 最佳實踐。用於設計元件、審查設計模式、討論樣式方案或優化使用者體驗。
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Frontend Design Guide

## 元件設計原則

### 1. 單一職責
每個元件只負責一件事，保持簡單可測試。

### 2. 組合優於繼承
```tsx
// 好：組合小元件
<Card>
  <CardHeader title="標題" />
  <CardBody>{content}</CardBody>
  <CardFooter actions={actions} />
</Card>
```

### 3. Props 介面設計
- 使用 TypeScript 定義明確的 Props 介面
- 提供合理的預設值
- 避免過多的 props（考慮拆分元件）

## 樣式最佳實踐

### Mobile-First 響應式設計
```css
/* 基礎樣式（手機） */
.container { width: 100%; padding: 16px; }

/* 平板以上 */
@media (min-width: 768px) {
  .container { max-width: 720px; margin: 0 auto; }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container { max-width: 960px; }
}
```

### CSS 變數管理主題
```css
:root {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --spacing-unit: 8px;
  --border-radius: 8px;
}

[data-theme="dark"] {
  --color-background: #1a1a1a;
}
```

### 命名規範
- 使用 BEM 或 CSS Modules
- 類名語義化：`.card-header` 而非 `.ch`
- 避免過深的巢狀（最多 3 層）

## 效能優化

### 渲染優化
- 使用 `React.memo()` 避免不必要的重新渲染
- 使用 `useMemo` / `useCallback` 快取計算結果
- 虛擬化長列表（react-window）

### 載入優化
- 圖片使用 lazy loading
- 程式碼分割（動態 import）
- 關鍵 CSS 內聯

## 無障礙設計 (A11y)

### 必要檢查項目
- [ ] 使用語義化 HTML（`<button>`, `<nav>`, `<main>`）
- [ ] 圖片提供 alt 文字
- [ ] 表單元素有對應的 label
- [ ] 色彩對比度符合 WCAG AA（4.5:1）
- [ ] 支援鍵盤導航（Tab, Enter, Escape）
- [ ] Focus 狀態清晰可見

### ARIA 使用原則
```tsx
// 只在必要時使用 ARIA
<button aria-label="關閉選單" aria-expanded={isOpen}>
  <CloseIcon />
</button>
```

## 動畫與過渡

### 效能友善的屬性
優先使用：`transform`, `opacity`
避免動畫：`width`, `height`, `top`, `left`

```css
.card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
}
```

### 尊重使用者偏好
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

## 設計系統建議

### 間距系統
使用 4px 或 8px 基準的倍數：4, 8, 12, 16, 24, 32, 48, 64

### 字體大小
```css
--font-xs: 12px;
--font-sm: 14px;
--font-base: 16px;
--font-lg: 18px;
--font-xl: 20px;
--font-2xl: 24px;
```

### 色彩層級
- Primary: 主要動作、品牌色
- Secondary: 次要動作
- Neutral: 文字、邊框、背景
- Semantic: Success, Warning, Error, Info
