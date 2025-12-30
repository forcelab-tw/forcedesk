# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ForceDesk is a macOS desktop widget application built with Electron and React. It displays various widgets on the desktop as a transparent, click-through overlay, including system monitoring, weather, stock market, news, horoscope, calendar, todo list, and Pomodoro timer.

## Commands

```bash
# Development (frontend only)
npm run dev

# Development (frontend + Electron)
npm run dev:electron

# Build for production
npm run build

# Build Electron app package
npm run build:electron

# Lint
npm run lint

# Compile Electron TypeScript (required after modifying electron/ files)
npx tsc -p tsconfig.electron.json
```

## Architecture

### Three-Layer Structure

1. **Electron Main Process** (`electron/`)
   - `main.ts`: Window management, IPC handlers, external API calls, Tray menu
   - `preload.ts`: Context bridge exposing `window.electronAPI` to renderer
   - `system-info.ts`: System metrics collection via `systeminformation`

2. **React Renderer** (`src/`)
   - `App.tsx`: Main layout with left/right widget columns
   - `components/`: Individual widget components
   - `types.ts`: Shared TypeScript interfaces

3. **IPC Communication Pattern**
   - Main → Renderer: `mainWindow.webContents.send('event', data)`
   - Renderer → Main: `ipcRenderer.send('request')` → handler sends response
   - All APIs exposed through `window.electronAPI` (defined in preload.ts)

### Data Flow

- System info: polled every 2 seconds in main process, pushed to renderer
- Weather/Stock/News: fetched on startup, then at intervals (15min/5min/30min)
- User interactions: Tray menu controls sent via IPC to renderer

### Key External APIs

- Weather: Open-Meteo + ip-api.com for geolocation
- Stock: Yahoo Finance chart API
- News: NewsAPI.org with AI filtering/translation via Claude CLI
- Horoscope: xxapi.cn
- Vibe Coding: Generated via Claude CLI

### Window Configuration

The main window is configured as a transparent, click-through desktop overlay:
- `transparent: true`, `frame: false`, `focusable: false`
- `type: 'desktop'` for desktop-level z-index
- `setIgnoreMouseEvents(true)` for complete click-through

## Key Patterns

### Adding a New Widget

1. Create component in `src/components/YourWidget.tsx`
2. Export from `src/components/index.ts`
3. Add TypeScript interfaces to `src/types.ts` AND `electron/preload.ts`
4. Add IPC handler in `electron/main.ts`
5. Expose API in `electron/preload.ts`
6. Add to layout in `src/App.tsx`

### Popup Windows

Popups use inline HTML loaded via data URL:
```typescript
popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
```

## Language

- Code comments and UI text are in Traditional Chinese (Taiwan)
- Use Taiwan terminology: 人工智慧 (not 人工智能), 軟體 (not 软件)

## Stock Market Colors (Taiwan Convention)

- Up/Gain: Red (#ef4444)
- Down/Loss: Green (#22c55e)
