import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Thought } from '../types';
import { Lightbulb, Eye, MessageSquare, Plus, Edit2, Trash2, X, Tag, Smile, Clock } from 'lucide-react';

const thoughtTypes = [
  { value: 'idea', label: 'Idea', icon: Lightbulb, color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'observation', label: 'Observation', icon: Eye, color: 'bg-blue-500/200/20 text-blue-400' },
  { value: 'pondering', label: 'Pondering', icon: MessageSquare, color: 'bg-purple-500/200/20 text-purple-400' },
  { value: 'note', label: 'Note', icon: MessageSquare, color: 'bg-theme-tertiary text-theme-primary' },
] as const;


export const Thoughts: React.FC = () => {
  const { thoughts, addThought, updateThought, deleteThought, setCurrentView, isSaving } = useTimelineStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingThought, setIsAddingThought] = useState(false);
  const [editingThought, setEditingThought] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    type: 'idea' as Thought['type'],
    tags: [] as string[],
  });

  // Filter thoughts
  const filteredThoughts = useMemo(() => {
    let filtered = thoughts;

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [thoughts, filterType, searchTerm]);

  // Group thoughts by date
  const groupedThoughts = useMemo(() => {
    const groups: Record<string, Thought[]> = {};

    filteredThoughts.forEach(thought => {
      const dateKey = format(new Date(thought.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(thought);
    });

    return groups;
  }, [filteredThoughts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    if (editingThought) {
      await updateThought(editingThought, formData);
      setEditingThought(null);
    } else {
      await addThought({
        ...formData,
        createdAt: new Date(),
      });
    }

    setFormData({ content: '', type: 'idea', tags: [] });
    setIsAddingThought(false);
  };

  const handleEdit = (thought: Thought) => {
    setFormData({
      content: thought.content,
      type: thought.type,
      tags: thought.tags || [],
    });
    setEditingThought(thought.id);
    setIsAddingThought(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this thought?')) {
      await deleteThought(id);
    }
  };

  const handleCancel = () => {
    setFormData({ content: '', type: 'idea', tags: [] });
    setIsAddingThought(false);
    setEditingThought(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-theme-primary mb-2">Thoughts</h2>
        <p className="text-theme-tertiary">Capture your ideas, observations, and random ponderings</p>
      </div>

      {/* Add Thought Button */}
      {!isAddingThought && (
        <button
          onClick={() => setIsAddingThought(true)}
          className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Thought
        </button>
      )}

      {/* Add/Edit Thought Form */}
      {isAddingThought && (
        <div className="mb-6 p-6 bg-theme-primary rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                What's on your mind?
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Share your thought..."
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-secondary mb-2">Type</label>
              <div className="flex gap-2">
                {thoughtTypes.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: value as Thought['type'] })}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${formData.type === value
                      ? color
                      : 'bg-theme-tertiary text-theme-secondary hover:opacity-80'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving || !formData.content.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : editingThought ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
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
          placeholder="Search thoughts..."
          className="flex-1 px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Types</option>
          {thoughtTypes.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>


      {/* Thoughts List */}
      {Object.entries(groupedThoughts).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedThoughts)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dateThoughts]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-theme-primary mb-3">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-3">
                  {dateThoughts.map((thought) => {
                    const typeConfig = thoughtTypes.find(t => t.value === thought.type);
                    const Icon = typeConfig?.icon || MessageSquare;

                    return (
                      <div
                        key={thought.id}
                        className="p-4 rounded-lg shadow-sm border border-theme hover:shadow-md transition-shadow bg-theme-primary"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig?.color}`}>
                              <Icon className="w-3 h-3 inline mr-1" />
                              {typeConfig?.label}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {format(new Date(thought.createdAt), 'h:mm a')}
                            </span>
                            {/* Pondering Timer */}
                            {thought.type === 'pondering' && (
                              <span className="flex items-center gap-1 text-xs text-purple-500 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                Pondering for {formatDistanceToNow(new Date(thought.createdAt))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(thought)}
                              className="p-1 text-gray-400 hover:text-theme-tertiary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(thought.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-theme-primary whitespace-pre-wrap">{thought.content}</p>

                        {thought.tags && thought.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {thought.tags.map((tag) => (
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
                  })}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            No thoughts yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Start capturing your ideas and observations
          </p>
          <button
            onClick={() => setIsAddingThought(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Your First Thought
          </button>
        </div>
      )}
    </div>
  );
};
