/**
 * 共用載入狀態元件
 */

interface LoadingStateProps {
  /** 載入訊息文字 */
  message?: string;
  /** 自訂 CSS 類別名稱 */
  className?: string;
}

/**
 * LoadingState 元件
 *
 * 用於顯示統一的載入狀態 UI
 *
 * @example
 * ```tsx
 * <LoadingState message="載入天氣資料中..." />
 * <LoadingState message="載入中..." className="custom-loading" />
 * ```
 */
export function LoadingState({
  message = '載入中...',
  className = 'loading-state',
}: LoadingStateProps) {
  return <div className={className}>{message}</div>;
}
