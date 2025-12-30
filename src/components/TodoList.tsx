import { useState, useEffect } from 'react';
import type { TodoItem } from '../types';

const MAX_DISPLAY_COUNT = 5;

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    // 監聽來自 Electron 的待辦事項更新
    window.electronAPI?.onTodoUpdate?.((items) => {
      setTodos(items);
    });

    // 請求載入待辦事項
    window.electronAPI?.loadTodos?.();

    // 每 30 秒重新載入
    const interval = setInterval(() => {
      window.electronAPI?.loadTodos?.();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="todo-list">
      {totalCount > 0 && (
        <div className="todo-stats">
          {completedCount}/{totalCount} 已完成
        </div>
      )}

      <div className="todo-items">
        {Array.from({ length: MAX_DISPLAY_COUNT }).map((_, index) => {
          const todo = todos[index];
          if (todo) {
            return (
              <div
                key={index}
                className={`todo-item ${todo.completed ? 'todo-item-completed' : ''}`}
              >
                <span className="todo-checkbox">
                  {todo.completed ? '✓' : '○'}
                </span>
                {todo.time && <span className="todo-time">{todo.time}</span>}
                <span className="todo-text">{todo.text}</span>
              </div>
            );
          }
          return <div key={index} className="todo-item todo-item-placeholder" />;
        })}
        {todos.length > MAX_DISPLAY_COUNT && (
          <div className="todo-more">還有 {todos.length - MAX_DISPLAY_COUNT} 項...</div>
        )}
      </div>
    </div>
  );
}
