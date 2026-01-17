import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          title: newTask.trim(),
          status: 'todo'
        }
      ]);
      setNewTask('');
    }
  };

  const updateTaskStatus = (id: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: newStatus } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const columns = [
    { id: 'todo', title: '待办', color: 'bg-green-100 dark:bg-green-900/30' },
    { id: 'in-progress', title: '进行中', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'done', title: '已完成', color: 'bg-gray-100 dark:bg-gray-800' }
  ] as const;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-light mb-6 text-green-700 dark:text-green-300">任务看板</h2>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="添加新任务..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 px-4 py-2 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300 dark:focus:ring-green-600 transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all duration-300 shadow-sm hover:shadow"
          >
            添加
          </button>
        </div>
      </form>

      {/* Task Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => {
          const columnTasks = tasks.filter(task => task.status === column.id);
          return (
            <div key={column.id} className={`rounded-xl p-4 ${column.color}`}>
              <h3 className="text-lg font-medium mb-4 text-center">{column.title}</h3>
              <div className="space-y-3">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-gray-700 dark:text-gray-300">{task.title}</p>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="删除任务"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {columns.map(col => (
                        <button
                          key={col.id}
                          onClick={() => updateTaskStatus(task.id, col.id)}
                          disabled={task.status === col.id}
                          className={`px-3 py-1 text-xs rounded-full transition-all ${task.status === col.id ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-800 cursor-pointer'}`}
                        >
                          {col.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;