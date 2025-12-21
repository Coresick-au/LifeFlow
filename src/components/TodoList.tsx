import React, { useState, useMemo } from 'react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { TodoItem } from '../types';
import { Plus, Check, Archive, Trash2, Edit2, X, Calendar, Flag, Clock, AlertCircle, CheckSquare } from 'lucide-react';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-200',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-200',
  low: 'bg-green-500/20 text-green-400 border-green-200',
};

const priorityIcons = {
  high: AlertCircle,
  medium: Flag,
  low: Clock,
};

export const TodoList: React.FC = () => {
  const { todos, addTodo, updateTodo, deleteTodo, completeTodo, archiveTodo, isSaving } = useTimelineStore();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'archived'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TodoItem['priority'],
    dueDate: undefined as Date | undefined,
    tags: [] as string[],
  });

  // Filter todos
  const filteredTodos = useMemo(() => {
    let filtered = todos;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  }, [todos, filterStatus, searchTerm]);

  // Group todos by status
  const groupedTodos = useMemo(() => {
    const groups = {
      active: filteredTodos.filter(t => t.status === 'active'),
      completed: filteredTodos.filter(t => t.status === 'completed'),
      archived: filteredTodos.filter(t => t.status === 'archived'),
    };
    return groups;
  }, [filteredTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTodo) {
      await updateTodo(editingTodo, formData);
      setEditingTodo(null);
    } else {
      await addTodo({
        ...formData,
        status: 'active',
        createdAt: new Date(),
      });
    }

    setFormData({ title: '', description: '', priority: 'medium', dueDate: undefined, tags: [] });
    setIsAddingTodo(false);
  };

  const handleEdit = (todo: TodoItem) => {
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate,
      tags: todo.tags || [],
    });
    setEditingTodo(todo.id);
    setIsAddingTodo(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this todo? This cannot be undone.')) {
      await deleteTodo(id);
    }
  };

  const handleComplete = async (id: string) => {
    await completeTodo(id);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Are you sure you want to archive this todo?')) {
      await archiveTodo(id);
    }
  };

  const getDueDateStatus = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (isBefore(due, today)) {
      return { status: 'overdue', color: 'text-red-600', label: 'Overdue' };
    } else if (due.getTime() === today.getTime()) {
      return { status: 'today', color: 'text-orange-600', label: 'Due today' };
    } else if (isBefore(due, addDays(today, 3))) {
      return { status: 'soon', color: 'text-yellow-600', label: 'Due soon' };
    }
    return null;
  };

  const TodoItem = ({ todo, showStatus }: { todo: TodoItem; showStatus?: boolean }) => {
    const PriorityIcon = priorityIcons[todo.priority];
    const dueDateStatus = getDueDateStatus(todo.dueDate);
    
    return (
      <div className={`p-4 bg-theme-primary rounded-lg shadow-sm border border-theme hover:shadow-md transition-all ${
        todo.status === 'completed' ? 'opacity-75' : ''
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            {todo.status === 'active' && (
              <button
                onClick={() => handleComplete(todo.id)}
                className="w-5 h-5 rounded border-2 border-theme hover:border-primary-500 transition-colors flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-transparent hover:text-primary-500" />
              </button>
            )}
            {todo.status === 'completed' && (
              <div className="w-5 h-5 rounded bg-primary-500/200 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {todo.status === 'archived' && (
              <Archive className="w-5 h-5 text-gray-400" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-medium text-theme-primary ${
                todo.status === 'completed' ? 'line-through' : ''
              }`}>
                {todo.title}
              </h4>
              {todo.description && (
                <p className="text-sm text-theme-tertiary mt-1">{todo.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {todo.status === 'active' && (
              <>
                <button
                  onClick={() => handleEdit(todo)}
                  className="p-1 text-gray-400 hover:text-theme-tertiary transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArchive(todo.id)}
                  className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleDelete(todo.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-3 text-xs">
          <span className={`px-2 py-1 rounded-full border ${priorityColors[todo.priority]} flex items-center gap-1`}>
            <PriorityIcon className="w-3 h-3" />
            {todo.priority}
          </span>
          
          {todo.dueDate && (
            <span className={`flex items-center gap-1 ${dueDateStatus?.color || 'text-slate-500 dark:text-slate-400'}`}>
              <Calendar className="w-3 h-3" />
              {format(new Date(todo.dueDate), 'MMM d, yyyy')}
              {dueDateStatus && <span className="font-medium">({dueDateStatus.label})</span>}
            </span>
          )}
          
          <span className="text-slate-500 dark:text-slate-400">
            Created {format(new Date(todo.createdAt), 'MMM d')}
          </span>
          
          {todo.completedAt && (
            <span className="text-green-600">
              Completed {format(new Date(todo.completedAt), 'MMM d')}
            </span>
          )}
          
          {todo.archivedAt && (
            <span className="text-yellow-600">
              Archived {format(new Date(todo.archivedAt), 'MMM d')}
            </span>
          )}
        </div>
        
        {todo.tags && todo.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {todo.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-theme-tertiary text-theme-tertiary rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-theme-primary mb-2">To-Do List</h2>
        <p className="text-theme-tertiary">Manage your tasks and stay organized</p>
      </div>

      {/* Add Todo Button */}
      {!isAddingTodo && (
        <button
          onClick={() => setIsAddingTodo(true)}
          className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Todo
        </button>
      )}

      {/* Add/Edit Todo Form */}
      {isAddingTodo && (
        <div className="mb-6 p-6 bg-theme-primary rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Add more details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoItem['priority'] })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dueDate: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving || !formData.title.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : editingTodo ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ title: '', description: '', priority: 'medium', dueDate: undefined, tags: [] });
                  setIsAddingTodo(false);
                  setEditingTodo(null);
                }}
                className="px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search todos..."
          className="flex-1 px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-theme-border bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Todo Lists */}
      {filterStatus === 'all' ? (
        <div className="space-y-8">
          {Object.entries(groupedTodos).map(([status, statusTodos]) => (
            statusTodos.length > 0 && (
              <div key={status}>
                <h3 className="text-lg font-semibold text-theme-primary mb-3 capitalize">
                  {status} ({statusTodos.length})
                </h3>
                <div className="space-y-3">
                  {statusTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.length > 0 ? (
            filteredTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-theme-primary mb-2">
                No {filterStatus} todos
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {filterStatus === 'active' && 'Start by adding a new todo item'}
                {filterStatus === 'completed' && 'Complete some active todos to see them here'}
                {filterStatus === 'archived' && 'Archive completed todos to see them here'}
              </p>
              {filterStatus === 'active' && (
                <button
                  onClick={() => setIsAddingTodo(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Your First Todo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
