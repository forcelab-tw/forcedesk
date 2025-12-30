import { useState, useEffect } from 'react';
import type { TodoItem } from '../types';
import { UI_CONSTANTS, UPDATE_INTERVALS } from '../shared/constants';
import { usePolling } from '../hooks';

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    // 監聽來自 Electron 的待辦事項更新
    window.electronAPI?.onTodoUpdate?.((items) => {
      setTodos(items);
    });
  }, []);

  // 定期載入待辦事項
  usePolling(
    () => window.electronAPI?.loadTodos?.(),
    UPDATE_INTERVALS.TODO,
    true // 立即執行一次
  );

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
        {Array.from({ length: UI_CONSTANTS.TODO_MAX_DISPLAY }).map((_, index) => {
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
        {todos.length > UI_CONSTANTS.TODO_MAX_DISPLAY && (
          <div className="todo-more">還有 {todos.length - UI_CONSTANTS.TODO_MAX_DISPLAY} 項...</div>
        )}
      </div>
    </div>
  );
}
